"""Publish signed Android assets alongside the already-tested Windows artifact."""
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
        return response.read() if binary else json.load(response)
run = request('/actions/runs/37274482805')
if run['conclusion'] != 'success' or run['head_sha'] != 'a45e054f0dbe15519c1432747039ec4eee881649':
    raise RuntimeError('Windows build identity or validation mismatch')
artifact = request('/actions/artifacts/11328714247')
if artifact['expired'] or artifact['workflow_run']['id'] != run['id']:
    raise RuntimeError('Windows artifact unavailable or mismatched')
assets = pathlib.Path('release-assets')
with zipfile.ZipFile(io.BytesIO(request('/actions/artifacts/11328714247/zip', binary=True))) as archive:
    members = [name for name in archive.namelist() if pathlib.PurePosixPath(name).name == 'ZeroMovies-0.4.5-Windows-x64.zip']
    if len(members) != 1: raise RuntimeError('Expected portable ZIP missing')
    (assets / 'ZeroMovies-0.4.5-Windows-x64.zip').write_bytes(archive.read(members[0]))
files = [assets / name for name in ['ZeroMovies-0.4.5-Android.apk','ZeroMovies-0.4.5-Android-TV.apk','ZeroMovies-0.4.5-Windows-x64.zip']]
if not all(p.is_file() and p.stat().st_size > 0 for p in files): raise RuntimeError('Required release assets missing')
checksums = assets / 'SHA256SUMS.txt'
checksums.write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in files))
# Start as a draft; only publish after all four assets upload successfully.
release = request('/releases', 'POST', {'tag_name':'v0.4.5','target_commitish':os.environ['GITHUB_SHA'],'name':'ZeroMovies v0.4.5 🎬','body':pathlib.Path('docs/release-0.4.5.md').read_text(),'draft':True,'prerelease':False})
for file in [*files,checksums]:
    url = release['upload_url'].split('{')[0] + '?name=' + file.name
    req = urllib.request.Request(url, data=file.read_bytes(), method='POST', headers={'Authorization':'Bearer '+token,'Content-Type':'application/octet-stream'})
    with opener.open(req,timeout=240) as response:
        result=json.load(response)
        if result.get('state') != 'uploaded': raise RuntimeError('Release asset upload incomplete')
request('/releases/'+str(release['id']),'PATCH',{'draft':False,'make_latest':'true'})
print('Published ZeroMovies v0.4.5 with verified signed APKs and Windows portable ZIP.')
