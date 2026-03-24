import Api from '@/api/Axios'

const state = {
  headerMenu: [],
  footerMenu: [],
  mobileMenu: [],
};
const mutations = {
  setItemsToHeaderMenu(state, data) {
    state.headerMenu = data
  },
  setItemsToFooterMenu(state, data) {
    state.footerMenu = data
  },
  setItemsToMobileMenu(state, data) {
    state.mobileMenu = data
  },
};
const actions = {
  fetchHeaderMenu({commit}, {lang}) {
    // const lang = localStorage.getItem('currentLang') || 'ru';
    return Api.get('menu/get_menu_header', {
      params: { lang },
    })
    .then((result) => {
      commit('setItemsToHeaderMenu', result.data);
    })
    .catch((error) => {
      console.log(error);
    });
  },
  fetchFooterMenu({commit}, {lang}) {
    // const lang = localStorage.getItem('currentLang') || 'ru';
    return Api.get('menu/get_menu_footer', {
      params: { lang },
    })
    .then((result) => {
      commit('setItemsToFooterMenu', result.data);
    })
    .catch((error) => {
      console.log(error);
    });
  },
  fetchMobileMenu({commit}, {lang}) {
    // const lang = localStorage.getItem('currentLang') || 'ru';
    return Api.get('menu/get_menu_mobile', {
      params: { lang },
    })
    .then((result) => {
      commit('setItemsToMobileMenu', result.data);
    })
    .catch((error) => {
      console.log(error);
    });
  },
};
const getters = {
  getHeaderMenu(state) {
    return state.headerMenu;
  },
  getFooterMenu(state) {
    return state.footerMenu;
  },
  getMobileMenu(state) {
    return state.mobileMenu;
  },
};

export default {namespaced: true, state, mutations, actions, getters};