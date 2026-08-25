import { type ReactNode, useState } from 'react'
import { MembershipPassDialog } from '#/components/dashboard/membership-pass-dialog'
import { Button } from '#/components/ui/button'
import { EXTERNAL_LINKS } from '#/lib/constants'
import { isLikelyMobileDevice } from '#/lib/device'
import { cn } from '#/lib/utils'

export function useMembershipPass() {
  const [dialogOpen, setDialogOpen] = useState(false)

  function openPass() {
    if (isLikelyMobileDevice()) {
      window.location.assign(EXTERNAL_LINKS.NEULAND_NEXT_MEMBER)
      return
    }

    setDialogOpen(true)
  }

  const dialog = (
    <MembershipPassDialog open={dialogOpen} onOpenChange={setDialogOpen} />
  )

  return { openPass, dialog }
}

type MembershipPassButtonProps = {
  className?: string
  variant?: 'default' | 'outline'
  children?: ReactNode
}

export function MembershipPassButton({
  className,
  variant = 'default',
  children = 'Mitgliedsausweis öffnen',
}: MembershipPassButtonProps) {
  const { openPass, dialog } = useMembershipPass()

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={cn(className)}
        onClick={openPass}
      >
        {children}
      </Button>
      {dialog}
    </>
  )
}
