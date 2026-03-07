/**
 * Friend Model - Join table mapping users to their friends
 *
 * Each row represents one side of a friendship. When user A befriends user B,
 * two rows are created: one owned by A (userId = B) and one owned by B (userId = A).
 * User profile data (name, picture) is looked up from the user service by userId.
 */

/**
 * Status of a friend request or friendship.
 * - pending: Friend request sent but not yet accepted
 * - accepted: Friendship is active
 * - blocked: User has blocked this friend
 */
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Represents one side of a friend relationship.
 *
 * Each user in a friendship has their own row. The ownerId identifies whose
 * friend list this record belongs to, and userId identifies the friend.
 * User profile data is resolved from the user service by userId.
 */
export interface Friend {
    /** Unique identifier for this friend record. */
    id: string;

    /** The user whose friend list this record belongs to. */
    ownerId: string;

    /** The friend's user ID. Look up profile data from the user service. */
    userId: string;

    /** Current status of the friendship (pending, accepted, or blocked). */
    status: FriendStatus;

    /** Whether the friend can share army lists with this user. */
    canShareArmyLists: boolean;

    /** Whether the friend can view this user's match history. */
    canViewMatchHistory: boolean;

    /** Timestamp when the friend relationship was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the friend relationship was last updated. ISO 8601. */
    updatedAt: string;
}
