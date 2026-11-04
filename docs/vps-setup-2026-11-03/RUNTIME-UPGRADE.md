# Обновление PHP и Node.js — 03.11.2026

Установлены и активированы [PHP 8.5.12](https://www.php.net/ChangeLog-8.php#8.5.12) и [Node.js 26.13.0 LTS](https://nodejs.org/en/blog/release/v26.13.0). PHP 8.5.12 содержит октябрьские исправления безопасности. Предыдущий PHP 8.3.36 Branded также содержит исправления этой серии; PHP 8.3.27 из старой установки aaPanel их не содержал.

Системный пакет `nodejs` обновлён с ветки 24 до `26.13.0-1nodesource1` из подписанного репозитория NodeSource. Branded использует отдельную сборку Node.js той же версии из официального архива. PHP собран из официальных исходников с проверкой SHA-256. OPcache в PHP 8.5 встроен; старый `zend_extension=opcache` в конфигурации этой версии не нужен.

Nuxt 4.6.4 из `package-lock.json` допускает Node >=26. Во временной Windows-копии проекта с Node 26.13.0 выполнены `npm ci`, `nuxt prepare`, 50 unit-тестов и `nuxt build`. Тестовая сборка не переносилась на VPS.

## Что проверено на VPS

- PHP CLI и FPM Branded используют 8.5.12; HTTP-проверка подтвердила OPcache, соединение с MariaDB и чтение/запись Redis в db0/db1.
- phpMyAdmin обслуживается отдельной службой `branded-phpmyadmin` на PHP 8.5.12. Nginx передаёт запросы в `/run/branded-phpmyadmin/php-fpm.sock`; страница входа возвращает HTTP 200. Вход с учётными данными БД не выполнялся.
- Прежняя служба PHP 8.3.27 остановлена и исключена из автозапуска. Действующих процессов старого FPM нет.
- `/usr/bin/node` и Node Branded возвращают 26.13.0; два процесса PM2 в cluster mode активны, их исполняемый файл соответствует новой версии.
- Конфигурация Nginx проверена, пять служб Branded активны и включены в автозапуск. Боевые файлы WordPress и Nuxt ещё не перенесены.

## WordPress перед переносом

Локальная копия `C:\OSPanel\home\branded.loc` использует WordPress 6.8.3. [Таблица совместимости WordPress](https://make.wordpress.org/core/handbook/references/php-compatibility-and-wordpress-versions/) указывает поддержку PHP 8.5 начиная с WordPress 6.9. Перед переносом этой копии обновите ядро до поддерживаемой ветки и проверьте WooCommerce, WPML, тему и остальные плагины на staging. Если обновление приложения нужно отложить, для Branded сохранён PHP 8.3.36 с исправлениями безопасности.

## Пути и резервные версии

- Версионные каталоги: `/opt/branded/php-8.5.12` и `/opt/branded/node-26.13.0`.
- Стабильные пути служб: `/opt/branded/php` и `/opt/branded/node`.
- Резервные версии Branded: `/opt/branded/php-8.3.36` и `/opt/branded/node-22.23.4`.
- Копии прежней конфигурации PHP, Nginx и репозитория NodeSource: `/root/branded-upgrade-20261103`.
- Сценарий обновления: `upgrade-latest.py`. `bootstrap.py` относится к первоначальной установке и не предназначен для запуска поверх обновлённого сервера.
