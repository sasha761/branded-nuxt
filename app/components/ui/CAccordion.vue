<template>
  <div class="c-accordion">
    <div
      v-for="(item, index) in accordionItems"
      :key="index"
      class="c-accordion__block"
      :class="{ 'is-active': item.active }"
    >
      <div @click="toggleAccordion(index)" class="c-accordion__block-title">
        <span>{{ te(item.title) ? t(item.title) : item.title }}</span>
        <svg width="11px" height="7px" class="u-arrow">
          <use xlink:href="#arrow"></use>
        </svg>
      </div>
      <div
        class="c-accordion__block-text"
        ref="accordionItemText"
        v-html="item.content"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { slideUp, slideDown } from '~/utils/slideToggle'

const { t, te } = useI18n()

const props = defineProps({
  accordionInfo: { type: Object, required: true },
})

const accordionItemText = ref([])
const accordionItems = ref([])

onMounted(() => {
  for (const [key, value] of Object.entries(props.accordionInfo)) {
    accordionItems.value.push({
      title: key,
      content: value,
      active: false,
    })
  }
})

function toggleAccordion(index) {
  if (accordionItems.value[index].active) {
    accordionItems.value[index].active = false
    slideUp(accordionItemText.value[index])
  } else {
    closeAll()
    openItem(index)
  }
}

function closeAll() {
  accordionItems.value.forEach((block, i) => {
    if (block.active) {
      block.active = false
      slideUp(accordionItemText.value[i])
    }
  })
}

function openItem(index) {
  accordionItems.value[index].active = true
  slideDown(accordionItemText.value[index])
}
</script>

<style lang="scss">
@import "~/assets/scss/components/accordion.scss";
</style>