<template>
  <select-filter
    @select-filter="handleSelectChange" 
    :options="options" 
    :show-all="showAll"
    :filter-param="filterParam" 
    :current-option="currentOption"
  />
</template>

<script>
import selectFilter from './SelectFilter.vue'

export default {
  name: 'SelectFilterForm',

  components: {
    selectFilter,
  },
  
  props: {
    options: {
      type: Array,
      required: true,
    },
    showAll: {
      type: Object,
    },
    filterParam: {
      type: String,
      required: true,
      default: ''
    },
    currentOption: {
      type: Object,
      required: true
    },
  },

  methods: {
    handleSelectChange(selectedOption) {
      this.$emit('select-filter', selectedOption);
    },
  }
}
</script>