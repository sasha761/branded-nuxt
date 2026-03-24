<template>
  <footer class="l-footer">
    <div class="l-footer__bottom">
      <div class="u-container">
        <div class="row c-footer-menu">
          <div v-for="(item, index) in getFooterMenu" :key="index" class="col-lg-3 col-md-6 col-6 u-col">
            <h3 class="c-footer-menu__title">{{item.title}}</h3>
            <ul v-if="item.submenu">
              <li v-for="(item2, index2) in item.submenu" :key="index2" class="c-footer-menu__items">
                <router-link :to="item2.slug">{{ item2.title }}</router-link>
              </li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6 col-6 u-col">
            <h3 class="c-footer-menu__title">Мы в соцсетях</h3>
            <div class="c-social">
              <a
                class="c-social__item"
                href="https://www.facebook.com/profile.php?id=100075507740803"
                rel="nofollow"
              >
                <svg width="28px" height="28px" class="is-facebook">
                  <use xlink:href="#facebook"></use>
                </svg>
              </a>
              <a
                class="c-social__item"
                href="https://www.instagram.com/branded.com.ua/"
                rel="nofollow"
              >
                <svg width="28px" height="28px" class="is-insta">
                  <use xlink:href="#instagram"></use>
                </svg>
              </a>
              <a class="c-social__item" href="https://t.me/Branded_own" rel="nofollow">
                <svg width="28px" height="28px" class="is-telegram">
                  <use xlink:href="#telegram"></use>
                </svg>
              </a>
            </div>
            <a class="is-phone" href="tel:+38(066)3156536">+38 (066) 315 65 36</a>
            <h3 class="u-h4">Партнерам</h3>
            <p>Подключиться к партнерской программе "Маркетплейс"</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';

export default {
  mounted() {
    this.fetchFooterMenu({lang: this.currentLang});
  },

  computed: {
    ...mapGetters({
      getFooterMenu: 'menu/getFooterMenu',
      currentLang: 'lang/getCurrentLang',
    })
  },

  methods: {
    ...mapActions({
      fetchFooterMenu: 'menu/fetchFooterMenu',
    }),
  }
}
</script>