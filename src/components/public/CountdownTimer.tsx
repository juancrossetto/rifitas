'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  drawDate: string | Date
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(target: Date): TimeLeft {
  const total = target.getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ drawDate }: CountdownTimerProps) {
  const target = new Date(drawDate)
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(target))

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

  const isUrgent = time.total > 0 && time.days === 0
  const isOver = time.total === 0

  if (isOver) {
    return (
      <div className="rounded-2xl bg-surface-container border border-outline-variant px-5 py-4 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1 block">event_available</span>
        <p className="font-display font-bold text-on-surface">¡Sorteo realizado!</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl px-5 py-4 ${
      isUrgent
        ? 'bg-error-container border border-error/30'
        : 'bg-primary/5 border border-primary/20'
    }`}>
      <p className={`text-xs font-semibold text-center mb-3 tracking-widest uppercase ${
        isUrgent ? 'text-error' : 'text-primary'
      }`}>
        {isUrgent ? '⚡ Últimas horas' : '⏳ Tiempo restante'}
      </p>

      <div className="flex items-center justify-center gap-2">
        {time.days > 0 && (
          <>
            <TimeUnit value={time.days} label="días" urgent={isUrgent} />
            <Sep urgent={isUrgent} />
          </>
        )}
        <TimeUnit value={time.hours} label="hs" urgent={isUrgent} />
        <Sep urgent={isUrgent} />
        <TimeUnit value={time.minutes} label="min" urgent={isUrgent} />
        <Sep urgent={isUrgent} />
        <TimeUnit value={time.seconds} label="seg" urgent={isUrgent} live />
      </div>
    </div>
  )
}

function TimeUnit({
  value,
  label,
  urgent,
  live,
}: {
  value: number
  label: string
  urgent: boolean
  live?: boolean
}) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span
        className={`font-display font-black text-3xl tabular-nums leading-none ${
          urgent ? 'text-error' : 'text-primary'
        } ${live ? 'transition-all duration-500' : ''}`}
      >
        {pad(value)}
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${
        urgent ? 'text-error/70' : 'text-primary/60'
      }`}>
        {label}
      </span>
    </div>
  )
}

function Sep({ urgent }: { urgent: boolean }) {
  return (
    <span className={`font-display font-black text-2xl pb-3 select-none ${
      urgent ? 'text-error/60' : 'text-primary/40'
    }`}>
      :
    </span>
  )
}
