/**
 * Apple Touch Icon — Hexagonal Badge
 *
 * Generates a 180×180 Apple touch icon using the same hexagonal badge design
 * as the favicon, scaled up for iOS home screen and bookmark rendering.
 *
 * @requirements
 * 1. Must render a 180×180 PNG via Next.js file-convention metadata.
 * 2. Must use the same hex badge design as the favicon for brand consistency.
 * 3. Must be legible at 60×60 (smallest iOS rendering size).
 *
 * @module apple-icon
 */

import { ImageResponse } from 'next/og';

/** Apple touch icon dimensions (standard 180×180). */
export const size = {
    width: 180,
    height: 180,
};

/** Output MIME type. */
export const contentType = 'image/png';

/**
 * Generates the Apple touch icon as a PNG via ImageResponse.
 *
 * Same hexagonal badge as the favicon, scaled to 180×180 for high-DPI iOS devices.
 */
export default function AppleIcon(): ImageResponse {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1e1e2e',
                borderRadius: '36px',
            }}
        >
            {/* biome-ignore lint: svg element */}
            <svg width="150" height="150" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hex shape — pointy-top hexagon */}
                <path
                    d="M16 1 L29.5 8.5 L29.5 23.5 L16 31 L2.5 23.5 L2.5 8.5 Z"
                    fill="#1e1e2e"
                    stroke="#c4993a"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                {/* Inner hex accent line */}
                <path
                    d="M16 4 L27 10 L27 22 L16 28 L5 22 L5 10 Z"
                    fill="none"
                    stroke="#c4993a"
                    strokeWidth="0.4"
                    strokeLinejoin="round"
                    opacity="0.35"
                />
                {/* "A" monogram — path outline since Satori does not support <text> */}
                <path
                    d="M16 8 L10 24 L12.5 24 L13.5 21 L18.5 21 L19.5 24 L22 24 L16 8 Z M14.3 18.5 L16 12.5 L17.7 18.5 Z"
                    fill="#6ba3d6"
                    fillRule="evenodd"
                />
            </svg>
        </div>,
        {
            ...size,
        },
    );
}
