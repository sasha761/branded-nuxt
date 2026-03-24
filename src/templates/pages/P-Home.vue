<template>
  <main class="p-main">
    <C-PageLoader v-if="requestInProgress"/>
    <L-Hero-Home v-if="homeData.banners_group" :data="homeData.banners_group" />
    <L-Accessory :data="homeData.accesories" />
    <L-Product-Row :data="homeData.best_offers" />
    <L-Brand :data="homeData.products_brand" />
    <L-Outlet :data="homeData.products_sale" />
    <L-Branded />
    <L-Subscribe />
  </main>
</template>
<script>

import CPageLoader from '@/templates/components/C-PageLoader.vue'

import LSubscribe from '@/templates/layout/L-Subscribe.vue'
import LHeroHome from '@/templates/layout/L-Hero-home.vue'
import LAccessory from '@/templates/layout/L-Accessory.vue'
import LProductRow from '@/templates/layout/L-Product-row.vue'
import LBrand from '@/templates/layout/L-Brand.vue'
import LOutlet from '@/templates/layout/L-Outlet.vue'
import LBranded from '@/templates/layout/L-Branded.vue'

import waitRequest from '@/mixins/waitRequest';

import { mapActions, mapGetters } from 'vuex';

export default {
  name: "App",

  mixins: [waitRequest],

  components: {
    LHeroHome,
    LSubscribe,
    LAccessory,
    LProductRow,
    LBrand,
    LOutlet,
    LBranded,
    CPageLoader
  },

  computed: {
    ...mapGetters({
      homeData: 'home/getHomeData',
      homeLang: 'home/getHomeLang',
      currentLang: 'lang/getCurrentLang',
    }),
  },

  created() {
    if (!Object.keys(this.homeData).length || this.homeLang !== this.currentLang) {  
      this.loadHomeData();
    }
  },

  watch: {
    currentLang: 'loadHomeData' 
  },

  methods: {
    ...mapActions({
      fetchHomeData: 'home/fetchHomeData'
    }),

    loadHomeData() {
      this.waitRequest(() => {
        return this.fetchHomeData({
          lang: this.currentLang, // Передаём текущий язык
        })
      });
    },
  }
}
</script>