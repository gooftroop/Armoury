CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`picture` text,
	`email` text,
	`preferences` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`campaign_type_id` text NOT NULL,
	`organizer_id` text NOT NULL,
	`organizer_name` text NOT NULL,
	`narrative` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`status` text NOT NULL,
	`phases` text,
	`custom_rules` text,
	`rankings` text,
	`participant_ids` text,
	`match_ids` text,
	`crusade_rules_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaign_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`is_organizer` integer NOT NULL,
	`army_id` text NOT NULL,
	`army_name` text NOT NULL,
	`current_phase_id` text NOT NULL,
	`matches_in_current_phase` integer NOT NULL,
	`crusade_data` text,
	`match_ids` text,
	`joined_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaign_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`phases` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `friends` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`status` text NOT NULL,
	`requester_name` text NOT NULL,
	`requester_picture` text,
	`receiver_name` text NOT NULL,
	`receiver_picture` text,
	`can_share_army_lists` integer NOT NULL,
	`can_view_match_history` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_friends_requesterId` ON `friends` (`requester_id`);--> statement-breakpoint
CREATE INDEX `idx_friends_receiverId` ON `friends` (`receiver_id`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`players` text NOT NULL,
	`turn` text NOT NULL,
	`score` text,
	`outcome` text NOT NULL,
	`campaign_id` text,
	`match_data` text,
	`notes` text NOT NULL,
	`played_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_status` (
	`file_key` text PRIMARY KEY NOT NULL,
	`sha` text NOT NULL,
	`last_synced` text NOT NULL,
	`etag` text
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`user_id` text PRIMARY KEY NOT NULL,
	`connection_id` text,
	`status` text NOT NULL,
	`last_seen` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `armies` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`faction_id` text NOT NULL,
	`detachment_id` text,
	`warlord_unit_id` text,
	`battle_size` text NOT NULL,
	`points_limit` integer NOT NULL,
	`units` text NOT NULL,
	`total_points` integer NOT NULL,
	`notes` text NOT NULL,
	`versions` text NOT NULL,
	`current_version` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_armies_ownerId` ON `armies` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_armies_factionId` ON `armies` (`faction_id`);--> statement-breakpoint
CREATE TABLE `chapter_approved` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`primary_missions` text,
	`secondary_missions` text,
	`deployment_zones` text,
	`challenger_cards` text,
	`twist_cards` text,
	`tournament_missions` text,
	`terrain_layouts` text
);
--> statement-breakpoint
CREATE TABLE `core_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`revision` text NOT NULL,
	`battle_scribe_version` text NOT NULL,
	`profile_types` text,
	`cost_types` text,
	`shared_rules` text,
	`categories` text,
	`constraints` text,
	`source_file` text NOT NULL,
	`last_synced` text
);
--> statement-breakpoint
CREATE TABLE `crusade_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`starting_supply_limit` integer NOT NULL,
	`starting_requisition_points` integer NOT NULL,
	`rp_per_battle` integer NOT NULL,
	`rank_thresholds` text,
	`xp_gain_rules` text,
	`requisitions` text,
	`battle_honours` text,
	`battle_scars` text,
	`agendas` text,
	`narrative` text,
	`source_mechanics` text
);
--> statement-breakpoint
CREATE TABLE `factions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_file` text NOT NULL,
	`source_sha` text NOT NULL,
	`catalogue_file` text NOT NULL
);
