#!/usr/bin/env python3
import json
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request

result = {}
for name in ['branded-mariadb', 'branded-redis', 'branded-php', 'branded-pm2']:
    result[name] = subprocess.run(['systemctl', 'is-active', '--quiet', name]).returncode == 0
for key, url in [('php', 'http://127.0.0.1:8081/__branded/health'), ('node', 'http://127.0.0.1:3000'+('/__preparation/health' if (Path('/srv/branded/nuxt/current').resolve().name == 'preparation') else '/'))]:
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            result[key] = response.status == 200
            if key == 'php':
                detail = json.load(response)
                result['opcache'] = detail['opcache']
                result['redis_db0_db1'] = all(detail['redis_db0_db1'])
    except Exception as exc:
        result[key] = False
usage = shutil.disk_usage('/')
result['disk_below_85_percent'] = usage.used / usage.total < 0.85
print(json.dumps(result))
sys.exit(0 if all(result.values()) else 1)
