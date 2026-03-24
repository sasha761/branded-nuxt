<template>
  <div class="l-modal" :class="{ 'is-active': popupName }">
    <div class="l-modal__overlay"></div>
    <div class="l-modal__wrapper">
      <component :is="popupName" :data="popupData"></component>
    </div>
  </div>
</template>

<script>
import PopupQuickBuy from '@/templates/popups/PopupQuickBuy.vue';
import PopupMobileMenu from '@/templates/popups/PopupMobileMenu.vue';
import PopupLightbox from '@/templates/popups/PopupLightbox.vue';
import PopupSearch from '@/templates/popups/PopupSearch.vue';
import PopupMobileMenuMore from '@/templates/popups/PopupMobileMenuMore.vue';


export default {
  data() {
    return {
      popupName: null,
      popupData: null,
      isActive: false,
    }
  },
  
  components: {
    PopupQuickBuy,
    PopupMobileMenu,
    PopupLightbox,
    PopupSearch,
    PopupMobileMenuMore
  },

  mounted() {
    this.$popup.onOpen({callback: (data)=> {
      this.openModal(data);
    }})

    this.$popup.onClose({callback: (data)=> {
      this.openModal(data);
    }})
  },

  methods: {
    openModal(data) {
      this.popupData = data.data;
      this.popupName = data.name;
    },

    closeModal() {
      this.popupData = null
      this.popupName = null;
    }
  },
}
</script>
