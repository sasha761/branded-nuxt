import { createRouter, createWebHistory } from 'vue-router';

// const routes = [
//   // Главная страница (универсальная)
//   {
//     path: '/:lang?',
//     name: 'home-page',
//     component: () => import('../templates/pages/P-Home.vue'),
//     props: (route) => ({
//       lang: route.params.lang, // Язык по умолчанию
//     }),
//   },

//   // Страница продукта
//   {
//     path: '/:lang?/product/:productName',
//     name: 'product',
//     component: () => import('../templates/pages/P-Product.vue'),
//     props: (route) => ({
//       lang: route.params.lang,
//       productName: route.params.productName,
//       productData: route.params.productData,
//     }),
//   },

//   // Категория продукта
//   {
//     path: '/:lang?/product-category/:categorySlug/:subcategorySlug?',
//     name: 'product-category',
//     component: () => import('../templates/pages/P-Shop.vue'),
//     props: true,
//   },

//   // Бренд
//   {
//     path: '/:lang?/brand/:brandName',
//     name: 'brand',
//     component: () => import('../templates/pages/P-Shop.vue'),
//   },

//   // Общие страницы
//   {
//     path: '/:lang?/cart',
//     name: 'cart',
//     component: () => import('../templates/pages/P-Cart.vue'),
//   },
//   {
//     path: '/:lang?/checkout-2',
//     name: 'checkout',
//     component: () => import('../templates/pages/P-Checkout.vue'),
//   },
//   {
//     path: '/:lang?/checkout-2/order-received/:numbers',
//     name: 'order-received',
//     component: () => import('../templates/pages/P-Order-received.vue'),
//     props: true,
//   },

//   {
//     path: '/:lang?/search',
//     name: 'SearchResults',
//     component: () => import('../templates/pages/P-Shop.vue'),
//     props: route => ({ lang: route.params.lang })
//   },

//   {
//     path: '/:lang?/:page',
//     name: 'page',
//     component: () => import('../templates/pages/P-Page.vue'),
//   },

//   // Маршрут для 404 страниц
//   // {
//   //   path: '/:catchAll(.*)',
//   //   name: 'page',
//   //   component: () => import('../templates/pages/P-Page.vue'),
//   // },
// ];

const routes = [
  // Главная страница (универсальная)
  {
    path: '/',
    name: 'home-page',
    component: () => import('../templates/pages/P-Home.vue'),
    props: { lang: 'ru' }, // По умолчанию русский
  },
  {
    path: '/uk',
    name: 'home-page-uk',
    component: () => import('../templates/pages/P-Home.vue'),
    props: { lang: 'uk' },
  },

  // Страница продукта
  {
    path: '/product/:productName',
    name: 'product',
    component: () => import('../templates/pages/P-Product.vue'),
    props: route => ({
      lang: 'ru',
      productName: route.params.productName,
      productData: route.params.productData,
    }),
  },
  {
    path: '/uk/product/:productName',
    name: 'product-uk',
    component: () => import('../templates/pages/P-Product.vue'),
    props: route => ({
      lang: 'uk',
      productName: route.params.productName,
      productData: route.params.productData,
    }),
  },

  // Категория продукта
  {
    path: '/product-category/:categorySlug/:subcategorySlug?',
    name: 'product-category',
    component: () => import('../templates/pages/P-Shop.vue'),
    props: { lang: 'ru' },
  },
  {
    path: '/uk/product-category/:categorySlug/:subcategorySlug?',
    name: 'product-category-uk',
    component: () => import('../templates/pages/P-Shop.vue'),
    props: { lang: 'uk' },
  },

  // Бренд
  {
    path: '/brand/:brandName',
    name: 'brand',
    component: () => import('../templates/pages/P-Shop.vue'),
    props: { lang: 'ru' },
  },
  {
    path: '/uk/brand/:brandName',
    name: 'brand-uk',
    component: () => import('../templates/pages/P-Shop.vue'),
    props: { lang: 'uk' },
  },

  // Общие страницы
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../templates/pages/P-Cart.vue'),
    props: { lang: 'ru' },
  },
  {
    path: '/uk/cart',
    name: 'cart-uk',
    component: () => import('../templates/pages/P-Cart.vue'),
    props: { lang: 'uk' },
  },
  {
    path: '/checkout-2',
    name: 'checkout',
    component: () => import('../templates/pages/P-Checkout.vue'),
    props: { lang: 'ru' },
  },
  {
    path: '/uk/checkout-2',
    name: 'checkout-uk',
    component: () => import('../templates/pages/P-Checkout.vue'),
    props: { lang: 'uk' },
  },

  // Динамические страницы
  {
    path: '/:page',
    name: 'page',
    component: () => import('../templates/pages/P-Page.vue'),
    props: route => ({ lang: 'ru', page: route.params.page }),
  },
  {
    path: '/uk/:page',
    name: 'page-uk',
    component: () => import('../templates/pages/P-Page.vue'),
    props: route => ({ lang: 'uk', page: route.params.page }),
  },

  // 404
  // {
  //   path: '/:catchAll(.*)',
  //   name: 'not-found',
  //   component: () => import('../templates/pages/P-NotFound.vue'),
  // },
];

// Создание маршрутизатора для Vue 3
export const router = createRouter({
  history: createWebHistory(), // Заменяет mode: 'history'
  routes,
  scrollBehavior() {
    return { left: 0, top: 0 }; // В Vue 3 используем left вместо x
  },
});
