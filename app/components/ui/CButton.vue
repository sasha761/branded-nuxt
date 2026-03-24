<template>
  <button type="button" @click="$emit('button-click')" class="u-btn">
    <slot></slot>
  </button>
</template>

<script setup>
defineEmits(['button-click'])
</script>
