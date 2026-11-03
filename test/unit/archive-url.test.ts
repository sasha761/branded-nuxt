import { describe, expect, it } from 'vitest'
import { isArchiveParam, normalizeArchiveUrl } from '../../shared/utils/archiveUrl'

describe('normalizeArchiveUrl', () => {
  it('убирает метки рекламы', () => {
    expect(normalizeArchiveUrl('/product-category/women/?utm_source=fb&gclid=abc&fbclid=x&srsltid=y'))
      .toBe('/product-category/women/')
  })

  it('оставляет параметры каталога и сортирует ключи', () => {
    expect(normalizeArchiveUrl('/product-category/women/?page=2&gclid=abc&color=beliy&orderby=price'))
      .toBe('/product-category/women/?color=beliy&orderby=price&page=2')
  })

  it('разные метки рекламы дают один и тот же url', () => {
    const a = normalizeArchiveUrl('/brand/flex/?size=m&gclid=AAA')
    const b = normalizeArchiveUrl('/brand/flex/?utm_campaign=x&size=m&fbclid=BBB')
    expect(a).toBe(b)
  })

  it('filter_* и массивы PHP', () => {
    expect(normalizeArchiveUrl('/sezon/zima/?filter_color=red,blue&color[]=a&color[]=b'))
      .toBe('/sezon/zima/?color%5B%5D=a&color%5B%5D=b&filter_color=red%2Cblue')
  })

  it('повторяющиеся ключи сохраняют порядок', () => {
    expect(normalizeArchiveUrl('/x/?color=b&color=a')).toBe('/x/?color=b&color=a')
  })

  it('пустые значения и hash отбрасываются', () => {
    expect(normalizeArchiveUrl('/x/?color=&page=2#top')).toBe('/x/?page=2')
    expect(normalizeArchiveUrl('/x/#top')).toBe('/x/')
  })

  it('путь без query не меняется, кириллица в пути остаётся как есть', () => {
    expect(normalizeArchiveUrl('/бренд/suns-house/')).toBe('/бренд/suns-house/')
  })

  it('идемпотентна: повторная нормализация ничего не меняет', () => {
    const once = normalizeArchiveUrl('/x/?s=сумка женская&page=2&utm_source=a')
    expect(normalizeArchiveUrl(once)).toBe(once)
  })
})

describe('isArchiveParam', () => {
  it.each(['orderby', 'page', 's', 'brand', 'color', 'size', 'sezon', 'filter_material', 'color[]'])('%s — параметр каталога', (key) => {
    expect(isArchiveParam(key)).toBe(true)
  })

  it.each(['utm_source', 'gclid', 'fbclid', 'yclid', 'srsltid', 'ref', 'on_sale'])('%s — не параметр каталога', (key) => {
    expect(isArchiveParam(key)).toBe(false)
  })
})
