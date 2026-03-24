<template>
  <div class="c-logo">
    <NuxtLink :to="localePath('/')">
      <svg width="100%" height="35px">
        <use xlink:href="#logo"></use>
      </svg>
    </NuxtLink>
  </div>
</template>

<script setup>
const localePath = useLocalePath()
</script>

<style lang="scss">
@import url("~/assets/scss/components/logo.scss");
</style>