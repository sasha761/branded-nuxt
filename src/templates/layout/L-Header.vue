<template>
  <header class="l-header">
    <div class="l-header__bottom u-relative">
      <div class="u-container">
        <div class="l-header__bottom-left">
          <C-Logo />
          <C-Menu :headerMenu="getHeaderMenu" v-if="getHeaderMenu.length"/>
        </div>
        <div class="l-header__bottom-right">
          <C-SearchForm />
          <div class="c-service cart d-none d-sm-block">
            <div>
              <span class="c-service__count">{{getCartProducts.length}}</span>
              <svg width="20px" height="20px"><use xlink:href="#cart"></use></svg>
            </div>
            <div class="c-service__dropdown">
              <L-MiniCart 
                :cartButtons="true" 
                :cartTitle="true" 
                :cartProducts="getCartProducts" 
                :totalAmount="getTotalAmount" 
                :cartUrl="getCartUrl"  
                :checkoutUrl="getCheckoutUrl" />
            </div>
          </div>
          <div class="c-dropdown js-dropdown" :class="{'is-active': activeDropdown}" @click="activeDropdown = !activeDropdown">
            <span class="c-dropdown__current">Помощь</span>
            <svg width="11px" height="7px" class="u-arrow"><use xlink:href="#arrow"></use></svg>
            <ul class="c-dropdown__list">
              <li><router-link to="/dostavka-i-oplata">Доставка и оплата</router-link></li>
              <li><router-link to="/vozvrat-i-obmen">Возврат и обмен</router-link></li>
              <li><router-link to="/garantiya">Гарантия</router-link></li>
              <li><router-link to="/reviews">Отзывы</router-link></li>
              <li><a to="tel:+38(066)3156536">+38 (066) 315 65 36</a></li>
            </ul>
          </div>

          <C-Lang :langs="getLanguages" :current-lang="currentLang" @update:currentLang="updateLanguage" v-if="getLanguages.length" />

          <div class="c-burger d-block d-sm-none"  @click="mobileMenuModal">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    <C-Sticky-Menu />
  </header>
</template>

<script>

import { mapMutations, mapActions, mapGetters } from 'vuex';
import { stripSlug, stripLang } from '@/assets/js/utils.js';

import stringConfig from '@/config/stringConfig.js'
import CMenu from '@/templates/components/C-Menu.vue';
import CLogo from '@/templates/components/C-Logo.vue';
import CLang from '@/templates/components/C-Lang.vue';
import CSearchForm from '@/templates/components/C-SearchForm.vue';
import LMiniCart from '@/templates/layout/L-MiniCart.vue';

import CStickyMenu from '@/templates/components/C-sticky-menu.vue';


export default {
  data() {
    return {
      activeDropdown: false,
      strings: stringConfig,
    }
  },

  components: {
    LMiniCart,
    CMenu,
    CLogo,
    CStickyMenu,
    CLang,
    CSearchForm,
  },

  created() {
    this.fetchLanguages();
    this.fetchCartUrl({lang: this.currentLang});
    this.fetchMenu();
    this.setTotalAmount();
  },

  watch: {
    currentLang(newVal) {
      this.fetchMenu({lang: newVal});
      this.fetchCartUrl({lang: newVal});
    },
  },

  computed: {
    ...mapGetters({
      getCartProducts: 'cart/getCartProducts',
      getCartUrl: 'cart/getCartUrl',
      getCheckoutUrl: 'cart/getCheckoutUrl',
      getTotalAmount: 'cart/getTotalAmount',
      getHeaderMenu: 'menu/getHeaderMenu',
      getMobileMenu: 'menu/getMobileMenu',
      getLanguages: 'lang/getLanguages',
      currentLang: 'lang/getCurrentLang',
    }),
  },

  methods: {
    ...mapActions({
      fetchCartUrl: 'cart/fetchCartUrl',
      fetchHeaderMenu: 'menu/fetchHeaderMenu',
      fetchMobileMenu: 'menu/fetchMobileMenu',
      fetchLanguages: 'lang/fetchLanguages',
      setLanguageInStore: 'lang/updateCurrentLang'
    }),

    ...mapMutations({
      setTotalAmount: 'cart/setTotalAmount'
    }),

    updateLanguage(newLang) {
      this.setLanguageInStore(newLang); // Обновляем Store
      // console.log('Текущий язык изменён:', this.currentLang);
    },

    fetchMenu() {
      this.fetchHeaderMenu({lang: this.currentLang});
      this.fetchMobileMenu({lang: this.currentLang});
    },

    mobileMenuModal() {
      this.$popup.open('PopupMobileMenu', {menu: this.getMobileMenu})
    },

    stripSlug,
    stripLang,
  }
}
</script>
