import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useProductVariation } from '~/composables/useProductVariation'
import type { SingleProduct } from '~/types/wp-api'

const color = {
  name: 'pa_color',
  label: 'Цвет',
  type: 'color',
  options: [
    { slug: 'cherniy', name: 'Черный', color: '#000000' },
    { slug: 'beliy', name: 'Белый', color: '#ffffff' },
  ],
}
const size = {
  name: 'pa_size',
  label: 'Размер',
  type: 'select',
  options: [
    { slug: 'xs-s', name: 'XS/S', color: null },
    { slug: 'm-l', name: 'M/L', color: null },
  ],
}
// Атрибут с одним вариантом (бренд в вариациях): выбирать не из чего, не показывается
const brand = {
  name: 'pa_brand',
  label: 'Бренд',
  type: 'select',
  options: [{ slug: 'lexie', name: 'Lexie', color: null }],
}

function product(data: Partial<SingleProduct>) {
  return ref({ id: 1, name: 'Шорты', ...data } as SingleProduct)
}

// Как шорты Lexie: черный XS/S и белый M/L закончились
const lexie = () => product({
  variation_attributes: [color, size, brand],
  variations: [
    { id: 11, attributes: { pa_color: 'cherniy', pa_size: 'xs-s', pa_brand: 'lexie' }, in_stock: false, price: '1000' },
    { id: 12, attributes: { pa_color: 'cherniy', pa_size: 'm-l', pa_brand: 'lexie' }, in_stock: true, price: '1100' },
    { id: 13, attributes: { pa_color: 'beliy', pa_size: 'xs-s', pa_brand: 'lexie' }, in_stock: true, price: '1200' },
    { id: 14, attributes: { pa_color: 'beliy', pa_size: 'm-l', pa_brand: 'lexie' }, in_stock: false, price: '1300' },
  ],
} as Partial<SingleProduct>)

describe('useProductVariation', () => {
  it('по умолчанию выбрана первая вариация в наличии', () => {
    const { selected, variation, hasVariations } = useProductVariation(lexie())

    expect(hasVariations.value).toBe(true)
    expect(selected.value).toEqual({ pa_color: 'cherniy', pa_size: 'm-l', pa_brand: 'lexie' })
    expect(variation.value?.id).toBe(12)
  })

  it('показывает цвет и размер, атрибут с одним вариантом скрыт', () => {
    const { visibleAttributes } = useProductVariation(lexie())
    expect(visibleAttributes.value.map(attribute => attribute.name)).toEqual(['pa_color', 'pa_size'])
  })

  it('недоступное сочетание приглушено, но вариант выбираем через другой цвет', () => {
    const { isAvailable, isSelectable } = useProductVariation(lexie())

    // при черном XS/S нет в наличии…
    expect(isAvailable('pa_size', 'xs-s')).toBe(false)
    // …но белый XS/S есть
    expect(isSelectable('pa_size', 'xs-s')).toBe(true)
    expect(isAvailable('pa_size', 'm-l')).toBe(true)
  })

  it('выбор размера, которого нет в текущем цвете, переключает цвет на вариацию в наличии', () => {
    const { select, selected, variation } = useProductVariation(lexie())

    select('pa_size', 'xs-s')

    expect(selected.value).toMatchObject({ pa_color: 'beliy', pa_size: 'xs-s' })
    expect(variation.value?.id).toBe(13)
  })

  it('выбор цвета, которого нет в текущем размере, переключает размер', () => {
    const { select, selected, variation } = useProductVariation(lexie())

    select('pa_color', 'beliy')

    expect(selected.value).toMatchObject({ pa_color: 'beliy', pa_size: 'xs-s' })
    expect(variation.value?.id).toBe(13)
  })

  it('selection для корзины: ID вариации, цена, подписи и слаги атрибутов', () => {
    const { selection } = useProductVariation(lexie())

    expect(selection.value).toEqual({
      id: 12,
      name: 'M/L',
      availability: true,
      price: '1100',
      attributes: [
        { name: 'pa_color', label: 'Цвет', value: 'Черный' },
        { name: 'pa_size', label: 'Размер', value: 'M/L' },
      ],
      variation: { pa_color: 'cherniy', pa_size: 'm-l', pa_brand: 'lexie' },
    })
  })

  it('цвет «любой» в вариации: одна вариация, выбранный цвет уходит в variation', () => {
    const { select, selection } = useProductVariation(product({
      variation_attributes: [color, { ...size, options: [size.options[1]!] }],
      variations: [{ id: 20, attributes: { pa_color: '', pa_size: 'm-l' }, in_stock: true, price: '900' }],
    } as Partial<SingleProduct>))

    expect(selection.value?.variation).toEqual({ pa_color: 'cherniy', pa_size: 'm-l' })

    select('pa_color', 'beliy')

    expect(selection.value?.id).toBe(20)
    expect(selection.value?.variation).toEqual({ pa_color: 'beliy', pa_size: 'm-l' })
    expect(selection.value?.attributes[0]).toEqual({ name: 'pa_color', label: 'Цвет', value: 'Белый' })
  })

  it('всё распродано: выбрана первая вариация, availability = false', () => {
    const { variation, selection } = useProductVariation(product({
      variation_attributes: [size],
      variations: [
        { id: 31, attributes: { pa_size: 'xs-s' }, in_stock: false, price: '500' },
        { id: 32, attributes: { pa_size: 'm-l' }, in_stock: false, price: '500' },
      ],
    } as Partial<SingleProduct>))

    expect(variation.value?.id).toBe(31)
    expect(selection.value?.availability).toBe(false)
  })

  it('простой товар или WP без новых полей: вариаций нет, selection = null', () => {
    const { hasVariations, selection } = useProductVariation(product({}))

    expect(hasVariations.value).toBe(false)
    expect(selection.value).toBeNull()
  })
})
