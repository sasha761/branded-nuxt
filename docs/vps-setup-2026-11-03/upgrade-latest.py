#!/usr/bin/env python3
"""Upgrade active Branded PHP/Node; preserve previous versions and configuration."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.request

ROOT = Path('/opt/branded')
CONF = Path('/etc/branded')
BUILD = ROOT/'build'
BACKUP = Path('/root/branded-upgrade-20261103')
STATUS = Path('/root/branded-upgrade.status')

def phase(message):
    STATUS.write_text(message+'\n')
    print(time.strftime('%H:%M:%S'), message, flush=True)

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def out(args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs).strip()

def download(url, destination, digest=None):
    if not destination.exists():
        with urllib.request.urlopen(url, timeout=90) as source, destination.open('wb') as target:
            shutil.copyfileobj(source, target)
    if digest and hashlib.sha256(destination.read_bytes()).hexdigest() != digest:
        raise RuntimeError('Checksum mismatch: '+destination.name)
    return destination

def extract(archive, target):
    target.mkdir(parents=True, exist_ok=True)
    run(['tar', '-xf', str(archive), '-C', str(target), '--strip-components=1'])

def readable(directory):
    run(['chmod', '-R', 'a+rX', str(directory)])

def switch(link, target):
    temporary = link.with_name(link.name+'.upgrade-next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(link)

def phpmyadmin_health(attempts=1):
    entries = list(Path('/www/server/phpmyadmin').glob('*/index.php'))
    assert len(entries) == 1, 'Expected one phpMyAdmin installation'
    url = 'http://127.0.0.1:888/'+entries[0].parent.name+'/index.php'
    request = urllib.request.Request(url, headers={'Host': 'phpmyadmin'})
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                body = response.read(2*1024*1024).lower()
                assert response.status == 200 and b'pma_username' in body and b'fatal error' not in body
                return response.status
        except Exception:
            if attempt+1 == attempts:
                raise
            time.sleep(1)

def set_default(link, target):
    if link.exists() or link.is_symlink():
        backup = BACKUP/(str(link).lstrip('/').replace('/', '_')+'.before')
        if not backup.exists() and not backup.is_symlink():
            shutil.copy2(link, backup, follow_symlinks=False)
    switch(link, target)

def health():
    for _ in range(30):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8081/__branded/health', timeout=5) as response:
                value = json.load(response)
            with urllib.request.urlopen('http://127.0.0.1:3000/__preparation/health', timeout=5) as response:
                node = json.load(response)
            assert value['opcache'] and all(value['redis_db0_db1'])
            assert value['php'] == '8.5.12'
            return value, node
        except Exception:
            time.sleep(1)
    raise RuntimeError('New runtime health check failed')

def main():
    if os.geteuid() != 0:
        raise RuntimeError('Run as root')
    os.umask(0o027)
    BACKUP.mkdir(exist_ok=True, mode=0o700)
    BUILD.mkdir(exist_ok=True)
    assert not Path('/srv/branded/wordpress/wp-config.php').exists(), 'Migration happened: inspect application before upgrading'
    old_configuration = [CONF/'php.ini', CONF/'php-fpm.conf', Path('/www/server/nginx/conf/enable-php.conf')]
    for path in old_configuration:
        target = BACKUP/(path.name+'.before')
        if not target.exists():
            shutil.copy2(path, target)
    phase('Installing required library for official Node 26 binaries')
    env = dict(os.environ, DEBIAN_FRONTEND='noninteractive', NEEDRESTART_MODE='l')
    run(['apt-get', 'install', '-y', '--no-install-recommends', 'libatomic1'], env=env)
    phase('Downloading and verifying official Node.js 26.13.0 LTS')
    node_version = '26.13.0'
    node_target = ROOT/('node-'+node_version)
    node_file = 'node-v'+node_version+'-linux-x64.tar.xz'
    sums = urllib.request.urlopen('https://nodejs.org/dist/v'+node_version+'/SHASUMS256.txt', timeout=60).read().decode()
    digest = next(line.split()[0] for line in sums.splitlines() if line.split()[-1] == node_file)
    archive = download('https://nodejs.org/dist/v'+node_version+'/'+node_file, BUILD/node_file, digest)
    if not (node_target/'bin/node').exists():
        extract(archive, node_target)
    readable(node_target)
    assert out([str(node_target/'bin/node'), '--version']) == 'v26.13.0'
    node_env = dict(os.environ, PATH=str(node_target/'bin')+':'+os.environ['PATH'])
    pm2_manifest = node_target/'lib/node_modules/pm2/package.json'
    if not pm2_manifest.exists() or json.loads(pm2_manifest.read_text())['version'] != '7.1.2':
        run([str(node_target/'bin/npm'), 'install', '--global', 'pm2@7.1.2', '--no-audit', '--no-fund'], env=node_env)
    phase('Downloading and verifying official PHP 8.5.12 security release')
    metadata = json.load(urllib.request.urlopen('https://www.php.net/releases/index.php?json&version=8.5', timeout=60))
    assert metadata['version'] == '8.5.12', 'Official latest PHP changed: recheck release'
    package = next(item for item in metadata['source'] if item['filename'].endswith('.tar.xz'))
    archive = download('https://www.php.net/distributions/'+package['filename'], BUILD/package['filename'], package['sha256'])
    source = BUILD/'php-8.5.12'
    php_target = ROOT/'php-8.5.12'
    if not (php_target/'bin/php').exists():
        if not (source/'configure').exists():
            extract(archive, source)
        phase('Compiling PHP 8.5.12 FPM with built-in OPcache (one CPU)')
        configure = ['./configure', '--prefix='+str(php_target), '--with-config-file-path=/etc/branded', '--with-config-file-scan-dir=/etc/branded/php.d', '--enable-fpm', '--with-fpm-user=branded', '--with-fpm-group=branded', '--disable-opcache-jit', '--with-openssl', '--with-curl', '--with-zlib', '--enable-mbstring', '--enable-intl', '--with-mysqli=mysqlnd', '--with-pdo-mysql=mysqlnd', '--with-zip', '--enable-gd', '--with-jpeg', '--with-webp', '--with-freetype', '--enable-bcmath', '--enable-exif', '--enable-soap', '--enable-sockets', '--enable-pcntl', '--with-sodium', '--without-pear']
        run(configure, cwd=source, env=dict(os.environ, CFLAGS='-O2 -g0', CXXFLAGS='-O2 -g0'))
        run(['make', '-j1'], cwd=source)
        run(['make', 'install'], cwd=source)
    phase('Compiling PhpRedis for PHP 8.5 ABI')
    extension_dir = Path(out([str(php_target/'bin/php-config'), '--extension-dir']))
    if not (extension_dir/'redis.so').exists():
        version = urllib.request.urlopen('https://pecl.php.net/rest/r/redis/latest.txt', timeout=60).read().decode().strip()
        assert re.fullmatch(r'\d+\.\d+\.\d+', version)
        archive = download('https://pecl.php.net/get/redis-'+version+'.tgz', BUILD/('redis-'+version+'.tgz'))
        redis_source = BUILD/('phpredis-php85-'+version)
        extract(archive, redis_source)
        run([str(php_target/'bin/phpize')], cwd=redis_source)
        run(['./configure', '--with-php-config='+str(php_target/'bin/php-config')], cwd=redis_source)
        run(['make', '-j1'], cwd=redis_source)
        run(['make', 'install'], cwd=redis_source)
    readable(php_target)
    # PHP 8.5 embeds OPcache. Loading the old shared extension is invalid.
    ini = (CONF/'php.ini').read_text()
    ini = re.sub(r'(?m)^\s*zend_extension\s*=\s*[^\n]*opcache[^\n]*\n?', '', ini)
    candidate_ini = BACKUP/'php85.ini'
    candidate_ini.write_text(ini)
    required = ['mysqli', 'pdo_mysql', 'curl', 'mbstring', 'intl', 'gd', 'zip', 'redis', 'Zend OPcache']
    modules = out([str(php_target/'bin/php'), '-c', str(candidate_ini), '-m'])
    assert all(name in modules for name in required), 'Missing required PHP module'
    assert out([str(php_target/'bin/php'), '-n', '-r', 'echo PHP_VERSION;']) == '8.5.12'
    if os.environ.get('BRANDED_BUILD_ONLY') == '1':
        run([str(php_target/'sbin/php-fpm'), '-c', str(candidate_ini), '-y', str(CONF/'php-fpm.conf'), '-t'])
        phase('BUILD COMPLETE: PHP 8.5.12 and Node 26.13.0 staged; active services unchanged')
        return
    assert phpmyadmin_health() == 200
    assert Path('/tmp/mysql.sock').is_socket()
    pool = '''[global]
pid=/run/branded-phpmyadmin/php-fpm.pid
error_log=/www/wwwlogs/phpmyadmin-fpm.log
daemonize=no
[phpmyadmin]
user=www
group=www
listen=/run/branded-phpmyadmin/php-fpm.sock
listen.owner=www
listen.group=www
listen.mode=0660
pm=ondemand
pm.max_children=1
pm.process_idle_timeout=20s
pm.max_requests=300
request_terminate_timeout=120s
clear_env=yes
security.limit_extensions=.php
php_admin_value[open_basedir]=/www/server/phpmyadmin:/tmp:/usr/share/zoneinfo:/etc/ssl/certs
php_admin_value[error_log]=/www/wwwlogs/phpmyadmin-php-error.log
php_admin_value[mysqli.default_socket]=/tmp/mysql.sock
php_admin_value[pdo_mysql.default_socket]=/tmp/mysql.sock
'''
    candidate_pool = CONF/'phpmyadmin-fpm.conf'
    candidate_pool.write_text(pool)
    candidate_pool.chmod(0o644)
    panel_ini = CONF/'phpmyadmin.ini'
    panel_ini.write_text(ini.replace('opcache.memory_consumption=128', 'opcache.memory_consumption=64'))
    panel_ini.chmod(0o644)
    run([str(php_target/'sbin/php-fpm'), '-c', str(candidate_ini), '-y', str(CONF/'php-fpm.conf'), '-t'])
    run([str(php_target/'sbin/php-fpm'), '-c', str(panel_ini), '-y', str(candidate_pool), '-t'])
    pma_unit = Path('/etc/systemd/system/branded-phpmyadmin.service')
    pma_unit.write_text('''[Unit]
Description=PHP 8.5 FPM for aaPanel phpMyAdmin
After=network.target mysqld.service
[Service]
Type=simple
RuntimeDirectory=branded-phpmyadmin
RuntimeDirectoryMode=0755
ExecStart='''+str(php_target/'sbin/php-fpm')+''' -c /etc/branded/phpmyadmin.ini -y /etc/branded/phpmyadmin-fpm.conf
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectHome=true
# The existing aaPanel MySQL connection uses /tmp/mysql.sock.
PrivateTmp=false
[Install]
WantedBy=multi-user.target
''')
    pma_unit.chmod(0o644)
    run(['systemd-analyze', 'verify', str(pma_unit)])
    phase('Switching Branded PHP/Node and phpMyAdmin to new runtimes')
    php_link, node_link = ROOT/'php', ROOT/'node'
    old_php, old_node = ROOT/'php-8.3.36', ROOT/'node-22.23.4'
    if not php_link.is_symlink():
        assert not old_php.exists()
        php_link.rename(old_php)
        php_link.symlink_to(old_php)
    else:
        old_php = php_link.resolve()
    if not node_link.is_symlink():
        assert not old_node.exists()
        node_link.rename(old_node)
        node_link.symlink_to(old_node)
    else:
        old_node = node_link.resolve()
    nginx = Path('/www/server/nginx/conf/enable-php.conf')
    nginx_before = nginx.read_text()
    assert nginx_before.count('unix:/tmp/php-cgi-83.sock') == 1, 'Unexpected phpMyAdmin handler; inspect before changing'
    legacy_stopped = False
    try:
        (CONF/'php.ini').write_text(ini)
        switch(php_link, php_target)
        switch(node_link, node_target)
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'restart', 'branded-php', 'branded-pm2'])
        value, node = health()
        pm2_env = dict(os.environ, PATH='/opt/branded/node/bin:/usr/local/bin:/usr/bin:/bin', PM2_HOME='/srv/branded/.pm2')
        processes = json.loads(out(['/usr/sbin/runuser', '-u', 'branded', '--', '/opt/branded/node/bin/pm2', 'jlist'], env=pm2_env))
        workers = [item for item in processes if item['name'] == 'branded-nuxt']
        assert len(workers) == 2 and all(item['pm2_env']['status'] == 'online' for item in workers)
        assert all(Path('/proc', str(item['pid']), 'exe').resolve() == node_target/'bin/node' for item in workers)
        run(['systemctl', 'enable', '--now', 'branded-phpmyadmin'])
        for _ in range(20):
            if Path('/run/branded-phpmyadmin/php-fpm.sock').is_socket():
                break
            time.sleep(1)
        assert Path('/run/branded-phpmyadmin/php-fpm.sock').is_socket()
        nginx.write_text(nginx_before.replace('unix:/tmp/php-cgi-83.sock', 'unix:/run/branded-phpmyadmin/php-fpm.sock'))
        run(['/www/server/nginx/sbin/nginx', '-t'])
        effective = out(['/www/server/nginx/sbin/nginx', '-T'], stderr=subprocess.DEVNULL)
        assert not re.search(r'(?m)^\s*fastcgi_pass\s+unix:/tmp/php-cgi-83\.sock;', effective), 'Legacy PHP still referenced'
        run(['/www/server/nginx/sbin/nginx', '-s', 'reload'])
        phpmyadmin_health(attempts=8)
        legacy_stopped = True
        # The vendor's SysV-generated unit does not honor --now on disable.
        run(['systemctl', 'stop', 'php-fpm-83'])
        run(['systemctl', 'disable', 'php-fpm-83'])
        panel_status = phpmyadmin_health(attempts=8)
        assert subprocess.run(['systemctl', 'is-active', '--quiet', 'php-fpm-83']).returncode != 0
    except Exception:
        if legacy_stopped:
            run(['systemctl', 'enable', 'php-fpm-83'])
            run(['systemctl', 'start', 'php-fpm-83'])
        nginx.write_text(nginx_before)
        shutil.copy2(BACKUP/'php.ini.before', CONF/'php.ini')
        switch(php_link, old_php)
        switch(node_link, old_node)
        run(['systemctl', 'restart', 'branded-php', 'branded-pm2'])
        run(['/www/server/nginx/sbin/nginx', '-s', 'reload'])
        run(['systemctl', 'disable', '--now', 'branded-phpmyadmin'])
        raise
    phase('Updating default CLI commands and saving verified versions')
    for name in ['php', 'phpize', 'php-config']:
        set_default(Path('/usr/local/bin')/name, php_target/'bin'/name)
    set_default(Path('/usr/local/bin/php-fpm'), php_target/'sbin/php-fpm')
    for name in ['node', 'npm', 'npx', 'pm2', 'pm2-runtime']:
        set_default(Path('/usr/local/bin')/name, node_target/'bin'/name)
    php_default = Path('/usr/bin/php')
    if php_default.is_symlink() and php_default.resolve() == Path('/www/server/php/83/bin/php'):
        (BACKUP/'php-default-link.before').write_text(os.readlink(php_default))
        switch(php_default, php_target/'bin/php')
    run(['/usr/local/sbin/branded-check'])
    setup_report = Path('/root/branded-setup-report.json')
    previous = json.loads(setup_report.read_text())
    previous.update({'php': value['php'], 'php_integration': value, 'node': out([str(node_link/'bin/node'), '--version']), 'nuxt_preparation': node})
    setup_report.write_text(json.dumps(previous, indent=2))
    run(['python3', '/root/branded-summary.py'])
    report = {'php': value, 'node': previous['node'], 'phpmyadmin_http': panel_status, 'phpmyadmin_socket': '/run/branded-phpmyadmin/php-fpm.sock', 'old_php83_service': 'inactive', 'previous_php': str(old_php), 'previous_node': str(old_node)}
    (BACKUP/'report.json').write_text(json.dumps(report, indent=2))
    phase('UPGRADE COMPLETE: PHP 8.5.12 / Node 26.13.0 LTS; checks passed')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        phase('FAILED: '+(str(error) or type(error).__name__))
        raise
