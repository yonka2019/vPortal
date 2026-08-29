const parse = (hex: string) => {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value
  const packed = Number.parseInt(full, 16)
  return [(packed >> 16) & 255, (packed >> 8) & 255, packed & 255]
}

const linear = (component: number) => {
  const scaled = component / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]: number[]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

/**
 * Brand hexes are chosen for white backgrounds — Elastic's #005571 all but vanishes on ours.
 * Lift the dark ones toward white until they read, and leave everything else exactly as picked.
 */
export function readable(hex: string): string {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return '#9aa8c4'
  const rgb = parse(hex)
  const level = luminance(rgb)
  if (level >= 0.2) return hex
  const lift = Math.min(0.62, (0.2 - level) * 2.2)
  return `#${rgb.map((c) => Math.round(c + (255 - c) * lift).toString(16).padStart(2, '0')).join('')}`
}
