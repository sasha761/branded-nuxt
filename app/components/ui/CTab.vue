<template>
  <div class="c-tab">
    <div class="c-tab__nav">
      <span
        v-for="(tabItem, name, index) in data.menu"
        :key="index"
        :class="{ 'is-active': index === activeTab }"
        @click="toggleTab(index)"
        class="c-tab__item"
      >
        {{ name }}
      </span>
      <slot name="additionalFieldInTabNav"></slot>
    </div>
    <div class="c-tab__container">
      <div
        v-for="(tabContent, name, index) in data.menu"
        :key="index"
        :class="{ 'is-active': index === activeTab }"
        class="c-tab__content"
      >
        <slot name="tabContent" :tabContent="tabContent"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },
})

const activeTab = ref(0)

function toggleTab(tab) {
  activeTab.value = tab
}
</script>

<style lang="scss">
@import "~/assets/scss/components/tab.scss";
</style>