export default {
  install(Vue, { app, store }) {
    if (!app.router || !store) {
      throw new Error('LanguageRedirectPlugin requires router and store to be passed.');
    }

    // let isReplacingRoute = false; // Флаг для отслеживания замены маршрута

    // store.subscribe((mutation, state) => {
    //   if (mutation.type === 'lang/setApiUrl') {
        // console.log(mutation.type, state);
        // const apiUrl = new URL(mutation.payload).pathname; // Убираем домен и протокол
        // const currentUrl = app.router.currentRoute.path; // Текущий маршрут

        // Если пути отличаются, заменяем URL
        // if (currentUrl !== apiUrl && !isReplacingRoute) {
        //   isReplacingRoute = true; // Устанавливаем флаг
        //   app.router.replace(apiUrl).finally(() => {
        //     isReplacingRoute = false; // Сбрасываем флаг после завершения
        //   });
        // }
    //   }
    // });

    // Глобальный хук для обработки маршрутов при загрузке
    app.router.beforeEach((to, from, next) => {
      // console.log(to, next);
      const currentLang = store.getters['lang/getCurrentLang']; // Получаем язык из Vuex

      if (currentLang === 'uk' && !to.path.startsWith('/uk')) {
        next({ path: `/uk${to.path}`, query: to.query, hash: to.hash });
      } else if (currentLang === 'ru' && to.path.startsWith('/uk')) {
        const newPath = to.path.replace('/uk', '') || '/';
        next({ path: newPath, query: to.query, hash: to.hash });
      } else {
        next();
      }
    });
  },
};
