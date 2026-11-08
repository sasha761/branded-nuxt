<template>
  <section class="l-branded">
    <UiCImage class="l-branded__img d-lg-block d-none" :src="brandedBgImg" alt="" loading="lazy" decoding="async" />

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
          </div>
        </div>
        <div class="l-branded__products d-none d-sm-block">
          <div class="row">
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <UiCImage :src="productImage1" alt="branded product" width="282" height="422" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <UiCImage :src="productImage2" alt="branded product" width="282" height="422" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <UiCImage :src="productImage3" alt="branded product" width="282" height="422" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-3 col-6 u-col">
              <div class="c-product">
                <div class="c-product__img">
                  <UiCImage :src="productImage4" alt="branded product" width="282" height="422" loading="lazy" decoding="async" />
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
import productImage1 from '~/assets/img/223.png'
import productImage2 from '~/assets/img/224.png'
import productImage3 from '~/assets/img/225.png'
import productImage4 from '~/assets/img/2221.png'

const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/components/product.scss";
  @import "~/assets/scss/layout/branded.scss";
</style>
