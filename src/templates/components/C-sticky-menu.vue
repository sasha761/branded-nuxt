<template>
  <section class="c-sticky-menu">
    <ul class="c-sticky-menu__row">
      <li>
        <router-link to="/" class="c-sticky-menu__item">
          <svg width="20px" height="20px">
            <use xlink:href="#icon-home"></use>
          </svg>
          <span>Main</span>
        </router-link>
      </li>
      <li class="c-sticky-menu__item" @click="mobileMenuModal" data-modal="#mobile-menu">
        <svg width="24px" height="20px">
          <use xlink:href="#catalog"></use>
        </svg>
        <span>Catalog</span>
      </li>
      <li>
        <router-link to="/cart" class="c-sticky-menu__item">
          <span v-if="getCartProducts.length" class="c-service__count">{{getCartProducts.length}}</span>
          <svg width="20px" height="20px">
            <use xlink:href="#bag"></use>
          </svg>
          <span>Cart</span>
        </router-link>
      </li>
      <li class="c-sticky-menu__item" @click="mobileSearchModal" data-modal="#mobile-search">
        <svg width="17px" height="20px" stroke="#333">
          <use xlink:href="#search"></use>
        </svg>
        <span>Search</span>
      </li>
      <li class="c-sticky-menu__item" @click="mobileMenuMoreModal" data-modal="#mobile-menu-more">
        <svg width="30px" height="20px">
          <use xlink:href="#dots"></use>
        </svg>
        <span>More</span>
      </li>
    </ul>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {

    }
  },

  computed: {
    ...mapGetters({
      getCartProducts: 'cart/getCartProducts',
      getMobileMenu: 'menu/getMobileMenu',
    })
  },
  
  methods: {
    mobileSearchModal() {
      this.$popup.open('PopupSearch', {menu: this.getMobileMenu})
    },

    mobileMenuMoreModal() {
      this.$popup.open('PopupMobileMenuMore', {menu: ''})
    },

    mobileMenuModal() {
      this.$popup.open('PopupMobileMenu', {menu: this.getMobileMenu})
    },
  }
}
</script>