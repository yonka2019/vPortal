/**
 * The sky. Three slow radial blobs whose colour is mixed live with `--beam`,
 * so whichever service the pointer rests on paints the whole page.
 */
export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
      <div className="aurora__grain" />
      <div className="aurora__scrim" />
    </div>
  )
}

export const setBeam = (color: string) => document.documentElement.style.setProperty('--beam', color)

export const resetBeam = () => document.documentElement.style.removeProperty('--beam')
