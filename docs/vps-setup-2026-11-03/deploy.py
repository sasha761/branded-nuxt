#!/usr/bin/env python3
"""Atomic Nuxt release deployment. Root: branded-deploy SOURCE RELEASE or --rollback."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.request

BASE = Path('/srv/branded/nuxt')
ENV = dict(os.environ, PM2_HOME='/srv/branded/.pm2', PATH='/opt/branded/node/bin:/usr/local/bin:/usr/bin:/bin')

def reload():
    subprocess.run(['/usr/sbin/runuser', '-u', 'branded', '--', '/opt/branded/node/bin/pm2', 'reload', '/etc/branded/ecosystem.config.cjs', '--env', 'production', '--update-env'], env=ENV, check=True)

def sync_assets(release):
    assets = release/'.output/public/_nuxt'
    if assets.is_dir():
        shared = BASE/'assets/_nuxt'
        shared.mkdir(parents=True, exist_ok=True)
        subprocess.run(['rsync', '-a', '--safe-links', '--chmod=D755,F644', '--chown=branded:branded', str(assets)+'/', str(shared)+'/'], check=True)

def point(name, destination):
    temporary = BASE/(name+'.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(destination)
    temporary.replace(BASE/name)

if os.geteuid() != 0:
    sys.exit('Run as root')
old = (BASE/'current').resolve()
if sys.argv[1:] == ['--rollback']:
    previous = BASE/'previous'
    if not previous.is_symlink() or not previous.resolve().is_dir():
        sys.exit('No previous release')
    target = previous.resolve()
else:
    if len(sys.argv) != 3 or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,63}', sys.argv[2]):
        sys.exit('Usage: branded-deploy /srv/branded/incoming/RELEASE RELEASE | --rollback')
    source = Path(sys.argv[1]).resolve()
    incoming = Path('/srv/branded/incoming').resolve()
    if source == incoming or incoming not in source.parents:
        sys.exit('Source must be a release directory below /srv/branded/incoming')
    entry = source/'.output/server/index.mjs'
    if not entry.is_file():
        sys.exit('Expected SOURCE/.output/server/index.mjs')
    subprocess.run(['/opt/branded/node/bin/node', '--check', str(entry)], check=True)
    target = BASE/'releases'/sys.argv[2]
    if target.exists():
        sys.exit('Release exists: choose a new release ID')
    # Require the migrated backend before activating real storefront code.
    with urllib.request.urlopen('http://127.0.0.1:8081/wp-json/api/menus', timeout=15) as response:
        if response.status != 200:
            sys.exit('WordPress API is not ready')
    target.mkdir(mode=0o755)
    subprocess.run(['rsync', '-a', '--chown=branded:branded', str(source/'.output')+'/', str(target/'.output')+'/'], check=True)
    subprocess.run(['chmod', '-R', 'u=rwX,go=rX', str(target)], check=True)
sync_assets(target)
point('current', target)
try:
    reload()
    for attempt in range(10):
        try:
            route = '/__preparation/health' if target.name == 'preparation' else '/'
            with urllib.request.urlopen('http://127.0.0.1:3000'+route, timeout=15) as response:
                if response.status == 200:
                    break
        except Exception:
            if attempt == 9:
                raise
            time.sleep(2)
except Exception:
    sync_assets(old)
    point('current', old)
    reload()
    raise
point('previous', old)
print('Activated:', target)
