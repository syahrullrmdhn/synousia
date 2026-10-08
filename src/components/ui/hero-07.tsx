'use client'

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import Balancer from 'react-wrap-balancer'

import { cn } from '@/lib/utils'

import { Cta, type CtaProps } from '@/components/ui/hero-07-utils/cta'

export interface Hero07Props {
  tagline: string
  title: string
  description: string
  landscapeImage: string
  landscapeAlt?: string
  animation?: 'none' | 'subtle'
  primaryCTA?: CtaProps
  secondaryCTA?: CtaProps
  variant?: 'standard' | 'compact'
}

const variantStyles = {
  standard: {
    copy: 'pb-20 pt-10 sm:pb-28 sm:pt-12 lg:pb-32',
    tagline: 'text-sm sm:text-base',
    title: 'text-3xl sm:text-4xl md:text-5xl',
    description: 'text-sm sm:text-base',
    header: 'gap-6 sm:gap-8',
    grid: 'gap-10',
  },
  compact: {
    copy: 'pb-14 pt-8 sm:pb-20 sm:pt-10 lg:pb-24',
    tagline: 'text-sm',
    title: 'text-2xl sm:text-3xl md:text-4xl',
    description: 'text-sm',
    header: 'gap-4 sm:gap-5',
    grid: 'gap-8',
  },
} as const

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
}

const mediaItem: Variants = {
  hidden: { opacity: 0, y: -20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
}

function Reveal({
  active,
  variants,
  className,
  children,
}: Readonly<{
  active: boolean
  variants?: Variants
  className?: string
  children: React.ReactNode
}>) {
  if (!active) return <div className={className}>{children}</div>

  return (
    <motion.div variants={variants ?? item} className={className}>
      {children}
    </motion.div>
  )
}

export function Hero07({
  tagline,
  title,
  description,
  landscapeImage,
  landscapeAlt = '',
  animation = 'none',
  primaryCTA,
  secondaryCTA,
  variant = 'standard',
}: Readonly<Hero07Props>) {
  const reduce = useReducedMotion()
  const animate = animation === 'subtle' && !reduce
  const vs = variantStyles[variant]

  const taglineElement = tagline && (
    <p
      className={cn(
        'max-w-xs leading-relaxed tracking-tight text-secondary',
        vs.tagline,
      )}
    >
      <Balancer>{tagline}</Balancer>
    </p>
  )

  const titleElement = title && (
    <h1
      className={cn(
        'font-display max-w-3xl font-bold leading-[0.98] tracking-[-0.04em] text-balance text-foreground',
        vs.title,
        variant === 'standard' && 'lg:text-6xl',
      )}
    >
      <Balancer>{title}</Balancer>
    </h1>
  )

  const descriptionElement = description && (
    <p
      className={cn(
        'max-w-xl leading-relaxed text-muted-foreground',
        vs.description,
      )}
    >
      <Balancer>{description}</Balancer>
    </p>
  )

  const ctasElement = (primaryCTA?.ctaEnabled || secondaryCTA?.ctaEnabled) && (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {primaryCTA?.ctaEnabled && <Cta cta={primaryCTA} />}
      {secondaryCTA?.ctaEnabled && (
        <Cta
          cta={{ ...secondaryCTA, variant: secondaryCTA.variant ?? 'link' }}
        />
      )}
    </div>
  )

  const mediaElement = landscapeImage && (
    <div className="relative w-full overflow-hidden px-4 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.25rem] bg-accent p-2 sm:p-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 z-10 rounded-2xl bg-background/10 mix-blend-overlay sm:inset-3"
        />
        <img
          src={landscapeImage}
          alt={landscapeAlt}
          decoding="async"
          className="aspect-[4/3] w-full rounded-2xl object-cover object-center outline outline-black/10 sm:aspect-[16/7]"
        />
        <div className="font-quote absolute right-8 bottom-7 z-20 max-w-56 rounded-xl bg-background/90 px-4 py-3 text-lg italic text-foreground backdrop-blur sm:right-12 sm:bottom-10 sm:max-w-none sm:text-xl">
          Tak ada panggung, hanya lingkaran.
        </div>
      </div>
    </div>
  )

  return (
    <section className="relative isolate w-full overflow-hidden bg-background">
      <Reveal active={animate} variants={mediaItem} className="w-full">
        {mediaElement}
      </Reveal>

      <motion.div
        className={cn(
          'relative z-10 mx-auto grid max-w-7xl grid-cols-1 px-6 lg:grid-cols-12',
          vs.copy,
          vs.grid,
        )}
        variants={animate ? container : undefined}
        initial={animate ? 'hidden' : false}
        whileInView={animate ? 'visible' : undefined}
        viewport={{ once: true, margin: '-80px' }}
      >
        <Reveal
          active={animate}
          className="flex lg:col-span-4 lg:col-start-1 lg:items-start lg:self-stretch"
        >
          {taglineElement}
        </Reveal>

        <Reveal
          active={animate}
          className={cn(
            'flex flex-col items-start lg:col-span-6 lg:col-start-7',
            vs.header,
          )}
        >
          {titleElement}
          {descriptionElement}
          {ctasElement}
        </Reveal>
      </motion.div>
    </section>
  )
}

export default Hero07
