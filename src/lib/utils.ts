export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

// ── Color theming ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function relativeLuminance(r: number, g: number, b: number) {
  return [r, g, b]
    .map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0)
}

/** Returns white or black depending on which has better contrast against `hex`. */
function onColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  return relativeLuminance(r, g, b) > 0.179 ? '#1a1a1a' : '#ffffff'
}

/** Blends `hex` with white at 85% to produce a light container colour. */
function containerColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const blend = (c: number) => Math.round(c * 0.18 + 255 * 0.82)
  return `rgb(${blend(r)},${blend(g)},${blend(b)})`
}

/** Darkens `hex` by mixing with black at 30%. */
function darken(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const d = (c: number) => Math.round(c * 0.7)
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}

/**
 * Builds a set of CSS custom property overrides for a raffle theme.
 * Safe to use in a React `style` prop (cast to React.CSSProperties).
 */
export function buildRaffleTheme(
  primaryColor?: string | null,
  secondaryColor?: string | null
): Record<string, string> {
  const vars: Record<string, string> = {}

  if (primaryColor) {
    const container = containerColor(primaryColor)
    const on = onColor(primaryColor)
    const dark = darken(primaryColor)
    vars['--color-primary'] = primaryColor
    vars['--color-on-primary'] = on
    vars['--color-primary-container'] = container
    vars['--color-on-primary-container'] = dark
    vars['--color-inverse-primary'] = primaryColor
  }

  if (secondaryColor) {
    const container = containerColor(secondaryColor)
    const on = onColor(secondaryColor)
    vars['--color-secondary'] = secondaryColor
    vars['--color-on-secondary'] = on
    vars['--color-secondary-container'] = container
  }

  return vars
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
