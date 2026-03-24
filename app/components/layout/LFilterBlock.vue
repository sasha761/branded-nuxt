<template>
  <div>
    <div v-if="status === 'pending'" style="display: flex; align-items: center; justify-content: center;">
      <UiCSpinner />
    </div>
    
    <div class="l-filter">
      <div v-for="filter in filterGroups" :key="filter.attribute" class="widget">
        <FormsSelectFilter
          @select-filter="sortHandler"
          :options="filter.options"
          :show-all="showAll"
          :placeholder="filter.label"
          :filter-param="filter.attribute"
          :current-option="getFilterByKey(filter.attribute, route.query[filter.attribute])"
        />
      </div>
    </div>
    <div class="l-shop__result">
      <div class="l-shop__result-count">
        <p v-if="props.products.length" class="woocommerce-result-count">
          Отображение {{ productCurrentCount }} из {{ productsLength }}
        </p>
      </div>
      <FormsSelectFilter
        v-if="sortOptions.length"
        @select-filter="sortHandler"
        :options="sortOptions"
        :show-all="showAll"
        placeholder="Сортировать по"
        filter-param="orderby"
        :current-option="getFilterByKey('orderby', route.query.orderby)"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  slug: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  productsCount: { type: Number, default: 0 },
  is_brand: { type: Boolean, default: false },
})

const route = useRoute()
const { locale } = useI18n()

const emit = defineEmits(['filtering'])

const showAll = { text: 'Показать все', key: 'all' }

const currentPage = computed(() => Number(route.query?.page) || 1)
const productsLength = computed(() => props.productsCount)


const { data: filtersData, status } = useLazyAsyncData(
  `filters:${props.slug}:${locale.value}:${currentPage.value}`,
  () => $fetch('/api/archive/get_filters', {
    params: {
      lang: locale.value,
      slug: props.slug,
      is_brand: props.is_brand,
    },
  }),
  {
    default: () => ({
      filters: [],
      sort_options: [],
    }),
  }
)

const filterGroups = computed(() => {
  if (!filtersData.value?.filters) return []

  return filtersData.value.filters.map((filter) => ({
    attribute: filter.attribute,
    label: filter.label,
    options: filter.options.map((option) => ({ text: option.name, key: option.slug })),
  }))
})

const sortOptions = computed(() => {
  if (!filtersData.value?.sort_options) return []

  return filtersData.value.sort_options
    .filter((option) => option.value !== 'default')
    .map((option) => ({ text: option.label, key: option.value }))
})

const productCurrentCount = computed(() => {
  const maxItems = props.products.length ? 16 : 0
  const first = props.products.length ? 1 : 0
  return `${maxItems * currentPage.value - (maxItems - first)}-${maxItems * currentPage.value - (maxItems - props.products.length)}`
})

function getAllOptions(filterKey) {
  if (filterKey === 'orderby') return sortOptions.value

  const group = filterGroups.value.find((filter) => filter.attribute === filterKey)
  return group?.options || []
}

function getFilterByKey(filterKey, searchParam) {
  const options = getAllOptions(filterKey)
  return options.find((option) => option.key === searchParam) || showAll
}

function sortHandler(selectedOption) {
  emit('filtering', selectedOption)
}
</script>

<style lang="scss" scoped>
@import "~/assets/scss/layout/filter.scss";
@import "~/assets/scss/layout/shop.scss";
</style>