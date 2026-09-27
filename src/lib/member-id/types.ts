export type QRPayload = {
  sub: string
  name: string
  iat: number
  exp: number
  type: QRType
}

export enum QRType {
  APP = 'app',
  APPLE_WALLET = 'apple_wallet',
  ANDROID_WALLET = 'android_wallet',
}

export type VerificationResult = {
  success: boolean
  payload: QRPayload | null
  error?: string
}
