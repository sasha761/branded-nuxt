/**
 * Позиции корзины в формате WP: из объекта товара, который хранит корзина,
 * уходят только ID, вариация, выбранные атрибуты и количество (цены WP всегда берёт из базы).
 */
export function cartProducts(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.slice(0, 50).map((item: any) => {
    const id = Number(item?.id) || 0
    const variationId = Number(item?.size_selected?.[0]?.id) || id
    const variation = cartVariation(item?.variation)

    return {
      id,
      size_selected: [{ id: variationId }],
      ...(variation ? { variation } : {}),
      quantity: Number(item?.quantity) || 1,
    }
  })
}

/**
 * Слаги атрибутов позиции ({pa_color: 'beliy'}). WP принимает их только для атрибутов «любое»
 * и только из вариантов товара, здесь — лишь форма и размер.
 */
function cartVariation(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const entries = Object.entries(value)
    .filter(([key, slug]) => /^[\w%-]{1,100}$/.test(key) && typeof slug === 'string' && slug.length <= 200)
    .slice(0, 10)

  return entries.length ? Object.fromEntries(entries) : null
}
