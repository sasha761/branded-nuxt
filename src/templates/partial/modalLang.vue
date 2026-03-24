<template>
  <div class="c-modal c-modal__lang js-modal-lang" id="modal-lang">
    <div @click="close" data-modal="close" class="c-modal__close">
      <svg width="20px" height="20px" >
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>
    <div class="row">
      <div class="col-sm-6 col-12">
        <div class="c-flag-uk">
          <span class="c-flag-uk__blue"></span>
          <span class="c-flag-uk__yellow"></span>
        </div>
      </div>
      <div class="col-sm-6 col-12">
        <div class="c-modal__lang-box is-first">
          <template v-if="firstModal">
            <span class="c-modal__lang-subtitle">Мова сайту</span>
            <p class="c-modal__lang-title">Встановити українську за замовчуванням?</p>
            <button class="u-btn is-black" @click="setLang('uk')">Підтвердити</button>
            <span 
              class="c-modal__lang-change js-modal-change-lang"
              @click="firstModal = !firstModal"
            >Змінити мову сайту</span>
          </template>
          <template v-else>
            <span class="c-modal__lang-subtitle">Мова сайту</span>
            <p class="c-modal__lang-title">Будь ласка, оберіть мову сайту</p>
            <button class="u-btn is-black" @click="setLang('uk')">Українська</button>
            <button class="u-btn" @click="setLang('ru')">російська</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: "CModal",
  data() {
    return {
      isOpen: true,
      firstModal: true
    }
  },

  created() {
    (localStorage.getItem('lang') === null) ? this.open() : this.close();
  },

  methods: {
    close() {
      this.isOpen = false;
    },

    open() {
      this.isOpen = true;
    },

    setLang(lang) {
      localStorage.setItem('lang', lang);
      this.close();
    }
  }

}
</script>