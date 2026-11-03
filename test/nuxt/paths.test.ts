import { describe, expect, it } from 'vitest'
import { normalizePath } from '~/composables/usePageRoute'
import { parseOrderUrl } from '~/composables/useOrderForm'

describe('normalizePath (путь для WP)', () => {
  it('декодирует кириллицу и добавляет слеш в конце', () => {
    expect(normalizePath('/%D0%B1%D1%80%D0%B5%D0%BD%D0%B4/suns-house')).toBe('/бренд/suns-house/')
  })

  it('не дублирует слеш', () => {
    expect(normalizePath('/uk/brand/flex-uk/')).toBe('/uk/brand/flex-uk/')
    expect(normalizePath('/')).toBe('/')
  })

  it('битый percent-encoding оставляет как есть', () => {
    expect(normalizePath('/x/%E0%A4%A')).toBe('/x/%E0%A4%A/')
  })
})

describe('parseOrderUrl (ответ create_order)', () => {
  it('абсолютный URL WP: номер и ключ заказа', () => {
    expect(parseOrderUrl('https://branded.com.ua/checkout/order-received/12345/?key=wc_order_AbC123'))
      .toEqual({ id: '12345', key: 'wc_order_AbC123' })
  })

  it('относительный URL и uk-префикс', () => {
    expect(parseOrderUrl('/uk/checkout/order-received/77/?key=wc_order_x')).toEqual({ id: '77', key: 'wc_order_x' })
  })

  it('без ключа — null: страница заказа без ключа отдаёт 404', () => {
    expect(parseOrderUrl('https://branded.com.ua/checkout/order-received/12345/')).toBeNull()
  })

  it('не строка или не URL заказа — null', () => {
    expect(parseOrderUrl(undefined)).toBeNull()
    expect(parseOrderUrl({ id: 1 })).toBeNull()
    expect(parseOrderUrl('https://branded.com.ua/cart/?key=x')).toBeNull()
  })
})
