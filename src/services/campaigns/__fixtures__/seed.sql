-- Schema for local development
-- Matches the Drizzle ORM schema in @armoury/shared/data/dsql/schema.ts

CREATE TABLE IF NOT EXISTS master_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    organizer_id TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    narrative JSONB,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status TEXT NOT NULL,
    phases JSONB,
    custom_rules JSONB,
    rankings JSONB,
    participant_ids JSONB,
    match_ids JSONB,
    crusade_rules_id TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS participant_campaigns (
    id TEXT PRIMARY KEY,
    master_campaign_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_organizer BOOLEAN NOT NULL,
    army_id TEXT NOT NULL,
    army_name TEXT NOT NULL,
    current_phase_id TEXT NOT NULL,
    matches_in_current_phase INTEGER NOT NULL,
    crusade_data JSONB,
    match_ids JSONB,
    joined_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_master_campaigns_organizer_id ON master_campaigns (organizer_id);
CREATE INDEX IF NOT EXISTS idx_participant_campaigns_master_campaign_id ON participant_campaigns (master_campaign_id);
CREATE INDEX IF NOT EXISTS idx_participant_campaigns_account_id ON participant_campaigns (account_id);

-- Seed test data
INSERT INTO master_campaigns (id, name, type, organizer_id, organizer_name, narrative, start_date, end_date, status, phases, custom_rules, rankings, participant_ids, match_ids, crusade_rules_id, created_at, updated_at) VALUES
    ('campaign-001', 'Battle for the Capital', 'crusade', 'user-001', 'War Marshal', '{"crusadeNarrativeRef": null, "customNarrative": "The final battle for the capital city begins."}', '2024-01-01T00:00:00.000Z', NULL, 'active', '[]', '["Standard units only"]', '[]', '["participant-001", "participant-002"]', '[]', NULL, '2024-01-01T00:00:00.000Z', '2024-01-15T12:00:00.000Z'),
    ('campaign-002', 'Border Sector War', 'generic', 'user-002', 'Commander Rex', '{"crusadeNarrativeRef": null, "customNarrative": "Two factions clash in the border sector."}', '2024-03-01T00:00:00.000Z', '2024-09-01T00:00:00.000Z', 'upcoming', '[]', '[]', '[]', '[]', '[]', NULL, '2024-02-15T00:00:00.000Z', '2024-02-15T00:00:00.000Z');

INSERT INTO participant_campaigns (id, master_campaign_id, account_id, display_name, is_organizer, army_id, army_name, current_phase_id, matches_in_current_phase, crusade_data, match_ids, joined_at, updated_at) VALUES
    ('participant-001', 'campaign-001', 'user-001', 'War Marshal', TRUE, 'army-001', 'Iron Defenders 3rd Company', 'phase-1', 3, NULL, '[]', '2024-01-01T00:00:00.000Z', '2024-01-15T12:00:00.000Z'),
    ('participant-002', 'campaign-001', 'user-003', 'Dark Commander', FALSE, 'army-002', 'Shadow Legion', 'phase-1', 2, NULL, '[]', '2024-01-02T00:00:00.000Z', '2024-01-14T10:00:00.000Z');
