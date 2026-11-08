export function imageViewportMargin(offset: number) {
  return `${Number.isFinite(offset) ? Math.max(0, offset) : 200}px 0px`
}
