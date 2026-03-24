import './assets/scss/main.scss';
import { createApp } from 'vue';
// import { createStore } from 'vuex';
// import { createRouter } from 'vue-router';
// import Vuelidate from '@vuelidate/core';
import Vuelidate from 'vuelidate'
import App from './App.vue';
import { store } from './store';
import { router } from './routes/router.js';
import emitter from './plugins/emitter.js';
import LanguageRedirectPlugin from './plugins/language-redirect.js';


const app = createApp(App);

// Используем плагины
app.use(store);
app.use(router);
app.use(Vuelidate);
app.use(emitter);
app.use(LanguageRedirectPlugin, { app: { router }, store });


// Монтируем приложение
app.mount('#app');

// Обработчик после перехода по маршрутам
router.afterEach(() => {
  app.config.globalProperties.$popup.close(1, () => {});
});

// import './assets/scss/main.scss'
// import Vue from 'vue'
// import Vuelidate from 'vuelidate'
// import App from './App.vue'
// import VueRouter from 'vue-router'
// import {store} from './store';
// import {router} from './routes/router.js';
// import emitter from './plugins/emitter.js';
// import LanguageRedirectPlugin from './plugins/language-redirect.js';
// import { createI18n } from 'vue-i18n'

// window.emitter = new Emitter();
// const i18n = createI18n({

// });

// console.log(i18n);

// Vue.config.productionTip = false
// Vue.use(emitter);
// Vue.use(VueRouter);
// Vue.use(Vuelidate);
// // Vue.use(i18n);
// Vue.use(LanguageRedirectPlugin, { app: { router }, store });



// new Vue({
//   router,
//   store,
//   render: h => h(App),
// }).$mount('#app')

// router.afterEach(() => {
//   Vue.prototype.$popup.close(1, () => {})
// });
