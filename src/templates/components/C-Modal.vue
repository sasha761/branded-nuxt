<template>
  <div class="l-modal-container" v-if="isOpen">
    <div class="c-modal c-modal__lang js-modal-lang" id="modal-lang">
      <slot></slot>
    </div>
  </div>
</template>

<script>

export default {
  name: "CModal",
  data() {
    return {
      isOpen: true,
      firstModal: true
    }
  },

  created() {
    (localStorage.getItem('lang') === null) ? this.open() : this.close();
  },

  methods: {
    close() {
      this.isOpen = false;
    },

    open() {
      this.isOpen = true;
    },

    setLang(lang) {
      localStorage.setItem('lang', lang);
      this.close();
    }
  }

}
</script>
