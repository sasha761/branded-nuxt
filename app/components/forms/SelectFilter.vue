<template>
  <div class="c-sort js-filter-sort">
    <ClientOnly>
      <vSelect
        v-model="selected"
        @update:modelValue="handleSelectChange"
        :options="optionsAdapted"
        label="text"
        :placeholder="props.placeholder"
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import vSelect from 'vue-select'

const props = defineProps({
  options: { type: Array, required: true },
  showAll: { type: Object },
  placeholder: { type: String, default: '' },
  filterParam: { type: String },
  currentOption: { type: Object, required: true },
})

const emit = defineEmits(['select-filter'])

const isDefault = props.currentOption.key === props.showAll?.key
const selected = ref(isDefault ? null : props.currentOption.text)

const optionsAdapted = computed(() => {
  const modified = [...props.options]
  if (props.showAll) {
    modified.push(props.showAll)
  }
  return modified.filter(x => x.key !== props.currentOption.key)
})

function handleSelectChange(value) {
  if (!value || value.key === props.showAll?.key) {
    selected.value = null
    emit('select-filter', { type: props.filterParam, key: 'all' })
    return
  }

  selected.value = value.text
  emit('select-filter', { type: props.filterParam, key: value.key, text: value.text })
}
</script>

<style lang="scss"> 
@import '~/assets/scss/components/sort.scss';
</style>