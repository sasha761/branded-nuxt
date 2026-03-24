<template>
  <div class="c-modal c-mobile-menu js-tab-mobile-menu" id="mobile-menu">
    <tab :data="data">
      <template v-slot:additionalFieldInTabNav>
        <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-mobile-menu__close">
          <use xlink:href="#icon-close"></use>
        </svg>
      </template>
      <template v-slot:tabContent="{ tabContent }">
        <div class="c-mobile-menu__cat">
          <router-link 
            v-for="(item, index) in tabContent" 
            :key="index" 
            :to="item.slug" 
            class="c-mobile-menu__item"
          >
            <span>{{ item.title }}</span>
            <picture v-if="item.image">
              <source :data-srcset="item.image.url" :srcset="item.image.url" type="image/jpeg"> 
              <img 
                src="data:image/png;base64,TEVITGhbV0IyeWs4cHlvSmFkUiouN2tDTWRuag==" 
                :alt="item.title" 
                :title="item.title + '- tooltip'"
                width="95" 
                height="95"
                class=""
              >
            </picture>
          </router-link>
        </div>
      </template>
    </tab>
  </div>
</template>

<script>
// import { mapMutations, mapActions, mapGetters } from 'vuex';
import tab from '../components/C-Tab.vue';


export default {
  data() {
    return {
    };
  },

  components: {
    tab
  },

  props: {
    data: {
      type: Object,
    }
  },

  computed: {

  },

  methods: {
    handleCloseClick() {
      this.$popup.close(1, () => {})
    },
  }
}
</script>