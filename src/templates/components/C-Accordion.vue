<template>
  <div class="c-accordion">
    <div 
      v-for="(item, index) in accordionItems" 
      :key="index" 
      class="c-accordion__block"
      :class="{'is-active': accordionItems[index].active }" 
    >
      <div @click="toggleAccordion(index)" class="c-accordion__block-title">
        <span>{{ item.title }}</span>
        <svg width="11px" height="7px" class="u-arrow">
          <use xlink:href="#arrow"></use>
        </svg>
      </div>
      <div 
        class="c-accordion__block-text" 
        ref="accordionItemText"
        v-html="item.content"></div>
    </div>
  </div>
</template>

<script>
import {slideUp, slideDown} from '../../assets/js/slideToggle.js';

export default {
  data() {
    return {
      accordionItems: [],
    }
  },

  props: {
    accordionInfo: {
      type: Object,
    }
  },

  mounted() {
    for (const [key, value] of Object.entries(this.accordionInfo)) {
      const newObj = { 
        'title': key,
        'content': value,
        'active': false
      };

      this.accordionItems.push(newObj);
    }
  },

  methods: {
    toggleAccordion(index) {
      if (this.accordionItems[index].active === true) {
          this.accordionItems[index].active = false;
          slideUp(this.$refs.accordionItemText[index]);
      } else {
        this.close();
        this.open(this.accordionItems[index], index);
      }
    },

    close() {
      this.accordionItems.forEach((block, index) => {
        if (block.active === true) {
          block.active = false;
          slideUp(this.$refs.accordionItemText[index]);  
        }
      });
    },

    open(block, index) {
      block.active = true;
      slideDown(this.$refs.accordionItemText[index]);
    },
  }
}
</script>
