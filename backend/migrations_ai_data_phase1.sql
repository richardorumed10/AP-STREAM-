BEGIN;

CREATE TABLE IF NOT EXISTS ai_data_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_data_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL
        REFERENCES ai_data_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    data_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_data_query_logs (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT
        REFERENCES ai_data_conversations(id) ON DELETE SET NULL,
    user_id INTEGER
        REFERENCES users(id) ON DELETE SET NULL,
    intent VARCHAR(100),
    query_type VARCHAR(100),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_data_conversations_user
    ON ai_data_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_data_messages_conversation
    ON ai_data_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_data_query_logs_user
    ON ai_data_query_logs(user_id, created_at);

COMMIT;
