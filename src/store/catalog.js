import Api from '@/api/Axios'

const state = {
  products: [],
  productsCount: 0,
  categoryInfo: []
};
const mutations = {
  setProductsList(state, products) {
    state.products = products;
  },
  setMoreProductsList(state, moreProducts) {
    state.products = [...state.products, ...moreProducts];
  },
  setProductsCount(state, productsCount) {
    state.productsCount = productsCount;
  },
  setCategoryInfo(state, categoryInfo) {
    state.categoryInfo = categoryInfo;
  },
};
const actions = {
  fetchProducts({commit}, {url, page, offset, slug, lang}) {
    return Api.get('archive/get_products', {
      params: {
        url: url,
        page: page,
        offset: offset,
        slug: slug,
        lang: lang
      }
    })
    .then((result) => {
      console.log(result)
      if(result?.data?.status !== 'nomore') {
        commit('setProductsCount', result.data?.products_count);
        commit('setProductsList', result.data?.products);
        // commit('setCategoryInfo', result.data?.product_cat);
      }
      // console.log('fetchData: ', result.data)
      return result.data;
    })
    .catch((error) => {
      console.log(error);
    });
  },
};
const getters = {
  products(state) {
    return state.products;
  },
  productsCount(state) {
    return state.productsCount;
  },
  categoryInfo(state) {
    return state.categoryInfo;
  }
};

export default {namespaced: true, state, mutations, actions, getters};