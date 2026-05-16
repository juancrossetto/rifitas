interface PrizeHeroProps {
  prizes: string[]
}

export function PrizeHero({ prizes }: PrizeHeroProps) {
  if (!prizes.length) return null
  const [first, ...rest] = prizes

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-5 shadow-lg">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative flex items-start gap-4">
        {/* Trofeo */}
        <div className="shrink-0 flex flex-col items-center">
          <span
            className="material-symbols-outlined text-5xl leading-none"
            style={{ fontVariationSettings: "'FILL' 1", color: '#fbbf24' }}
          >
            emoji_events
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-on-primary/70 mb-0.5">
            1° Premio
          </p>
          <p className="font-display font-black text-on-primary text-xl leading-tight">
            {first}
          </p>

          {/* Premios adicionales */}
          {rest.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {rest.map((prize, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-on-primary/60 min-w-[22px]">
                    {i + 2}°
                  </span>
                  <span className="text-sm text-on-primary/80 font-semibold leading-tight">
                    {prize}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
