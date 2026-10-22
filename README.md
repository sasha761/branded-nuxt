# branded — фронт branded.com.ua на Nuxt 4

Интернет-магазин branded.com.ua: Nuxt 4 (SSR) поверх headless WordPress/WooCommerce с Yoast SEO и WPML (ru/uk).

Данные приходят из кастомного REST API темы WordPress `news`: `wp-content/themes/news/inc/rest-api-*.php`, репозиторий [sasha761/branded](https://github.com/sasha761/branded). Браузер к WordPress не обращается: все запросы идут через серверную прослойку `server/api/*`.

## Требования

- Node.js 22.22.3+ или 24.15+ (требование Nuxt 4.6; на более старой 22.x dev-сервер предупреждает, что версия не поддерживается)
- Redis 7 на сервере для кеша Nitro (необязательно: без него кеш живёт в памяти процесса)
- WordPress с темой `news`. Локально это `http://branded.loc` в OSPanel, сайт доступен, только когда запущен OSPanel.

## Установка

```bash
npm install
cp .env.example .env
```

## Переменные окружения

Полный список с комментариями — в `.env.example`.

| Переменная | Что задаёт |
|---|---|
| `NUXT_WP_SITE_URL` | Адрес WordPress, к которому ходит BFF. Локально `http://branded.loc` |
| `NUXT_WP_TIMEOUT` | Таймаут запроса к WP, мс (по умолчанию 8000) |
| `NUXT_PUBLIC_SITE_URL` | Домен сайта для canonical, hreflang и og:url |
| `NUXT_BFF_SECRET` | = `BRANDED_BFF_SECRET` в `wp-config.php`: WP доверяет IP покупателя из BFF (rate limit заказов) |
| `NUXT_REVALIDATE_SECRET` | = `BRANDED_REVALIDATE_SECRET` в `wp-config.php`: вебхук сброса кеша `POST /api/_revalidate` |
| `NUXT_REDIS_URL` | Кеш Nitro в Redis, общий для всех инстансов, например `redis://127.0.0.1:6379/1`. Пусто — кеш в памяти процесса |
| `NUXT_PUBLIC_GTM_ID`, `NUXT_PUBLIC_FB_PIXEL_ID` | Аналитика. Задаются только на проде |

> **Внимание.** Если `NUXT_WP_SITE_URL` указывает на прод (`https://branded.com.ua`), то заказы, отзывы и подписки из локального фронта настоящие: письма клиенту и админу, сообщения в Telegram, списание остатков.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер на http://localhost:3004 |
| `npm run build` | production-сборка в `.output/` |
| `npm run preview` | запуск собранного приложения |
| `node .output/server/index.mjs` | запуск production-сборки (порт из `PORT`, по умолчанию 3000) |
| `npx nuxi typecheck` | проверка типов (пока с ошибками, см. `docs/project-review-2026-10-20.md`) |

### Особенности Windows

- После остановки `nuxi dev` процесс `node` может остаться на порту 3004 и продолжать отдавать старую версию. Перед перезапуском найди процессы `node.exe` с `nuxi` или `@nuxt\cli` в командной строке, завершай их через `Stop-Process -Force`. Проверить, что порт свободен: `Get-NetTCPConnection -LocalPort 3004`.
- Dev-сервер Vite зависает на кириллических путях (`/бренд/…`). Такие страницы проверяй на production-сборке.

## Структура

| Путь | Что внутри |
|---|---|
| `app/pages/` | маршруты: товар, архивы (категории, бренды, сезоны), корзина, checkout, заказ, поиск, catch-all для CMS-страниц |
| `app/components/` | `layout/` (крупные блоки и страницы-шаблоны), `ui/`, `forms/`, `popups/`, `partial/` |
| `app/composables/` | маршрут и SEO страницы, корзина и котировка, форма заказа, вариации товара, меню, аналитика |
| `app/stores/cart.ts` | корзина (Pinia, хранится в `localStorage`) |
| `server/api/` | BFF: проверка входа и проксирование в WP, вебхук сброса кеша |
| `server/plugins/cache-storage.ts` | хранилище кеша Nitro: Redis или LRU в памяти |
| `shared/utils/` | код для фронта и сервера сразу: нормализация query каталога (без `utm_*`, `gclid`) |
| `server/middleware/` | 301-редиректы со старых URL WordPress, прокси sitemap Yoast |
| `server/utils/wpFetch.ts` | клиент WP: таймаут и перевод ошибок WP в статусы 404 / 4xx / 503 |
| `i18n/locales/` | строки интерфейса ru и uk |
| `docs/` | справочник API и ревью проекта |

## Документация

- [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md) — архитектура: слои, данные, кеш, локализация, модули.
- [docs/wp-api.md](docs/wp-api.md) — справочник по эндпоинтам WordPress.
- [docs/project-review-2026-10-20.md](docs/project-review-2026-10-20.md) — ревью проекта, технический долг и чек-лист работ до запуска.
