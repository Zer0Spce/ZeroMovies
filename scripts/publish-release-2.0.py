"""Publish the verified ZeroPlay 2.0 production assets."""
import hashlib, json, os, pathlib, subprocess, urllib.error, urllib.parse, urllib.request

repo=os.environ['GITHUB_REPOSITORY']
base='https://api.github.com/repos/'+repo
token=os.environ['GH_TOKEN']
source_branch='release/v2.0'
tag='v2.0'
notes=pathlib.Path('docs/release-2.0.md')
assets=pathlib.Path('release-assets')
required=[
    assets/'ZeroPlay-2.0-Android.apk',
    assets/'ZeroPlay-2.0-Android-TV.apk',
    assets/'ZeroPlay-2.0-Windows-x64.zip',
]

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
        if redirected and urllib.parse.urlsplit(req.full_url).netloc!=urllib.parse.urlsplit(newurl).netloc:
            redirected.remove_header('Authorization')
        return redirected

opener=urllib.request.build_opener(SafeRedirect())

def request(path,method='GET',data=None):
    headers={
        'Authorization':'Bearer '+token,
        'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28',
    }
    if data is not None:
        data=json.dumps(data).encode('utf-8')
        headers['Content-Type']='application/json'
    req=urllib.request.Request(base+path,data=data,headers=headers,method=method)
    with opener.open(req,timeout=120) as response:
        return json.load(response) if response.status!=204 else None

# Never publish an outdated run after release/v2.0 moved.
if os.environ.get('GITHUB_REF')=='refs/heads/'+source_branch:
    head=request('/git/ref/heads/'+source_branch)['object']['sha']
    if head!=os.environ['GITHUB_SHA']:
        raise RuntimeError('Release source superseded; publishing blocked')

if not notes.is_file():
    raise RuntimeError('2.0 release notes are missing')
if not all(file.is_file() and file.stat().st_size>0 for file in required):
    missing=[file.name for file in required if not file.is_file() or file.stat().st_size<=0]
    raise RuntimeError('Required release assets missing: '+', '.join(missing))

# Do one last local credential audit across every distributable.
subprocess.run(['python','scripts/audit-release-secrets.py',*[str(file) for file in required]],check=True)

checksums=assets/'SHA256SUMS.txt'
checksums.write_text(''.join(hashlib.sha256(file.read_bytes()).hexdigest()+'  '+file.name+'\n' for file in required),encoding='utf-8')

body=notes.read_text(encoding='utf-8')
# Avoid silently overwriting a release someone already published manually.
try:
    existing=request('/releases/tags/'+tag)
except urllib.error.HTTPError as error:
    if error.code!=404: raise
    existing=None
if existing and not existing.get('draft'):
    raise RuntimeError('v2.0 is already published; refusing to replace it')
release=existing or request('/releases','POST',{
    'tag_name':tag,
    'target_commitish':os.environ['GITHUB_SHA'],
    'name':'ZeroPlay v2.0 🎬',
    'body':body,
    'draft':True,
    'prerelease':False,
})

existing_assets={row['name']:row for row in release.get('assets',[])}
for file in [*required,checksums]:
    previous=existing_assets.get(file.name)
    if previous:
        request('/releases/assets/'+str(previous['id']),'DELETE')
    upload=release['upload_url'].split('{')[0]+'?name='+urllib.parse.quote(file.name)
    req=urllib.request.Request(upload,data=file.read_bytes(),method='POST',headers={
        'Authorization':'Bearer '+token,
        'Content-Type':'application/octet-stream',
        'Accept':'application/vnd.github+json',
    })
    with opener.open(req,timeout=300) as response:
        result=json.load(response)
        if result.get('state')!='uploaded':
            raise RuntimeError('Release asset upload incomplete: '+file.name)

request('/releases/'+str(release['id']),'PATCH',{
    'draft':False,
    'prerelease':False,
    'make_latest':'true',
    'body':body,
    'name':'ZeroPlay v2.0 🎬',
})
print('Published ZeroPlay v2.0 with signed Android APKs, Windows portable ZIP and SHA256 checksums.')
