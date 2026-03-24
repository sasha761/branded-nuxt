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

<script>
export default {
  props: {
    langs: {
      type: Array,
      required: true,
    },
    currentLang: {
      type: String,
      required: true,
    },
  },

  methods: {
    changeCurrentLang(lang) {
      this.$emit('update:currentLang', lang);
    },
  },
};
</script>
