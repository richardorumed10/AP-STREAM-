const { Pool } = require('pg');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'apstream',
  user: process.env.PGUSER || 'u0_a221',
  password: process.env.PGPASSWORD || undefined
});

const USER_AGENT = 'AP-STREAM-Crawler/1.0 (+AP-STREAM Search)';
const MAX_BYTES = 3 * 1024 * 1024;

function normalizeUrl(raw, base) {
  try {
    const url = new URL(raw, base);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    url.hash = '';

    return url.href;
  } catch {
    return null;
  }
}

function getDomain(url) {
  return new URL(url).hostname.toLowerCase();
}

function extractPage(html, url) {
  const $ = cheerio.load(html);

  $('script, style, noscript, svg').remove();

  const title =
    $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    '';

  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    '';

  const language =
    $('html').attr('lang')?.trim() ||
    null;

  const rawBodyText = $('body').text();
  const content = String(rawBodyText || '')
    .replace(/\s+/g, ' ')
    .trim();

  const links = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const target = normalizeUrl(href, url);

    if (!target) return;

    links.push({
      url: target,
      anchor: $(element).text().replace(/\s+/g, ' ').trim().slice(0, 500)
    });
  });

  return {
    title,
    description,
    language,
    content,
    links
  };
}

async function readRobots(url) {
  const origin = new URL(url).origin;
  const robotsUrl = `${origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    const text = await response.text();

    return robotsParser(robotsUrl, text);
  } catch {
    return robotsParser(robotsUrl, '');
  }
}

async function ensureSite(client, url) {
  const parsed = new URL(url);
  const domain = parsed.hostname.toLowerCase();

  const result = await client.query(
    `
    INSERT INTO ap_search_sites
      (domain, homepage_url)
    VALUES
      ($1, $2)
    ON CONFLICT (domain)
    DO UPDATE SET updated_at = NOW()
    RETURNING id
    `,
    [domain, `${parsed.protocol}//${parsed.host}/`]
  );

  return result.rows[0].id;
}

async function savePage(client, siteId, url, response, data) {
  const hash = crypto
    .createHash('sha256')
    .update(data.content || '')
    .digest('hex');

  const result = await client.query(
    `
    INSERT INTO ap_search_pages
      (
        site_id,
        url,
        canonical_url,
        title,
        description,
        content,
        language,
        status_code,
        content_type,
        content_hash,
        last_crawled_at,
        last_seen_at
      )
    VALUES
      ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
    ON CONFLICT (url)
    DO UPDATE SET
      site_id = EXCLUDED.site_id,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      content = EXCLUDED.content,
      language = EXCLUDED.language,
      status_code = EXCLUDED.status_code,
      content_type = EXCLUDED.content_type,
      content_hash = EXCLUDED.content_hash,
      last_crawled_at = NOW(),
      last_seen_at = NOW(),
      updated_at = NOW()
    RETURNING id
    `,
    [
      siteId,
      url,
      data.title,
      data.description,
      data.content.slice(0, 2000000),
      data.language,
      response.status,
      response.headers.get('content-type') || '',
      hash
    ]
  );

  return result.rows[0].id;
}

async function saveLinks(client, pageId, links) {
  for (const link of links) {
    await client.query(
      `
      INSERT INTO ap_search_links
        (source_page_id, target_url, anchor_text)
      VALUES
        ($1,$2,$3)
      `,
      [pageId, link.url, link.anchor]
    );

    await client.query(
      `
      INSERT INTO ap_search_crawl_jobs
        (url, status, depth, priority)
      VALUES
        ($1,'queued',1,0)
      ON CONFLICT DO NOTHING
      `,
      [link.url]
    );
  }
}

async function crawl(url) {
  const client = await pool.connect();

  try {
    const robots = await readRobots(url);

    if (!robots.isAllowed(url, USER_AGENT)) {
      console.log(`[AP-STREAM] robots.txt blocked: ${url}`);
      return;
    }

    console.log(`[AP-STREAM] crawling: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });

    const contentType =
      response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      console.log(`[AP-STREAM] skipped non-HTML: ${url}`);
      return;
    }

    const contentLength =
      Number(response.headers.get('content-length') || 0);

    if (contentLength > MAX_BYTES) {
      console.log(`[AP-STREAM] skipped large page: ${url}`);
      return;
    }

    const html = await response.text();

    if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) {
      console.log(`[AP-STREAM] skipped large HTML: ${url}`);
      return;
    }

    const data = extractPage(html, url);
    const siteId = await ensureSite(client, url);
    const pageId = await savePage(
      client,
      siteId,
      url,
      response,
      data
    );

    await saveLinks(client, pageId, data.links);

    console.log(
      `[AP-STREAM] indexed ${url} (${data.links.length} links)`
    );
  } finally {
    client.release();
  }
}

const MAX_DEPTH = Number(process.env.APSTREAM_SEARCH_MAX_DEPTH || 2);
const MAX_ATTEMPTS = Number(process.env.APSTREAM_SEARCH_MAX_ATTEMPTS || 3);
const WORKER_DELAY_MS = Number(process.env.APSTREAM_SEARCH_WORKER_DELAY_MS || 1500);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function claimNextJob() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      SELECT id, url, depth, attempts
      FROM ap_search_crawl_jobs
      WHERE status = 'queued'
        AND scheduled_at <= NOW()
        AND attempts < $1
      ORDER BY priority DESC, scheduled_at ASC, id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `, [MAX_ATTEMPTS]);

    if (result.rowCount === 0) {
      await client.query('COMMIT');
      return null;
    }

    const job = result.rows[0];

    await client.query(`
      UPDATE ap_search_crawl_jobs
      SET status = 'running',
          attempts = attempts + 1,
          started_at = NOW(),
          error = NULL
      WHERE id = $1
    `, [job.id]);

    await client.query('COMMIT');

    return {
      ...job,
      attempts: job.attempts + 1
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function completeJob(id) {
  await pool.query(`
    UPDATE ap_search_crawl_jobs
    SET status = 'completed',
        completed_at = NOW(),
        error = NULL
    WHERE id = $1
  `, [id]);
}

async function failJob(id, errorMessage) {
  await pool.query(`
    UPDATE ap_search_crawl_jobs
    SET
      status = CASE
        WHEN attempts >= $2 THEN 'failed'
        ELSE 'queued'
      END,
      error = $1,
      completed_at = CASE
        WHEN attempts >= $2 THEN NOW()
        ELSE NULL
      END
    WHERE id = $3
  `, [
    String(errorMessage).slice(0, 2000),
    MAX_ATTEMPTS,
    id
  ]);
}

async function queueDiscoveredLinks(url, depth) {
  if (depth >= MAX_DEPTH) {
    return;
  }

  const result = await pool.query(`
    INSERT INTO ap_search_crawl_jobs
      (url, status, depth, attempts, priority, scheduled_at)
    SELECT
      x.url,
      'queued',
      $2,
      0,
      0,
      NOW()
    FROM (
      SELECT DISTINCT target_url AS url
      FROM ap_search_links
      WHERE source_page_id = (
        SELECT id
        FROM ap_search_pages
        WHERE url = $1
        LIMIT 1
      )
    ) x
    WHERE x.url IS NOT NULL
    ON CONFLICT (url) DO NOTHING
  `, [url, depth + 1]);

  if (result.rowCount > 0) {
    console.log(
      `[AP-STREAM] queued ${result.rowCount} discovered URL(s) from ${url}`
    );
  }
}

async function worker() {
  console.log('[AP-STREAM] Search crawler worker started');
  console.log(`[AP-STREAM] max depth: ${MAX_DEPTH}`);
  console.log(`[AP-STREAM] max attempts: ${MAX_ATTEMPTS}`);

  while (true) {
    const job = await claimNextJob();

    if (!job) {
      console.log('[AP-STREAM] crawl queue empty');
      break;
    }

    console.log(
      `[AP-STREAM] processing job #${job.id}: ${job.url} ` +
      `(depth=${job.depth}, attempt=${job.attempts})`
    );

    try {
      if (job.depth > MAX_DEPTH) {
        await completeJob(job.id);
        console.log(`[AP-STREAM] skipped job #${job.id}: max depth reached`);
        continue;
      }

      await crawl(job.url);
      await queueDiscoveredLinks(job.url, job.depth);
      await completeJob(job.id);

      console.log(`[AP-STREAM] completed job #${job.id}`);
    } catch (error) {
      console.error(
        `[AP-STREAM] job #${job.id} failed:`,
        error.message
      );

      await failJob(job.id, error.message);
    }

    await sleep(WORKER_DELAY_MS);
  }
}

async function main() {
  const arg = process.argv[2];

  if (arg === '--worker') {
    await worker();
    await pool.end();
    return;
  }

  if (!arg) {
    console.error(
      'Usage:\n' +
      '  node apstream_search_crawler.js https://example.com\n' +
      '  node apstream_search_crawler.js --worker'
    );
    process.exit(1);
  }

  await crawl(arg);
  await pool.end();
}

main().catch(async error => {
  console.error('[AP-STREAM] crawler error:', error);
  await pool.end();
  process.exit(1);
});
