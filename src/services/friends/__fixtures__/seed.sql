CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requester_name TEXT NOT NULL,
    requester_picture TEXT,
    receiver_name TEXT NOT NULL,
    receiver_picture TEXT,
    can_share_army_lists BOOLEAN NOT NULL DEFAULT false,
    can_view_match_history BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_friends_requester_id ON friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_friends_receiver_id ON friends(receiver_id);

CREATE TABLE IF NOT EXISTS user_presence (
    user_id TEXT PRIMARY KEY,
    connection_id TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    last_active_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_presence_connection_id ON user_presence(connection_id);
