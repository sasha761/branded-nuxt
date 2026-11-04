#!/usr/bin/env python3
"""Isolated Branded stack. Run as root on the VPS; secrets stay on that VPS."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import tarfile
import time
import urllib.request

ROOT = Path('/opt/branded')
BUILD = ROOT / 'build'
CONF = Path('/etc/branded')
APP = Path('/srv/branded')
LOG = Path('/var/log/branded')
STATUS = Path('/root/branded-setup.status')

def phase(message):
    STATUS.write_text(message + '\n')
    print(time.strftime('%H:%M:%S'), message, flush=True)

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def capture(args):
    return subprocess.check_output(args, text=True).strip()

def write(path, content, mode=0o644):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + '\n')
    path.chmod(mode)

def download(url, dest, sha256=None):
    dest = Path(dest)
    if not dest.exists():
        with urllib.request.urlopen(url, timeout=90) as source, dest.open('wb') as target:
            shutil.copyfileobj(source, target)
    if sha256 and hashlib.sha256(dest.read_bytes()).hexdigest() != sha256:
        raise RuntimeError('Checksum mismatch: ' + dest.name)
    return dest

def extract(archive, destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    run(['tar', '-xf', str(archive), '-C', str(destination), '--strip-components=1'])

def service(name, content):
    write('/etc/systemd/system/' + name + '.service', content)

def main():
    if os.geteuid() != 0:
        raise RuntimeError('Run as root')
    os.umask(0o027)
    for path in [ROOT, BUILD, APP, LOG, CONF, CONF/'php.d', CONF/'nginx', APP/'wordpress', APP/'nuxt/releases']:
        path.mkdir(parents=True, exist_ok=True)
    ROOT.chmod(0o755)
    (CONF/'php.d').chmod(0o755)
    for name in ['branded', 'branded-db']:
        if subprocess.run(['id', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
            run(['useradd', '--system', '--home-dir', str(APP if name == 'branded' else APP/'mariadb'), '--shell', '/usr/sbin/nologin', name])
    run(['chown', 'root:branded', str(CONF)])
    CONF.chmod(0o750)
    APP.chmod(0o755)
    for path in [LOG, APP/'wordpress', APP/'nuxt', APP/'nuxt/releases']:
        run(['chown', 'branded:branded', str(path)])
        path.chmod(0o755)
    phase('Installing build dependencies from existing Ubuntu repositories')
    env = dict(os.environ, DEBIAN_FRONTEND='noninteractive', NEEDRESTART_MODE='l')
    run(['apt-get', 'update'], env=env)
    run(['apt-get', 'install', '-y', '--no-install-recommends', 'build-essential', 'autoconf', 'pkg-config', 'ca-certificates', 'curl', 'xz-utils', 'rsync', 'libaio1', 'libncurses5', 'libssl-dev', 'libxml2-dev', 'libcurl4-openssl-dev', 'libonig-dev', 'libzip-dev', 'libicu-dev', 'libpng-dev', 'libjpeg-dev', 'libwebp-dev', 'libfreetype6-dev', 'libsodium-dev', 'libsqlite3-dev'], env=env)
    phase('Installing verified official Node.js 22 binary')
    node_sums = urllib.request.urlopen('https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt', timeout=60).read().decode()
    digest, filename = next(line.split() for line in node_sums.splitlines() if line.endswith('-linux-x64.tar.xz'))
    node_tar = download('https://nodejs.org/dist/latest-v22.x/' + filename, BUILD/filename, digest)
    if not (ROOT/'node/bin/node').exists():
        extract(node_tar, ROOT/'node')
    node_env = dict(os.environ, PATH=str(ROOT/'node/bin') + ':' + os.environ['PATH'])
    run([str(ROOT/'node/bin/npm'), 'install', '--global', 'pm2@latest', '--no-audit', '--no-fund'], env=node_env)
    phase('Installing verified official MariaDB 10.11.19 binary')
    maria_base = 'https://archive.mariadb.org/mariadb-10.11.19/bintar-linux-systemd-x86_64/'
    maria_file = 'mariadb-10.11.19-linux-systemd-x86_64.tar.gz'
    sums = urllib.request.urlopen(maria_base + 'sha256sums.txt', timeout=60).read().decode()
    maria_sha = next(line.split()[0] for line in sums.splitlines() if line.split()[-1].lstrip('*') == maria_file)
    archive = download(maria_base + maria_file, BUILD/maria_file, maria_sha)
    if not (ROOT/'mariadb/bin/mariadbd').exists():
        extract(archive, ROOT/'mariadb')
    run(['chmod', '-R', 'a+rX', str(ROOT/'mariadb')])
    dbdir = APP/'mariadb'
    dbdir.mkdir(exist_ok=True)
    run(['chown', '-R', 'branded-db:branded-db', str(dbdir)])
    write(CONF/'mariadb.cnf', '''
[client]
socket=/run/branded-mariadb/mariadb.sock
port=3307
[mariadbd]
basedir=/opt/branded/mariadb
datadir=/srv/branded/mariadb
socket=/run/branded-mariadb/mariadb.sock
pid-file=/run/branded-mariadb/mariadb.pid
port=3307
bind-address=127.0.0.1
skip-name-resolve
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
innodb-buffer-pool-size=256M
innodb-log-file-size=64M
max-connections=30
performance-schema=OFF
local-infile=0
symbolic-links=0
log-error=/srv/branded/mariadb/error.log
''')
    if not (dbdir/'mysql').exists():
        run([str(ROOT/'mariadb/scripts/mariadb-install-db'), '--defaults-file='+str(CONF/'mariadb.cnf'), '--basedir='+str(ROOT/'mariadb'), '--datadir='+str(dbdir), '--user=branded-db', '--auth-root-authentication-method=socket', '--skip-test-db'])
    service('branded-mariadb', '''
[Unit]
Description=Branded MariaDB 10.11 (isolated from aaPanel MySQL)
After=network.target
[Service]
Type=simple
User=branded-db
Group=branded-db
RuntimeDirectory=branded-mariadb
RuntimeDirectoryMode=0755
ExecStart=/opt/branded/mariadb/bin/mariadbd --defaults-file=/etc/branded/mariadb.cnf
Restart=on-failure
RestartSec=5
TimeoutStopSec=120
LimitNOFILE=16364
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/srv/branded/mariadb /run/branded-mariadb
[Install]
WantedBy=multi-user.target
''')
    # The database process does not need access to application secrets.
    run(['chmod', 'o+x', str(CONF)])
    secret_file = CONF/'secrets.json'
    if secret_file.exists():
        values = json.loads(secret_file.read_text())
    else:
        values = {key: secrets.token_hex(32) for key in ['database_password', 'redis_password', 'bff_secret', 'revalidate_secret']}
        write(secret_file, json.dumps(values, indent=2), 0o600)
    phase('Starting isolated MariaDB and creating the empty Branded database')
    run(['systemctl', 'daemon-reload'])
    run(['systemctl', 'enable', '--now', 'branded-mariadb'])
    for _ in range(60):
        if Path('/run/branded-mariadb/mariadb.sock').exists():
            break
        time.sleep(1)
    maria = [str(ROOT/'mariadb/bin/mariadb'), '--no-defaults', '--socket=/run/branded-mariadb/mariadb.sock', '-uroot']
    sql = "CREATE DATABASE IF NOT EXISTS branded CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'branded'@'127.0.0.1' IDENTIFIED BY '" + values['database_password'] + "'; GRANT ALL PRIVILEGES ON branded.* TO 'branded'@'127.0.0.1';"
    run(maria, input=sql, text=True)
    phase('Starting isolated Redis 7 on loopback port 6380 (WP db0 / Nitro db1)')
    redisdir = APP/'redis'
    redisdir.mkdir(exist_ok=True)
    run(['chown', 'branded:branded', str(redisdir)])
    redisbin = ROOT/'redis/bin'
    redisbin.mkdir(parents=True, exist_ok=True)
    (ROOT/'redis').chmod(0o755)
    redisbin.chmod(0o755)
    for binary in ['redis-server', 'redis-cli']:
        run(['install', '-m', '755', '/www/server/redis/src/'+binary, str(redisbin/binary)])
    write(CONF/'redis.conf', '''
bind 127.0.0.1
port 6380
protected-mode yes
daemonize no
supervised no
databases 16
maxmemory 192mb
maxmemory-policy allkeys-lru
save ""
appendonly no
dir /srv/branded/redis
logfile ""
requirepass '''+values['redis_password'], 0o640)
    run(['chown', 'root:branded', str(CONF/'redis.conf')])
    service('branded-redis', '''
[Unit]
Description=Branded Redis 7 cache (db0 WP, db1 Nitro)
After=network.target
[Service]
Type=simple
User=branded
Group=branded
ExecStart=/opt/branded/redis/bin/redis-server /etc/branded/redis.conf
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/srv/branded/redis
[Install]
WantedBy=multi-user.target
''')
    run(['systemctl', 'daemon-reload'])
    run(['systemctl', 'enable', '--now', 'branded-redis'])
    phase('Building current official PHP 8.3 with FPM and OPcache (one CPU)')
    php_meta = json.load(urllib.request.urlopen('https://www.php.net/releases/index.php?json&version=8.3', timeout=60))
    php_source = next(item for item in php_meta['source'] if item['filename'].endswith('.tar.xz'))
    php_archive = download('https://www.php.net/distributions/' + php_source['filename'], BUILD/php_source['filename'], php_source['sha256'])
    source = BUILD/('php-' + php_meta['version'])
    if not (ROOT/'php/bin/php').exists():
        if not (source/'configure').exists():
            extract(php_archive, source)
        configure = ['./configure', '--prefix=/opt/branded/php', '--with-config-file-path=/etc/branded', '--with-config-file-scan-dir=/etc/branded/php.d', '--enable-fpm', '--with-fpm-user=branded', '--with-fpm-group=branded', '--enable-opcache', '--with-openssl', '--with-curl', '--with-zlib', '--enable-mbstring', '--enable-intl', '--with-mysqli=mysqlnd', '--with-pdo-mysql=mysqlnd', '--with-zip', '--enable-gd', '--with-jpeg', '--with-webp', '--with-freetype', '--enable-bcmath', '--enable-exif', '--enable-soap', '--enable-sockets', '--enable-pcntl', '--with-sodium', '--without-pear']
        run(configure, cwd=source)
        run(['make', '-j1'], cwd=source)
        run(['make', 'install'], cwd=source)
    phase('Building PhpRedis from the official PECL registry')
    ext = capture([str(ROOT/'php/bin/php-config'), '--extension-dir'])
    if not Path(ext, 'redis.so').exists():
        redis_version = urllib.request.urlopen('https://pecl.php.net/rest/r/redis/latest.txt', timeout=60).read().decode().strip()
        if not re.fullmatch(r'\d+\.\d+\.\d+', redis_version):
            raise RuntimeError('Unexpected PECL redis version')
        ext_archive = download('https://pecl.php.net/get/redis-' + redis_version + '.tgz', BUILD/('redis-' + redis_version + '.tgz'))
        ext_source = BUILD/('phpredis-' + redis_version)
        extract(ext_archive, ext_source)
        run([str(ROOT/'php/bin/phpize')], cwd=ext_source)
        run(['./configure', '--with-php-config=/opt/branded/php/bin/php-config'], cwd=ext_source)
        run(['make', '-j1'], cwd=ext_source)
        run(['make', 'install'], cwd=ext_source)
    write(CONF/'php.ini', '''
[PHP]
expose_php=Off
memory_limit=256M
max_execution_time=120
max_input_vars=5000
post_max_size=64M
upload_max_filesize=64M
date.timezone=Europe/Kyiv
display_errors=Off
log_errors=On
error_log=/var/log/branded/php-error.log
realpath_cache_size=4096K
realpath_cache_ttl=600
session.cookie_httponly=1
session.cookie_samesite=Lax
session.use_strict_mode=1
[opcache]
zend_extension=opcache
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=128
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=30000
opcache.validate_timestamps=1
opcache.revalidate_freq=2
opcache.jit=0
''')
    write(CONF/'php.d/20-redis.ini', 'extension=redis')
    write(CONF/'php-fpm.conf', '''
[global]
pid=/run/branded-php/php-fpm.pid
error_log=/var/log/branded/php-fpm.log
daemonize=no
[branded]
user=branded
group=branded
listen=/run/branded-php/php-fpm.sock
listen.owner=www
listen.group=www
listen.mode=0660
pm=ondemand
pm.max_children=3
pm.process_idle_timeout=20s
pm.max_requests=500
request_terminate_timeout=120s
catch_workers_output=yes
clear_env=yes
security.limit_extensions=.php
php_admin_value[open_basedir]=/srv/branded:/etc/branded:/tmp:/usr/share/zoneinfo
''')
    service('branded-php', '''
[Unit]
Description=Branded PHP 8.3 FPM with OPcache
After=network.target branded-mariadb.service branded-redis.service
[Service]
Type=simple
RuntimeDirectory=branded-php
RuntimeDirectoryMode=0755
ExecStart=/opt/branded/php/sbin/php-fpm -y /etc/branded/php-fpm.conf
ExecReload=/bin/kill -USR2 $MAINPID
Restart=on-failure
RestartSec=3
PrivateTmp=true
NoNewPrivileges=true
ProtectHome=true
[Install]
WantedBy=multi-user.target
''')
    runtime = {
        'NODE_ENV': 'production', 'NITRO_HOST': '127.0.0.1', 'NITRO_PORT': '3000',
        'NUXT_WP_SITE_URL': 'http://127.0.0.1:8081', 'NUXT_WP_TIMEOUT': '8000',
        'NUXT_PUBLIC_SITE_URL': 'https://branded.com.ua',
        'NUXT_REDIS_URL': 'redis://:' + values['redis_password'] + '@127.0.0.1:6380/1',
        'NUXT_BFF_SECRET': values['bff_secret'], 'NUXT_REVALIDATE_SECRET': values['revalidate_secret'],
        'NUXT_PUBLIC_GTM_ID': '', 'NUXT_PUBLIC_FB_PIXEL_ID': ''
    }
    write(CONF/'nuxt.env.json', json.dumps(runtime, indent=2), 0o640)
    run(['chown', 'root:branded', str(CONF/'nuxt.env.json')])
    write(CONF/'ecosystem.config.cjs', '''
const env = require('/etc/branded/nuxt.env.json');
module.exports = { apps: [{
  name: 'branded-nuxt', cwd: '/srv/branded/nuxt/current',
  script: '.output/server/index.mjs', interpreter: '/opt/branded/node/bin/node',
  instances: 2, exec_mode: 'cluster', autorestart: true,
  node_args: '--max-old-space-size=256', max_memory_restart: '384M',
  kill_timeout: 10000, listen_timeout: 10000, merge_logs: true, time: true,
  out_file: '/var/log/branded/nuxt-out.log', error_file: '/var/log/branded/nuxt-error.log',
  env_production: env
}]};
''')
    preparation = APP/'nuxt/releases/preparation/.output/server'
    preparation.mkdir(parents=True, exist_ok=True)
    write(preparation/'index.mjs', '''
import http from 'node:http';
http.createServer((req, res) => {
  const health = req.url === '/__preparation/health';
  res.writeHead(health ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  res.end(JSON.stringify({ state: 'awaiting-project-files', pid: process.pid }));
}).listen(Number(process.env.NITRO_PORT || 3000), '127.0.0.1');
''')
    run(['chown', '-R', 'branded:branded', str(APP/'nuxt/releases/preparation')])
    current = APP/'nuxt/current'
    if not current.exists():
        current.symlink_to('releases/preparation')
    pmhome = APP/'.pm2'
    pmhome.mkdir(exist_ok=True)
    run(['chown', 'branded:branded', str(pmhome)])
    service('branded-pm2', '''
[Unit]
Description=Branded Nuxt PM2 cluster (two workers)
After=network.target branded-redis.service
[Service]
Type=simple
User=branded
Group=branded
WorkingDirectory=/srv/branded/nuxt
Environment=PM2_HOME=/srv/branded/.pm2
Environment=PATH=/opt/branded/node/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/branded/node/bin/node /opt/branded/node/lib/node_modules/pm2/bin/pm2-runtime start /etc/branded/ecosystem.config.cjs --env production
Restart=always
RestartSec=5
TimeoutStopSec=30
KillMode=mixed
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
[Install]
WantedBy=multi-user.target
''')
    wp = {
        'DB_NAME': 'branded', 'DB_USER': 'branded', 'DB_PASSWORD': values['database_password'], 'DB_HOST': '127.0.0.1:3307',
        'DB_CHARSET': 'utf8mb4', 'DB_COLLATE': '', 'WP_REDIS_HOST': '127.0.0.1', 'WP_REDIS_PORT': 6380,
        'WP_REDIS_PASSWORD': values['redis_password'], 'WP_REDIS_DATABASE': 0, 'WP_CACHE_KEY_SALT': 'branded:',
        'BRANDED_BFF_SECRET': values['bff_secret'], 'BRANDED_REVALIDATE_SECRET': values['revalidate_secret'],
        'BRANDED_REVALIDATE_URL': 'http://127.0.0.1:3000/api/_revalidate',
        'DISALLOW_FILE_EDIT': True, 'DISABLE_WP_CRON': True
    }
    def php_literal(value):
        return ('true' if value else 'false') if isinstance(value, bool) else str(value) if isinstance(value, int) else "'" + value.replace("'", "\\'") + "'"
    write(CONF/'wp-runtime.php', '<?php\n// Include BEFORE matching constants in wp-config.php. No duplicate definitions.\n' + '\n'.join('define('+php_literal(k)+', '+php_literal(v)+');' for k,v in wp.items()), 0o640)
    run(['chown', 'root:branded', str(CONF/'wp-runtime.php')])
    write(CONF/'wp-headless-stage-B.php.example', '''
<?php
// Activate only during the later headless cutover, after staging verification.
define('WP_HOME', 'https://branded.com.ua');
define('WP_SITEURL', 'https://cms.branded.com.ua');
define('BRANDED_FRONTEND_URL', '');
// Also set upload_url_path to https://branded.com.ua/wp-content/uploads in WP options.
''')
    phase('Writing loopback Nginx backend and private integration health check')
    health = APP/'health'
    health.mkdir(exist_ok=True)
    health.chmod(0o755)
    write(health/'check.php', '''
<?php
require '/etc/branded/wp-runtime.php';
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=branded;charset=utf8mb4', DB_USER, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$r = new Redis(); $r->connect(WP_REDIS_HOST, WP_REDIS_PORT, 2); $r->auth(WP_REDIS_PASSWORD);
$redis = [];
foreach ([0, 1] as $db) {
  $r->select($db); $key = 'branded:setup:'.bin2hex(random_bytes(8));
  $r->setex($key, 30, 'ok'); $redis[$db] = $r->get($key) === 'ok'; $r->del($key);
}
header('Content-Type: application/json'); header('Cache-Control: no-store');
echo json_encode(['php' => PHP_VERSION, 'opcache' => (bool)opcache_get_status(false), 'mariadb' => $pdo->query('SELECT VERSION()')->fetchColumn(), 'redis_db0_db1' => $redis]);
''')
    write(CONF/'nginx/internal.conf', r'''
server {
    listen 127.0.0.1:8081;
    server_name cms.branded.com.ua;
    root /srv/branded/wordpress;
    index index.php;
    access_log /var/log/branded/wp-internal-access.log;
    error_log /var/log/branded/wp-internal-error.log;
    client_max_body_size 64m;
    add_header X-Robots-Tag "noindex, nofollow" always;
    location = /__branded/health {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /srv/branded/health/check.php;
        fastcgi_pass unix:/run/branded-php/php-fpm.sock;
    }
    location ~ /\. { deny all; }
    location = /xmlrpc.php { return 403; }
    location ~* ^/wp-content/.*\.php(?:/|$) { return 403; }
    location / {
        if (!-f $document_root/index.php) { return 503; }
        try_files $uri $uri/ /index.php?$args;
    }
    location ~ \.php$ {
        try_files $uri =404;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_HOST cms.branded.com.ua;
        fastcgi_param SERVER_NAME cms.branded.com.ua;
        fastcgi_param HTTPS on;
        fastcgi_param SERVER_PORT 443;
        fastcgi_read_timeout 120s;
        fastcgi_pass unix:/run/branded-php/php-fpm.sock;
    }
}
''')
    # Activate a new loopback-only vhost; preserve all existing aaPanel vhosts.
    vhost = Path('/www/server/panel/vhost/nginx/zz-branded-internal.conf')
    if vhost.exists() and vhost.read_text().strip() != 'include /etc/branded/nginx/internal.conf;':
        raise RuntimeError('Unexpected existing Branded vhost; refusing overwrite')
    write(vhost, 'include /etc/branded/nginx/internal.conf;')
    # Nginx master needs only public config traversal; runtime secrets remain mode 640/600.
    CONF.chmod(0o751)
    for directory in [ROOT, ROOT/'node', ROOT/'php', ROOT/'mariadb', CONF/'nginx']:
        directory.chmod(0o755)
    run(['chmod', '-R', 'a+rX', str(ROOT/'node'), str(ROOT/'php'), str(ROOT/'mariadb')])
    run([str(ROOT/'php/sbin/php-fpm'), '-t', '-y', str(CONF/'php-fpm.conf')])
    run(['/www/server/nginx/sbin/nginx', '-t'])
    run(['systemctl', 'daemon-reload'])
    run(['systemctl', 'enable', '--now', 'branded-php', 'branded-pm2'])
    run(['/www/server/nginx/sbin/nginx', '-s', 'reload'])
    write('/etc/logrotate.d/branded', '''
/var/log/branded/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su root root
}
''')
    phase('CORE READY: running integration checks')
    report = {
        'node': capture([str(ROOT/'node/bin/node'), '--version']),
        'php': capture([str(ROOT/'php/bin/php'), '-r', 'echo PHP_VERSION;']),
        'services': {name: capture(['systemctl', 'is-active', name]) for name in ['branded-mariadb', 'branded-redis', 'branded-php', 'branded-pm2']},
        'php_integration': json.loads(capture(['curl', '--fail', '--silent', '--retry', '15', '--retry-delay', '1', '--retry-all-errors', 'http://127.0.0.1:8081/__branded/health'])),
        'nuxt_preparation': json.loads(capture(['curl', '--fail', '--silent', '--retry', '15', '--retry-delay', '1', '--retry-all-errors', 'http://127.0.0.1:3000/__preparation/health'])),
    }
    write('/root/branded-setup-report.json', json.dumps(report, indent=2), 0o600)
    phase('CORE COMPLETE - project files not transferred; public domains not changed')
    print(json.dumps(report, indent=2), flush=True)

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        phase('FAILED: ' + str(exc))
        raise
