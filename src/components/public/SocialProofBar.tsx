interface SocialProofBarProps {
  sold: number
  reserved: number
  total: number
  participantCount: number
}

export function SocialProofBar({ sold, reserved, total, participantCount }: SocialProofBarProps) {
  const available = total - sold - reserved
  const soldPct = Math.min((sold / total) * 100, 100)
  const reservedPct = Math.min((reserved / total) * 100, 100 - soldPct)
  const occupiedPct = soldPct + reservedPct

  // Urgency levels
  const isAlmostGone = available <= Math.max(5, total * 0.1)   // < 10% o < 5 números
  const isHighDemand = occupiedPct >= 60 && !isAlmostGone
  const isGoodMomentum = occupiedPct >= 30 && !isHighDemand && !isAlmostGone

  return (
    <div className="flex flex-col gap-3">
      {/* Social proof line */}
      {participantCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Mini avatars */}
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(participantCount, 4) }).map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center"
              >
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}
                >
                  person
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">{participantCount}</strong>
            {participantCount === 1 ? ' persona ya participa' : ' personas ya participan'}
          </p>
        </div>
      )}

      {/* Urgency chip */}
      {isAlmostGone && (
        <div className="flex items-center gap-2 px-3 py-2 bg-error-container rounded-lg">
          <span className="material-symbols-outlined text-error text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
          <span className="text-sm font-bold text-error">
            ¡Solo quedan {available} número{available !== 1 ? 's' : ''}!
          </span>
        </div>
      )}

      {isHighDemand && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 rounded-lg border border-primary/20">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            trending_up
          </span>
          <span className="text-sm font-semibold text-primary">
            Alta demanda · {Math.round(occupiedPct)}% ocupado
          </span>
        </div>
      )}

      {isGoodMomentum && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg">
          <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            bar_chart
          </span>
          <span className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">{Math.round(occupiedPct)}%</strong> de los números reservados
          </span>
        </div>
      )}

      {/* Progress bar mejorado */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className={`font-semibold ${isAlmostGone ? 'text-error' : 'text-on-surface-variant'}`}>
            {sold} vendido{sold !== 1 ? 's' : ''}
            {reserved > 0 ? ` · ${reserved} reservado${reserved !== 1 ? 's' : ''}` : ''}
          </span>
          <span className={`font-semibold ${isAlmostGone ? 'text-error' : 'text-primary'}`}>
            {available} disponible{available !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
              style={{ width: `${soldPct}%` }}
            />
            <div
              className="h-full bg-reserved/50 transition-all duration-700"
              style={{ width: `${reservedPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
