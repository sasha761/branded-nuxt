export async function wpFetch<T = any>(path: string, options: Record<string, any> = {}): Promise<T> {
  const config = useRuntimeConfig()
  const baseUrl = config.wpSiteUrl

  return await $fetch<T>(`${baseUrl}/wp-json/api/${path}`, {
    ...options,
  })
}
