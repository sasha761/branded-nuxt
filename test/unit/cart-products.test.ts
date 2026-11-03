import { describe, expect, it } from 'vitest'
import { cartProducts } from '../../server/utils/cart'

describe('cartProducts (позиции корзины для WP)', () => {
  it('не массив → пустой список', () => {
    expect(cartProducts(undefined)).toEqual([])
    expect(cartProducts({ id: 1 })).toEqual([])
    expect(cartProducts('[]')).toEqual([])
  })

  it('берёт только ID, вариацию и количество; цена и прочее не уходят в WP', () => {
    const [line] = cartProducts([{
      id: '101',
      name: 'Платье',
      price: '1',
      quantity: '2',
      size_selected: [{ id: 205, name: 'M', availability: true }],
      post_img_m: 'x.jpg',
    }])

    expect(line).toEqual({ id: 101, size_selected: [{ id: 205 }], quantity: 2 })
  })

  it('простой товар без вариации: ID вариации = ID товара, количество по умолчанию 1', () => {
    expect(cartProducts([{ id: 7 }])).toEqual([{ id: 7, size_selected: [{ id: 7 }], quantity: 1 }])
  })

  it('мусор вместо чисел → 0 и 1', () => {
    expect(cartProducts([{ id: 'abc', quantity: 'x' }])).toEqual([{ id: 0, size_selected: [{ id: 0 }], quantity: 1 }])
  })

  it('передаёт слаги атрибутов «любое», отбрасывая неверные ключи и значения', () => {
    const [line] = cartProducts([{
      id: 1,
      variation: {
        'pa_color': 'cherniy',
        'pa_size': 'm',
        'bad key!': 'x',
        'pa_long': 'y'.repeat(201),
        'pa_number': 5,
      },
    }])

    expect(line?.variation).toEqual({ pa_color: 'cherniy', pa_size: 'm' })
  })

  it('пустая или неверная вариация не попадает в позицию', () => {
    expect(cartProducts([{ id: 1, variation: {} }])[0]).not.toHaveProperty('variation')
    expect(cartProducts([{ id: 1, variation: ['pa_color'] }])[0]).not.toHaveProperty('variation')
    expect(cartProducts([{ id: 1, variation: 'pa_color' }])[0]).not.toHaveProperty('variation')
  })

  it('не больше 50 позиций и 10 атрибутов', () => {
    expect(cartProducts(Array.from({ length: 60 }, (_, i) => ({ id: i + 1 })))).toHaveLength(50)

    const variation = Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`pa_${i}`, 'v']))
    expect(Object.keys(cartProducts([{ id: 1, variation }])[0]?.variation ?? {})).toHaveLength(10)
  })
})
