<template>
  <button
      type="button"
      @click="handleClick"
      class="u-btn"
    >
      <slot></slot>
  </button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('button-click');
    }
  }
}
</script>