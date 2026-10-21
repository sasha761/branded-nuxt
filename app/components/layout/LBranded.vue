<template>
  <section class="l-branded">
    <div class="l-branded__img d-lg-block d-none" :style="{ 'background-image': `url(${brandedBgImg})` }"></div>

    <div class="u-container">
      <div class="l-branded__content">
        <div class="l-branded__head">
          <div class="l-branded__head-text">
            <div class="c-logo">
              <NuxtLink :to="localePath('/')">
                <svg width="310px" height="68px">
                  <use xlink:href="#logo"></use>
                </svg>
              </NuxtLink>
              <p>{{ $t('home.branded_slogan') }}</p>
            </div>
            <p>{{ $t('home.branded_text') }}</p>
          </div>
          <div class="c-appeal">
            <span class="is-number">15</span>
            <p class="u-h3">{{ $t('home.brands') }}</p>
            <p class="u-h4">{{ $t('home.brands_community') }}</p>
            <a href="#" class="u-btn is-orange">{{ $t('home.join') }}</a>
          </div>
        </div>
        <div class="l-branded__products d-none d-sm-block">
          <div class="row">
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img src="~/assets/img/223.png" alt="branded product" width="300" height="450">
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img src="~/assets/img/224.png" alt="branded product" width="300" height="450">
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img src="~/assets/img/225.png" alt="branded product" width="300" height="450">
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <img src="~/assets/img/2221.png" alt="branded product" width="300" height="450">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import brandedBgImg from '~/assets/img/9130.jpg'

const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/components/product.scss";
  @import "~/assets/scss/layout/branded.scss";
</style>
