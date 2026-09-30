BEGIN;

CREATE TABLE IF NOT EXISTS ap_hub_version_files (
  id BIGSERIAL PRIMARY KEY,
  version_id BIGINT NOT NULL
    REFERENCES ap_hub_versions(id)
    ON DELETE CASCADE,
  project_id BIGINT NOT NULL
    REFERENCES ap_hub_projects(id)
    ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ap_hub_version_files_unique_path
    UNIQUE (version_id, path)
);

CREATE INDEX IF NOT EXISTS idx_ap_hub_version_files_version
  ON ap_hub_version_files(version_id);

CREATE INDEX IF NOT EXISTS idx_ap_hub_version_files_project
  ON ap_hub_version_files(project_id);

COMMIT;
