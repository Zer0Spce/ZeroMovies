"""Replace only the ZeroPlay v2.0.1 Windows ZIP and checksum asset.

Android and Android TV release assets are intentionally preserved byte-for-byte.
"""
import hashlib
import json
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request

repo = os.environ['GITHUB_REPOSITORY']
token = os.environ['GH_TOKEN']
base = 'https://api.github.com/repos/' + repo
tag = 'v2.0.1'
notes = pathlib.Path('docs/release-2.0.1-windows-repair.md')
windows_zip = pathlib.Path('windows/dist/ZeroPlay-2.0.1-Windows-x64.zip')
checksum_file = pathlib.Path('windows/dist/SHA256SUMS.txt')
android_names = ['ZeroPlay-2.0.1-Android.apk', 'ZeroPlay-2.0.1-Android-TV.apk']

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected and urllib.parse.urlsplit(req.full_url).netloc != urllib.parse.urlsplit(newurl).netloc:
            redirected.remove_header('Authorization')
        return redirected

opener = urllib.request.build_opener(SafeRedirect())

def request(path, method='GET', data=None):
    headers = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    with opener.open(req, timeout=120) as response:
        return json.load(response) if response.status != 204 else None

if not windows_zip.is_file() or windows_zip.stat().st_size <= 0:
    raise RuntimeError('Rebuilt Windows 2.0.1 ZIP is missing')
if not notes.is_file():
    raise RuntimeError('Corrected 2.0.1 release notes are missing')

release = request('/releases/tags/' + tag)
if release.get('draft') or release.get('prerelease'):
    raise RuntimeError('v2.0.1 must already be a stable published release')
assets = {row['name']: row for row in release.get('assets', [])}

lines = []
for name in android_names:
    asset = assets.get(name)
    if not asset:
        raise RuntimeError('Existing Android asset is missing: ' + name)
    digest = str(asset.get('digest') or '')
    if not digest.startswith('sha256:') or len(digest) != 71:
        raise RuntimeError('Existing Android asset has no trustworthy SHA-256 digest: ' + name)
    lines.append(digest[7:] + '  ' + name + '\n')

windows_hash = hashlib.sha256(windows_zip.read_bytes()).hexdigest()
lines.append(windows_hash + '  ' + windows_zip.name + '\n')
checksum_file.write_text(''.join(lines), encoding='utf-8')

# Delete only the assets that are being replaced. Android APKs remain untouched.
for name in [windows_zip.name, checksum_file.name]:
    previous = assets.get(name)
    if previous:
        request('/releases/assets/' + str(previous['id']), 'DELETE')

upload_base = release['upload_url'].split('{')[0]
for file in [windows_zip, checksum_file]:
    upload = upload_base + '?name=' + urllib.parse.quote(file.name)
    req = urllib.request.Request(upload, data=file.read_bytes(), method='POST', headers={
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/vnd.github+json',
    })
    with opener.open(req, timeout=300) as response:
        result = json.load(response)
        if result.get('state') != 'uploaded':
            raise RuntimeError('Release asset upload incomplete: ' + file.name)

request('/releases/' + str(release['id']), 'PATCH', {
    'draft': False,
    'prerelease': False,
    'make_latest': 'true',
    'name': 'ZeroPlay v2.0.1 · Maintenance Update',
    'body': notes.read_text(encoding='utf-8'),
})
print('Repaired v2.0.1 Windows ZIP and checksums; Android assets were preserved unchanged.')
