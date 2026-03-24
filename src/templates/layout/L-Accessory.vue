<template>
  <section class="l-accessory d-none d-lg-block">
    <div class="u-container u-relative">
      <div class="l-accessory__text">
        <h2 class="u-h2">Accessories</h2>
        <p>Jewelry, bags, backpacks, glasses and more</p>
        <router-link to="/product-category/accessories/" class="u-btn is-black">The entire collection</router-link>
      </div>

      <div class="text-center">
        <div class="l-accessory__bg">
          <img 
            src="@/assets/img/accessory1.jpg" 
            alt="accessory background" 
            height="830" 
            width="825"
          >

          <router-link to="/product-category/accessories/" class="c-circle">
            <svg width="61px" height="19px" class="c-circle__arrow">
              <use xlink:href="#small-arrow"></use>
            </svg>
            <img 
              src="@/assets/img/circle-img.png" 
              alt="circle image"
              width="251"
              height="251"
            >
          </router-link>
        </div>
      </div>
      <router-link 
        v-for="(item, index) in data"
        :key="index"
        :to="{
          name: 'product-category',
          params: {
            lang: stripLang(item.link) || null,
            categorySlug: stripSlug(item.link),
          }
        }"
        class="l-accessory__block"
        :class="{ 'is-first': index === 0, 'is-second': index === 1 }"
      >
        <div class="l-accessory__block-text">
          <span>{{item.title}}</span>
          <svg width="61px" height="19px" class="l-accessory__arrow">
            <use xlink:href="#small-arrow"></use>
          </svg>
        </div>
        
        <picture style="padding: 12px; background-color: white;">
          <!-- <source data-srcset="{{item.img|resize(imgSize, 300, 'center')|towebp}}" type="image/webp"> -->
          <!-- <source data-srcset="{{item.img|resize(imgSize, 300, 'center')|tojpg}}" type="image/jpeg">  -->
          <img 
            :src="item.img" 
            :alt="'Аксессуары: сумочки -' + index" 
            height="300"
            :width="index === 0 ? 300 : (index === 1 ? 330 : 300)"
          >
        </picture>
      </router-link>
    </div>
  </section>
</template>

<script>
import { stripSlug, stripLang } from '@/assets/js/utils.js';

export default {
  data() {
    return {
      imgPlaceholder: 'data:image/gif;base64,R0lGODlhKwAeAIAAAP///wAAACH5BAEAAAEALAAAAAArAB4AAAIjjI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2VAAAOw==',
    }
  },

  props: {
    data: {
      type: Array,
    }
  },

  methods: {
    stripSlug, 
    stripLang
  }
}
</script>