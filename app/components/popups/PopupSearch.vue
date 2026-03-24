<template>
  <div class="c-modal is-search" id="mobile-search">
    <svg @click="handleCloseClick" width="20px" height="20px" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>
    <UiCSearchForm />
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
