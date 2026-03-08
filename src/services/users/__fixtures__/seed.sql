CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    sub TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    account_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_sub ON users(sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    preferences JSONB NOT NULL DEFAULT '{}',
    systems JSONB NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Seed test data
INSERT INTO users (id, sub, email, name, picture, account_id, created_at, updated_at) VALUES
    ('user-001', 'auth0|user001', 'user001@armoury.dev', 'Test User One', NULL, 'account-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
    ('user-002', 'auth0|user002', 'user002@armoury.dev', 'Test User Two', 'https://example.com/avatar.png', NULL, '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z');

INSERT INTO accounts (id, user_id, preferences, systems, created_at, updated_at) VALUES
    ('account-001', 'user-001', '{"theme":"dark","language":"en","notificationsEnabled":true}', '{}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');