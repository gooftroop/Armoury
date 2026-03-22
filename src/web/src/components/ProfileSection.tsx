'use client';

/**
 * Profile summary card — displays user avatar, name, and email.
 *
 * Extracted from AccountSettingsView to keep each settings section in its own
 * composable render component.
 *
 * @requirements
 * 1. Must render a Card with the profile title in the header.
 * 2. Must display the user's avatar with initials fallback.
 * 3. Must display the user's name and email.
 * 4. Must NOT own any state or perform data fetching.
 * 5. Must NOT use data-testid.
 *
 * @module profile-section
 */

import * as React from 'react';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@/components/ui/index.js';
import { getInitials } from '@/lib/getInitials.js';

/** Props for the ProfileSection component. */
export interface ProfileSectionProps {
    /** User profile data to display. */
    user: {
        /** User display name. */
        name: string;
        /** User email address. */
        email: string;
        /** URL to the user's profile picture. */
        picture: string;
    };
    /** Translated section title (e.g. "Profile"). */
    title: string;
}

/**
 * ProfileSection — renders the profile summary card with avatar and user info.
 *
 * @param props - Component props.
 * @returns The rendered profile card.
 */
function ProfileSection({ user, title }: ProfileSectionProps): React.ReactElement {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-semibold text-primary">{user.name}</p>
                        <p className="text-sm text-secondary">{user.email}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

ProfileSection.displayName = 'ProfileSection';

export { ProfileSection };
