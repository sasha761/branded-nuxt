import Api from '@/api/Axios'

const state = {
  languages: [],
  currentLang: localStorage.getItem('currentLang') || 'ru', // By default
  apiUrl: '',
};

const mutations = {
  setLanguages(state, data) {
    const languagesArray = data.languages ? Object.values(data.languages) : [];
    state.languages = languagesArray;
    state.currentLang = data.current_lang || 'ru';
  },
  setCurrentLang(state, lang) {
    localStorage.setItem('currentLang', lang);
    state.currentLang = lang;
  },
  setApiUrl(state, url) {
    
    state.apiUrl = url; // Сохраняем URL из API
  },
};
const actions = {
  updateCurrentLang({ commit }, lang) {
    commit('setCurrentLang', lang);
  },
  updateApiUrl({ commit }, lang) {
    commit('setApiUrl', lang);
  },
  fetchLanguages({ commit }) {
    const lang = localStorage.getItem('currentLang') || 'ru';
    return Api.get('menu/languages', {
      params: { lang },
    })
    .then((result) => {
      commit('setLanguages', result.data); // Передаем весь объект
    })
    .catch((error) => {
      console.error('Failed to fetch languages:', error);
    });
  }
};
const getters = {
  getLanguages(state) {
    return state.languages;
  },
  getCurrentLang(state) {
    return state.currentLang;
  },
  getApiUrl(state) {
    return state.getApiUrl;
  },
};

export default {namespaced: true, state, mutations, actions, getters};