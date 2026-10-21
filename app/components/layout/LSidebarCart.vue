<template>
  <aside class="l-sidebar-cart actions">
    <form class="l-sidebar-cart__cupons" @submit.prevent="emit('submitCoupon')">
      <h2 class="u-h3">{{ t('coupon.title') }}</h2>
      <div v-if="appliedCoupon" class="l-sidebar-cart__coupon-applied">
        <span>{{ t('coupon.applied', { code: appliedCoupon }) }}</span>
        <button type="button" class="u-link" @click="emit('removeCoupon')">{{ t('remove') }}</button>
      </div>
      <div v-else class="c-form-cupons">
        <input
          :id="couponInputId"
          :value="couponCode"
          type="text"
          name="coupon_code"
          :placeholder="t('coupon.placeholder')"
          @input="emit('update:couponCode', $event.target.value)"
        >
        <button
          type="submit"
          name="apply_coupon"
          value="Apply coupon"
          class="u-btn-submit"
          :aria-label="t('coupon.apply')"
          :disabled="couponDisabled"
        >
          <svg width="26px" height="14px"><use xlink:href="#big-arrow"></use></svg>
        </button>
      </div>
      <p v-if="couponError" class="c-form-error">{{ couponError }}</p>
    </form>

    <div class="l-sidebar-cart__total actions">
      <h2 class="u-h3">{{ t('cart_summary.title') }}</h2>
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
  // Купон, который принят WP (из котировки)
  appliedCoupon: {
    type: String,
    default: '',
  },
  couponError: {
    type: String,
    default: '',
  },
  couponInputId: {
    type: String,
    default: 'coupon_code',
  },
  couponDisabled: {
    type: Boolean,
    default: false,
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

const { t } = useI18n()
const emit = defineEmits(['update:couponCode', 'submitCoupon', 'removeCoupon'])
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/sidebar-cart.scss";
  @import "~/assets/scss/components/form-cupons.scss";

  .l-sidebar-cart__coupon-applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 14px;

    .u-link {
      text-decoration: underline;
      cursor: pointer;
    }
  }
</style>
