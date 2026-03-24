<template>
  <footer class="l-footer">
    <div class="l-footer__bottom">
      <div class="u-container">
        <div class="row c-footer-menu">
          <div v-for="(item, index) in footerMenu" :key="index" class="col-lg-3 col-md-6 col-6 u-col">
            <h3 class="c-footer-menu__title">{{ item.title }}</h3>
            <ul v-if="item.submenu">
              <li v-for="(item2, index2) in item.submenu" :key="index2" class="c-footer-menu__items">
                <NuxtLink :to="localePath(item2.slug)">{{ item2.title }}</NuxtLink>
              </li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6 col-6 u-col">
            <h3 class="c-footer-menu__title">{{ $t('socialTitle') }}</h3>
            <div class="c-social">
              <a class="c-social__item" href="https://www.facebook.com/profile.php?id=100075507740803" rel="nofollow">
                <svg width="28px" height="28px" class="is-facebook"><use xlink:href="#facebook"></use></svg>
              </a>
              <a class="c-social__item" href="https://www.instagram.com/branded.com.ua/" rel="nofollow">
                <svg width="28px" height="28px" class="is-insta"><use xlink:href="#instagram"></use></svg>
              </a>
              <a class="c-social__item" href="https://t.me/Branded_own" rel="nofollow">
                <svg width="28px" height="28px" class="is-telegram"><use xlink:href="#telegram"></use></svg>
              </a>
            </div>
            <a class="is-phone" href="tel:+38(066)3156536">+38 (066) 315 65 36</a>
            <h3 class="u-h4">{{ $t('partnersTitle') }}</h3>
            <p>{{ $t('partnersText') }}</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const { locale } = useI18n()
const localePath = useLocalePath()
const footerKey = computed(() => `footer-menu:${locale.value}`)

const { data: footerMenu } = useAsyncData(
  footerKey,
  () => $fetch('/api/menu/get_menu_footer', { params: { lang: locale.value } }),
  {
    watch: [locale],
    default: () => [],
    getCachedData(key, nuxtApp) {
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    },
  }
)
</script>

<style lang="scss">
  @import "~/assets/scss/components/footer-menu.scss";
  @import "~/assets/scss/layout/footer.scss";
</style>