# Ревью branded (Nuxt 4 + headless WordPress): техдолг, прод-рендеринг, перенос WP на cms.branded.com.ua

## Context

Магазин branded.com.ua сейчас работает на WordPress/WooCommerce (Yoast + WPML), индексируется, получает трафик в том числе из Google Images. Новый фронт — Nuxt 4 (`C:\OSPanel\home\wp-nuxt`, ~6k строк), WP остаётся бэкендом (кастомные `wp-json/api/*`). План — увести WP на `cms.branded.com.ua`, а на основном домене отдавать Nuxt.
Задача: оценить проект, найти техдолг, определить схему рендеринга в проде и сделать переезд без потери позиций и трафика из поиска по картинкам.

Что проверено: весь код Nuxt; живой сайт (robots.txt, все sitemap, HTML страниц товара и категории); ответы публичных WP-эндпоинтов, которые использует Nuxt.

---

## 1. Общая оценка

| Аспект | Оценка |
|---|---|
| Архитектурный каркас (слои, BFF, роутинг) | **7/10**: правильная основа, хорошо масштабируется |
| Качество кода / поддерживаемость | **5/10**: дублирование, нет типов, нет линтера и тестов |
| Готовность к продакшену по SEO | **3/10**: есть блокеры, из-за которых запуск в текущем виде уронит позиции |
| Безопасность checkout/заказов | **требует проверки на стороне WP** (см. P0-11) |

Итог: фундамент выбран верно, кода пока немного, поэтому исправления сейчас обходятся дёшево. Но запускать на основной домен в текущем виде нельзя: canonical, hreflang, переключатель языков, часть URL и пагинация сломают индекс.

---

## 2. Что сделано хорошо

- **Чёткие слои:** pages → `server/api/*` (BFF) → `server/utils/wpFetch.ts` → WP REST. Адрес WP не попадает в клиентский бандл (`runtimeConfig`).
- **URL-структура совпадает с WP:** `/product/`, `/product-category/**`, `/brand/`, `prefix_except_default` (ru без префикса, `/uk/`). Поэтому полного совпадения URL добиться реально.
- **SSR + `useAsyncData`** с `Promise.all` (данные, SEO и крошки тянутся параллельно), `signal` для отмены запросов, ключи учитывают локаль.
- **SEO-данные по-прежнему из Yoast:** у редакторов не меняется рабочий процесс. JSON-LD Product/BreadcrumbList прокидывается (`app/composables/useSeo.ts`).
- **Кеш Nitro** на меню, сайдбар и фильтры (`routeRules`).
- **Производительность:** попапы через `defineAsyncComponent`, `Lazy*` блоки на главной, `ClientOnly` для корзины (без hydration mismatch), `fetchpriority` и preload у hero-баннера.
- **Есть ARCHITECTURE_GUIDE.md.** Миграция со старого Vue CLI (`src/`) доведена до конца.

---

## 3. Проблемы и техдолг

### P0: блокеры запуска (SEO и безопасность)

1. **Canonical и og:url = `http://localhost:3000/...` на проде.** Проверено: `POST https://branded.com.ua/wp-json/api/seo/get_seo` для товара и главной возвращает `canonical: "http://localhost:3000/product/.../"`. То же в `menu/languages` → `url`. В WP-плагине жёстко зашит адрес фронта. В таком виде canonical указывает на чужой хост, и Google выкинет страницы из индекса.
2. **Нет hreflang.** На живом сайте у каждой страницы есть пары `ru` / `uk` / `x-default`. В Nuxt их нет вообще (`useLocaleHead` и hreflang нигде не используются).
3. **`robots` из Yoast игнорируется.** API отдаёт поле `robots`, но в `useSeo.ts` оно не выводится, поэтому noindex-страницы из Yoast станут индексируемыми.
4. **Переключатель языка строит неверные URL.** `LHeader.vue` использует `switchLocalePath`, а он просто добавляет `/uk`. Слаги же различаются: `/product-category/zhenskaya-obuv/` ↔ `/uk/product-category/zhinoche-vzuttya/`, `/brand/flex/` ↔ `/uk/brand/flex-uk/`, `/reviews/` ↔ `/uk/vidguky/`. Правильный `path` для каждого языка уже приходит из `api/menu/languages`, но не используется. Вдобавок `useAsyncData` языков закеширован по ключу только от локали, а не от URL.
5. **Не покрыты URL из sitemap:** `/sezon/{zima,leto,demisezon}/` (6 шт.), `/бренд/suns-house/`, `/shop/` (на живом это 301 на главную), `/uk/vidguky/` (уйдёт в `[...page].vue`, а не в `reviews.vue`), `/sales/`, `/uk/magazyn/`. Все они падают в catch-all `[...page].vue`. Каждый нужно проверить; скорее всего часть отдаст 404 или страницу без списка товаров.
6. **Дубли из-за слеша в конце.** WP отвечает 301 с `/product/x` на `/product/x/`, а Nuxt (vue-router, strict: false) отдаёт 200 на оба варианта.
7. **Любая ошибка WP превращается в 404** (`[...page].vue:86`, `product/[productName].vue:177`). Если WP на минуту ляжет или ответит медленно, Googlebot получит 404 и начнёт выкидывать страницы. Должно быть: 404 только на 404 от WP, иначе 503.
8. **Пагинацию не видят роботы.** `v-pagination-3` рендерит `<button>` без `href`. Глубокие страницы каталога находятся только через sitemap.
9. **Картинки товара.** На `product/[productName].vue:22,98` стоит `alt=""` (на живом сайте alt = название товара, а это важный сигнал для Google Images). В качестве отображаемого `src` используется оригинал 1680×2160 (тяжёлый LCP), тогда как живой сайт показывает варианты `-840x1080` / `-532x665`. API отдаёт `post_img_l` (532x665) и `post_img_m` (420x504), а варианта 840x1080 не отдаёт. В карточках (`CProduct.vue`) в `img src` стоит gif-заглушка: Google рекомендует реальный `src`.
10. **Нет robots.txt и sitemap на стороне Nuxt.** После переключения домена `/robots.txt`, `/sitemap_index.xml` и `/*-sitemap.xml` должен кто-то отдавать.
11. **Безопасность заказов:**
    - `GET /api/cart/get_order_info?order_id=N`: на вход только порядковый id, без order key (в `checkout.vue:279` `key` из URL WooCommerce выбрасывается), cookies в WP не пробрасываются. Если WP-эндпоинт не проверяет что-то ещё, любой может перебором выгрузить ФИО, телефон, email и адрес клиентов. **Проверить на стороне WP**: нужен `order_key`.
    - `create_order` отправляет товары из localStorage вместе с ценами. **Проверить**, что WP пересчитывает цены и остатки сам. Rate limit и антиспам отсутствуют.
12. **Главная запрашивает SEO без `lang`** (`index.vue:31`), поэтому `/uk/` получает русские title и description.

### P1: производительность, i18n, функционал

- **HTML не кешируется.** Каждый SSR делает около 7 HTTP-запросов к WP (страница, SEO, крошки + header 3 + footer 1) через публичный интернет (`WP_SITE_URL=https://branded.com.ua`). `wpFetch` работает без таймаута, без маппинга ошибок и без внутреннего адреса.
- **Чтение идёт через POST** (`get_seo`, `get_breadcrumbs`, `page`, `search`, `reviews`), поэтому ни routeRules-кеш, ни CDN эти запросы не кешируют.
- **`detectBrowserLanguage` с редиректом на `/`.** Google не рекомендует авто-редирект по языку, а вместе с кешированием HTML это даёт риск закешировать редирект.
- **Русский хардкод в шаблонах:** товар («В корзину», «Описание:», «Размер», «Купить в 1 клик»), весь checkout, крошки «Главная», страница заказа. Украинская версия получает русский UI. В `i18n/*.json` всего 36 ключей.
- **Checkout:** выбор оплаты (bacs/cod) не привязан к модели и не отправляется. Купон — заглушка `submitCoupon() {}`. Валидация телефона в QuickBuy и checkout различается.
- **`LHeroHome.vue`:** H1 «Online store brand clothing for men and women» на английском и спрятан в последнем слайде свайпера. Ссылки на 2 товара зашиты в коде.

### P2: поддерживаемость

- `brand/[brandName].vue` и `product-category/[...slug].vue` совпадают примерно на 95%. Логика пагинации скопирована 4 раза. `stripSlug` / `stripDomain` дублируются в `utils/url.ts` и `useProductUtils.ts` (последний не используется).
- Нет типов ответов API: `any`, SFC на JS (только 2 файла с `lang="ts"`). Нет ESLint, тестов и `.env.example`. README остался от Vue CLI.
- `server/api/*` — это 17 одинаковых прокси 1:1 без валидации и whitelisting параметров. Можно заменить одним типизированным хелпером.
- Устаревший конфиг: `experimental.inlineSSRStyles` (опция переименована) и `future.compatibilityVersion: 4` (лишнее на Nuxt 4). Предупреждения про Sass `@import` заглушены (в Dart Sass 3 он перестанет работать).
- Корзина живёт только в localStorage, геттер парсит JSON при каждом обращении. Синхронизации с остатками нет.
- Библиотеки: `v-pagination-3` (CJS, button), `vue-select` в beta. Perf-monitor плагин попадает в прод-бандл.

---

## 4. Как рендерить в продакшене

**Схема: SSR (Nitro `node-server`) + SWR-кеш HTML, nginx впереди. SSG не подходит:** ~1000 товаров × 2 языка, меняются остатки и цены, есть фильтры и пагинация.

```
                 ┌──────────── branded.com.ua (nginx) ────────────┐
Пользователь/    │ /wp-content/uploads/*  → файлы WP с диска (alias)│
Googlebot  ───▶  │ /sitemap_index.xml, /*-sitemap*.xml, xsl → WP   │
                 │ всё остальное          → Nuxt 127.0.0.1:3000    │
                 └─────────────────────────────────────────────────┘
                 cms.branded.com.ua (nginx → php-fpm WP)
                   /wp-admin, /wp-login.php → только по IP/basic-auth
                   /wp-json/*               → для Nuxt (X-Robots-Tag: noindex)
                   прочий фронт WP          → 301 на branded.com.ua
```

- **Nuxt:** `nuxt build` → `node .output/server/index.mjs` под PM2 или systemd. При PM2 cluster кеш Nitro выносится в Redis (`nitro.storage.cache`), для одного инстанса хватит fs/memory.
- **Nuxt → WP по внутреннему адресу** (`http://127.0.0.1` + `Host: cms.branded.com.ua`, или приватная сеть), таймаут 5–8 с.
- **routeRules (гибридный рендеринг):**
  - `/`, `/uk`, `/product/**`, `/uk/product/**`, `/product-category/**`, `/uk/product-category/**`, `/brand/**`, `/uk/brand/**`, страницы: `swr: 300–600`.
  - `/cart`, `/checkout`, `/order-received/**` (и `/uk/...`): `ssr: false`, `X-Robots-Tag: noindex`, без кеша.
  - `/search`: без кеша, `noindex, follow`.
  - GET-эндпоинты `/api/*`: кеш, как сейчас.
- **Инвалидация:** в WP хуки `save_post_product`, изменение остатков и `edited_term` вызывают `POST https://branded.com.ua/api/_revalidate` с секретом. Тот чистит `cache:nitro:routes:*`. Для начала хватит короткого TTL и полной очистки.
- **Опционально Cloudflare** перед nginx: кеш статики и картинок, HTML через origin.

---

## 5. Перенос WP на cms.branded.com.ua без потери трафика

**Главный принцип: публичные URL страниц и картинок не меняются.** То, что WP переехал на поддомен, должно остаться внутренней деталью. Если Google не видит изменений, терять нечего.

### 5.1 Картинки (рекомендуемый вариант): оставить на основном домене
- nginx на `branded.com.ua`:
  `location ^~ /wp-content/uploads/ { alias /path/to/wp/wp-content/uploads/; expires 365d; access_log off; }`.
  Если WP на другом сервере: `proxy_pass https://cms.branded.com.ua;` + `proxy_cache`.
- В WP: опция `upload_url_path = https://branded.com.ua/wp-content/uploads` (или фильтр `upload_dir` → `baseurl`). Тогда `wp_get_attachment_url`, srcset, og:image, schema и `<image:loc>` в sitemap и для новых загрузок останутся на основном домене.
- **Не запускать** `wp search-replace branded.com.ua cms.branded.com.ua` по базе. Меняется только `siteurl`.
- Nuxt должен отдавать в SSR-HTML **те же URL картинок, что и сейчас** (оригинал в `<a href>`, варианты 840x1080/532x665 в srcset), с `alt` = название товара. Тогда связка «картинка ↔ страница-источник» для Google Images сохранится.

### 5.2 Если всё же отдавать картинки с cms (или CDN-поддомена): не рекомендую
- Постоянные 301: `location ^~ /wp-content/uploads/ { return 301 https://cms.branded.com.ua$request_uri; }`, и не снимать их.
- `robots.txt` на cms **обязан разрешать** `/wp-content/uploads/`. Типичная ошибка — `Disallow: /` на CMS-поддомене: она выкинет все картинки из Google Images.
- Domain-property в Search Console (через DNS она покрывает поддомены). Новые URL должны быть одинаковыми везде: HTML, og:image, schema, image sitemap. Hotlink-защита не должна мешать Google.
- Будьте готовы к просадке Google Images на недели или месяцы: картинки переобходятся медленно. Выгоды от такого варианта нет.

### 5.3 Настройка WP на поддомене
- `WP_HOME = https://branded.com.ua`, `WP_SITEURL = https://cms.branded.com.ua`. Тогда permalinks, Yoast canonical, hreflang, sitemap и schema автоматически получают основной домен. После этого убрать хак с `localhost:3000` в WP-плагине (P0-1).
- Фильтр `rest_url`, который отдаёт `site_url()`. Иначе Gutenberg и WC-admin на cms будут обращаться к `branded.com.ua/wp-json` (CORS и cookies сломаются).
- На cms: фронт WP отвечает 301 на основной домен (`redirect_canonical` при `home ≠ host` делает это сам, плюс правило в nginx). `/wp-json` отдаётся с `X-Robots-Tag: noindex`, админка закрыта по IP или basic-auth.
- Совместимость WPML с `home ≠ siteurl` проверить на staging.

### 5.4 Что основной домен должен отдавать после переключения
- `/robots.txt` — из Nuxt `public/`, текущие правила, включая `Allow: */uploads` и `Sitemap:`.
- `/sitemap_index.xml`, `/*-sitemap*.xml`, `main-sitemap.xsl` — проксируются в Yoast.
- Редиректы, которые сейчас делает WP (Yoast/Redirection), а также `/shop/` → `/`. Экспортировать их в nginx `map` или в Nuxt server middleware.
- Все типы URL из sitemap (P0-5) с теми же title, description, H1, canonical и hreflang.

### 5.5 Чек-лист запуска
1. Staging Nuxt (закрыт basic-auth) на копии WP с новой схемой доменов.
2. Скрипт сверки по ~1150 URL из всех sitemap плюс топ страниц из GSC: статус, canonical, hreflang, title/description/H1, robots и набор URL картинок (staging сравнивается с живым сайтом).
3. Переключение DNS и nginx в часы низкого трафика. Повторная отправка sitemap в GSC.
4. Две–четыре недели мониторинга: GSC (Pages, Performance → Images), логи 404/5xx, Core Web Vitals.

---

## 6. План работ в репозитории Nuxt (если одобрите)

**Этап 1 — SEO-блокеры (Nuxt):**
- `app/composables/useSeo.ts`: вывод `robots`; нормализация хоста canonical и og:url к `runtimeConfig.public.siteUrl` (страховка от localhost/cms); hreflang + x-default.
- Новый `app/composables/usePageLanguages.ts`: `GET /api/menu/languages?url=<route.path>` с ключом по пути. Возвращает `path` для каждого языка: из него строятся hreflang и переключатель. `LHeader.vue` и `CLang.vue` переводятся на него вместо `switchLocalePath`.
- `server/middleware/trailing-slash.ts`: 301 на URL со слешем (кроме `/api`, `/_nuxt`, файлов).
- `server/utils/wpFetch.ts`: таймаут, внутренний URL (`WP_INTERNAL_URL` + Host), проброс 404, остальные ошибки → 503.
- `[...page].vue`, `product/[productName].vue`, `brand/*`, `product-category/*`: 404 только при 404 от WP, иначе 503.
- `index.vue`: передавать `lang` в `get_seo`.
- Новый `app/components/ui/CPagination.vue` на `<NuxtLink :to="{ query: { page } }">` вместо `v-pagination-3` (4 страницы).
- Товар: `alt` = название, srcset из вариантов, `<a href>` на оригинал. `CProduct.vue`: реальный `src`.
- Новые маршруты: `/sezon/[slug]` (архив атрибута, переиспользуется архивная логика), `/бренд/[slug]`, редирект `/shop/` → `/`. Проверить `/sales/`, `/uk/vidguky/`, `/uk/magazyn/`.
- `public/robots.txt`. В `nuxt.config.ts`: `routeRules` (swr, noindex и `ssr: false` для корзины), `detectBrowserLanguage: false`, `runtimeConfig.public.siteUrl`, удалить устаревшие опции, в dev проксировать sitemap и uploads.
- Чтения через POST → GET на стороне Nuxt (`get_seo.get.ts` и т.п. внутри по-прежнему шлют POST в WP, менять WP не нужно).

**Этап 2 — изменения на стороне WP** (кода плагина нет в этом репозитории, нужен доступ к нему): убрать `localhost:3000`, отдавать вариант 840x1080, `order_key` в `get_order_info`, пересчёт цен в `create_order`, webhook ревалидации, `WP_HOME`/`WP_SITEURL`, `upload_url_path`, фильтр `rest_url`.

**Этап 3 — инфраструктура:** конфиги nginx для обоих хостов, PM2/systemd, хранилище кеша Nitro, скрипт сверки URL, чек-лист из 5.5.

**Этап 4 — техдолг:** composable `useArchivePage` вместо дублирования brand/category; вынос всех строк в i18n; типы ответов API; ESLint; `.env.example`; README; привязка способа оплаты в checkout.

---

## 7. Проверка

- `npm run build && node .output/server/index.mjs`, затем curl:
  - canonical и og:url на `https://branded.com.ua`;
  - hreflang ru/uk/x-default совпадают с живым сайтом на товаре и категории (разные слаги);
  - `/product/x` → 301 на `/product/x/`;
  - несуществующий товар → 404, недоступный WP (`WP_SITE_URL` на мёртвый хост) → 503;
  - в SSR-HTML пагинация `<a href="?page=2">`, у картинок товара есть alt и реальные URL;
  - `/sezon/zima/`, `/uk/vidguky/`, `/shop/` работают как на живом сайте.
- Скрипт сверки по всем URL из sitemap: staging против продакшена (статус, canonical, hreflang, title, H1, картинки).
- Rich Results Test (Product, BreadcrumbList) и Lighthouse на странице товара (LCP после замены оригинала на 840x1080).
