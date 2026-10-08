import { Button, type ButtonProps } from '@/components/ui/button'

export interface CtaProps {
  ctaEnabled: boolean
  text: string
  link: string
  variant?: ButtonProps['variant']
}

export function Cta({ cta }: Readonly<{ cta: CtaProps }>) {
  if (!cta.ctaEnabled) return null

  return (
    <Button asChild size="lg" variant={cta.variant}>
      <a href={cta.link}>{cta.text}</a>
    </Button>
  )
}
