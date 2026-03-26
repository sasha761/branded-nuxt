<template>
  <div>
    <div v-if="status === 'pending'" style="display: flex; align-items: center; justify-content: center;">
      <UiCSpinner />
    </div>

    <LayoutLFilterFields
      v-if="filterGroups.length"
      class="l-filter-block__desktop-filters"
      :filter-groups="filterGroups"
      :show-all="showAll"
      @filtering="sortHandler"
    />

    <div class="l-shop__result">
      <div class="l-shop__result-count">
        <p v-if="props.products.length" class="woocommerce-result-count">
          Отображение {{ productCurrentCount }} из {{ productsLength }}
        </p>
      </div>

      <div v-if="filterGroups.length" class="l-filter-block__mobile-trigger">
        <button
          type="button"
          class="u-btn is-grey-border is-border-radius is-small"
          @click="openMobileFilters"
        >
          {{ te('all_filters') ? t('all_filters') : 'All filters' }}
        </button>
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
const { locale, t, te } = useI18n()
const { open } = usePopup()

const emit = defineEmits(['filtering'])

const showAll = computed(() => ({
  text: te('showAll') ? t('showAll') : 'Show all',
  key: 'all',
}))

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

function getFilterByKey(filterKey, searchParam) {
  const options = sortOptions.value
  return options.find((option) => option.key === searchParam) || showAll.value
}

function sortHandler(selectedOption) {
  emit('filtering', selectedOption)
}

function openMobileFilters() {
  open('PopupFilter', {
    title: te('all_filters') ? t('all_filters') : 'All filters',
    filterGroups: filterGroups.value,
    showAll: showAll.value,
    onSelect: sortHandler,
  })
}
</script>

<style lang="scss" scoped>
@import "~/assets/scss/layout/filter.scss";
@import "~/assets/scss/layout/shop.scss";

.l-filter-block__mobile-trigger {
  display: none;
}

@media only screen and (max-width: 1023px) {
  .l-filter-block__mobile-trigger {
    display: flex;
    justify-content: space-between;
  }

  .l-filter-block__desktop-filters {
    display: none;
  }
}
</style>
