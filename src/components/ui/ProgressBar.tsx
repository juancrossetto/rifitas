'use client'

interface ProgressBarProps {
  sold: number
  reserved: number
  total: number
}

export function ProgressBar({ sold, reserved, total }: ProgressBarProps) {
  const soldPct = Math.min((sold / total) * 100, 100)
  const reservedPct = Math.min((reserved / total) * 100, 100 - soldPct)

  return (
    <div>
      <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
        <span>{sold} vendidos</span>
        <span>{total - sold - reserved} disponibles</span>
      </div>
      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-container transition-all"
            style={{ width: `${soldPct}%` }}
          />
          <div
            className="h-full bg-reserved/60 transition-all"
            style={{ width: `${reservedPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
