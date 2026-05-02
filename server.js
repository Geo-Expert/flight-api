/**
 * TLV Flight Finder — server
 * Locally:  node server.js  → http://localhost:3333
 * Cloud:    Render / Railway / Fly.io — set SERPAPI_KEY env var (optional)
 */

const http  = require('http');
const https = require('https');
const url   = require('url');
const path  = require('path');
const fs    = require('fs');

const PORT = process.env.PORT || 3333;

function callSerpApi(params) {
  return new Promise((resolve, reject) => {
    const qs  = new URLSearchParams(params).toString();
    const req = https.request(
      { hostname: 'serpapi.com', path: '/search.json?' + qs, method: 'GET',
        headers: { 'User-Agent': 'TLV-Flight-Finder/1.0' } },
      (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Invalid JSON from SerpAPI')); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('SerpAPI timeout')); });
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve frontend
  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('index.html not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(htmlPath).pipe(res);
    return;
  }

  // Health check (Render pings this)
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Flight search proxy
  if (pathname === '/api/flights') {
    const { dest, out, ret, stops } = parsed.query;
    const apiKey = process.env.SERPAPI_KEY || parsed.query.key;

    if (!apiKey || !dest || !out || !ret) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing parameters.' }));
      return;
    }

    const stopsMap   = { '0': '1', '1': '2', '2': '3' };
    const stopsParam = stopsMap[stops] || '2';

    try {
      const data = await callSerpApi({
        engine: 'google_flights', departure_id: 'TLV', arrival_id: dest,
        outbound_date: out, return_date: ret,
        type: '1', adults: '1', currency: 'USD', hl: 'en',
        stops: stopsParam, api_key: apiKey,
      });

      if (data.error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: data.error }));
        return;
      }

      const flights = [...(data.best_flights || []), ...(data.other_flights || [])];
      const results = flights.map(f => {
        const segs     = f.flights || [];
        const firstSeg = segs[0] || {};
        const depTime  = (firstSeg.departure_airport?.time || '').split(' ')[1]?.slice(0, 5) || '';
        const numStops = Math.max(0, segs.length - 1);
        const airlines = [...new Set(segs.map(s => s.airline).filter(Boolean))].join(', ');
        const durMin   = f.total_duration || 0;
        const dur      = durMin ? `${Math.floor(durMin / 60)}h ${durMin % 60}m` : '';
        const price    = f.price || 0;
        const gurl     = `https://www.google.com/travel/flights?q=round+trip+TLV+to+${dest}+${out}+returning+${ret}`;
        return { dest, price, outDate: out, retDate: ret, depTime, numStops, airlines, dur, gurl };
      }).filter(r => r.price > 0);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✈  TLV Flight Finder → http://localhost:${PORT}\n`);
});
