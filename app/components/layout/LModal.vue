<template>
  <div class="l-modal" :class="{ 'is-active': popupState.name }">
    <div class="l-modal__overlay" @click="close"></div>
    <div class="l-modal__wrapper">
      <component :is="currentComponent" v-if="currentComponent" :data="popupState.data"></component>
    </div>
  </div>
</template>

<script setup lang="ts">
const { popupState, close } = usePopup()

const popupComponents: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  PopupQuickBuy: defineAsyncComponent({
    loader: () => import('~/components/popups/PopupQuickBuy.vue'),
    onError(error) { console.error('Failed to load PopupQuickBuy:', error) },
  }),
  PopupMobileMenu: defineAsyncComponent({
    loader: () => import('~/components/popups/PopupMobileMenu.vue'),
    onError(error) { console.error('Failed to load PopupMobileMenu:', error) },
  }),
  PopupLightbox: defineAsyncComponent({
    loader: () => import('~/components/popups/PopupLightbox.vue'),
    onError(error) { console.error('Failed to load PopupLightbox:', error) },
  }),
  PopupSearch: defineAsyncComponent({
    loader: () => import('~/components/popups/PopupSearch.vue'),
    onError(error) { console.error('Failed to load PopupSearch:', error) },
  }),
  PopupMobileMenuMore: defineAsyncComponent({
    loader: () => import('~/components/popups/PopupMobileMenuMore.vue'),
    onError(error) { console.error('Failed to load PopupMobileMenuMore:', error) },
  }),
}

const currentComponent = computed(() => {
  const name = popupState.value?.name
  if (!name) return null
  return popupComponents[name] || null
})
</script>

<style lang="scss">
@import "~/assets/scss/layout/modal.scss";
</style>