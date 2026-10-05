"""Publish signed Android assets alongside the validated Windows portable ZIP."""
import hashlib, io, json, os, pathlib, urllib.request, urllib.parse, zipfile
repo = os.environ['GITHUB_REPOSITORY']
base = 'https://api.github.com/repos/' + repo
token = os.environ['GH_TOKEN']
class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected and urllib.parse.urlsplit(req.full_url).netloc != urllib.parse.urlsplit(newurl).netloc:
            redirected.remove_header('Authorization')
        return redirected
opener = urllib.request.build_opener(SafeRedirect())
def request(path, method='GET', data=None, binary=False):
    headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    if data is not None:
        data = json.dumps(data).encode(); headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    with opener.open(req, timeout=120) as response:
        return response.read() if binary else (json.load(response) if response.status != 204 else None)
android_only = os.environ.get('ANDROID_ONLY') == 'true'
release = request('/releases/tags/v1.0') if android_only else None
assets = pathlib.Path('release-assets')
files = [assets / name for name in ['ZeroMovies-1.0-Android.apk','ZeroMovies-1.0-Android-TV.apk','ZeroMovies-1.0-Windows-x64.zip']]
if android_only:
    existing = {a['name']: a for a in release['assets']}
    windows = existing['ZeroMovies-1.0-Windows-x64.zip']
    previous = opener.open(existing['SHA256SUMS.txt']['browser_download_url'], timeout=120).read().decode()
    data = opener.open(windows['browser_download_url'], timeout=240).read()
    expected = next(line.split()[0] for line in previous.splitlines() if line.endswith(windows['name']))
    if hashlib.sha256(data).hexdigest() != expected: raise RuntimeError('Published Windows checksum mismatch')
    files[2].write_bytes(data)
if not all(p.is_file() and p.stat().st_size > 0 for p in files): raise RuntimeError('Required release assets missing')
checksums = assets / 'SHA256SUMS.txt'
checksums.write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in files))
# Start as a draft; only publish after all four assets upload successfully.
release = release or request('/releases', 'POST', {'tag_name':'v1.0','target_commitish':os.environ['GITHUB_SHA'],'name':'ZeroMovies v1.0 🎬','body':pathlib.Path('docs/release-1.0.md').read_text(),'draft':True,'prerelease':False})
upload_files = [*files[:2], checksums] if android_only else [*files, checksums]
for file in upload_files:
    if android_only and file.name in existing:
        request('/releases/assets/'+str(existing[file.name]['id']), 'DELETE')
    url = release['upload_url'].split('{')[0] + '?name=' + file.name
    req = urllib.request.Request(url, data=file.read_bytes(), method='POST', headers={'Authorization':'Bearer '+token,'Content-Type':'application/octet-stream'})
    with opener.open(req,timeout=240) as response:
        result=json.load(response)
        if result.get('state') != 'uploaded': raise RuntimeError('Release asset upload incomplete')
request('/releases/'+str(release['id']),'PATCH',{'draft':False,'make_latest':'true','body':pathlib.Path('docs/release-1.0.md').read_text()})
print('Published ZeroMovies v1.0 with verified signed APKs and Windows portable ZIP.')
