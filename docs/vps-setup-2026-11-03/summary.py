#!/usr/bin/env python3
"""Sanitized final verification output. Never prints runtime secrets."""
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.request

def output(args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs).strip()

env = dict(os.environ, PATH='/opt/branded/node/bin:/usr/local/bin:/usr/bin:/bin', PM2_HOME='/srv/branded/.pm2')
report = json.loads(Path('/root/branded-setup-report.json').read_text())
workers = json.loads(output(['/usr/sbin/runuser', '-u', 'branded', '--', '/opt/branded/node/bin/pm2', 'jlist'], env=env))
workers = [{'pid': item['pid'], 'status': item['pm2_env']['status'], 'mode': item['pm2_env']['exec_mode']} for item in workers if item['name'] == 'branded-nuxt']
assert len(workers) == 2 and all(w['status'] == 'online' for w in workers)
assert all(w['mode'] == 'cluster_mode' for w in workers)
report['workers'] = workers
assert report['php_integration']['opcache']
assert all(report['php_integration']['redis_db0_db1'])
assert all(value == 'active' for value in report['services'].values())
ports = output(['ss', '-H', '-lnt'])
for port in [3000, 3307, 6380, 8081]:
    matches = [line for line in ports.splitlines() if re.search(r':'+str(port)+r'\s', line)]
    assert matches and all('127.0.0.1:'+str(port) in line for line in matches), (port, matches)
assert 'FINISH COMPLETE' in Path('/root/branded-finish.log').read_text()
subprocess.run(['/usr/local/sbin/branded-check'], check=True, stdout=subprocess.DEVNULL)
subprocess.run(['/www/server/nginx/sbin/nginx', '-t'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for unit in ['branded-mariadb', 'branded-redis', 'branded-php', 'branded-pm2']:
    assert output(['systemctl', 'is-enabled', unit]) == 'enabled'
report['ports_loopback_only'] = True
report['preparation_ready'] = True
Path('/root/branded-final-report.json').write_text(json.dumps(report, indent=2))
Path('/root/branded-final-report.json').chmod(0o600)
print('BRANDED VPS - PREPARATION VERIFIED')
print('PHP', report['php'], 'FPM / OPcache: OK')
print('MariaDB', report['php_integration']['mariadb'])
print(output(['/opt/branded/redis/bin/redis-server', '--version']).split(' malloc=')[0])
print('Redis db0 + db1 authenticated read/write: OK')
print('Node', report['node'])
print('PM2: 2 workers ONLINE / cluster mode')
print('Worker PIDs:', ', '.join(str(w['pid']) for w in workers))
print('Nginx active config + Stage A/B syntax: OK')
print('Ports 3000 / 3307 / 6380 / 8081: loopback only')
print('4 services: active / autostart enabled')
print('Deploy, rollback, logrotate, cron: prepared')
print('Local empty-database backup: created')
print('')
print('AWAITING: WordPress files + DB, Nuxt .output')
print('Public DNS / domain routing: unchanged')
print('Offsite backups / SMTP / external alerts: pending')
