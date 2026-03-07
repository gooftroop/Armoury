CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    can_share_army_lists BOOLEAN NOT NULL DEFAULT false,
    can_view_match_history BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_friends_owner_id ON friends(owner_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);

CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY,
    connection_id TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    last_active_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_presence_connection_id ON user_presence(connection_id);
