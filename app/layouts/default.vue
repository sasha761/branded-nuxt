<template>
  <div class="default-layout">
    <UiCPageLoader v-if="isLanguageSwitchLoading" />
    <LayoutLModal />
    <LayoutLHeader />
    <div class="wrapper">
      <slot />
    </div>
    <LayoutLFooter />
  </div>
</template>

<script setup>
const { isLanguageSwitchLoading } = useLanguageSwitchLoader()
</script>
