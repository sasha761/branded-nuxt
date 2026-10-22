import type { Redis } from 'ioredis'
import redisDriver from 'unstorage/drivers/redis'
import lruCacheDriver from 'unstorage/drivers/lru-cache'

/**
 * Хранилище кеша Nitro: правила cache в nuxt.config.ts, сброс — server/api/_revalidate.post.ts.
 * Монтируется при старте сервера, а не через nitro.storage: опции storage попадают в сборку как JSON,
 * и адрес Redis пришлось бы знать уже на этапе build.
 *
 * - NUXT_REDIS_URL задан: Redis. Кеш общий для всех инстансов PM2, переживает рестарт и деплой,
 *   вебхук WP очищает его у всех сразу.
 * - не задан: LRU в памяти процесса с лимитом по объёму, у каждого инстанса свой кеш.
 *
 * В dev кеш API выключен, а свой кеш Nitro держит на диске (.nuxt/cache) — его не трогаем.
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    return
  }

  const { redisUrl } = useRuntimeConfig()
  const storage = useStorage()

  if (redisUrl) {
    const driver = redisDriver({
      url: String(redisUrl),
      base: 'branded',
      // Дольше maxAge + staleMaxAge любого правила: Nitro сам решает, что запись устарела,
      // а TTL только не даёт копиться записям, которые больше никто не запросит.
      ttl: 2 * 86400,
      // Redis недоступен → сразу промах кеша и запрос в WP. Без этого каждая команда ждёт
      // переподключения, и страница при упавшем Redis рендерится в 2–3 раза дольше обычного.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    })

    // Соединение открывается при старте (иначе первый запрос всегда мимо кеша), а ошибки
    // переподключения пишутся одной строкой, а не стектрейсом на каждую попытку.
    const client = driver.getInstance?.() as Redis
    let isDown = false
    client.on('error', (error) => {
      if (!isDown) {
        isDown = true
        console.error(`[cache] Redis недоступен, страницы идут без кеша: ${error.message}`)
      }
    })
    client.on('ready', () => {
      if (isDown) {
        isDown = false
        console.info('[cache] Redis снова доступен')
      }
    })

    storage.mount('cache', driver)
    return
  }

  console.warn('[cache] NUXT_REDIS_URL не задан: кеш Nitro в памяти процесса, у каждого инстанса свой')
  storage.mount('cache', lruCacheDriver({ max: 5000, maxSize: 128 * 1024 * 1024 }))
})
