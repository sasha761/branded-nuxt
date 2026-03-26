<template>
  <div class="c-modal is-filter" id="filter">
    <div class="c-modal__title">
      <h3 class="u-h3">{{ title }}</h3>
      <svg @click="handleCloseClick" width="20px" height="20px" class="c-modal__close">
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>

    <LayoutLFilterFields
      :filter-groups="props.data?.filterGroups || []"
      :show-all="resolvedShowAll"
      @filtering="handleFiltering"
    />

    <button class="u-btn is-black" @click="handleCloseClick">{{ t('apply') }}</button>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: () => ({}) },
})

const { t, te } = useI18n()
const { close } = usePopup()

const title = computed(() => props.data?.title || (te('all_filters') ? t('all_filters') : 'All filters'))
const resolvedShowAll = computed(() => props.data?.showAll || {
  text: te('showAll') ? t('showAll') : 'Show all',
  key: 'all',
})

function handleCloseClick() {
  close()
}

function handleFiltering(selectedOption) {
  props.data?.onSelect?.(selectedOption)
}
</script>
