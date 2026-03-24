<template>
  <div class="c-sort js-filter-sort">
    <v-select 
      v-model="selected" 
      @update:modelValue="handleSelectChange" 
      :options="optionsAdapted" 
      label="text"></v-select>
  </div>
</template>

<script>
import vSelect from "vue-select";

export default {
  components: {
    vSelect
  },

  data() {
    return {
      selected: '',
    }
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
    },
    currentOption: {
      type: Object,
      required: true,
    },
  },

  created() {
    this.selected = this.currentOption.text;
  },

  computed: {
    optionsAdapted() {
      const modifiedOptions = [...this.options];
      if (this.showAll) {
        modifiedOptions.push(this.showAll);
      }
      return modifiedOptions.filter(x => x.key !== this.currentOption.key);
    } 
  },

  methods: {
    handleSelectChange(value) {
      let key = value?.key || this.showAll?.key || this.optionsAdapted[0].key;
      let text = value?.text || this.showAll?.text || this.optionsAdapted[0].text;

      this.selected = text;
      this.$emit('select-filter', { type: this.filterParam, key, text });
    },
  },
}
</script>