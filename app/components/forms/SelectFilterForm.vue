<template>
  <FormsSelectFilter
    @select-filter="handleSelectChange"
    :options="options"
    :show-all="showAll"
    :filter-param="filterParam"
    :current-option="currentOption"
  />
</template>

<script setup>
const props = defineProps({
  options: { type: Array, required: true },
  showAll: { type: Object },
  filterParam: { type: String, required: true },
  currentOption: { type: Object, required: true },
})

const emit = defineEmits(['select-filter'])

function handleSelectChange(selectedOption) {
  emit('select-filter', selectedOption)
}
</script>
