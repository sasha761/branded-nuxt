# WordPress REST API для фронта

Справочник по кастомным эндпоинтам WordPress, из которых Nuxt получает данные: параметры, ответы, ошибки, кеш.

- Код: тема `news`, каталог `wp-content/themes/news/inc/`, точка подключения `inc/rest-api.php` (подключается из `functions.php`).
- Базовый адрес: `{WP_SITE_URL}/wp-json/api/...`. Nuxt ходит туда только через BFF: `server/api/<группа>/<имя>.<get|post>.ts` → `server/utils/wpFetch.ts`.
- Все маршруты публичные, кроме `rest_api/v1/set_seo_identifiers` (только администратор).

| Файл | Что внутри |
|---|---|
| `rest-api-helper.php` | общие хелперы: язык, картинки, поиск объектов, кеш, ревалидация, rate limit, карточка товара `get_product_short_info()` |
| `rest-api-route.php` | `api/route`: путь → объект, переводы, SEO и крошки из Yoast |
| `rest-api-menu.php` | меню и языки |
| `rest-api-catalog.php` | каталог, фильтры, сайдбар |
| `rest-api-product.php` | страница товара, похожие, отзывы товара |
| `rest-api-home.php` | главная |
| `rest-api-page.php` | CMS-страницы |
| `rest-api-search.php` | поиск |
| `rest-api-reviews.php` | все отзывы |
| `rest-api-seo.php` | SEO и хлебные крошки (старый формат запроса) |
| `rest-api-cart.php` | заказ, котировка корзины, данные заказа |

---

## 1. Общие правила

### Язык
Параметр `lang`: `ru` (по умолчанию) или `uk`. Неизвестное значение превращается в текущий язык WPML, затем в `ru`. Каждый эндпоинт выполняется в этом языке (`rest_api_with_lang()`): от него зависят запросы, permalink'и, шаблоны Yoast и переводы строк.

### Пути и URL
- `path` — путь на фронте: `/product/x/`, `/uk/product-category/zhinoche-vzuttya/`. Префикс `/uk/` у украинской версии, слеш в конце. **Во фронте используйте `path`.**
- `url` — абсолютный адрес на домене фронта. Все строки `http(s)://<хост WP>/…` в ответах `api/*` переписываются на `BRANDED_FRONTEND_URL` (фильтр `rest_pre_echo_response`). Ссылки на `/wp-content/uploads/` остаются на домене WP. URL внутри HTML (`content`, `description`) не переписываются.
- Слаги в разных языках разные (`/brand/flex/` ↔ `/uk/brand/flex-uk/`). Путь перевода нельзя получить заменой префикса, его отдают `api/route` (`alternates`) и `menu/languages`.

### Формат JSON
Кириллица и слеши не экранируются (`"ф"`, а не `"ф"`).

### Ошибки
```json
{ "code": "not_found", "message": "Page not found", "data": { "status": 404 } }
```
| code | status | Когда |
|---|---|---|
| `not_found`, `no_page`, `order_not_found` | 404 | объекта нет, он не опубликован или нет перевода на запрошенный язык |
| `rest_missing_callback_param`, `rest_invalid_param` | 400 | нет обязательного параметра или неверный тип (ядро WP) |
| `no_url`, `search_error`, `invalid_param` | 400 | пустой `url`, запрос поиска короче 3 символов, неверный список товаров |
| `invalid_order`, `invalid_coupon` | 422 | данные заказа не прошли проверку; подробности в `data.errors` |
| `rate_limited` | 429 | больше 10 заказов за 10 минут с одного IP |
| `order_failed` | 500 | заказ не удалось сохранить |

### Кеш
- Ответы кешируются через `wp_cache_*` в группе `rest_api`. Ключи содержат версию группы (`wp_cache_get_last_changed`): `branded_rest_catalog`, `branded_rest_seo`, `branded_rest_menu`.
- Версия сбрасывается хуками: сохранение товара или вариации, изменение наличия, термины и атрибуты, меню, вложения, отзывы, опции Yoast. Главная сбрасывается отдельно (`home_info_{lang}`).
- TTL: меню и главная — 1 д, SEO и `api/route` — 6 ч, сайдбар — 1 ч, фильтры — 30 мин, каталог, товар и похожие — 10 мин.
- **Без постоянного object cache (Redis/Memcached) кеш живёт один запрос.** На проде нужен Redis Object Cache.

### Ревалидация фронта
При любом сбросе версии WP один раз в конце обработки запроса отправляет:
```http
POST {BRANDED_REVALIDATE_URL}
X-Branded-Secret: {BRANDED_REVALIDATE_SECRET}
Content-Type: application/json

{ "scopes": ["catalog", "seo", "menu", "home"] }
```
Запрос неблокирующий и отправляется только если обе константы заданы. На стороне Nuxt: эндпоинт `/api/_revalidate`, который проверяет секрет и чистит кеш Nitro.

### Константы `wp-config.php`
| Константа | Назначение |
|---|---|
| `BRANDED_FRONTEND_URL` | домен фронта для переписывания URL в ответах. Пусто — `home_url()` |
| `BRANDED_TG_TOKEN`, `BRANDED_TG_CHATS` | Telegram-уведомления о заказах (чаты через запятую). Пусто — выключены |
| `BRANDED_BFF_SECRET` | секрет, при котором WP доверяет заголовку `X-Branded-Client-IP` от Nuxt |
| `BRANDED_REVALIDATE_URL`, `BRANDED_REVALIDATE_SECRET` | вебхук ревалидации фронта |

---

## 2. Типы

```ts
interface Image {
  id: number
  alt: string               // alt из медиатеки, иначе название товара
  src: string; width: number; height: number   // оригинал
  srcset: string            // варианты с тем же соотношением сторон
  sizes: Partial<Record<'archive_md' | 'archive_xl' | 'single_xl' | 'large', { src: string; width: number; height: number }>>
  // archive_md 420×504, archive_xl 532×665, single_xl 840×1080 (для LCP на странице товара)
}

// get_product_short_info(): карточка товара во всех списках и основа страницы товара
interface ProductShort {
  id: number; name: string
  path: string; permalink: string
  price: string             // «сырая» цена, у вариативного — минимальная
  price_html: string        // HTML WooCommerce
  is_sale: boolean; percent: number | false
  is_stock: 'instock' | 'outofstock' | 'onbackorder'; stockStatus: string   // дубль is_stock
  size_attribute: { id: number; name: string; availability: boolean }[]
                            // вариативный: доступные вариации (id вариации, pa_size, наличие)
                            // простой: [{ id, name: 'one size', availability }]
  image: Image | null       // главная картинка
  gallery?: Image[]         // только на странице товара
  post_img_l: string | false; post_img_m: string | false; post_img_xl: string | false  // старые поля: archive_xl, archive_md, large
  images?: string[]         // старое поле: оригиналы галереи
  post_attr_size: string; post_attr_color: string
  post_attr_brand: string; post_link_brand: string; post_brand_url: string; post_brand_path: string
  brand: WP_Term[]          // сырые термины pa_brand
  short_description: string; description: string   // HTML; совпадают
  video: unknown; other_colors: unknown             // поля ACF
}

interface MenuItem {
  title: string; url: string; path: string
  image: { url: string; title: string | null; alt: string | null } | null   // 180×180
  submenu: MenuItem[]
}

interface Crumb { text: string; url: string | null; path: string | null }   // у последней крошки null

interface Alternate { lang: 'ru' | 'uk' | 'x-default'; path: string; url: string }

// SEO из Yoast (как в <head> живого сайта)
interface Seo {
  title: string; description: string; canonical: string
  robots: string                              // "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  robots_directives: Record<string, string>
  og_title: string; og_description: string; og_url: string; og_site_name: string
  og_type: string; og_locale: string          // 'website' | 'article' …, 'ru_RU' | 'uk_UA'
  og_image: string; og_image_width: number | null; og_image_height: number | null; og_image_type: string | null
  twitter_card: string
  article_modified_time: string | null
  schema: { '@context': string; '@graph': object[] } | null
                            // полный граф Yoast (WebPage, BreadcrumbList, WebSite, Organization …),
                            // у товара + Product от WooCommerce (offers, aggregateRating, review)
}
```

---

## 3. Маршрут страницы

### `GET api/route?path=&lang=`
Определяет, что лежит по пути фронта, и отдаёт всё для `<head>` и крошек. Рекомендуемый способ для любой страницы.

| Параметр | Обяз. | Описание |
|---|---|---|
| `path` | да | путь фронта, с префиксом языка или без. Query игнорируется |
| `lang` | нет | по умолчанию язык из префикса пути |

```ts
{
  type: 'home' | 'product' | 'category' | 'brand' | 'attribute' | 'tag' | 'page'
  object: 'post' | 'term'
  id: number
  post_type?: 'product' | 'page'
  taxonomy?: 'product_cat' | 'pa_brand' | 'product_brand' | 'pa_sezon' | 'pa_color' | 'product_tag'
  slug?: string
  default_id?: number       // у страниц: ID в языке по умолчанию (540 — «Отзывы» в любом языке)
  template?: string         // у страниц: шаблон WP
  lang: 'ru' | 'uk'
  path: string              // запрошенный путь (нормализованный)
  canonical_path: string    // настоящий путь объекта
  redirect: string | null   // куда сделать 301
  alternates: Alternate[]   // переводы для hreflang и переключателя языка; язык без перевода отсутствует
  seo: Seo | null
  breadcrumbs: Crumb[]      // крошки Yoast: основная категория товара, без «Магазина»
}
```

- Поддерживаемые пути: главная, `/product/{slug}/`, архивы всех публичных таксономий товаров (`/product-category/…/`, `/brand/`, `/бренд/`, `/sezon/`, `/color/`, `/product-tag/`), страницы (с родителями).
- `redirect` заполняется, если:
  - слаг из другого языка: `/uk/brand/flex/` → `/uk/brand/flex-uk/`;
  - лишние или неверные родители категории;
  - пагинация WP: `/…/page/2/` → `/…/?page=2`, `/page/1/` → без пагинации;
  - страница магазина WooCommerce `/shop/` → главная языка.
- Ошибка 404 `not_found`: объекта нет, он не опубликован или нет перевода на язык.
- Кеш: 6 ч, версия `branded_rest_seo`.

---

## 4. Меню и языки (`rest-api-menu.php`)

| Маршрут | Ответ |
|---|---|
| `GET api/menus?lang=` | `{ header: MenuItem[], footer: MenuItem[], mobile: { man: MenuItem[], woman: MenuItem[] } }` — все меню одним запросом |
| `GET api/menu/get_menu_header?lang=` | `MenuItem[]` (location `menu-1`) |
| `GET api/menu/get_menu_footer?lang=` | `MenuItem[]` (`menu-2`) |
| `GET api/menu/get_menu_mobile?lang=` | `{ man: MenuItem[] /* menu-3 */, woman: MenuItem[] /* menu-4 */ }` |

### `GET api/menu/languages?lang=&url=`
Список языков для переключателя. `url` — текущий путь фронта (можно с query).

```ts
{ current_lang: string
  languages: Record<'ru' | 'uk', {
    language_code: string; native_name: string; translated_name: string; country_flag_url: string
    active: 0 | 1
    missing: 0 | 1          // 1 — у страницы нет перевода, ссылка ведёт на главную этого языка
    path: string; url: string
    /* + прочие поля icl_get_languages() */ }> }
```
Пути переводов берутся через тот же резолвер, что и в `api/route` (с переведёнными слагами), query сохраняется. Для маршрутов, которых нет в WP (`/search`, `/cart`, `/checkout`, аккаунт), меняется только префикс языка.

---

## 5. Каталог (`rest-api-catalog.php`)

### `GET api/archive/get_products`
| Параметр | Обяз. | Описание |
|---|---|---|
| `url` | да | `route.fullPath`. По первому сегменту пути определяется архив: `/product-category/`, `/brand/`, `/sezon/`, `/бренд/` … |
| `slug` | нет | слаг термина архива; по умолчанию последний сегмент пути |
| `page` | нет | по умолчанию `page` из query `url`, иначе 1 |
| `offset` | нет | по умолчанию `(page - 1) * 16` |
| `lang` | нет | |
| `on_sale` | нет | `1` — только товары со скидкой (страница «Sales», шаблон `sale-template.php`); путь может быть любым, например `/sales/` |

Что читается из query `url`:
- `orderby` = `default` (сначала в наличии, затем новые) \| `popularity` \| `price` \| `price-asc` \| `price-desc` \| `date` \| `rating`;
- `s`;
- `page`;
- фильтры по атрибутам WooCommerce: `color`, `size`, `sezon`, `brand` (или `filter_color` …). Значения — слаги через запятую, внутри атрибута «ИЛИ», между атрибутами «И».

Любые другие ключи (`utm_*`, `gclid`, `fbclid` …) игнорируются.

```ts
{ products: ProductShort[]
  products_count: number; total_pages: number; page: number; per_page: 16
  term: { id: number; taxonomy: string; slug: string; name: string; description: string; path: string } | null
  canonical_path: string | null   // путь термина; если не совпадает с запрошенным — 301
  product_cat: { id: number; name: string; parent: string | null; url: string; path: string; description: string } | null
  brand?: { name: string; description: string } }
```
- Ошибка 404 `not_found`: термин не найден или нет перевода.
- Товары, скрытые из каталога WooCommerce, не выводятся.
- Кеш: 10 мин.

### `GET api/archive/get_filters?lang=&slug=&is_brand=&taxonomy=`
Фильтры для архива: считаются по товарам архива, сам атрибут архива исключается. `is_brand=1` означает архив `pa_brand`; `taxonomy` задаёт другой архив (`pa_sezon`, `product_brand` …); по умолчанию `product_cat`.

```ts
{ filters: { attribute: 'brand' | 'color' | 'sezon' | 'size'; label: string /* переведённая подпись */
             options: { slug: string; name: string; count: number }[] }[]
  price_range: { min: number; max: number }
  sort_options: { value: 'default' | 'popularity' | 'date' | 'price-asc' | 'price-desc' | 'rating'; label: string }[]
  products_count: number }
```
Неизвестный слаг даёт пустые фильтры. Кеш: 30 мин.

### `GET api/archive/get_sidebar?lang=&slug=`
Корневые категории (ID 16, 17, 18) с дочерними. `slug` — текущая категория для `is_active`.
```ts
{ id: number; label: string; slug: string; url: string; path: string; is_active: boolean
  children: { term_id: number; name: string; slug: string; url: string; path: string; count: number }[] }[]
```
Кеш: 1 ч.

---

## 6. Товар (`rest-api-product.php`)

### `GET api/product/get_single_product?url=&lang=`
`url` — слаг товара (или путь `/product/{slug}/`). Отдаётся только опубликованный товар в запрошенном языке.

```ts
ProductShort & {
  gallery: Image[]
  canonical_path: string
  specs: { brand: string | null; brand_path: string | null; categories: string[]; sku: string
           stock_status: 'instock' | 'outofstock' | 'onbackorder'; in_stock: boolean }
  product_info: { /* ACF-группа product_info бренда */ specification: string /* HTML для совместимости, на языке запроса */ }
  categories_str: string
  rating: string; count: number
  comments: { comment_ID: number; comment_author: string; comment_content: string; comment_date: string; comment_parent: number; rating: number }[]
  related_products: ProductShort[]   // до 10: основная категория Yoast, без самого товара, сначала в наличии
  // Выбор вариации по всем атрибутам; у простого товара — пустые массивы
  variation_attributes: { name: string            // ключ как в вариации: 'pa_size', 'pa_color'
                          label: string           // «Размер» / «Розмір»
                          type: string            // тип атрибута WooCommerce: 'select', 'color' (квадратики Variation Swatches)…
                          options: { slug: string; name: string; color: string | null /* HEX для type 'color' */ }[] }[]
  variations: { id: number
                attributes: Record<string, string>   // { pa_size: 'xs-s', pa_color: 'beliy' }; '' — «любое»
                in_stock: boolean; price: string }[]
}
```
Ошибка 404 `not_found`. Кеш: 10 мин (сбрасывается при сохранении товара и новых отзывах).

Порядок `variation_attributes` — как у атрибутов товара, вариантов — как у терминов (так же, как форма вариаций на сайте WP). Пустое значение атрибута у вариации означает «любое»: под неё подходит любой вариант, а выбранный покупателем фронт передаёт в `products[].variation` (см. `create_order`). Прежний `size_attribute` (только размер, по строке на вариацию) остаётся для совместимости.

### `GET api/product/related?id=&lang=`
`{ items: ProductShort[] }` — те же похожие товары, для ленивой загрузки. `id` товара в любом языке. Кеш: 10 мин.

### `GET api/product/reviews?id=&page=&per_page=`
`{ items: Comment[] /* формат comments выше */, total: number, total_pages: number, page: number, per_page: number }`; `per_page` в диапазоне 1..48, по умолчанию 10.

### `POST api/product/review`
Новый отзыв (форма под товаром, как `templates/comment-form.twig`).
```ts
{ id: number          // ID товара в языке страницы
  author: string      // 2–60 символов
  email: string
  rating: 1..5
  content: string     // до 2000 символов
  website?: string }  // поле-ловушка, должно быть пустым
```
- **Ответ**: `{ id: number, status: 'approved' | 'pending' }`. Модерация по настройкам WP: отзыв автора без одобренных ранее комментариев ждёт проверки.
- **422 `invalid_review`**: `data.errors` — `{ author | email | rating | content: 'required' | 'invalid' | 'too_long' }` или `{ form: 'invalid' | 'duplicate' | 'flood' }`.
- **429 `rate_limited`**: больше 5 отзывов за час с одного IP (IP — как в `create_order`).
- Оценка сохраняется в мету `rating`, рейтинг товара пересчитывается (`WC_Comments::clear_transients`).

---

## 7. Главная, страницы, поиск, отзывы

### `GET api/home/get_home_info?lang=`
```ts
{ products_brand: ProductShort[]   // 6 новых из категории «women» (в языке запроса)
  products_sale: ProductShort[]    // 6 новых из «accessories»
  best_offers?: ProductShort[]     // ACF best_offers главной
  banners_group: { banners: { link: string; path: string /* + поля ACF */ }[] } | null
  accesories: { link: string; path: string /* + поля ACF */ }[] | null }   // опечатка в ключе — часть контракта
```
Кеш: 1 д.

### `GET|POST api/page/page` — `url`, `lang`
```ts
{ page: { ID: number; title: string; content: string /* HTML после the_content */ }
  canonical_path: string           // если не совпадает с запрошенным путём (слаг другого языка) — 301
  related_pages: { ID: number; title: string; link: string; path: string }[] }
```
Страница ищется по пути в любом языке, отдаётся только её перевод на `lang`. Ошибки: 400 `no_url`, 404 `no_page`.

### `GET|POST api/search/search`
| Параметр | По умолчанию | Описание |
|---|---|---|
| `query` | обязателен | от 3 символов; поиск по названию в языке `lang` |
| `lang` | ru | |
| `posts_per_page` | 7 | 1..48 |
| `page` | 1 | |
| `offset` | — | если передан, перекрывает `page` |

`{ products_count, total_pages, current_page, per_page, products: ProductShort[] }`. Товары, скрытые из поиска, не выводятся. Ошибка 400 `search_error`.

### `GET|POST api/reviews/reviews` — `lang`, `per_page` (1..48, 12), `page`, `offset`
```ts
{ total: number; total_pages: number; current_page: number; per_page: number
  reviews: { id: string; author: string; content: string; date: string /* Y-m-d H:i:s */; rating: number
             product_title: string; product_link: string; product_path: string }[] }
```
Список общий для всех языков, название и ссылка товара — в языке `lang`.

---

## 8. SEO в старом формате (`rest-api-seo.php`)
Для новых страниц используйте `api/route`.

### `GET|POST api/seo/get_seo` — `url`, `type`, `lang`
- `type`: `product` | `category` | `brand` | `page` | `home`.
- `url`: для product, category, brand — слаг; для page — путь.
- Ответ: `Seo` (из Yoast; если Yoast выключен — прежняя ручная сборка).
- Ошибка 404 `not_found`. Кеш: 6 ч.

### `GET|POST api/seo/get_breadcrumbs` — `url`, `type`, `lang`
`{ breadcrumbs: Crumb[], schema: BreadcrumbList }`. Крошки Yoast, как в `api/route`. 404 только для `product` и `category`.

---

## 9. Заказы (`rest-api-cart.php`)

### `POST api/cart/create_order`
```ts
{ products: { id: number                          // ID товара
              size_selected?: [{ id: number }]    // ID вариации; у простого товара — ID товара
              variation?: Record<string, string>  // слаги выбранных атрибутов { pa_color: 'beliy' }
              quantity?: number }[]               // 1..10, по умолчанию 1; до 50 позиций
  firstName: string; lastName: string             // обязательны
  phone: string                                   // 10–15 цифр
  email: string                                   // обязателен
  city: string; address: string                   // обязательны (address — отделение Новой почты)
  comments?: string
  payment_method?: 'cod' | 'bacs'                 // не передан — «Оплата при доставке | быстрый заказ»
  coupon?: string
  lang?: 'ru' | 'uk'                              // язык писем
  website?: string }                              // поле-ловушка для ботов, должно быть пустым
```
- **Ответ**: строка — URL страницы «заказ принят» `…/order-received/{id}/?key=wc_order_…`. Ключ из неё нужен для `get_order_info`.
- **Ошибка 422 `invalid_order`**: в `data.errors` — `{ firstName | lastName | phone | email | city | address | payment_method | products | "products.{N}": код }`. Коды: `required`, `invalid`, `empty`, `too_many`, `invalid_quantity`, `unavailable`, `out_of_stock`, `insufficient_stock`.
- **Ошибка 422 `invalid_coupon`** (`data.errors.coupon`). При любой ошибке заказ в базе не остаётся.
- **429 `rate_limited`**: больше 10 заказов за 10 минут с одного IP. IP клиента BFF передаёт в `X-Branded-Client-IP` вместе с `X-Branded-Secret` (= `BRANDED_BFF_SECRET`), иначе считается IP сервера Nuxt.
- Цены всегда из БД, цены из корзины игнорируются.
- **Атрибуты позиции**: значения вариации; из `variation` берутся только значения для атрибутов «любое» и только из вариантов товара, остальное игнорируется. Они записываются в мету позиции, как у корзины WooCommerce (видны в админке и письмах; в Telegram — строки «Цвет: …» под названием). Одна вариация в разных выбранных цветах — разные позиции.
- **Порядок создания**: заказ `pending` → товары, адреса, купон, итоги → `on-hold`. На последнем переходе WooCommerce списывает остатки и отправляет письма администратору и клиенту (на языке заказа). Затем уведомление в Telegram (в фоне).

### `POST api/cart/quote`
Пересчёт корзины без создания заказа: `{ products, coupon?, lang? }` (формат `products` как в `create_order`).
```ts
{ items: { index: number; id: number | null; product_id: number | null; variation_id: number | null
           name: string | null; size: string | null; quantity: number
           attributes: { name: string; label: string; value: string }[]   // выбранные атрибуты на языке lang
           price: number; line_total: number; in_stock: boolean; stock_quantity: number | null
           error: null | 'invalid' | 'invalid_quantity' | 'unavailable' | 'out_of_stock' | 'insufficient_stock' }[]
  subtotal: string; discount: string; total: string; currency: string
  coupon: { code: string; valid: boolean; error: string | null; message: string | null } | null }
```
Позиции с ошибкой не входят в сумму. Купон проверяется по правилам WooCommerce; `message` — текст WooCommerce, например «Время действия купона истекло».

### `GET api/cart/get_order_info?order_id=&key=`
`key` обязателен (`wc_order_…`). Без него 400, при несовпадении 404 — тот же ответ, что для несуществующего заказа.
```ts
{ order_data: { order_id; order_number; order_date; status; shipping_total; discount_total; order_total; order_currency
                payment_method; payment_method_title; customer_note
                billing_first_name; billing_last_name; billing_email; billing_phone; billing_city; billing_address_1 }
  products: { id; variation_id; name; qty; subtotal; total; brand: { name: string; slug: string }[]; cats?: string[]
              attributes: { label: string; value: string }[] }[] }   // атрибуты, которых нет в name (значения «любое»)
```

---

## 10. Подписка (legacy AJAX)

Форма «Будь в теме» по-прежнему работает через `POST /wp-admin/admin-ajax.php` с `action=subscribe`, `email`, `gender` (`Classes/NotificationSystem.class.php`). Обработчик создаёт пользователя с ролью `subscriber` и отправляет письмо с купоном. REST-эндпоинта нет. Nuxt ходит туда через BFF `POST /api/subscribe`: BFF проверяет email и поле-ловушку и ставит лимит 5 попыток в час на IP.

## 11. Служебное

### `POST rest_api/v1/set_seo_identifiers/` (только администратор)
Разовый скрипт: проставляет MPN (`wpseo_global_identifier_values`) и пустые `_sku` всем товарам по счётчику бренда. Не идемпотентен.

---

## 12. Устаревшее и чем заменить

Nuxt перешёл на правую колонку. Исключения: `related_products` и `comments` по-прежнему берутся из ответа товара — так похожие товары и отзывы попадают в SSR-HTML (внутренние ссылки, текст отзывов), а WP кеширует весь ответ. Старые методы и поля можно удалить после закрытия окна отката (план, M3).

| Было во фронте | Сейчас |
|---|---|
| `seo/get_seo` + `seo/get_breadcrumbs` + `menu/languages` на каждой странице | один `GET api/route` |
| `switchLocalePath` для переключателя языка, отсутствие hreflang | `alternates` из `api/route` |
| три запроса меню | `GET api/menus` |
| POST для `seo/*`, `page`, `search`, `reviews` | GET (кешируется) |
| `post_img_l` / `post_img_m` / `post_img_xl` / `images` | `image`, `gallery` (`sizes.single_xl` для главного фото товара) |
| `product_info.specification` (HTML) | `specs` + подписи из i18n |
| `related_products`, `comments` в ответе товара | `api/product/related`, `api/product/reviews` (лениво) |
| ответ `create_order` разбирается регуляркой без `key` | сохранять `key` из URL и передавать в `get_order_info` |

---

## 13. Как проверить

Быстрые проверки (локально `B=http://branded.loc/wp-json/api`). Запросы с кириллицей отправляйте из Node или браузера: Git Bash портит кодировку.
```bash
curl -s "$B/route?path=/uk/brand/flex/"                       # redirect: /uk/brand/flex-uk/, alternates ru/uk/x-default
curl -s "$B/archive/get_products?lang=ru&url=%2Fproduct-category%2Fwomen%2F%3Futm_source%3Dx%26color%3Dbeliy"   # UTM игнорируется, фильтр работает
curl -s -o /dev/null -w "%{http_code}\n" "$B/archive/get_products?lang=ru&url=/product-category/no-such/"        # 404
curl -s -o /dev/null -w "%{http_code}\n" "$B/cart/get_order_info?order_id=1"                                     # 400 без key
curl -s "$B/menu/languages?lang=ru&url=/reviews/"                 # uk → /uk/vidguky/
```
