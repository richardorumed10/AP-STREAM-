BEGIN;

CREATE TABLE IF NOT EXISTS ap_search_sites (
    id BIGSERIAL PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    homepage_url TEXT,
    title TEXT,
    description TEXT,
    robots_checked_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_search_pages (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT REFERENCES ap_search_sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    title TEXT,
    description TEXT,
    content TEXT,
    language TEXT,
    status_code INTEGER,
    content_type TEXT,
    content_hash TEXT,
    last_crawled_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_search_links (
    id BIGSERIAL PRIMARY KEY,
    source_page_id BIGINT REFERENCES ap_search_pages(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_search_crawl_jobs (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    depth INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_search_pages_site
    ON ap_search_pages(site_id);

CREATE INDEX IF NOT EXISTS idx_ap_search_pages_crawled
    ON ap_search_pages(last_crawled_at);

CREATE INDEX IF NOT EXISTS idx_ap_search_jobs_status
    ON ap_search_crawl_jobs(status, priority DESC, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_ap_search_links_source
    ON ap_search_links(source_page_id);

CREATE INDEX IF NOT EXISTS idx_ap_search_links_target
    ON ap_search_links(target_url);

COMMIT;
