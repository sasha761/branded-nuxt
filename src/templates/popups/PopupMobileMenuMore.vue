<template>
  <div class="c-modal c-mobile-menu is-more">
    <div class="c-modal__title">
      <h3 class="u-h3">Menu</h3>
      <svg @click="handleCloseClick" width="20px" height="20px">
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>

    <ul>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px">
          <use xlink:href="#shipping-store"></use>
        </svg>
        <router-link to="/">Main page</router-link>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px">
          <use xlink:href="#info"></use>
        </svg>
        <router-link to="/about-us">About us</router-link>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px">
          <use xlink:href="#open-box-checked"></use>
        </svg>
        <router-link to="/dostavka-i-oplata">Delivery and payment</router-link>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px">
          <use xlink:href="#open-box"></use>
        </svg>
        <router-link to="/vozvrat-i-obmen">Returns and exchanges</router-link>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="21px" height="20px" class="is-phone">
          <use xlink:href="#icon-phone"></use>
        </svg>
        <a href="tel:">Call us</a>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="17px" height="20px">
          <use xlink:href="#coment"></use>
        </svg>
        <router-link to="/reviews">Reviews</router-link>
      </li>
    </ul>
    <!-- {% include 'templates/search-form.twig' %} -->
  </div>
</template>

<script>
// import QuickBuyForm from '@/templates/forms/QuickBuyForm.vue'

export default {
  components: {
    // QuickBuyForm,
  },

  props: {
    data: {
      type: Object,
    }
  },

  methods: {
    handleCloseClick() {
      this.$popup.close(1, () => {})
    },
  }
}
</script>