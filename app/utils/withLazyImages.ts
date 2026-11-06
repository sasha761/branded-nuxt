// HTML из WordPress попадает в v-html уже с loading: браузер видит его до гидратации.
// Сохраняем явные настройки автора и не меняем строки внутри script/style/комментариев.
export function withLazyImages(html: string | null | undefined): string {
  if (!html) return ''

  return html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi, (tag: string) => {
    if (!/^<img\b/i.test(tag)) return tag

    const attributes = new Map([...tag.matchAll(/\s+([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g)]
      .map(match => [match[1]!.toLowerCase(), match[2]?.replace(/^(["'])([\s\S]*)\1$/, '$2')]))
    let additions = ''
    if (!attributes.has('loading')) {
      const priority = attributes.get('fetchpriority')?.toLowerCase() === 'high'
      additions += ` loading="${priority ? 'eager' : 'lazy'}"`
    }
    if (!attributes.has('decoding')) additions += ' decoding="async"'

    return tag.replace(/(\s*\/?>)$/, `${additions}$1`)
  })
}
