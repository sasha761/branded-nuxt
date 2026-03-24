<template>
  <main
    class="p-product"
    :data-id="product.id"
    :data-price="product.price"
    :data-categories="getProductCategory"
  >
    <C-PageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <C-Breadcrumb />
      <section class="l-product" v-if="product">
        <div class="row">
          <div class="col-lg-6 col-md-12 col-sm-12 u-col">
            <div  class="l-product__img">
              <a
                v-if="product.post_img_xl"
                :href="product.post_img_xl"
                class="js-lightbox"
                @click.prevent="openLightbox"
                data-key="0"
              >
                <img :src="product.post_img_xl" alt="" height="1440" width="1000">
              </a>
            </div>
          </div>
          <div class="col-lg-5 col-md-12 u-col">
            <div class="l-product__content">
              <router-link
                v-if="product.post_link_brand"
                :to="{
                  name: 'brand',
                  params: {
                    lang: currentLang !== 'ru' ? currentLang : undefined, 
                    brandName: product.post_link_brand, // Передаём slug бренда
                  },
                }"
                class="l-product__category"
              >
                {{ product.post_attr_brand }}
              </router-link>

              <h1 class="l-product__name">{{product.name}}</h1>
              <p class="c-price" v-html="product.price_html"></p>

              <form class="c-product-form" :data-product_id="product.id">
                <span v-if="product.size_attribute" class="c-product-form__size">Размер</span>

                <v-select 
                  v-if="product.size_attribute"
                  v-model="selectedSize" 
                  @update:modelValue="handleSelectChange" 
                  :options="product.size_attribute" 
                  label="name"></v-select>
                
                <div class="c-product-form__btn">
                  <CButton 
                    v-if="product.is_stock != 'outofstock'"
                    class="u-btn is-medium is-black"
                    @button-click="addProductToCart(product)"
                    :value="product.id"
                  >
                    В корзину
                  </CButton>

                  <CButton 
                    v-if="product.is_stock != 'outofstock'"
                    class="u-btn is-medium is-black-border"
                    @button-click="quickBuyModal"
                  >
                    Купить в 1 клик
                  </CButton>

                  <div v-if="product.is_stock == 'outofstock'" class="l-product__manage-stock u-h3 is-red">Out of stock</div>
                </div>
              </form>

              <div  class="l-product__text">
                <h4 class="l-product__text-title">Описание:</h4>
                <div v-if="product.sku">
                  <span>Артикул: </span> <span>{{product.sku}}</span>
                </div>
                <div v-html="product.description"></div>
              </div>

              <div class="l-product__info" v-if="product.product_info">
                <C-Accordion :accordion-info="product.product_info" />
              </div>
            </div>
          </div>
        </div>
        <div class="row d-none d-lg-flex" v-if="hasProductImages">
          <div 
            class="col-lg-6 u-col" 
            v-for="(imageItem, index) in product.images"
            :key="index"
            >
            <a
              :href="imageItem"
              class="js-lightbox"
              @click.prevent="openLightbox(index + 1)"
            >
              <img :src="imageItem" alt="" height="1440" width="1000">
            </a>
          </div>
        </div>
      </section>
    </div>
    <L-Related ref="relatedProductsSection" :products="relatedProducts"/>
    <L-Comments />
    <L-Subscribe />
  </main>
</template>

<script>
import Api from '@/api/Axios'
import { mapGetters, mapMutations } from 'vuex';
import vSelect from "vue-select";

import LSubscribe from '@/templates/layout/L-Subscribe.vue'
import LRelated from '@/templates/layout/L-Related.vue'
import LComments from '@/templates/layout/L-Comments.vue'

import CPageLoader from '@/templates/components/C-PageLoader.vue'
import CBreadcrumb from '@/templates/components/C-Breadcrumbs.vue'
import CAccordion from '@/templates/components/C-Accordion.vue'
import CButton from '@/templates/components/C-Button.vue'

import { stripSlug, stripLang } from '@/assets/js/utils.js';
import waitRequest from '@/mixins/waitRequest';

export default {
  components: {
    LSubscribe,
    LRelated,
    LComments,
    CBreadcrumb,
    CAccordion,
    CButton,
    vSelect,
    CPageLoader
  },

  mixins: [waitRequest],

  data() {
    return {
      product: [],
      selectedSize: '',
      relatedProducts: [],
      relatedProductsChecker: false,
    }
  },

  computed: {
    ...mapGetters({
      cartProducts: 'cart/getCartProducts',
      currentLang: 'lang/getCurrentLang',
    }),

    hasProductImages() {
      return this.product?.images?.length
    }, 
    getProductCategory() {
      return this.product?.cats?.join(', ');
    }
  },

  watch: {
    currentLang() { // Отслеживаем изменение языка
      this.fetchProductData(),
      this.relatedProductsChecker = false;
    }  
  },

  mounted() {
    if(this.$route.params.productData) {
      this.product = this.$route.params.productData
      this.selectedSize = (this.product?.size_attribute?.[0]) ?? { availability: true, id: this.$route.params.productData.id, name: "one size" };
    } else {
      this.fetchProductData();
    }
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleResize);
  },

  methods: {
    ...mapMutations({
      setProductToCart: 'cart/setProductToCart',
      setTotalAmount: 'cart/setTotalAmount'
    }),

    fetchProductData() {
      this.waitRequest(() => {
        return Api.get('product/get_single_product', {
          params: {
            url: this.$route.params.productName,
            lang: this.currentLang,
          }
        })
        .then((result) => {
          console.log(result)
          this.product = result.data
          this.selectedSize = (this.product?.size_attribute?.[0]) ?? [{ availability: true, id: result.data.id, name: "one size" }];
        })
        .catch((error) => {
          console.log(error);
        });
      })
    },

    handleScroll() {
      this.checkVisibility();
    },
    handleResize() {
      this.checkVisibility();
    },

    checkVisibility() {
      if (!this.$refs.relatedProductsSection || !this.$refs.relatedProductsSection.$el) {
        return; 
      }
      
      // console.log(this.product.id);
      const section = this.$refs.relatedProductsSection.$el;
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
      
      if (isVisible && this.relatedProductsChecker === false) {
        this.relatedProductsChecker = true;
        return Api.get('product/get_related_products', {
          params: {
            id: this.product.id,
            lang: this.currentLang,
          }
        })
        .then((result) => {
          console.log(result)
          this.relatedProducts = result.data?.related_products
        })
        .catch((error) => {
          console.log(error);
        });
      }
    },

    handleSelectChange(value) {
      console.log(value);
    },

    addProductToCart(product) {      
      let addedProduct = { ...product };
      let allProducts = this.cartProducts;
      addedProduct.quantity = 1;
      
      if (addedProduct.size_attribute === undefined) {
          addedProduct.size_attribute = [{ availability: true, id: addedProduct.id, name: "one size" }];
      }

      addedProduct.size_selected = this.selectedSize && this.selectedSize.name
        ? addedProduct.size_attribute.filter(obj => obj.name === this.selectedSize.name)
        : [{availability: true, id: addedProduct.id, name: "one size"}];

      const index = allProducts.findIndex(obj => obj.size_selected[0].id === this.selectedSize.id);

      if (index !== -1) {
        allProducts[index].quantity += 1;
      } else {
        allProducts.push(addedProduct);
      }

      
      console.log(addedProduct);
      // // Обновление состояния корзины
      this.setProductToCart(allProducts);
      this.setTotalAmount();
    },

    openLightbox(index = 0) {
      this.$popup.open('PopupLightbox', {
        images: [
          ...[this.product.post_img_xl], 
          ...this.product.images, 
          this.product.video
        ], 
        slideKey: index})
    },

    quickBuyModal() {
      this.$popup.open('PopupQuickBuy', {product: this.product})
    },

    stripSlug, 
    stripLang
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  }
}
</script>
