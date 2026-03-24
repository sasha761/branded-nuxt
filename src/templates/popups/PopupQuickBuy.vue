<template>
  <div class="c-modal is-quick-buy" id="quick-buy">
    <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>
    <QuickBuyForm :popupData="data" />
  </div>
</template>

<script>
import QuickBuyForm from '@/templates/forms/QuickBuyForm.vue'

export default {
  components: {
    QuickBuyForm,
  },

  props: {
    data: {
      type: Object,
    }
  },

  methods: {
    handleCloseClick() {
      this.$popup.close(1, () => {})
    },
  }
}
</script>