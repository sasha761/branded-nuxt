<template>
  <aside class="l-sidebar-cart actions">
    <form class="l-sidebar-cart__cupons" @submit.prevent="emit('submitCoupon')">
      <h2 class="u-h3">{{ couponTitle }}</h2>
      <div class="c-form-cupons">
        <input
          :id="couponInputId"
          :value="couponCode"
          type="text"
          name="coupon_code"
          :placeholder="couponPlaceholder"
          @input="emit('update:couponCode', $event.target.value)"
        >
        <button
          type="submit"
          name="apply_coupon"
          value="Apply coupon"
          class="u-btn-submit"
          :disabled="couponDisabled"
        >
          <svg width="26px" height="14px"><use xlink:href="#big-arrow"></use></svg>
        </button>
      </div>
    </form>

    <div class="l-sidebar-cart__total actions">
      <h2 class="u-h3">{{ orderTitle }}</h2>
      <ul class="l-sidebar-cart__list">
        <li
          v-for="(item, index) in summaryItems"
          :key="`${item.label}-${index}`"
          class="l-sidebar-cart__item"
          :class="item.itemClass"
        >
          <span>{{ item.label }}</span>
          <span :class="item.valueClass">{{ item.value }}</span>
        </li>

        <NuxtLink
          v-if="checkoutLink && checkoutLabel"
          :to="checkoutLink"
          class="u-btn is-black"
        >
          {{ checkoutLabel }}
        </NuxtLink>
      </ul>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  couponCode: {
    type: String,
    default: '',
  },
  couponTitle: {
    type: String,
    default: 'Купоны',
  },
  couponPlaceholder: {
    type: String,
    default: 'Промо код',
  },
  couponInputId: {
    type: String,
    default: 'coupon_code',
  },
  couponDisabled: {
    type: Boolean,
    default: false,
  },
  orderTitle: {
    type: String,
    default: 'Ваш заказ',
  },
  summaryItems: {
    type: Array,
    default: () => [],
  },
  checkoutLink: {
    type: String,
    default: '',
  },
  checkoutLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:couponCode', 'submitCoupon'])
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/sidebar-cart.scss";
  @import "~/assets/scss/components/form-cupons.scss";
</style>
