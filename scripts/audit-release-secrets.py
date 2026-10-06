"""Reject live API keys, including UTF-16 strings and nested release archives."""
import argparse, pathlib, re, zipfile, io, sys
LIVE=re.compile(rb'rc_live_[A-Za-z0-9_-]{20,}')
def scan(data,label,depth=0):
    if LIVE.search(data) or LIVE.search(data.replace(b'\x00',b'')):
        print('FAIL: live RawCast credential found in '+label);return False
    if depth<5 and data[:4]==b'PK\x03\x04':
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                for entry in archive.infolist():
                    if not entry.is_dir() and not scan(archive.read(entry),label+'!'+entry.filename,depth+1):return False
        except (zipfile.BadZipFile,RuntimeError):
            print('FAIL: unreadable release archive '+label);return False
    return True
parser=argparse.ArgumentParser();parser.add_argument('paths',nargs='+');args=parser.parse_args();good=True;count=0
for item in args.paths:
    root=pathlib.Path(item)
    if not root.exists():print('FAIL: audit path missing: '+item);good=False;continue
    for file in root.rglob('*') if root.is_dir() else [root]:
        if not file.is_file() or '.git' in file.parts or 'node_modules' in file.parts:continue
        try:good=scan(file.read_bytes(),str(file)) and good;count+=1
        except OSError:print('FAIL: unreadable audit file '+str(file));good=False
print(('PASS' if good else 'FAIL')+': credential audit of '+str(count)+' files; credential values were not printed.')
sys.exit(0 if good else 1)
