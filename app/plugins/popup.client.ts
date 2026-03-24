export default defineNuxtPlugin(() => {
  const { open, close, closeAll, popupState } = usePopup()

  // Close popup on route change
  const router = useRouter()
  router.afterEach(() => {
    close()
  })

  return {
    provide: {
      popup: { open, close, closeAll, popupState },
    },
  }
})
