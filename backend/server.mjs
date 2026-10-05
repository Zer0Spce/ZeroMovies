import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export function validateCatalog(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.items)) throw new Error('Expected schemaVersion 1 and items array');
  const ids = new Set();
  const https = (url) => { try { return new URL(url).protocol === 'https:'; } catch { return false; } };
  const validateStreams = (streams) => {
    if (!Array.isArray(streams)) throw new Error('streams must be an array');
    for (const stream of streams) {
      if (!stream || typeof stream.label !== 'string' || !stream.label.trim() || !https(stream.url)) throw new Error('Streams require a label and HTTPS URL');
      if (stream.headers && (typeof stream.headers !== 'object' || Array.isArray(stream.headers) || Object.values(stream.headers).some(v => typeof v !== 'string'))) throw new Error('Invalid stream headers');
      if (stream.subtitles !== undefined) {
        if (!Array.isArray(stream.subtitles) || stream.subtitles.some(s => !s || !https(s.url))) throw new Error('Invalid subtitles');
      }
    }
  };
  for (const item of data.items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) || typeof item.title !== 'string' || !item.title.trim()) throw new Error('Each item needs a unique ID and title');
    ids.add(item.id);
    if (!['movie', 'series', 'live'].includes(item.type)) throw new Error('Invalid item type');
    if (item.poster && !https(item.poster)) throw new Error('Poster URLs must use HTTPS');
    if (item.type === 'series') {
      if (!Array.isArray(item.episodes)) throw new Error('Series require episodes');
      const episodeIds = new Set();
      for (const episode of item.episodes) {
        if (!episode || typeof episode.id !== 'string' || !episode.id || episodeIds.has(episode.id) || !Number.isInteger(episode.season) || episode.season < 1 || !Number.isInteger(episode.episode) || episode.episode < 1) throw new Error('Invalid episode');
        episodeIds.add(episode.id); validateStreams(episode.streams);
      }
    } else validateStreams(item.streams);
  }
  return data;
}

export function makeServer(catalogPath) {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') {res.writeHead(405, {'Allow':'GET'}); res.end(JSON.stringify({error:'Method not allowed'})); return;}
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') {res.end(JSON.stringify({status:'ok'})); return;}
    if (url.pathname !== '/v1/catalog') {res.writeHead(404); res.end(JSON.stringify({error:'Not found'})); return;}
    try {
      const bytes = await readFile(catalogPath);
      if(bytes.length > 5_000_000) throw new Error('Catalog too large');
      const data = validateCatalog(JSON.parse(bytes.toString('utf8')));
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const type = url.searchParams.get('type');
      const result = {...data, items:data.items.filter(item => item.title.toLowerCase().includes(q) && (!type || item.type === type))};
      res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(result));
    } catch (err) {console.error('Catalog error:', err.message); res.writeHead(503); res.end(JSON.stringify({error:'Catalog unavailable'}));}
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.env.CATALOG_PATH || resolve(dirname(fileURLToPath(import.meta.url)), 'catalog.json');
  makeServer(path).listen(Number(process.env.PORT || 8080), process.env.HOST || '127.0.0.1', () => console.log('ZeroStreams catalog backend listening'));
}
