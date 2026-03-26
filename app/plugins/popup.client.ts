export default defineNuxtPlugin(() => {
  const { open, close, closeAll, popupState } = usePopup()

  // Close popup on route change
  const router = useRouter()
  router.afterEach((to, from) => {
    if (popupState.value.name === 'PopupFilter' && to.path === from.path) {
      return
    }

    close()
  })

  return {
    provide: {
      popup: { open, close, closeAll, popupState },
    },
  }
})
