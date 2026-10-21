<template>
  <div class="c-accordion">
    <div
      v-for="(item, index) in items"
      :key="item.key"
      class="c-accordion__block"
      :class="{ 'is-active': activeIndex === index }"
    >
      <div @click="toggleAccordion(index)" class="c-accordion__block-title">
        <span>{{ item.title }}</span>
        <svg width="11px" height="7px" class="u-arrow">
          <use xlink:href="#arrow"></use>
        </svg>
      </div>
      <!-- Текст в SSR-HTML (виден роботам), раскрывается по клику -->
      <div class="c-accordion__block-text" ref="accordionItemText">
        <template v-if="item.rows">
          <p v-for="row in item.rows" :key="row.label">
            <b>{{ row.label }}:</b>
            <NuxtLink v-if="row.path" :to="row.path">{{ row.value }}</NuxtLink>
            <template v-else>{{ row.value }}</template>
          </p>
        </template>
        <div v-else v-html="item.html"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { slideUp, slideDown } from '~/utils/slideToggle'

defineProps({
  // [{ key, title, html } | { key, title, rows: [{ label, value, path? }] }]
  items: { type: Array, required: true },
})

const accordionItemText = ref([])
const activeIndex = ref(-1)

function toggleAccordion(index) {
  if (activeIndex.value === index) {
    activeIndex.value = -1
    slideUp(accordionItemText.value[index])
    return
  }

  if (activeIndex.value !== -1) {
    slideUp(accordionItemText.value[activeIndex.value])
  }

  activeIndex.value = index
  slideDown(accordionItemText.value[index])
}
</script>

<style lang="scss">
@import "~/assets/scss/components/accordion.scss";
</style>
