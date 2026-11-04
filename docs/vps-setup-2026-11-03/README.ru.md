# Подготовка VPS Branded — 03.11.2026

Назначение этого комплекта: подготовить сервер для переноса WordPress + Nuxt, сохранить существующий `own.org.ua` и MySQL aaPanel. Публичные домены и DNS при подготовке не переключаются.

## Схема на VPS

| Компонент | Размещение | Адрес / параметры |
|---|---|---|
| PHP 8.5.12 с FPM, OPcache и PhpRedis | `/opt/branded/php` | `/run/branded-php/php-fpm.sock` |
| MariaDB 10.11 | `/opt/branded/mariadb`, данные `/srv/branded/mariadb` | `127.0.0.1:3307`, БД `branded` |
| Redis 7 | `/opt/branded/redis` | `127.0.0.1:6380`, db0 WordPress, db1 Nitro, пароль, 192 МБ |
| Node 26.13.0 LTS + PM2 | `/opt/branded/node` | 2 процесса, `127.0.0.1:3000` |
| Внутренний WordPress backend | `/etc/branded/nginx/internal.conf` | `127.0.0.1:8081` |
| Файлы WordPress после переноса | `/srv/branded/wordpress` | До переноса каталог пуст |
| Готовые сборки Nuxt | `/srv/branded/nuxt/releases/<release>/.output` | `/srv/branded/nuxt/current` — симлинк |
| Загрузка новых релизов | `/srv/branded/incoming/<release>/.output` | Затем `branded-deploy` |
| Настройки и секреты | `/etc/branded` | Секреты не включены в этот локальный комплект |
| Логи | `/var/log/branded` | Ежедневная ротация, 14 архивов |
| Локальные резервные копии | `/var/backups/branded` | Доступ только root; внешнее хранилище ещё требуется |

Службы приложения: `branded-php`, `branded-mariadb`, `branded-redis`, `branded-pm2`. Существующий MySQL на 3306 и Redis на 6379 остаются отдельными службами. phpMyAdmin переведён на PHP 8.5.12 через отдельную службу `branded-phpmyadmin`; прежний PHP 8.3.27 FPM остановлен. [Отчёт об обновлении и совместимости](RUNTIME-UPGRADE.md).

В PM2 до переноса `.output` работает техническая заглушка: обычные запросы получают 503, а `/__preparation/health` — 200. Это проверка процессов, а не развернутый магазин.

## Конфигурация приложения

`/etc/branded/nuxt.env.json` содержит runtime-переменные из актуального `.env.example`. PM2 читает их через `/etc/branded/ecosystem.config.cjs`; наличие `.env` рядом с production-сборкой не требуется. Аналитика пока отключена. Важные значения:

- `NUXT_WP_SITE_URL=http://127.0.0.1:8081`;
- `NUXT_PUBLIC_SITE_URL=https://branded.com.ua`;
- `NUXT_REDIS_URL` указывает на защищённый Redis на 6380, db1;
- BFF/revalidate-секреты совпадают с PHP-фрагментом.

`/etc/branded/wp-runtime.php` содержит DB/Redis/BFF/revalidate-константы. При переносе его нужно подключить в `wp-config.php` **перед определением этих констант**, удалив соответствующие дубли из переносимого файла. Старые WordPress salts, префикс таблиц и остальные параметры сохраняются.

```php
require '/etc/branded/wp-runtime.php';
```

`/etc/branded/wp-headless-stage-B.php.example` — отдельный фрагмент для последующего переключения админки на CMS-поддомен. Включать его при первичном переносе WordPress не нужно.

Пароли и ключи созданы на VPS. Они находятся в защищённых файлах `/etc/branded`; в чате и локальных исходниках их нет.

## Порядок переноса

1. Проверить размер боевых uploads и БД относительно свободного места VPS. При старте было примерно 14 ГиБ свободного места; сборка PHP и бинарные дистрибутивы используют часть этого пространства. Нужен запас для файлов, дампа и бэкапа.
2. Получить согласованный дамп боевой БД и архив WordPress. Загрузить их в `/srv/branded/incoming`, распаковать WordPress в `/srv/branded/wordpress`. Системные каталоги `/opt/branded` и `/etc/branded` не смешивать с архивом сайта.
3. Подключить `wp-runtime.php`, сохранив salts и `$table_prefix`. Проверить владельца файлов `branded:branded`, права каталогов 755 и файлов 644; `wp-config.php` — 640.
4. Импортировать дамп **в новую MariaDB**:

   ```sh
   /opt/branded/mariadb/bin/mariadb --no-defaults --socket=/run/branded-mariadb/mariadb.sock -uroot branded < /srv/branded/incoming/production.sql
   ```

5. Установить/активировать Redis Object Cache в перенесённом WordPress и включить object cache. Проверить API на внутреннем backend и факт использования постоянного кеша. Автономные PHP/Redis-проверки не заменяют эту проверку WordPress.
6. Выпустить/перенести TLS-сертификат для `branded.com.ua` и `www.branded.com.ua` в `/etc/branded/tls/branded/{fullchain.pem,privkey.pem}`. Проверить старый WordPress через локальный hosts, используя шаблон Stage A. DNS переключать только после проверки сайта, заказов, почты и бэкапов.
7. Собрать Nuxt на Linux/CI, используя Node 26.13.0 LTS либо совместимую актуальную версию. Передавать готовый каталог `.output`, включая `.output/public` и `.output/server`; `node_modules` локального Windows-проекта и `.env` не переносить в публичный каталог.
8. Загрузить сборку в `/srv/branded/incoming/<release>/.output`, затем выполнить:

   ```sh
   branded-deploy /srv/branded/incoming/<release> <release>
   ```

   Скрипт проверяет доступность API WordPress, создаёт новый релиз, переключает симлинк, выполняет PM2 reload и проверяет HTTP. При ошибке возвращает прежний симлинк. Откат отдельно: `branded-deploy --rollback`.

9. Поднять изолированный staging с копией БД, отключёнными реальными письмами/интеграциями и аналитикой; выполнить проверки из проектного ревью. Текущая production-БД не подходит для тестовых заказов.
10. Для Stage B: подготовить сертификат CMS, защиту админки `/etc/branded/admin.htpasswd`, применить WP-константы Stage B и `upload_url_path`, проверить WPML/Yoast, затем активировать шаблон Nginx Stage B. Он направляет uploads на диск, REST/sitemap в PHP, остальные запросы в Nuxt и перезаписывает `X-Forwarded-For` адресом реального соединения.

## Эксплуатация

```sh
branded-check
systemctl status branded-php branded-phpmyadmin branded-mariadb branded-redis branded-pm2
systemctl list-timers 'branded-*'
journalctl -u branded-check -n 30
tail -n 100 /var/log/branded/nuxt-error.log
```

- WordPress cron запускается каждые 5 минут; до появления `wp-cron.php` задача пропускается.
- Локальный бэкап назначен ежедневно на 03:30 Europe/Berlin с задержкой до 5 минут. До появления `wp-config.php` задача пропускается. Есть отдельная первоначальная копия пустой БД. Период хранения и внешнее хранилище нужно настроить до production-запуска; автоматического удаления старых копий этот комплект не выполняет.
- Проверка служб, PHP/БД/Redis, Node и заполнения диска выполняется каждые 5 минут. Результаты пока только в systemd journal: внешние уведомления не настроены.
- PHP установлен из официальных исходников с проверкой SHA-256, Node Branded и MariaDB — из официальных бинарных дистрибутивов с проверкой SHA-256. Установки под `/opt/branded` обновляются отдельно; системный Node обновляется из подписанной ветки NodeSource 26. `bootstrap.py` предназначен для первоначальной подготовки; после обновления поверх рабочего сервера его не запускать.

## Что остаётся перед публичным запуском

Перенос файлов/БД, Redis Object Cache в самом WordPress, TLS/DNS, staging и функциональные проверки, сверка URL/SEO, SMTP, внешние бэкапы с проверкой восстановления, внешние алерты и отдельная проверка SSH/firewall. Общий кеш двух настоящих Nitro-процессов и вебхук инвалидации проверяются после переноса проекта.

Текущий VPS: 1 vCPU и около 4 ГБ RAM. Лимиты настроены под этот объём; нагрузочная готовность магазина ещё не подтверждена. В проектном плане рекомендованы 4 vCPU/8 ГБ, минимум 2 vCPU/4 ГБ.
