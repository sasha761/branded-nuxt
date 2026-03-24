export function useWaitRequest() {
  const requestInProgress = ref(false)

  async function waitRequest<T>(callback: () => Promise<T>): Promise<T | undefined> {
    if (requestInProgress.value) return
    requestInProgress.value = true
    try {
      return await callback()
    } finally {
      requestInProgress.value = false
    }
  }

  return { requestInProgress, waitRequest }
}
