/**
 * Nur lokal (npm run admin): kleine Schnittstelle für den Button „نشر على الإنترنت" in der Admin-Oberfläche.
 *
 *   GET  /__venezia/status          → Anzahl ungespeicherter/unveröffentlichter Änderungen
 *   POST /__venezia/publish         → git add (nur Inhalte, Bilder & 3D-Scans) + commit + pull --rebase + push
 *   GET  /__venezia/deploy?sha=…    → Stand des GitHub-Pages-Builds für diesen Commit (öffentliche GitHub-API)
 *
 * Es werden ausschließlich src/content, src/assets/images und public/ar/scans (3D-Scans) veröffentlicht – Code-Änderungen bleiben unberührt.
 */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CONTENT_PATHS = ['src/content', 'src/assets/images', 'public/ar/scans'];

function git(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`git ${args.join(' ')}\n${stderr || stdout || err.message}`));
      else resolve(stdout.trim());
    });
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function repoInfo(cwd) {
  const remote = await git(['remote', 'get-url', 'origin'], cwd).catch(() => '');
  const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function status(cwd) {
  const porcelain = await git(['status', '--porcelain', '--', ...CONTENT_PATHS], cwd);
  const changes = porcelain ? porcelain.split('\n').length : 0;
  const ahead = Number(await git(['rev-list', '--count', '@{u}..HEAD'], cwd).catch(() => '0')) || 0;
  return { changes, ahead };
}

async function publish(cwd) {
  const log = [];
  await git(['add', '-A', '--', ...CONTENT_PATHS], cwd);
  const staged = await git(['diff', '--cached', '--name-only', '--', ...CONTENT_PATHS], cwd);
  if (staged) {
    const stamp = new Date().toLocaleString('de-AT', { timeZone: 'Europe/Vienna' });
    const files = staged.split('\n');
    await git(['commit', '-m', `Inhalte aktualisiert über Admin (${stamp})`, '-m', files.join('\n'), '--', ...CONTENT_PATHS], cwd);
    log.push(`${files.length} Datei(en) committet`);
  }
  const { ahead } = await status(cwd);
  if (!staged && ahead === 0) return { ok: true, nothing: true, log };
  // Falls jemand anderes inzwischen gepusht hat: erst holen, dann senden
  await git(['pull', '--rebase', '--autostash'], cwd);
  await git(['push'], cwd);
  log.push('push ok');
  const sha = await git(['rev-parse', 'HEAD'], cwd);
  return { ok: true, sha, log };
}

async function deploy(cwd, sha) {
  const info = await repoInfo(cwd);
  if (!info || !/^[0-9a-f]{7,40}$/.test(sha)) return { status: 'unknown' };
  const r = await fetch(
    `https://api.github.com/repos/${info.owner}/${info.repo}/actions/runs?head_sha=${sha}&per_page=5`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'venezia-admin' } }
  );
  if (!r.ok) return { status: 'unknown' };
  const data = await r.json();
  const run = data.workflow_runs?.[0];
  if (!run) return { status: 'queued' };
  return { status: run.status, conclusion: run.conclusion, url: run.html_url };
}

export default function publishPlugin() {
  return {
    name: 'venezia-publish',
    apply: 'serve',
    configureServer(server) {
      const cwd = server.config.root;
      server.middlewares.use('/__venezia', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          if (req.method === 'GET' && url.pathname === '/status') {
            const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf-8'));
            return send(res, 200, { ...(await status(cwd)), siteUrl: site.url });
          }
          if (req.method === 'POST' && url.pathname === '/publish') return send(res, 200, await publish(cwd));
          if (req.method === 'GET' && url.pathname === '/deploy') return send(res, 200, await deploy(cwd, url.searchParams.get('sha') ?? ''));
          send(res, 404, { ok: false, error: 'not found' });
        } catch (e) {
          send(res, 500, { ok: false, error: String(e?.message ?? e) });
        }
      });
    },
  };
}
