# Деплой Nuxt на VPS

Сервер подготовлен комплектом [docs/vps-setup-2026-11-03](../docs/vps-setup-2026-11-03/README.ru.md). В нём PM2, nginx, Redis и серверный скрипт `branded-deploy`. Отсюда — только доставка сборки из GitHub Actions: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

```text
GitHub Actions: npm ci → npm run build (Node 22, как на сервере)
  → rsync .output в /srv/branded/incoming/<release>/.output
  → sudo branded-deploy /srv/branded/incoming/<release> <release>
      проверка API WP, releases/<release>, симлинк current, pm2 reload, проверка HTTP, откат при ошибке
  → POST /api/_revalidate: сброс кеша API (HTML и так рендерится заново: buildId в ключе)
```

`<release>` — `<12 знаков sha>-<номер запуска>-<попытка>`: `branded-deploy` не перезаписывает существующий релиз.

## Сервер (один раз)

1. Пользователь для деплоя: вход только по ключу, без пароля.
   ```sh
   useradd --create-home --shell /bin/bash deploy
   install -d -m 700 -o deploy -g deploy ~deploy/.ssh
   # публичный ключ пары DEPLOY_SSH_KEY → ~deploy/.ssh/authorized_keys (600, владелец deploy)
   ```
2. Каталог загрузки доступен deploy на запись:
   ```sh
   chown deploy: /srv/branded/incoming
   ```
3. Право запускать только `branded-deploy`. Файл `/etc/sudoers.d/branded-deploy`, права 440, проверка `visudo -c`:
   ```text
   deploy ALL=(root) NOPASSWD: /usr/local/sbin/branded-deploy
   ```

## GitHub

Settings → Secrets and variables → Actions, уровень репозитория:

| Имя | Тип | Значение |
|---|---|---|
| `DEPLOY_SSH_KEY` | секрет | приватный ключ ed25519 без пароля |
| `DEPLOY_KNOWN_HOSTS` | секрет | вывод `ssh-keyscan -t ed25519 173.242.54.153` |
| `NUXT_REVALIDATE_SECRET` | секрет | то же значение, что в `/etc/branded/nuxt.env.json`. Без него кеш API после деплоя не сбрасывается |
| `DEPLOY_HOST` | переменная | `173.242.54.153`. Пока не задан, деплой пропускается |
| `DEPLOY_USER` | переменная | `deploy` |
| `DEPLOY_ON_PUSH` | переменная | `true` — деплой после каждого зелёного CI на master; иначе только вручную |

Первый деплой — вручную: Actions → Deploy → Run workflow. Для ручного подтверждения каждого деплоя в Settings → Environments → `production` включить Required reviewers.

`branded-deploy` требует, чтобы WP на `127.0.0.1:8081` уже отвечал (`/wp-json/api/menus` → 200). Поэтому первый настоящий деплой — после переноса WordPress.

## Проверка после первого деплоя

- `pm2 status` (PM2_HOME=/srv/branded/.pm2): два процесса `branded-nuxt` в `online`.
- `curl -sI http://127.0.0.1:3000/`: заголовки `X-Html-Cache`, `X-Frame-Options`. Повторный запрос даёт `X-Html-Cache: HIT`.
- Вебхук из WP: изменить товар в админке. Страница товара снова `MISS`, оба процесса отдают новую версию.
- Логи: `/var/log/branded/nuxt-error.log`.

## Откат

`branded-deploy --rollback` — на прошлый релиз (симлинк `previous`). Откат всего сайта на тему WP — шаблон nginx Stage A.

## Что учесть в серверном комплекте

Рекомендации из ревью, раздел 11.4:

- **Старые чанки.** Шаблон Stage B отдаёт `/_nuxt/` только из `current`. После деплоя открытые вкладки получат 404 на ленивые чанки прошлой сборки, а Nuxt перезагрузит страницу. Лучше копить чанки в отдельном каталоге (rsync без `--delete`) и отдавать `/_nuxt/` из него, чистить файлы старше 30 дней. `/_nuxt/builds/` (манифест сборки) оставить на Nuxt.
- **Redis.** `maxmemory 192mb` на WP (db0) и Nitro (db1) вместе. Кеш HTML — около 80 КБ на страницу, в sitemap ~2300 адресов. С `allkeys-lru` ничего не сломается, но HTML будет вытеснять object cache WP. Если позволяет память, поднять до 384–512 МБ.
- **Старые релизы.** `branded-deploy` их не удаляет: нужна чистка, например оставлять 5 последних.
