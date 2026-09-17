import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { normalizeSongs, scoreGuesses, MAX_PER_USER } from './game.js';

const songs = normalizeSongs(JSON.parse(await readFile(new URL('./submissions.json', import.meta.url), 'utf8')));
const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/api/songs') {
      return json(res, 200, {
        songs: songs.map(({ username, ...song }) => song),
        users: [...new Set(songs.map(song => song.username))].sort((a, b) => a.localeCompare(b)),
        maxPerUser: MAX_PER_USER,
      });
    }
    if (req.method === 'POST' && path === '/api/score') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 100000) return json(res, 413, { error: 'Request too large.' });
      }
      try { return json(res, 200, scoreGuesses(songs, JSON.parse(body).guesses)); }
      catch (error) { return json(res, 400, { error: error.message }); }
    }
    if (req.method === 'GET' && files[path]) {
      const [file, type] = files[path];
      const content = await readFile(new URL(file, import.meta.url));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      return res.end(content);
    }
    json(res, 404, { error: 'Not found.' });
  } catch { json(res, 500, { error: 'Something went wrong. Please try again.' }); }
});
server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
  console.log(`YapZap Guessr is running at http://localhost:${server.address().port}`);
});
