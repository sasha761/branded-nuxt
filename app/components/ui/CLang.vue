<template>
  <div class="c-lang js-lang">
    <div class="c-lang__current">
      {{ currentLang }}
      <svg width="11px" height="7px" class="c-lang__arrow">
        <use xlink:href="#arrow"></use>
      </svg>
    </div>
    <div v-if="langs.length" class="c-lang__sub">
      <NuxtLink
        v-for="lang in langs"
        :key="lang.code"
        :to="lang.path"
        :hreflang="lang.code"
        class="c-lang__item"
        @click="emit('switch', lang.code)"
      >{{ lang.code }}</NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // [{ code, path }] — путь перевода текущей страницы
  langs: {
    type: Array,
    default: () => [],
  },
  currentLang: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['switch'])
</script>

<style lang="scss" scoped>
@import "~/assets/scss/components/lang.scss";
</style>
