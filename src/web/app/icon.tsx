/**
 * Dynamic Favicon — Hexagonal Badge
 *
 * Generates a hexagonal badge favicon with an "A" monogram at build time
 * using Next.js ImageResponse. Renders as a crisp SVG-backed PNG at 32×32.
 *
 * Design: Dark slate hex with amber-gold stroke + steel-blue "A" letter.
 * Matches the Armoury design tokens (Steel Blue primary, Amber Gold secondary).
 *
 * @requirements
 * 1. Must render a 32×32 PNG favicon via Next.js file-convention metadata.
 * 2. Must use project design token colors (primary steel blue, secondary amber gold).
 * 3. Must be legible at small sizes (16px tab icon).
 * 4. Must not depend on external fonts or assets.
 *
 * @module favicon
 */

import { ImageResponse } from 'next/og';

/** Favicon image dimensions. */
export const size = {
    width: 32,
    height: 32,
};

/** Output MIME type. */
export const contentType = 'image/png';

/**
 * Generates the favicon as a PNG via ImageResponse.
 *
 * Draws a hexagonal badge shape with an "A" monogram centered inside.
 * Uses inline SVG for the hex shape since ImageResponse supports limited CSS.
 */
export default function Icon(): ImageResponse {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
            }}
        >
            {/* biome-ignore lint: svg element */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hex shape — pointy-top hexagon */}
                <path
                    d="M16 1 L29.5 8.5 L29.5 23.5 L16 31 L2.5 23.5 L2.5 8.5 Z"
                    fill="#1e1e2e"
                    stroke="#c4993a"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                {/* Inner hex accent line */}
                <path
                    d="M16 4 L27 10 L27 22 L16 28 L5 22 L5 10 Z"
                    fill="none"
                    stroke="#c4993a"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                    opacity="0.35"
                />
                {/* "A" monogram */}
                <text
                    x="16"
                    y="22"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                    fontSize="18"
                    fontWeight="800"
                    fill="#6ba3d6"
                    letterSpacing="-0.5"
                >
                    A
                </text>
            </svg>
        </div>,
        {
            ...size,
        },
    );
}
