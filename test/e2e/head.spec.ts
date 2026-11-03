import { expect, test, type APIRequestContext } from '@playwright/test'

/**
 * SSR без браузера: статус, canonical, hreflang, robots, H1, редиректы.
 * Адреса категории и товара берутся с главной и из hreflang, чтобы тест работал на любой копии базы.
 */
interface Head {
  status: number
  location: string | null
  robotsHeader: string | null
  lang: string | undefined
  canonical: string[]
  alternates: Record<string, string>
  rels: string[]
  robots: string | undefined
  h1: string[]
  html: string
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
const pathOf = (url: string) => {
  const { pathname, search } = new URL(url, 'http://localhost')
  return decodeURI(pathname) + search
}

async function head(request: APIRequestContext, path: string): Promise<Head> {
  const response = await request.get(encodeURI(path), { maxRedirects: 0 })
  const html = await response.text()
  const links = html.match(/<link\s[^>]*>/g) || []
  const metas = html.match(/<meta\s[^>]*>/g) || []

  return {
    status: response.status(),
    location: response.headers().location ?? null,
    robotsHeader: response.headers()['x-robots-tag'] ?? null,
    lang: html.match(/<html[^>]*\slang="([^"]+)"/)?.[1],
    canonical: links.filter(tag => attr(tag, 'rel') === 'canonical').map(tag => attr(tag, 'href')!),
    alternates: Object.fromEntries(links
      .filter(tag => attr(tag, 'rel') === 'alternate' && attr(tag, 'hreflang'))
      .map(tag => [attr(tag, 'hreflang')!, attr(tag, 'href')!])),
    rels: links.map(tag => attr(tag, 'rel') || ''),
    robots: metas.find(tag => attr(tag, 'name') === 'robots')?.match(/content="([^"]*)"/)?.[1],
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(match => match[1]!.replace(/<[^>]+>/g, '').trim()),
    html,
  }
}

function expectIndexable(page: Head, path: string, lang: 'ru-RU' | 'uk-UA') {
  expect(page.status, path).toBe(200)
  expect(page.lang, path).toBe(lang)
  expect(page.canonical, path).toHaveLength(1)
  expect(pathOf(page.canonical[0]!), `${path}: self-canonical`).toBe(path)
  expect(Object.keys(page.alternates).sort(), `${path}: hreflang`).toEqual(['ru', 'uk', 'x-default'])
  expect(page.robots ?? '', path).not.toContain('noindex')
  expect(page.robotsHeader ?? '', path).not.toContain('noindex')
  expect(page.h1, `${path}: один непустой H1`).toHaveLength(1)
  expect(page.h1[0], path).not.toBe('')
}

test.describe('SEO и статусы SSR', () => {
  let category = ''
  let product = ''

  test.beforeAll(async ({ request }) => {
    const home = await head(request, '/')
    category = home.html.match(/href="(\/product-category\/[^"?#]+\/)"/)?.[1] ?? ''
    const archive = await head(request, category)
    product = archive.html.match(/href="(\/product\/[^"?#]+\/)"/)?.[1] ?? ''
    expect(category, 'категория в меню главной').not.toBe('')
    expect(product, `товар в ${category}`).not.toBe('')
  })

  test('главная ru и uk', async ({ request }) => {
    expectIndexable(await head(request, '/'), '/', 'ru-RU')
    expectIndexable(await head(request, '/uk/'), '/uk/', 'uk-UA')
  })

  test('категория и её uk-перевод', async ({ request }) => {
    const ru = await head(request, category)
    expectIndexable(ru, category, 'ru-RU')

    const uk = pathOf(ru.alternates.uk!)
    expect(uk).toMatch(/^\/uk\//)
    expectIndexable(await head(request, uk), uk, 'uk-UA')
  })

  test('товар и его uk-перевод, JSON-LD Product', async ({ request }) => {
    const ru = await head(request, product)
    expectIndexable(ru, product, 'ru-RU')
    expect(ru.html).toContain('application/ld+json')
    expect(ru.html).toMatch(/"@type":"Product"/)

    const uk = pathOf(ru.alternates.uk!)
    expectIndexable(await head(request, uk), uk, 'uk-UA')
  })

  test('пагинация: canonical на саму страницу, prev, без hreflang', async ({ request }) => {
    const page2 = await head(request, `${category}?page=2`)

    expect(page2.status).toBe(200)
    expect(pathOf(page2.canonical[0]!)).toBe(`${category}?page=2`)
    expect(page2.rels).toContain('prev')
    expect(page2.alternates).toEqual({})
  })

  test('UTM-метки не меняют canonical и товары', async ({ request }) => {
    const clean = await head(request, category)
    const tagged = await head(request, `${category}?utm_source=test&gclid=e2e`)

    expect(tagged.status).toBe(200)
    expect(tagged.canonical).toEqual(clean.canonical)
    const products = (page: Head) => page.html.match(/href="\/product\/[^"]+"/g) ?? []
    expect(products(tagged)).toEqual(products(clean))
  })

  for (const [path, robots] of [['/cart/', 'noindex, nofollow'], ['/checkout/', 'noindex, nofollow'], ['/search/?s=test', 'noindex, follow']] as const) {
    test(`${path}: ${robots}`, async ({ request }) => {
      const page = await head(request, path)
      expect(page.status).toBe(200)
      expect(page.robotsHeader).toBe(robots)
      expect(page.robots).toBe(robots)
    })
  }

  test('301 со старых адресов WordPress', async ({ request }) => {
    const cases: [string, string][] = [
      [category.slice(0, -1), category],
      [`${category}page/2/`, `${category}?page=2`],
      ['/?s=test', '/search/?s=test'],
      ['/my-account/', '/'],
    ]

    for (const [from, to] of cases) {
      const page = await head(request, from)
      expect(page.status, from).toBe(301)
      expect(pathOf(page.location!), from).toBe(to)
    }
  })

  test('несуществующая страница и товар — 404', async ({ request }) => {
    expect((await head(request, '/e2e-no-such-page/')).status).toBe(404)
    expect((await head(request, '/product/e2e-no-such-product/')).status).toBe(404)
  })
})
