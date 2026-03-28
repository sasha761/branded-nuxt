<template>
  <section class="l-accessory d-none d-lg-block">
    <div class="u-container u-relative">
      <div class="l-accessory__text">
        <h2 class="u-h2">Accessories</h2>
        <p>Jewelry, bags, backpacks, glasses and more</p>
        <NuxtLink :to="localePath('/product-category/accessories/')" class="u-btn is-black">The entire collection</NuxtLink>
      </div>

      <div class="text-center">
        <div class="l-accessory__bg">
          <img
            src="~/assets/img/accessory1.jpg"
            alt="accessory background"
            height="830"
            width="825"
          >
          <NuxtLink :to="localePath('/product-category/accessories/')" class="c-circle">
            <svg width="61px" height="19px" class="c-circle__arrow">
              <use xlink:href="#small-arrow"></use>
            </svg>
            <img
              src="~/assets/img/circle-img.png"
              alt="circle image"
              width="251"
              height="251"
            >
          </NuxtLink>
        </div>
      </div>

      <NuxtLink
        v-for="(item, index) in data"
        :key="index"
        :to="item.path"
        class="l-accessory__block"
        :class="{ 'is-first': index === 0, 'is-second': index === 1 }"
      >
        <div class="l-accessory__block-text">
          <span>{{ item.title }}</span>
          <svg width="61px" height="19px" class="l-accessory__arrow">
            <use xlink:href="#small-arrow"></use>
          </svg>
        </div>
        <picture style="padding: 12px; background-color: white;">
          <img
            :src="item.img"
            :alt="'Аксессуары: сумочки -' + index"
            height="300"
            :width="index === 0 ? 300 : (index === 1 ? 330 : 300)"
          >
        </picture>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  data: { type: Array },
})

const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
@import "~/assets/scss/layout/accessory.scss";
@import "~/assets/scss/components/circle.scss";
</style>
