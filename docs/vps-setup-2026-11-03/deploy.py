#!/usr/bin/env python3
"""Activate a Linux Nuxt artifact; privileged operations stay in this root-owned helper."""
import fcntl
import json
import os
from pathlib import Path
import pwd
import re
import stat
import subprocess
import sys
import time
import urllib.request

BASE = Path('/srv/branded/nuxt')
INCOMING = Path('/srv/branded/incoming')
GITHUB_INCOMING = INCOMING / 'github'
NODE = '/opt/branded/node/bin/node'
ENV = dict(os.environ, PM2_HOME='/srv/branded/.pm2', PATH='/opt/branded/node/bin:/usr/local/bin:/usr/bin:/bin')
RELEASE = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,63}')


def app_run(args):
    return subprocess.run(['/usr/sbin/runuser', '-u', 'branded', '--', *map(str, args)], env=ENV, check=True)


def validate_output(output):
    if output.is_symlink() or not output.is_dir():
        raise ValueError('Artifact must be a real .output directory')
    root = output.resolve()
    if not (root / 'server/index.mjs').is_file():
        raise ValueError('Expected .output/server/index.mjs')
    for folder, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            p = Path(folder) / name
            mode = p.lstat().st_mode
            if stat.S_ISLNK(mode):
                if not p.resolve().is_relative_to(root):
                    raise ValueError('Artifact contains a symlink outside .output')
            elif not (stat.S_ISDIR(mode) or stat.S_ISREG(mode)):
                raise ValueError('Artifact contains a special file')
    return root


def release_path(link):
    target = (BASE / link).resolve()
    if target.parent != (BASE / 'releases').resolve() or not target.is_dir():
        raise ValueError('Release link points outside the release directory')
    return target


def point(name, target):
    temporary = BASE / (name + '.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(BASE / name)


def sync_assets(target):
    source = target / '.output/public/_nuxt'
    if source.is_dir():
        # No root rsync/chmod traversal of files supplied by the uploader.
        app_run(['rsync', '-a', '--safe-links', '--no-owner', '--no-group', '--chmod=D755,F644', str(source) + '/', str(BASE / 'assets/_nuxt') + '/'])


def reload_app():
    app_run(['/opt/branded/node/bin/pm2', 'reload', '/etc/branded/ecosystem.config.cjs', '--env', 'production', '--update-env'])


def revalidate():
    config = json.loads(Path('/etc/branded/nuxt.env.json').read_text())
    secret = config.get('NUXT_REVALIDATE_SECRET')
    if not secret:
        raise RuntimeError('Server revalidation secret is missing')
    request = urllib.request.Request(
        'http://127.0.0.1:3000/api/_revalidate',
        data=json.dumps({'scopes': ['catalog', 'seo', 'menu', 'home']}).encode(),
        headers={'Content-Type': 'application/json', 'x-branded-secret': secret},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise RuntimeError('Cache revalidation failed')


def metadata_for(target):
    path = target / '.output/public/deploy-meta.json'
    if not path.exists():
        return None
    result = subprocess.run(['/usr/sbin/runuser', '-u', 'branded', '--', '/usr/bin/cat', str(path)], check=True, capture_output=True, timeout=5)
    data = json.loads(result.stdout)
    if set(data) != {'sha', 'run', 'attempt'} or not re.fullmatch(r'[a-f0-9]{40}', data['sha']) or not all(str(data[k]).isdigit() for k in ('run', 'attempt')):
        raise ValueError('Invalid deployment metadata')
    return data


def healthy(target):
    expected = metadata_for(target)
    for attempt in range(10):
        try:
            with urllib.request.urlopen('http://127.0.0.1:3000/', timeout=15) as response:
                if response.status != 200:
                    raise RuntimeError('Storefront health check failed')
            if expected:
                with urllib.request.urlopen('http://127.0.0.1:3000/deploy-meta.json', timeout=15) as response:
                    if json.load(response) != expected:
                        raise RuntimeError('The running build does not match the new artifact')
            return
        except Exception:
            if attempt == 9:
                raise RuntimeError('New release did not become healthy') from None
            time.sleep(2)


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run through sudo')
    with open('/run/branded-deploy.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        old = release_path('current')
        args = sys.argv[1:]
        if args == ['--status']:
            print(json.dumps({'release': old.name, 'metadata': metadata_for(old)}))
            return
        if args == ['--rollback']:
            target = release_path('previous')
        elif len(args) == 2 and RELEASE.fullmatch(args[1]):
            source = Path(args[0]).resolve()
            if source == INCOMING or not source.is_relative_to(INCOMING.resolve()):
                raise ValueError('Source must be below /srv/branded/incoming')
            if os.environ.get('SUDO_USER') == 'deploy' and source != GITHUB_INCOMING / args[1]:
                raise ValueError('deploy may activate only its GitHub upload directory')
            output = validate_output(source / '.output')
            target = BASE / 'releases' / args[1]
            if target.exists() or target.is_symlink():
                raise ValueError('Release exists; use a new release ID')
            app_run([NODE, '--check', output / 'server/index.mjs'])
            with urllib.request.urlopen('http://127.0.0.1:8081/wp-json/api/menus', timeout=30) as response:
                if response.status != 200:
                    raise RuntimeError('WordPress API is not ready')
            target.mkdir(mode=0o755)
            user = pwd.getpwnam('branded')
            os.chown(target, user.pw_uid, user.pw_gid)
            app_run(['rsync', '-a', '--safe-links', '--no-owner', '--no-group', '--chmod=D755,F644', str(output) + '/', str(target / '.output') + '/'])
            validate_output(target / '.output')
        else:
            raise ValueError('Usage: branded-deploy SOURCE RELEASE | --rollback | --status')
        try:
            sync_assets(target)
            point('current', target)
            reload_app()
            healthy(target)
            revalidate()
            healthy(target)
        except Exception:
            sync_assets(old)
            point('current', old)
            reload_app()
            healthy(old)
            raise RuntimeError('Deployment failed; previous release restored') from None
        point('previous', old)
        print('Activated:', target)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print environment variables or secret-bearing request headers.
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
