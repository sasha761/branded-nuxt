import { describe, expect, it } from 'vitest'
import { withLazyImages } from '../../app/utils/withLazyImages'

describe('изображения в HTML WordPress', () => {
  it('добавляет lazy до отправки HTML, сохраняя picture, srcset и адреса', () => {
    const html = '<picture><source srcset="photo.jpg 2x"><img src="photo.jpg" alt="Товар"></picture>'
    expect(withLazyImages(html)).toBe('<picture><source srcset="photo.jpg 2x"><img src="photo.jpg" alt="Товар" loading="lazy" decoding="async"></picture>')
    expect(withLazyImages(withLazyImages(html))).toBe(withLazyImages(html))
  })

  it('сохраняет явную загрузку и приоритет LCP', () => {
    const explicit = '<img src="hero.jpg" loading="eager" decoding="sync">'
    expect(withLazyImages(explicit)).toBe(explicit)
    expect(withLazyImages('<img src="hero.jpg" fetchpriority="high">')).toContain('loading="eager"')
    expect(withLazyImages("<IMG src='hero.jpg' LOADING='lazy' />")).toBe("<IMG src='hero.jpg' LOADING='lazy' decoding=\"async\" />")
  })

  it('обрабатывает кавычки и > в alt, не принимая их за атрибуты', () => {
    expect(withLazyImages('<img src=x.jpg alt="size > 5 loading=eager" data-loading="yes">'))
      .toBe('<img src=x.jpg alt="size > 5 loading=eager" data-loading="yes" loading="lazy" decoding="async">')
    expect(withLazyImages('<img src=x.jpg alt=\'fetchpriority="high"\'>')).toContain('loading="lazy"')
  })

  it('не меняет комментарии, скрипты, стили и пустой контент', () => {
    const html = '<!-- <img src=x> --><script>const image = \'<img src=x>\'</script><style>.x::after { content: "<img src=x>" }</style><p>Текст</p>'
    expect(withLazyImages(html)).toBe(html)
    expect(withLazyImages(null)).toBe('')
    expect(withLazyImages(undefined)).toBe('')
  })
})
