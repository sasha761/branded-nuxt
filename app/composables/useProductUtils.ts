export function useProductUtils() {
  function extractProductName(url: string): string | undefined {
    if (!url) return
    const parts = url.split('/')
    return parts[parts.length - 2]
  }

  function stripSlug(url: string): string {
    if (!url) return ''
    return url.split('/').filter(Boolean).pop() || ''
  }

  function stripLang(url: string): string | null {
    if (!url) return null
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      if (pathParts[1] === 'uk') return pathParts[1]
    } catch {
      // relative URL
      const pathParts = url.split('/')
      if (pathParts[1] === 'uk') return pathParts[1]
    }
    return null
  }

  function stripDomain(url: string): string {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  return { extractProductName, stripSlug, stripLang, stripDomain }
}
