import jsQR from 'jsqr'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { useI18n } from '#/lib/i18n/locale-context'
import type { MessageKey } from '#/lib/i18n/messages'
import { cn } from '#/lib/utils'

type QrCameraProps = {
  onScan: (data: string) => void
  paused?: boolean
  className?: string
  /** Last scan outcome — tints the viewfinder frame. */
  status?: 'valid' | 'invalid' | null
}

type CameraErrorCode =
  | 'generic'
  | 'unsupported'
  | 'denied'
  | 'notFound'
  | 'busy'

const CAMERA_ERROR_KEYS: Record<CameraErrorCode, MessageKey> = {
  generic: 'scanner.cameraErrorGeneric',
  unsupported: 'scanner.cameraErrorUnsupported',
  denied: 'scanner.cameraErrorDenied',
  notFound: 'scanner.cameraErrorNotFound',
  busy: 'scanner.cameraErrorBusy',
}

function cameraErrorCode(err: unknown): CameraErrorCode {
  if (!(err instanceof Error)) {
    return 'generic'
  }
  if (err.message.includes('Camera API not supported')) {
    return 'unsupported'
  }
  if (err.name === 'NotAllowedError') {
    return 'denied'
  }
  if (err.name === 'NotFoundError') {
    return 'notFound'
  }
  if (err.name === 'NotReadableError') {
    return 'busy'
  }
  return 'generic'
}

function stopMediaStream(stream: MediaStream | null | undefined) {
  if (!stream) return
  for (const track of stream.getTracks()) track.stop()
}

export function QrCamera({
  onScan,
  paused = false,
  className,
  status = null,
}: QrCameraProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startIdRef = useRef(0)
  const lastScanTime = useRef(0)
  const [isScanning, setIsScanning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorCode, setErrorCode] = useState<CameraErrorCode | null>(null)
  const { t } = useI18n()

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    const startId = ++startIdRef.current
    stopCamera()
    setErrorCode(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported')
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' },
        },
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        ;(constraints.video as MediaTrackConstraints).facingMode = {
          ideal: 'user',
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      }

      // Unmounted or a newer start superseded this request — release immediately.
      if (startId !== startIdRef.current) {
        stopMediaStream(stream)
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsScanning(true)
      setErrorCode(null)
    } catch (err) {
      if (startId !== startIdRef.current) return
      stopCamera()
      setErrorCode(cameraErrorCode(err))
      console.error('Camera error:', err)
    }
  }, [stopCamera])

  useEffect(() => {
    void startCamera()
    return () => {
      // Invalidate any in-flight getUserMedia so its stream is stopped on resolve.
      startIdRef.current += 1
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Re-attach if the <video> remounts (e.g. after clearing an error state).
  useEffect(() => {
    if (errorCode) return
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [errorCode])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false)
      },
      { threshold: 0.1 },
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing || paused) {
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    const now = Date.now()
    if (now - lastScanTime.current < 800) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (
      code?.data &&
      typeof code.data === 'string' &&
      code.data.trim().length > 0
    ) {
      lastScanTime.current = now
      setIsProcessing(true)
      onScan(code.data)
      window.setTimeout(() => setIsProcessing(false), 1200)
    }
  }, [isProcessing, onScan, paused])

  useEffect(() => {
    if (!isScanning || isProcessing || paused) return

    let raf = 0
    let lastFrameTime = 0

    const tick = (currentTime: number) => {
      const frameInterval = isVisible ? 100 : 1000
      if (currentTime - lastFrameTime >= frameInterval) {
        captureFrame()
        lastFrameTime = currentTime
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [captureFrame, isProcessing, isScanning, isVisible, paused])

  if (errorCode) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-8 text-center',
          className,
        )}
      >
        <p className="text-sm text-destructive" role="alert">
          {t(CAMERA_ERROR_KEYS[errorCode])}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={startCamera}>
          {t('scanner.cameraRetry')}
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative mx-auto max-w-md overflow-hidden border border-terminal-window-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={t('scanner.cameraLabel')}
          className="aspect-[4/3] w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {isScanning ? (
          <div className="absolute top-3 right-3">
            <div
              className={cn(
                'size-2.5',
                isVisible && !paused
                  ? 'animate-pulse bg-terminal-green'
                  : 'bg-terminal-text/40',
              )}
            />
          </div>
        ) : null}

        {!isScanning ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-sm text-white">{t('scanner.cameraStarting')}</p>
          </div>
        ) : null}

        {isVisible && !paused ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'relative h-52 w-52 border',
                status === 'valid' && 'border-terminal-green/70',
                status === 'invalid' && 'border-destructive/70',
                !status && 'border-white/25',
              )}
            >
              <span
                className={cn(
                  'absolute -top-0.5 -left-0.5 h-6 w-6 border-t-2 border-l-2',
                  status === 'invalid'
                    ? 'border-destructive'
                    : 'border-terminal-green',
                )}
              />
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 h-6 w-6 border-t-2 border-r-2',
                  status === 'invalid'
                    ? 'border-destructive'
                    : 'border-terminal-green',
                )}
              />
              <span
                className={cn(
                  'absolute -bottom-0.5 -left-0.5 h-6 w-6 border-b-2 border-l-2',
                  status === 'invalid'
                    ? 'border-destructive'
                    : 'border-terminal-green',
                )}
              />
              <span
                className={cn(
                  'absolute -right-0.5 -bottom-0.5 h-6 w-6 border-r-2 border-b-2',
                  status === 'invalid'
                    ? 'border-destructive'
                    : 'border-terminal-green',
                )}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-1 text-center">
        <p className="text-sm text-terminal-text">{t('scanner.cameraHint')}</p>
        <p className="text-xs text-terminal-text/55">
          {t('scanner.cameraHintAuto')}
        </p>
      </div>
    </div>
  )
}
