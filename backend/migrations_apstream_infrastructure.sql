-- AP-STREAM PLACES
CREATE TABLE IF NOT EXISTS ap_places (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    address TEXT,
    city VARCHAR(120),
    country VARCHAR(120) DEFAULT 'Uganda',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    website TEXT,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AP-STREAM BUSINESSES
CREATE TABLE IF NOT EXISTS ap_businesses (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT REFERENCES ap_places(id) ON DELETE SET NULL,
    owner_id BIGINT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    verification_status VARCHAR(40) DEFAULT 'unverified',
    status VARCHAR(40) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AP-STREAM BUSINESS PRODUCTS / SERVICES
CREATE TABLE IF NOT EXISTS ap_business_items (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES ap_businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(14,2),
    currency VARCHAR(10) DEFAULT 'UGX',
    image_url TEXT,
    item_type VARCHAR(30) DEFAULT 'product',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AP-STREAM BUSINESS REVIEWS
CREATE TABLE IF NOT EXISTS ap_business_reviews (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES ap_businesses(id) ON DELETE CASCADE,
    reviewer_id BIGINT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    status VARCHAR(30) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AP-STREAM CLOUD FILE METADATA
CREATE TABLE IF NOT EXISTS ap_cloud_files (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT,
    filename VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(150),
    size_bytes BIGINT DEFAULT 0,
    visibility VARCHAR(30) DEFAULT 'private',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_places_name
    ON ap_places(name);

CREATE INDEX IF NOT EXISTS idx_ap_places_category
    ON ap_places(category);

CREATE INDEX IF NOT EXISTS idx_ap_places_city
    ON ap_places(city);

CREATE INDEX IF NOT EXISTS idx_ap_places_coordinates
    ON ap_places(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_ap_businesses_name
    ON ap_businesses(name);

CREATE INDEX IF NOT EXISTS idx_ap_businesses_category
    ON ap_businesses(category);

CREATE INDEX IF NOT EXISTS idx_ap_business_items_business
    ON ap_business_items(business_id);

CREATE INDEX IF NOT EXISTS idx_ap_business_reviews_business
    ON ap_business_reviews(business_id);

CREATE INDEX IF NOT EXISTS idx_ap_cloud_files_owner
    ON ap_cloud_files(owner_id);
