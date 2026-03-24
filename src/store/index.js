import { createStore } from 'vuex';

import commons from './commons';
import catalog from './catalog';
import cart from './cart';
import menu from './menu';
import home from './home';
import lang from './lang';

// Vue.use(Vuex)

export const store = createStore({
  ...commons,
  modules: {
    catalog,
    cart,
    menu,
    home,
    lang
  },
});