import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(root + 'content/site.json', 'utf8'));

const esc = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const url = value => {
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw Error('Expected an HTTP(S) URL');
  return esc(parsed.href);
};

const domain = config.domain.replace(/\/$/, '');
url(domain);
url(config.linkedin);
if (config.github) url(config.github);

await rm(root + 'dist', { recursive: true, force: true });
await mkdir(root + 'dist', { recursive: true });
await cp(root + 'public', root + 'dist', { recursive: true });

function document({ title, description, body, canonical = '', pageClass = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url(domain + '/' + canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url(domain + '/' + canonical)}">
  <meta name="theme-color" content="#111412">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
</head>
<body class="${pageClass}">
  <a class="skip" href="#main">Skip to content</a>
  <div class="page">
    <header>
      <a class="monogram" href="/" aria-label="${esc(config.name)}, home">FC</a>
      <span>Space engineer · Developer</span>
    </header>
    ${body}
    <footer>
      <span>© ${new Date().getFullYear()} ${esc(config.name)}</span>
      <span>AI · Engineering · Space</span>
    </footer>
  </div>
</body>
</html>`;
}

const home = `<main id="main">
  <div class="intro">
    <p class="eyebrow">${esc(config.role)} · ${esc(config.company)}</p>
    <h1>${esc(config.name)}</h1>
  </div>
  <div class="details">
    <p class="summary">I’m Francesco — an AI leader and hands-on developer with a background in aerospace and space engineering. I focus on turning generative AI from promising experiments into measurable business impact through AI agents, software development, workflow automation, and large-scale adoption.</p>
    <p class="context">My path into AI began with machine learning in 2017 while studying space engineering, then building Python tools and ML models as a systems engineer. Today, as ${esc(config.role)} at ${esc(config.company)}, I work across technology, engineering, and Information Systems to turn high-value AI applications into solutions people actually use. I also contribute to AI strategy and edge AI for spacecraft.</p>
    <div class="links" aria-label="Social links">
      <a href="${url(config.linkedin)}">LinkedIn ↗</a>
      ${config.github ? `<a href="${url(config.github)}">GitHub ↗</a>` : ''}
    </div>
  </div>
  <figure class="portrait">
    <img src="/fc_pic.jpg" alt="Portrait of ${esc(config.name)}" width="685" height="1000" decoding="async" fetchpriority="high">
  </figure>
</main>`;

await writeFile(root + 'dist/index.html', document({
  title: config.name + ' — AI leadership & engineering',
  description: config.description,
  body: home,
  pageClass: 'home'
}));

const notFound = `<main id="main">
  <div class="intro">
    <p class="eyebrow">404</p>
    <h1>Not found.</h1>
    <p class="summary">This page does not exist.</p>
    <a href="/">Back home</a>
  </div>
</main>`;

await writeFile(root + 'dist/404.html', document({
  title: 'Page not found — ' + config.name,
  description: 'Page not found.',
  body: notFound,
  canonical: '404.html',
  pageClass: 'not-found'
}));

await writeFile(root + 'dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(domain + '/')}</loc></url></urlset>`);
await writeFile(root + 'dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
await writeFile(root + 'dist/.nojekyll', '');

console.log('Built single-page site in dist/');
