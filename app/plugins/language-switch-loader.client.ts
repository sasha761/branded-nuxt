export default defineNuxtPlugin((nuxtApp) => {
  const { stopLanguageSwitchLoader } = useLanguageSwitchLoader()
  const router = useRouter()

  nuxtApp.hook('page:finish', () => {
    stopLanguageSwitchLoader()
  })

  nuxtApp.hook('app:error', () => {
    stopLanguageSwitchLoader()
  })

  router.onError(() => {
    stopLanguageSwitchLoader()
  })
})
