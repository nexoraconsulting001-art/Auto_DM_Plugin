// Serves a built site locally with the same clean URLs as the server.
//   node tools/serve.mjs [dist] (PORT=8080 by default, 127.0.0.1 only)
// POST /__test/early-access answers 200 and prints the request, so the form can be tried with
// SITE_CONFIG pointing at a config whose earlyAccess.endpoint is http://127.0.0.1:8080/__test/early-access.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 8080);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/__test/early-access') {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'content-type');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      console.log('early access request:', body);
      res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}');
    });
    return;
  }
  let file = path.join(root, path.normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, ''));
  if (!file.startsWith(root)) return res.writeHead(400).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': types['.html'] });
    return fs.createReadStream(path.join(root, '404.html')).pipe(res);
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
