export function useLanguageSwitchLoader() {
  const isLanguageSwitchLoading = useState('language-switch-loading', () => false)

  function startLanguageSwitchLoader() {
    isLanguageSwitchLoading.value = true
  }

  function stopLanguageSwitchLoader() {
    isLanguageSwitchLoading.value = false
  }

  return {
    isLanguageSwitchLoading,
    startLanguageSwitchLoader,
    stopLanguageSwitchLoader,
  }
}
