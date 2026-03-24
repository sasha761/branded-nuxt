export function stripSlug(url: string): string {
  if (!url) return ''
  return url.split('/').filter(Boolean).pop() || ''
}

export function stripDomain(url: string): string {
  if (!url) return ''
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
  } catch {
    return url
  }
}
