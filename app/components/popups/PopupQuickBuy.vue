<template>
  <div class="c-modal is-quick-buy" id="quick-buy">
    <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>
    <FormsQuickBuyForm :popupData="data" />
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object },
})

const { close } = usePopup()

function handleCloseClick() {
  close(1)
}
</script>
