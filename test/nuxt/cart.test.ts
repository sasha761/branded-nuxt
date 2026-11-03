import { describe, expect, it } from 'vitest'
import { cartLineKey, toCartItem } from '~/stores/cart'
import type { SelectedVariation } from '~/types/wp-api'

const product = {
  id: 100,
  name: 'Шорты FLUID',
  path: '/product/shorty-fluid/',
  price: '1380',
  post_attr_brand: 'LEXIE',
  post_brand_path: '/brand/lexie/',
  image: { sizes: { archive_md: { src: 'https://example.com/shorts-532x665.jpg' } } },
  specs: { categories: ['Женщинам', 'Шорты'] },
  // корзине не нужны: не должны попасть в localStorage
  gallery: [{ src: 'big.jpg' }],
  related: [{ id: 1 }],
  comments: [{ id: 1 }],
}

const selection = (variation: Record<string, string>): SelectedVariation => ({
  id: 205,
  name: 'M/L',
  availability: true,
  price: '1200',
  attributes: [{ name: 'pa_size', label: 'Размер', value: 'M/L' }],
  variation,
})

describe('toCartItem', () => {
  it('вариация: ID и цена вариации, атрибуты и слаги для заказа', () => {
    const item = toCartItem(product, selection({ pa_size: 'm-l' }), 2)

    expect(item).toEqual({
      id: 100,
      name: 'Шорты FLUID',
      path: '/product/shorty-fluid/',
      price: '1200',
      quantity: 2,
      size_selected: [{ id: 205, name: 'M/L', availability: true }],
      attributes: [{ name: 'pa_size', label: 'Размер', value: 'M/L' }],
      variation: { pa_size: 'm-l' },
      post_img_m: 'https://example.com/shorts-532x665.jpg',
      post_attr_brand: 'LEXIE',
      post_brand_path: '/brand/lexie/',
      categories: ['Женщинам', 'Шорты'],
    })
  })

  it('простой товар: позиция «one size» с ID товара, без атрибутов', () => {
    const item = toCartItem(product, null)

    expect(item.size_selected).toEqual([{ id: 100, name: 'one size', availability: true }])
    expect(item.price).toBe('1380')
    expect(item.quantity).toBe(1)
    expect(item).not.toHaveProperty('attributes')
    expect(item).not.toHaveProperty('variation')
  })

  it('прежний выбор размера (SizeOption без variation) — без атрибутов', () => {
    const item = toCartItem(product, { id: 300, name: 'S', availability: true })

    expect(item.size_selected).toEqual([{ id: 300, name: 'S', availability: true }])
    expect(item).not.toHaveProperty('variation')
  })

  it('не тащит в корзину галерею, похожие товары и отзывы', () => {
    const item: Record<string, unknown> = { ...toCartItem(product, null) }

    expect(item.gallery).toBeUndefined()
    expect(item.related).toBeUndefined()
    expect(item.comments).toBeUndefined()
  })

  it('картинка: archive_md, иначе прежний post_img_m, иначе false', () => {
    expect(toCartItem({ ...product, image: undefined, post_img_m: 'old.jpg' }, null).post_img_m).toBe('old.jpg')
    expect(toCartItem({ ...product, image: undefined }, null).post_img_m).toBe(false)
  })
})

describe('cartLineKey', () => {
  it('одна вариация в двух цветах («любой» цвет) — две позиции', () => {
    const black = toCartItem(product, selection({ pa_color: 'cherniy', pa_size: 'm-l' }))
    const white = toCartItem(product, selection({ pa_color: 'beliy', pa_size: 'm-l' }))

    expect(cartLineKey(black)).not.toBe(cartLineKey(white))
  })

  it('тот же выбор — та же позиция', () => {
    const a = toCartItem(product, selection({ pa_size: 'm-l' }))
    const b = toCartItem(product, selection({ pa_size: 'm-l' }), 3)

    expect(cartLineKey(a)).toBe(cartLineKey(b))
  })

  it('старые позиции из localStorage без variation и size_selected', () => {
    expect(cartLineKey({ id: 7, size_selected: [{ id: 70, name: 'M', availability: true }] })).toBe('70|{}')
    expect(cartLineKey({ id: 7, size_selected: undefined as never })).toBe('7|{}')
  })
})
