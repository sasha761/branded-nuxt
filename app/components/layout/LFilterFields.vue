<template>
  <div class="l-filter">
    <div v-for="filter in props.filterGroups" :key="filter.attribute" class="widget">
      <FormsSelectFilter
        @select-filter="handleSelect"
        :options="filter.options"
        :show-all="props.showAll"
        :placeholder="filter.label"
        :filter-param="filter.attribute"
        :current-option="getFilterByKey(filter.attribute, route.query[filter.attribute])"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  filterGroups: { type: Array, default: () => [] },
  showAll: { type: Object, required: true },
})

const emit = defineEmits(['filtering'])
const route = useRoute()

function getAllOptions(filterKey) {
  const group = props.filterGroups.find((filter) => filter.attribute === filterKey)
  return group?.options || []
}

function getFilterByKey(filterKey, searchParam) {
  const options = getAllOptions(filterKey)
  return options.find((option) => option.key === searchParam) || props.showAll
}

function handleSelect(selectedOption) {
  emit('filtering', selectedOption)
}
</script>

<style lang="scss" scoped>
@import "~/assets/scss/layout/filter.scss";
</style>
