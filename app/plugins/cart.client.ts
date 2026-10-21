// Корзина живёт в localStorage: подхватываем её после полной гидрации (включая асинхронные страницы
// в Suspense), чтобы SSR-разметка совпала с клиентской. app:mounted для этого рано.
export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    useCartStore().hydrate()
  })
})
