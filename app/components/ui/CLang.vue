<template>
  <div class="c-lang js-lang">
    <div class="c-lang__current">
      {{ currentLang }}
      <svg width="11px" height="7px" class="c-lang__arrow">
        <use xlink:href="#arrow"></use>
      </svg>
    </div>
    <div class="c-lang__sub">
      <div
        v-for="lang in langs"
        :key="lang.language_code"
        @click="changeCurrentLang(lang.language_code)"
        class="c-lang__item"
      >{{ lang.language_code }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  langs: {
    type: Array,
    required: true,
  },
  currentLang: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:currentLang'])

function changeCurrentLang(lang) {
  emit('update:currentLang', lang)
}
</script>
  
<style lang="scss" scoped>
@import "~/assets/scss/components/lang.scss";
</style>