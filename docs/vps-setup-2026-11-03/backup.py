#!/usr/bin/env python3
"""Local backup only. Add off-server storage before production cutover."""
import datetime
import gzip
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile

os.umask(0o077)
base = Path('/var/backups/branded')
base.mkdir(exist_ok=True, parents=True)
base.chmod(0o700)
uploads = Path('/srv/branded/wordpress/wp-content/uploads')
size = sum(p.stat().st_size for p in uploads.rglob('*') if p.is_file() and not p.is_symlink()) if uploads.exists() else 0
free = shutil.disk_usage(base).free
if free < size + 1024**3:
    sys.exit('Insufficient disk space for a safe local backup')
folder = base/datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
folder.mkdir(mode=0o700)
dumpfile = folder/'branded.sql.gz'
command = ['/opt/branded/mariadb/bin/mariadb-dump', '--no-defaults', '--socket=/run/branded-mariadb/mariadb.sock', '--user=root', '--single-transaction', '--routines', '--triggers', '--events', '--hex-blob', 'branded']
with subprocess.Popen(command, stdout=subprocess.PIPE) as proc:
    with gzip.open(dumpfile, 'wb') as dest:
        shutil.copyfileobj(proc.stdout, dest)
    if proc.wait():
        sys.exit('Database dump failed; incomplete backup retained for diagnosis')
with gzip.open(dumpfile, 'rb') as check:
    while check.read(1024*1024):
        pass
if '--database-only' not in sys.argv:
    with tarfile.open(folder/'files.tar.gz', 'w:gz') as archive:
        archive.add('/etc/branded', arcname='etc/branded')
        if uploads.exists():
            archive.add(uploads, arcname='wordpress/wp-content/uploads')
        config = Path('/srv/branded/wordpress/wp-config.php')
        if config.exists():
            archive.add(config, arcname='wordpress/wp-config.php')
    # Do not silently delete user data or old backups. Retention is a later storage policy.
print('Local backup OK:', folder)
