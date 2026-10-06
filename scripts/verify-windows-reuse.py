"""Reuse only a successful, Defender-scanned Windows build of identical source."""
import json, os, re, urllib.request

repo = os.environ['GITHUB_REPOSITORY']
run_id = os.environ['REUSE_WINDOWS_RUN']
if not re.fullmatch(r'[1-9][0-9]*', run_id):
    raise RuntimeError('Invalid reusable Windows run')
def get(path):
    request = urllib.request.Request('https://api.github.com/repos/' + repo + path,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
                 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)
run = get('/actions/runs/' + run_id)
if run['path'] != '.github/workflows/release.yml':
    raise RuntimeError('Reusable build must come from the release workflow')
jobs = get('/actions/runs/' + run_id + '/jobs')['jobs']
windows = next((job for job in jobs if job['name'] == 'windows'), None)
required = {'Windows app smoke test', 'Package portable ZIP',
            'Scan packaged Windows files with Microsoft Defender',
            'Audit Windows release credentials', 'Verify downloaded video playback'}
passed = {step['name'] for step in (windows or {}).get('steps', [])
          if step.get('conclusion') == 'success'}
if not windows or windows['conclusion'] != 'success' or not required <= passed:
    raise RuntimeError('Windows playback, packaging and Defender checks must pass')
def windows_tree(sha):
    if not re.fullmatch(r'[a-f0-9]{40}', sha):
        raise RuntimeError('Invalid source commit')
    commit = get('/git/commits/' + sha)
    tree = get('/git/trees/' + commit['tree']['sha'])
    return next(entry['sha'] for entry in tree['tree']
                if entry['path'] == 'windows' and entry['type'] == 'tree')
if windows_tree(run['head_sha']) != windows_tree(os.environ['GITHUB_SHA']):
    raise RuntimeError('Windows source changed; a fresh Windows build is required')
print('Reusing successful Windows playback/package/Defender validation with identical Windows source.')
