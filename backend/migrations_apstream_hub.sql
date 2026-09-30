BEGIN;

-- =========================================================
-- AP-STREAM HUB
-- Core project and source-management foundation
-- =========================================================

CREATE TABLE IF NOT EXISTS ap_hub_projects (
    id BIGSERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,

    visibility VARCHAR(20) NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('private', 'public')),

    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ap_hub_projects_owner
    ON ap_hub_projects(owner_id);

CREATE TABLE IF NOT EXISTS ap_hub_project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL
        REFERENCES ap_hub_projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(30) NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'developer', 'member', 'viewer')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ap_hub_members_project
    ON ap_hub_project_members(project_id);

CREATE INDEX IF NOT EXISTS idx_ap_hub_members_user
    ON ap_hub_project_members(user_id);

CREATE TABLE IF NOT EXISTS ap_hub_files (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL
        REFERENCES ap_hub_projects(id) ON DELETE CASCADE,

    path TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',

    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_ap_hub_files_project
    ON ap_hub_files(project_id);

CREATE TABLE IF NOT EXISTS ap_hub_versions (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL
        REFERENCES ap_hub_projects(id) ON DELETE CASCADE,

    version_number BIGINT NOT NULL,
    message TEXT NOT NULL,

    created_by INTEGER
        REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_ap_hub_versions_project
    ON ap_hub_versions(project_id);

COMMIT;
