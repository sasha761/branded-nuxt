import type { ProductVariation, SelectedAttribute, SelectedVariation, SingleProduct, VariationAttribute } from '~/types/wp-api'

// Показываются всегда, даже с одним вариантом. Прочие атрибуты с одним вариантом (бренд в вариациях)
// выбирать не из чего: они выбраны молча и уходят в заказ.
const ALWAYS_SHOWN = new Set(['pa_size', 'pa_color'])

type Selection = Record<string, string>

/** Вариация подходит под выбор: у каждого выбранного атрибута её значение совпадает или «любое» (''). */
function matches(variation: ProductVariation, selection: Selection) {
  return Object.entries(selection).every(([name, slug]) => {
    const own = variation.attributes[name]
    return !slug || !own || own === slug
  })
}

/**
 * Выбор вариации по всем атрибутам (размер, цвет…), как форма вариаций WooCommerce.
 * Данные из get_single_product: variation_attributes и variations (docs/wp-api.md).
 */
export function useProductVariation(product: Ref<SingleProduct | null>) {
  const attributes = computed<VariationAttribute[]>(
    () => (product.value?.variation_attributes || []).filter(attribute => attribute.options.length)
  )
  const variations = computed<ProductVariation[]>(() => product.value?.variations || [])
  const hasVariations = computed(() => attributes.value.length > 0 && variations.value.length > 0)

  const visibleAttributes = computed(() => attributes.value.filter(
    attribute => attribute.options.length > 1 || ALWAYS_SHOWN.has(attribute.name) || attribute.type === 'color'
  ))

  function find(selection: Selection, inStockOnly = true) {
    return variations.value.find(variation => (!inStockOnly || variation.in_stock) && matches(variation, selection))
  }

  /** Полный выбор по вариации: её значения, а для «любое» — текущий выбор или первый вариант. */
  function selectionFrom(variation: ProductVariation | undefined, current: Selection = {}): Selection {
    return Object.fromEntries(attributes.value.map(attribute => [
      attribute.name,
      variation?.attributes[attribute.name] || current[attribute.name] || attribute.options[0]!.slug,
    ]))
  }

  // Первая вариация в наличии, как раньше первый доступный размер. Считается одинаково на сервере и клиенте.
  const selected = ref<Selection>(selectionFrom(find({}) ?? variations.value[0]))

  const variation = computed(() => find(selected.value) ?? find(selected.value, false) ?? null)

  /** Есть вариация в наличии с этим вариантом при остальном текущем выборе. */
  function isAvailable(name: string, slug: string) {
    return Boolean(find({ ...selected.value, [name]: slug }))
  }

  /** Есть вариация в наличии с этим вариантом хоть при каком-то выборе остальных атрибутов. */
  function isSelectable(name: string, slug: string) {
    return Boolean(find({ [name]: slug }))
  }

  function select(name: string, slug: string) {
    const next = { ...selected.value, [name]: slug }

    if (find(next)) {
      selected.value = next
      return
    }

    // Сочетания нет в наличии: остальные атрибуты берутся из подходящей вариации
    const fallback = find({ [name]: slug }) ?? find({ [name]: slug }, false)
    selected.value = fallback ? { ...selectionFrom(fallback, selected.value), [name]: slug } : next
  }

  function selectedOption(attribute: VariationAttribute) {
    return attribute.options.find(option => option.slug === selected.value[attribute.name]) ?? null
  }

  // Для корзины и «Купить в 1 клик»: совместимо с прежним size_selected ({id, name, availability})
  const selection = computed<SelectedVariation | null>(() => {
    if (!hasVariations.value || !variation.value) {
      return null
    }

    const shown: SelectedAttribute[] = visibleAttributes.value
      .map(attribute => ({ name: attribute.name, label: attribute.label, value: selectedOption(attribute)?.name || '' }))
      .filter(attribute => attribute.value)

    return {
      id: variation.value.id,
      name: shown.find(attribute => attribute.name === 'pa_size')?.value || shown.map(attribute => attribute.value).join(', '),
      availability: variation.value.in_stock,
      price: variation.value.price,
      attributes: shown,
      variation: { ...selected.value },
    }
  })

  return {
    hasVariations,
    visibleAttributes,
    selected,
    variation,
    selection,
    select,
    selectedOption,
    isAvailable,
    isSelectable,
  }
}
