<template>
  <div class="c-modal is-search" id="mobile-search">
    <svg @click="handleCloseClick" width="20px" height="20px" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>
    <C-SearchForm />
  </div>

</template>

<script>
import CSearchForm from '@/templates/components/C-SearchForm.vue';

export default {
  components: {
    CSearchForm
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