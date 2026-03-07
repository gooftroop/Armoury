/** Root layout pass-through. The locale layout at app/[locale]/layout.tsx provides the full HTML shell. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children;
}
