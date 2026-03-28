<template>
  <div class="default-layout">
    <LayoutLHeader />
    <div class="wrapper">
      <slot />
    </div>
    <LayoutLFooter />
    <UiCPageLoader v-if="isLanguageSwitchLoading" />
    <LayoutLModal />
  </div>
</template>

<script setup>
const { isLanguageSwitchLoading } = useLanguageSwitchLoader()
</script>
