import Api from '@/api/Axios'

const state = {
  homeData: [],
  homeLang: null,
};
const mutations = {
  setHomeData(state, { data, lang }) {
    state.homeData = data,
    state.homeLang = lang;
  },
};
const actions = {
  fetchHomeData({commit}, {lang}) {
    return Api.get('home/get_home_info', {
      params: { 
        lang: lang
      },
    })
    .then((result) => {
      commit('setHomeData', { data: result.data, lang });
    })
    .catch((error) => {
      console.log(error);
    });
  },
};
const getters = {
  getHomeData(state) {
    return state.homeData;
  },
  getHomeLang(state) {
    return state.homeLang;
  }
};

export default {namespaced: true, state, mutations, actions, getters};