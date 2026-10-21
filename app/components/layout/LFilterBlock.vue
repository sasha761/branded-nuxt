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
        <p v-if="products.length" class="woocommerce-result-count">
          {{ t('result_count', { from: rangeFrom, to: rangeTo, total: productsCount }) }}
        </p>
      </div>

      <div v-if="filterGroups.length" class="l-filter-block__mobile-trigger">
        <button
          type="button"
          class="u-btn is-grey-border is-border-radius is-small"
          @click="openMobileFilters"
        >
          {{ t('all_filters') }}
        </button>
      </div>

      <FormsSelectFilter
        v-if="sortOptions.length"
        @select-filter="sortHandler"
        :options="sortOptions"
        :show-all="showAll"
        :placeholder="t('sort_by')"
        filter-param="orderby"
        :current-option="getSortOption(route.query.orderby)"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // Слаг и таксономия архива: фильтры считаются по его товарам
  slug: { type: String, default: '' },
  taxonomy: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  productsCount: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  perPage: { type: Number, default: 16 },
})

const route = useRoute()
const { locale, t } = useI18n()
const { open } = usePopup()

const emit = defineEmits(['filtering'])

const showAll = computed(() => ({
  text: t('showAll'),
  key: 'all',
}))

const { data: filtersData, status } = useLazyAsyncData(
  `filters:${props.taxonomy}:${props.slug}:${locale.value}`,
  () => $fetch('/api/archive/get_filters', {
    params: {
      lang: locale.value,
      slug: props.slug || undefined,
      // product_cat — по умолчанию в WP
      taxonomy: props.taxonomy && props.taxonomy !== 'product_cat' ? props.taxonomy : undefined,
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

const rangeFrom = computed(() => (props.page - 1) * props.perPage + 1)
const rangeTo = computed(() => (props.page - 1) * props.perPage + props.products.length)

function getSortOption(searchParam) {
  return sortOptions.value.find((option) => option.key === searchParam) || showAll.value
}

function sortHandler(selectedOption) {
  emit('filtering', selectedOption)
}

function openMobileFilters() {
  open('PopupFilter', {
    title: t('all_filters'),
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
