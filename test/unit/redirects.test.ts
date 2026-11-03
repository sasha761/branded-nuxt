import { describe, expect, it } from 'vitest'
import { redirectTarget } from '../../server/utils/redirects'

const target = (url: string) => {
  const { pathname, search } = new URL(url, 'http://localhost')
  return redirectTarget(pathname, search)
}

describe('redirectTarget', () => {
  it('добавляет слеш в конце, сохраняя query', () => {
    expect(target('/product-category/women')).toBe('/product-category/women/')
    expect(target('/product-category/women?color=beliy')).toBe('/product-category/women/?color=beliy')
  })

  it('не трогает канонические адреса', () => {
    expect(target('/')).toBeNull()
    expect(target('/uk/')).toBeNull()
    expect(target('/product-category/women/')).toBeNull()
    expect(target('/product-category/women/?page=2&utm_source=x')).toBeNull()
  })

  it('пропускает API, служебные пути и файлы', () => {
    expect(target('/api/route')).toBeNull()
    expect(target('/_nuxt/entry.js')).toBeNull()
    expect(target('/robots.txt')).toBeNull()
    expect(target('/sitemap_index.xml')).toBeNull()
    expect(target('/wp-content/uploads/2023/06/photo.jpeg')).toBeNull()
  })

  it('пагинация WordPress: /page/N/ → ?page=N', () => {
    expect(target('/product-category/women/page/2/')).toBe('/product-category/women/?page=2')
    expect(target('/product-category/women/page/3')).toBe('/product-category/women/?page=3')
    expect(target('/uk/brand/flex-uk/page/2/?orderby=price')).toBe('/uk/brand/flex-uk/?orderby=price&page=2')
  })

  it('/page/1/ → без номера страницы', () => {
    expect(target('/product-category/women/page/1/')).toBe('/product-category/women/')
    expect(target('/product-category/women/page/1/?page=5')).toBe('/product-category/women/')
  })

  it('поиск WordPress: /?s= → /search/?s=', () => {
    expect(target('/?s=платье')).toBe(`/search/?s=${encodeURIComponent('платье').replace(/%20/g, '+')}`)
    expect(target('/uk/?s=test')).toBe('/uk/search/?s=test')
    expect(target('/uk?s=test')).toBe('/uk/search/?s=test')
  })

  it('кабинет WooCommerce → главная языка', () => {
    expect(target('/my-account/')).toBe('/')
    expect(target('/my-account/orders/')).toBe('/')
    expect(target('/uk/mij-akaunt/edit-account/')).toBe('/uk/')
    expect(target('/uk/my-account')).toBe('/uk/')
  })

  it('похожие на кабинет пути не перехватываются', () => {
    expect(target('/my-accounts-test/')).toBeNull()
  })

  it('схлопывает повторные слеши', () => {
    expect(target('/product-category//women/')).toBe('/product-category/women/')
  })
})
