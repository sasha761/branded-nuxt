#!/usr/bin/env python3
"""Install deployment/operations helpers after bootstrap has completed."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
CONF = Path('/etc/branded')
(CONF/'php.d').chmod(0o755)

def put(path, text, mode=0o644):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.strip() + '\n')
    path.chmod(mode)

for unit in ['branded-mariadb', 'branded-redis', 'branded-php', 'branded-pm2']:
    subprocess.run(['systemctl', 'is-active', '--quiet', unit], check=True)
for name in ['deploy', 'backup', 'check']:
    target = Path('/usr/local/sbin/branded-' + name)
    shutil.copy2(HERE/(name+'.py'), target)
    target.chmod(0o750)
for name in ['nginx-stage-A.conf.example', 'nginx-stage-B.conf.example']:
    shutil.copy2(HERE/name, CONF/'nginx'/name)
    (CONF/'nginx'/name).chmod(0o644)
with tempfile.TemporaryDirectory(prefix='branded-nginx-lint-', dir='/run') as temporary:
    lint = Path(temporary)
    subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=nginx-lint.invalid', '-keyout', str(lint/'key.pem'), '-out', str(lint/'cert.pem')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for name in ['nginx-stage-A.conf.example', 'nginx-stage-B.conf.example']:
        config = (HERE/name).read_text()
        for domain in ['branded', 'cms']:
            config = config.replace('/etc/branded/tls/'+domain+'/fullchain.pem', str(lint/'cert.pem')).replace('/etc/branded/tls/'+domain+'/privkey.pem', str(lint/'key.pem'))
        config = config.replace('include fastcgi_params;', 'include /www/server/nginx/conf/fastcgi_params;')
        put(lint/'nginx.conf', 'events {}\nhttp {\n'+config+'\n}')
        subprocess.run(['/www/server/nginx/sbin/nginx', '-t', '-c', str(lint/'nginx.conf')], check=True)
put('/etc/logrotate.d/branded', '''
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
for directory in ['/srv/branded/incoming', '/var/backups/branded']:
    Path(directory).mkdir(exist_ok=True, parents=True)
Path('/var/backups/branded').chmod(0o700)
subprocess.run(['chown', 'branded:branded', '/srv/branded/incoming'], check=True)
put('/etc/systemd/system/branded-wp-cron.service', '''
[Unit]
Description=Branded WordPress due cron events
ConditionPathExists=/srv/branded/wordpress/wp-cron.php
After=branded-php.service branded-mariadb.service branded-redis.service
[Service]
Type=oneshot
User=branded
Group=branded
WorkingDirectory=/srv/branded/wordpress
ExecStart=/opt/branded/php/bin/php /srv/branded/wordpress/wp-cron.php
PrivateTmp=true
NoNewPrivileges=true
''')
put('/etc/systemd/system/branded-wp-cron.timer', '''
[Unit]
Description=Run Branded WordPress cron every five minutes after migration
[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Persistent=true
[Install]
WantedBy=timers.target
''')
put('/etc/systemd/system/branded-backup.service', '''
[Unit]
Description=Branded local database/uploads/config backup
ConditionPathExists=/srv/branded/wordpress/wp-config.php
After=branded-mariadb.service
[Service]
Type=oneshot
UMask=0077
ExecStart=/usr/local/sbin/branded-backup
Nice=10
IOSchedulingClass=idle
''')
put('/etc/systemd/system/branded-backup.timer', '''
[Unit]
Description=Branded local backup daily at 03:30 Europe/Berlin
[Timer]
OnCalendar=*-*-* 03:30:00 Europe/Berlin
Persistent=true
RandomizedDelaySec=300
[Install]
WantedBy=timers.target
''')
put('/etc/systemd/system/branded-check.service', '''
[Unit]
Description=Branded stack local health check (journal only)
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/branded-check
''')
put('/etc/systemd/system/branded-check.timer', '''
[Unit]
Description=Check Branded stack every five minutes
[Timer]
OnBootSec=3min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
''')
subprocess.run(['systemctl', 'daemon-reload'], check=True)
subprocess.run(['systemctl', 'enable', '--now', 'branded-wp-cron.timer', 'branded-backup.timer', 'branded-check.timer'], check=True)
subprocess.run(['/usr/local/sbin/branded-check'], check=True)
subprocess.run(['/usr/local/sbin/branded-backup', '--database-only'], check=True)
print('FINISH COMPLETE: deployment helper, Nginx templates, timers and local database backup prepared')
