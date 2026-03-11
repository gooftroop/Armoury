CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL,
    players TEXT NOT NULL,
    turn TEXT,
    score TEXT,
    outcome TEXT,
    campaign_id TEXT,
    match_data TEXT,
    notes TEXT NOT NULL DEFAULT '',
    played_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matches_system_id ON matches (system_id);

CREATE TABLE IF NOT EXISTS ws_connections (
    connection_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_subscriptions (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    match_id TEXT NOT NULL,
    user_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_match_subscriptions_connection_id ON match_subscriptions (connection_id);
CREATE INDEX IF NOT EXISTS idx_match_subscriptions_match_id ON match_subscriptions (match_id);
