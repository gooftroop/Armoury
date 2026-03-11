# Next.js 15 + React 19 Rendering Strategy

**Purpose:** Principal-engineer-level reference for rendering decisions, SSG/ISR, the 4-layer cache architecture, Streaming + PPR, Server Actions, security, the Data Access Layer pattern, and cache coordination in the Armoury web application.

**Audience:** Engineers who already know React and Next.js basics. This document skips fundamentals and focuses on Next.js 15 + React 19 specifics, production security, and patterns that are non-obvious or easy to get wrong.

**Scope:** `@armoury/web` (Next.js 15 App Router). Mobile (`@armoury/mobile`) uses React Query but not Server Actions or RSC.

**Related Documents:**

- [BEST_PRACTICES.md](./plan/BEST_PRACTICES.md) — §8 (App Router file conventions), §9 (Server/Client decision matrix) — **read those first for fundamentals**
- [REACT_QUERY.md](./REACT_QUERY.md) — §4 (SSR/RSC prefetch + `HydrationBoundary`), §5 (cache configuration tiers)
- [STATE_MANAGEMENT.md](./plan/STATE_MANAGEMENT.md) — State tier hierarchy (Tier 1–5)
- [RXJS_STATE.md](./RXJS_STATE.md) — RxJS → React Query cache bridge

---

## Table of Contents

1. [RSC Composition Patterns](#1-rsc-composition-patterns)
2. [Server Actions](#2-server-actions)
3. [Progressive Enhancement & Form Hooks](#3-progressive-enhancement--form-hooks)
4. [Security Model](#4-security-model)
5. [Data Access Layer (DAL) Pattern](#5-data-access-layer-dal-pattern)
6. [TanStack Query v5 + RSC Streaming](#6-tanstack-query-v5--rsc-streaming)
7. [Cache Invalidation Across Boundaries](#7-cache-invalidation-across-boundaries)
8. [Auth0 Integration in the Rendering Pipeline](#8-auth0-integration-in-the-rendering-pipeline)
9. [Decision Trees](#9-decision-trees)
10. [Auditing Checklist](#10-auditing-checklist)
11. [Route Rendering Modes (Static / Dynamic / PPR)](#11-route-rendering-modes-static--dynamic--ppr)
12. [Static Generation and ISR](#12-static-generation-and-isr)
13. [The 4-Layer Cache Architecture](#13-the-4-layer-cache-architecture)
14. [Streaming, `loading.js`, and `after()`](#14-streaming-loadingjs-and-after)
15. [Route-Level Decision Guide](#15-route-level-decision-guide)
16. [Forward-Looking: `use cache` and Cache Components](#16-forward-looking-use-cache-and-cache-components)

---

## 1. RSC Composition Patterns

### 1.1 Server Components Are the Default

Every file in `app/` is a Server Component unless it carries `'use client'`. Server Components:

- Run **only on the server** — never shipped to the browser as JavaScript
- Can `await` directly — no `useEffect`, no `useState`, no loading spinner for initial data
- Have access to environment variables, databases, and secrets
- Cannot use hooks, browser APIs, or event handlers

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx — Server Component
// No 'use client' → runs entirely on the server

import { auth0 } from '@web/src/lib/auth0.js';
import { getArmies } from '@web/src/dal/armies.js';

export default async function ArmiesPage() {
    // auth0.getSession() is available in Server Components without any hook
    const session = await auth0.getSession();

    if (!session) {
        // Redirect is thrown as an exception in Next.js — it terminates rendering
        redirect('/auth/login');
    }

    // Direct data access — no API round-trip, no exposed secrets
    const armies = await getArmies(session.user.sub);

    return <ArmyList armies={armies} />;
}
```

### 1.2 Pushing `'use client'` to the Leaf

The most common RSC mistake is placing `'use client'` too high in the tree, causing large subtrees to ship as client JavaScript. Push it as deep as possible — wrap only the component that actually needs interactivity.

```typescript
// ❌ Wrong — entire page becomes a client bundle
'use client';
export default function ArmiesPage() { /* ... */ }

// ✅ Correct — only the interactive filter widget is a Client Component
// app/[locale]/[gameSystem]/(app)/armies/page.tsx (Server Component)
export default async function ArmiesPage() {
    const armies = await getArmies(userId);

    return (
        <section>
            <ArmyFilterBar />      {/* Client Component — handles filter state */}
            <ArmyGrid armies={armies} /> {/* Server Component — pure render */}
        </section>
    );
}

// src/web/src/components/armies/ArmyFilterBar.tsx
'use client';
import { useState } from 'react';
// Only this file (and its subtree) ships as JS
```

### 1.3 Passing Server Components as Children to Client Components

A Client Component **cannot import** a Server Component — but it can receive one as `children`. This is the canonical pattern for wrapping Server-rendered content in a Client-side provider or shell.

```typescript
// Armoury's actual pattern — src/web/app/[locale]/layout.tsx
// NextIntlClientProvider is a Client Component; children are Server Components

export default async function LocaleLayout({ children, params }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <html lang={locale} className={`${libreFranklin.variable} ${jetbrainsMono.variable} dark`}>
            <body>
                <NextIntlClientProvider>   {/* Client Component */}
                    <Providers>            {/* Client Component — QueryClientProvider + DataContextProvider */}
                        {children}         {/* Server Components from page.tsx */}
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
```

### 1.4 `React.cache()` for Request-Level Deduplication

`React.cache()` memoizes a function for the duration of a single server render pass. Multiple Server Components calling the same cached function in one request share the result — it is only computed once.

```typescript
// src/web/src/dal/session.ts
import { cache } from 'react';
import { auth0 } from '@web/src/lib/auth0.js';
import type { Session } from '@auth0/nextjs-auth0/types';

/**
 * Returns the current Auth0 session, memoized per request.
 *
 * Multiple Server Components calling verifySession() in the same render
 * will receive the same result without re-querying Auth0.
 *
 * @throws Redirects to /auth/login if no session exists.
 */
export const verifySession = cache(async (): Promise<Session> => {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/auth/login');
    }

    return session;
});
```

> **Why this matters**: Without `cache()`, a layout, a page, and two child components each calling `auth0.getSession()` would issue four separate calls. With `cache()`, all four share one result.

### 1.5 Async Server Components and `<Suspense>`

`async` components work as Server Components. Wrap them in `<Suspense>` to stream partial HTML — the shell renders immediately, and the async content streams in when ready.

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx
import { Suspense } from 'react';
import { ArmySkeleton } from '@web/src/components/armies/ArmySkeleton.js';
import { ArmyList } from '@web/src/components/armies/ArmyList.js';

export default function ArmiesPage() {
    // The page shell renders instantly.
    // ArmyList suspends while fetching — the skeleton shows until data arrives.
    return (
        <main>
            <h1>Armies</h1>
            <Suspense fallback={<ArmySkeleton />}>
                <ArmyList /> {/* async Server Component */}
            </Suspense>
        </main>
    );
}

// src/web/src/components/armies/ArmyList.tsx — async Server Component
async function ArmyList() {
    const session = await verifySession(); // React.cache() — free after first call
    const armies = await getArmies(session.user.sub);

    return <ul>{armies.map(a => <ArmyCard key={a.id} army={a} />)}</ul>;
}
```

### 1.6 Promise-as-Prop Pattern

Pass an unresolved Promise from a Server Component to a Client Component and read it with `React.use()`. This enables streaming: the server starts sending HTML before the data resolves.

```typescript
// app/[locale]/[gameSystem]/(app)/armies/[id]/page.tsx (Server Component)
import { use } from 'react';
import { getArmy } from '@web/src/dal/armies.js';
import { ArmyDetailClient } from '@web/src/components/armies/ArmyDetailClient.js';

interface Props { params: Promise<{ id: string }> }

export default function ArmyDetailPage({ params }: Props) {
    const { id } = use(params);

    // Do NOT await — pass the Promise down so the client can stream
    const armyPromise = getArmy(id);

    return (
        <Suspense fallback={<ArmyDetailSkeleton />}>
            <ArmyDetailClient armyPromise={armyPromise} />
        </Suspense>
    );
}

// src/web/src/components/armies/ArmyDetailClient.tsx
'use client';
import { use } from 'react';
import type { Army } from '@shared/types/entities.js';

interface Props { armyPromise: Promise<Army> }

export function ArmyDetailClient({ armyPromise }: Props) {
    // React.use() suspends the component until the promise resolves.
    // Suspense boundary above catches the suspension.
    const army = use(armyPromise);

    return <article><h1>{army.name}</h1></article>;
}
```

> **When to prefer this over `HydrationBoundary`**: Use promise-as-prop when you want streaming without TanStack Query involvement (e.g., one-shot detail pages). Use `HydrationBoundary` when the client component needs to `useQuery`, refetch, or participate in mutations.

---

## 2. Server Actions

### 2.1 What Server Actions Are

Server Actions are async functions that run on the server, invoked from the client without a manual API route. They are Next.js's mechanism for form submissions and mutations that need server-side logic (auth, DB writes, cache invalidation).

**Critical mental model:** Treat every Server Action as a public API endpoint. It is called over the network. Users can invoke it with arbitrary arguments. Validate everything. Check auth every time.

### 2.2 Defining Server Actions

**Module-level** — a file with `'use server'` at the top exports only Server Actions:

```typescript
// src/web/src/actions/armies.ts
'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { verifySession } from '@web/src/dal/session.js';
import { db } from '@web/src/dal/db.js';

const RenameArmySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
});

/**
 * Renames an army. Validates input, re-verifies auth, then writes to DB.
 *
 * @requirements Must validate input. Must re-verify session. Must revalidate cache.
 */
export async function renameArmy(
    _prevState: unknown,
    formData: FormData,
): Promise<{ success: boolean; error?: string }> {
    // Step 1: Re-verify auth on every action call — never trust the caller
    const session = await verifySession();

    // Step 2: Validate and parse input — never trust FormData directly
    const parsed = RenameArmySchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
    });

    if (!parsed.success) {
        return { success: false, error: 'Invalid input.' };
    }

    const { id, name } = parsed.data;

    // Step 3: Authorize — verify this user owns this army
    const army = await db.armies.findById(id);

    if (!army || army.userId !== session.user.sub) {
        return { success: false, error: 'Not found.' };
    }

    // Step 4: Perform the mutation
    await db.armies.rename(id, name);

    // Step 5: Invalidate the Next.js data cache
    revalidateTag(`army:${id}`);

    return { success: true };
}
```

**Inline** — define directly inside a Server Component (rare; useful for one-off form handlers):

```typescript
// app/[locale]/[gameSystem]/(app)/armies/[id]/edit/page.tsx (Server Component)
export default async function EditArmyPage({ params }) {
    const { id } = await params;

    // Inline Server Action — still treated as 'use server' by Next.js
    async function updateName(formData: FormData) {
        'use server';

        const session = await verifySession(); // Always re-verify
        const name = z.string().min(1).max(100).parse(formData.get('name'));

        // Check ownership
        const army = await db.armies.findById(id);
        if (!army || army.userId !== session.user.sub) throw new Error('Forbidden');

        await db.armies.rename(id, name);
        revalidateTag(`army:${id}`);
        redirect(`/armies/${id}`);
    }

    const army = await getArmy(id);

    return (
        <form action={updateName}>
            <input name="name" defaultValue={army.name} />
            <button type="submit">Save</button>
        </form>
    );
}
```

### 2.3 Form Binding

Pass a Server Action directly to `<form action={action}>`. Next.js handles the POST, invokes the action, and triggers a re-render.

```typescript
// Progressive enhancement: works with JS disabled (native form POST)
// With JS: intercepted by React — no full page reload
<form action={renameArmy}>
    <input type="hidden" name="id" value={army.id} />
    <input name="name" defaultValue={army.name} />
    <button type="submit">Save</button>
</form>
```

To bind arguments ahead of time, use `.bind()`:

```typescript
// Pre-bind the army ID so it isn't sent as a form field
const renameArmyWithId = renameArmy.bind(null, army.id);

// src/web/src/actions/armies.ts
export async function renameArmy(
    id: string, // bound argument
    _prevState: unknown,
    formData: FormData,
) {
    'use server';
    // id is a closed-over value — encrypted by Next.js, not visible in the HTML
    // ...
}
```

> **Security note on `.bind()`**: Bound arguments are encrypted by Next.js and not accessible in the page source. They are safe for opaque IDs. They are **not** safe for secrets like access tokens — those must come from the server-side session only.

---

## 3. Progressive Enhancement & Form Hooks

### 3.1 `useActionState`

`useActionState` manages form state across Server Action submissions. It tracks the pending state, the last action return value, and exposes a wrapped action for `<form action>`.

```typescript
// src/web/src/components/armies/RenameArmyForm.tsx
'use client';

import { useActionState } from 'react';
import { renameArmy } from '@web/src/actions/armies.js';

interface Props {
    army: { id: string; name: string };
}

/** Form to rename an army with validation feedback from the server. */
export function RenameArmyForm({ army }: Props) {
    const [state, action, isPending] = useActionState(renameArmy, null);

    return (
        <form action={action}>
            <input type="hidden" name="id" value={army.id} />
            <label htmlFor="name">Army Name</label>
            <input
                id="name"
                name="name"
                defaultValue={army.name}
                aria-invalid={!!state?.error}
                aria-describedby={state?.error ? 'name-error' : undefined}
            />
            {state?.error && (
                <p id="name-error" role="alert">{state.error}</p>
            )}
            <button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save'}
            </button>
        </form>
    );
}
```

> **Progressive enhancement**: If JavaScript fails to load, `<form action={action}>` still submits as a native HTML form POST and the Server Action runs. The error/success UI won't update (no JS), but the action executes.

### 3.2 `useFormStatus`

`useFormStatus` gives any component inside a `<form>` access to the form's submission state. Use it to build reusable submit buttons or loading indicators without prop-drilling.

```typescript
// src/web/src/components/ui/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

interface Props {
    label: string;
    loadingLabel?: string;
}

/**
 * Submit button that automatically disables and shows loading text
 * during form submission. Works with any Server Action form.
 */
export function SubmitButton({ label, loadingLabel = 'Saving…' }: Props) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} aria-disabled={pending}>
            {pending ? loadingLabel : label}
        </button>
    );
}

// Usage — no prop drilling needed:
// <form action={renameArmy}>
//     <input name="name" />
//     <SubmitButton label="Save" />
// </form>
```

### 3.3 `useOptimistic`

`useOptimistic` applies a temporary optimistic update while a Server Action is in-flight, then replaces it with the server's response when it completes.

```typescript
// src/web/src/components/armies/ArmyList.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { deleteArmy } from '@web/src/actions/armies.js';
import type { Army } from '@shared/types/entities.js';

interface Props { armies: Army[] }

export function ArmyList({ armies }: Props) {
    const [optimisticArmies, removeOptimistic] = useOptimistic(
        armies,
        (currentArmies: Army[], idToRemove: string) =>
            currentArmies.filter((a) => a.id !== idToRemove),
    );
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        startTransition(async () => {
            // Apply the optimistic update immediately
            removeOptimistic(id);
            // Then execute the Server Action
            await deleteArmy(id);
        });
    };

    return (
        <ul aria-busy={isPending}>
            {optimisticArmies.map((army) => (
                <li key={army.id}>
                    {army.name}
                    <button onClick={() => handleDelete(army.id)}>Delete</button>
                </li>
            ))}
        </ul>
    );
}
```

> **`useOptimistic` vs TanStack Query optimistic updates**: Use `useOptimistic` when you are using Server Actions (no `useMutation`). Use TanStack Query's optimistic update pattern (see [REACT_QUERY.md §3](./REACT_QUERY.md#3-mutations--cache-invalidation)) when using `useMutation`. Do not mix them for the same operation.

---

## 4. Security Model

### 4.1 The Four Non-Negotiables

Every Server Action must satisfy all four:

| #   | Rule                                | How                                                                    |
| --- | ----------------------------------- | ---------------------------------------------------------------------- |
| 1   | **Validate all inputs**             | `zod.safeParse()` before touching any value                            |
| 2   | **Re-verify auth on every call**    | `verifySession()` at the top of every action                           |
| 3   | **Authorize at the resource level** | Confirm the authenticated user owns/can access the specific record     |
| 4   | **CSRF is handled by Next.js**      | Same-origin restriction + Origin header check — no manual token needed |

```typescript
'use server';

import { z } from 'zod';
import { verifySession } from '@web/src/dal/session.js';

const UpdateSchema = z.object({
    id: z.string().uuid(),
    value: z.string().min(1).max(255),
});

export async function updateSomething(_prevState: unknown, formData: FormData) {
    // ① Re-verify auth — never assume the caller is authenticated
    const session = await verifySession();

    // ② Validate — never trust FormData
    const parsed = UpdateSchema.safeParse({
        id: formData.get('id'),
        value: formData.get('value'),
    });

    if (!parsed.success) {
        return { error: 'Invalid input', fields: parsed.error.flatten().fieldErrors };
    }

    // ③ Authorize — verify ownership at the data level
    const record = await db.findById(parsed.data.id);

    if (!record || record.userId !== session.user.sub) {
        // Return the same generic error for "not found" and "forbidden"
        // to avoid information leakage about record existence
        return { error: 'Not found.' };
    }

    await db.update(parsed.data.id, parsed.data.value);

    return { success: true };
}
```

### 4.2 Closed-Over Values and `.bind()`

When a Server Action closes over a server-side variable (e.g., an ID from a Server Component), Next.js **automatically encrypts** that value before embedding it in the HTML. The client cannot read or tamper with it.

```typescript
// app/.../armies/[id]/page.tsx (Server Component)
export default async function ArmyPage({ params }) {
    const { id } = await params;

    // The 'id' is closed over — Next.js encrypts it in the action reference
    // An attacker cannot replace it by inspecting the page source
    async function handleDelete() {
        'use server';
        await deleteArmy(id); // 'id' is verified to come from the server
    }

    return <form action={handleDelete}><button type="submit">Delete</button></form>;
}
```

**What this protects against**: An attacker cannot craft a form submission that substitutes a different `id`. The encryption makes the closed-over value tamper-evident.

**What this does NOT protect against**: The caller can still invoke the action with a different `id` via direct HTTP POST (without the encryption). This is why authorization checks at the resource level (rule ③ above) are mandatory regardless.

### 4.3 Zod Input Validation Patterns

Use `safeParse` (not `parse`) so you can return structured validation errors to the form:

```typescript
// Return type matches useActionState expectations
export type ActionState = {
    success: boolean;
    error?: string;
    fields?: Record<string, string[]>;
};

const ArmySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    faction: z.string().min(1, 'Faction is required'),
    pointsLimit: z.coerce.number().min(0).max(10_000),
});

export async function createArmy(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await verifySession();

    const parsed = ArmySchema.safeParse({
        name: formData.get('name'),
        faction: formData.get('faction'),
        pointsLimit: formData.get('pointsLimit'),
    });

    if (!parsed.success) {
        return {
            success: false,
            error: 'Validation failed.',
            fields: parsed.error.flatten().fieldErrors,
        };
    }

    await db.armies.create({ ...parsed.data, userId: session.user.sub });
    revalidateTag(`armies:${session.user.sub}`);

    return { success: true };
}
```

### 4.4 Taint APIs (Preventing Data Leaks)

React 19 provides experimental taint APIs to prevent sensitive values from being passed to Client Components:

```typescript
// src/web/src/dal/users.ts
import { experimental_taintObjectReference, experimental_taintUniqueValue } from 'react';

export async function getUserProfile(userId: string) {
    const user = await db.users.findById(userId);

    // Taint the full object — prevents passing the whole user to a Client Component
    experimental_taintObjectReference('Do not pass the full user object to Client Components. Use a DTO.', user);

    // Taint individual sensitive values
    experimental_taintUniqueValue('Do not pass the auth token to Client Components.', user, user.authToken);

    return user;
}
```

If a Server Component tries to pass `user` (or `user.authToken`) to a Client Component, React throws at render time — catching the leak in development and CI.

> **Current status**: `experimental_taintObjectReference` and `experimental_taintUniqueValue` require `experimental.taint: true` in `next.config.ts`. Enable this in Armoury when adding sensitive data access patterns.

### 4.5 CSRF Protection

Next.js Server Actions have built-in CSRF protection. The framework:

1. Checks the `Origin` header on action requests
2. Rejects cross-origin requests that don't match the application origin
3. Requires requests to include the `Next-Action` header (set automatically by the React client)

**You do not need to add CSRF tokens manually.** Do not add `csrf-token` hidden inputs — they are unnecessary and add complexity.

---

## 5. Data Access Layer (DAL) Pattern

### 5.1 What the DAL Is

The Data Access Layer is a module that centralizes all data access logic behind a single layer. Benefits:

- **Auth checks in one place** — impossible to accidentally bypass authorization
- **DTOs by default** — only safe, minimal fields leave the DAL
- **`React.cache()` deduplication** — multiple components reading the same data pay one DB roundtrip

The DAL lives at `src/web/src/dal/`.

### 5.2 Structure

```
src/web/src/dal/
├── session.ts       → verifySession() — cached Auth0 session lookup
├── armies.ts        → getArmies(), getArmy(), createArmy(), etc.
├── rosters.ts       → getRoster(), etc.
├── matches.ts       → getMatches(), getMatch(), etc.
└── db.ts            → database client (exported for DAL internals only)
```

### 5.3 `verifySession` — The Authentication Gate

```typescript
// src/web/src/dal/session.ts
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@web/src/lib/auth0.js';

/**
 * Returns the current session. Redirects to /auth/login if unauthenticated.
 *
 * Wrapped with React.cache() — multiple calls in one render pay one Auth0 lookup.
 * Safe to call at the top of every Server Component and Server Action.
 */
export const verifySession = cache(async () => {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/auth/login');
    }

    return session;
});
```

### 5.4 DAL Functions — Ownership Checks and DTOs

```typescript
// src/web/src/dal/armies.ts
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { verifySession } from '@web/src/dal/session.js';
import { db } from '@web/src/dal/db.js';
import type { ArmyDTO } from '@shared/types/dtos.js';

/**
 * Returns all armies belonging to the current user.
 * Returns DTOs only — internal fields (raw DB rows, metadata) are stripped.
 */
export const getArmies = cache(async (): Promise<ArmyDTO[]> => {
    const session = await verifySession();

    const rows = await db.armies.findByUserId(session.user.sub);

    // Map to DTO — expose only what the UI needs
    return rows.map(toArmyDTO);
});

/**
 * Returns a single army. Throws notFound() if the army doesn't exist
 * or doesn't belong to the current user.
 */
export const getArmy = cache(async (id: string): Promise<ArmyDTO> => {
    const session = await verifySession();

    const row = await db.armies.findById(id);

    // Ownership check — "not found" and "forbidden" return the same error
    // to avoid leaking information about records belonging to other users
    if (!row || row.userId !== session.user.sub) {
        notFound();
    }

    return toArmyDTO(row);
});

// DTO mapper — strips internal fields
function toArmyDTO(row: ArmyRow): ArmyDTO {
    return {
        id: row.id,
        name: row.name,
        faction: row.faction,
        pointsLimit: row.pointsLimit,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
    // Omitted: row.userId, row.deletedAt, row.internalNotes, etc.
}
```

### 5.5 DAL in Server Actions

Server Actions call DAL functions — they don't call `db` directly:

```typescript
// src/web/src/actions/armies.ts
'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { verifySession } from '@web/src/dal/session.js';
import { db } from '@web/src/dal/db.js';

// ✅ verifySession() from DAL — single source of truth for auth
// ✅ Direct db access OK in actions because actions ARE the write path
// ✅ Read access (getArmy, getArmies) should always go through DAL functions

export async function deleteArmy(_prevState: unknown, formData: FormData) {
    const session = await verifySession(); // DAL — with React.cache()

    const id = z.string().uuid().parse(formData.get('id'));

    // Ownership check at the write path
    const army = await db.armies.findById(id);

    if (!army || army.userId !== session.user.sub) {
        return { error: 'Not found.' };
    }

    await db.armies.delete(id);
    revalidateTag(`armies:${session.user.sub}`);
    revalidateTag(`army:${id}`);

    return { success: true };
}
```

### 5.6 DAL Anti-Patterns

| Never Do This                            | Do This Instead                                  |
| ---------------------------------------- | ------------------------------------------------ |
| Call `db` directly in a Server Component | Call a DAL function                              |
| Skip `verifySession()` in a DAL function | Call it first, always                            |
| Pass raw DB rows to Client Components    | Return DTOs                                      |
| Rely on route-level auth alone           | Always check ownership at the data level         |
| Return error details in action responses | Return generic messages; log details server-side |

---

## 6. TanStack Query v5 + RSC Streaming

> **Note:** [REACT_QUERY.md §4](./REACT_QUERY.md#4-ssr--rsc-integration) covers the `HydrationBoundary` + `dehydrate` pattern. This section covers streaming prefetch and pending query dehydration (v5.40+), which are not in that document.

### 6.1 Recap: The Standard SSR Pattern

Server Component creates a `QueryClient`, prefetches, dehydrates into `HydrationBoundary`. Client Component calls `useQuery` with the same options — data is in cache, no loading state. Covered fully in [REACT_QUERY.md §4](./REACT_QUERY.md#4-ssr--rsc-integration).

### 6.2 Streaming Prefetch (v5.40+)

In TanStack Query v5.40+, you can pass a **pending Promise** to `prefetchQuery` and dehydrate it while it's still in-flight. The client receives the hydrated pending state and waits for the promise to stream in — enabling sub-waterfall performance.

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx (Server Component)
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { armyListOptions } from '@shared/frontend/armies/queries.js';

export default async function ArmiesPage() {
    const queryClient = new QueryClient();

    // Do NOT await — pass the pending promise to prefetchQuery
    // The dehydrated state includes the pending promise reference
    void queryClient.prefetchQuery(armyListOptions({}));

    return (
        // dehydrate() captures the pending promise — client receives it streaming
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ArmyListView />
        </HydrationBoundary>
    );
}
```

> **When to use awaited vs. non-awaited prefetch:**
>
> - **`await prefetchQuery`** — server waits for data before sending HTML. Best for critical above-the-fold content.
> - **`void prefetchQuery`** (pending dehydration) — server streams HTML immediately; data races the HTML to the client. Best for secondary content, long-loading data.

### 6.3 Multiple Parallel Prefetches

```typescript
// app/[locale]/[gameSystem]/(app)/armies/[id]/page.tsx (Server Component)
export default async function ArmyDetailPage({ params }) {
    const { id } = await params;
    const queryClient = new QueryClient();

    // Parallel awaited prefetches — both must resolve before HTML streams
    await Promise.all([
        queryClient.prefetchQuery(armyDetailOptions(id)),
        queryClient.prefetchQuery(rosterOptions(id)),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ArmyDetailView id={id} />
        </HydrationBoundary>
    );
}
```

### 6.4 Choosing: Server Action vs. `useMutation`

This is the most common architecture decision when adding a write operation:

| Use Server Action when…                           | Use `useMutation` when…                             |
| ------------------------------------------------- | --------------------------------------------------- |
| Form submission (progressive enhancement matters) | Complex client-side flow (multi-step, conditional)  |
| No client-side optimistic UI needed               | Optimistic updates with rollback are required       |
| Simple fire-and-forget write                      | Need `isPending`, `isError`, `reset()` in component |
| Want to `revalidate` Next.js cache                | Need React Query cache invalidation only            |
| Action runs once, then redirects                  | Action can be retried from the UI                   |

You can also **compose both**: call a Server Action from within a `useMutation.mutationFn`:

```typescript
// Compose Server Action + React Query mutation for optimistic updates + server cache invalidation
export function useRenameArmy() {
    const queryClient = useQueryClient();

    return useMutation({
        // mutationFn calls the Server Action — gets auth + DB write + revalidateTag
        mutationFn: (vars: { id: string; name: string }) => {
            const formData = new FormData();
            formData.set('id', vars.id);
            formData.set('name', vars.name);
            return renameArmy(null, formData);
        },

        onMutate: async ({ id, name }) => {
            await queryClient.cancelQueries({ queryKey: armyDetailOptions(id).queryKey });
            const prev = queryClient.getQueryData<Army>(armyDetailOptions(id).queryKey);
            queryClient.setQueryData<Army>(armyDetailOptions(id).queryKey, (old) => (old ? { ...old, name } : old));
            return { prev };
        },

        onError: (_err, { id }, context) => {
            if (context?.prev) {
                queryClient.setQueryData(armyDetailOptions(id).queryKey, context.prev);
            }
        },

        onSettled: async (_data, _err, { id }) => {
            await queryClient.invalidateQueries({ queryKey: armyDetailOptions(id).queryKey });
        },
    });
}
```

---

## 7. Cache Invalidation Across Boundaries

When a write happens, two separate caches may need invalidation:

| Cache                  | Owner                    | Invalidation API                      |
| ---------------------- | ------------------------ | ------------------------------------- |
| **Next.js data cache** | Server (Node.js process) | `revalidateTag()`, `revalidatePath()` |
| **React Query cache**  | Client (browser memory)  | `queryClient.invalidateQueries()`     |

### 7.1 Server-Side: `revalidateTag` and `revalidatePath`

Call from within Server Actions after a successful write:

```typescript
'use server';

export async function createArmy(_prevState: unknown, formData: FormData) {
    const session = await verifySession();
    // ... validate, authorize, write ...

    // Invalidate the army list tag — any fetch() with this tag is re-fetched
    revalidateTag(`armies:${session.user.sub}`);

    // Optionally invalidate a specific path (full-page re-render on next visit)
    revalidatePath(`/armies`);

    return { success: true };
}
```

**Tagging fetches** so they can be invalidated:

```typescript
// src/web/src/dal/armies.ts
export const getArmies = cache(async (): Promise<ArmyDTO[]> => {
    const session = await verifySession();

    // Tag the fetch — revalidateTag('armies:userId') will bust this
    const rows = await fetch(`/api/armies?userId=${session.user.sub}`, {
        next: { tags: [`armies:${session.user.sub}`] },
    }).then((r) => r.json());

    return rows.map(toArmyDTO);
});
```

> **`revalidatePath` vs. `revalidateTag`**: Prefer `revalidateTag` — it is surgical and only busts affected data. `revalidatePath` re-renders the entire route, which is expensive and often unnecessarily broad.

### 7.2 Client-Side: `queryClient.invalidateQueries()`

After a Server Action completes successfully and the page re-renders (via `revalidateTag`), the client's React Query cache may still hold stale data. Invalidate it from the component:

```typescript
// src/web/src/components/armies/RenameArmyForm.tsx
'use client';

import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { renameArmy } from '@web/src/actions/armies.js';
import { armyKeys } from '@shared/frontend/armies/queries.js';

export function RenameArmyForm({ army }: Props) {
    const queryClient = useQueryClient();
    const [state, action, isPending] = useActionState(renameArmy, null);

    // When the action succeeds, invalidate the React Query cache
    useEffect(() => {
        if (state?.success) {
            void queryClient.invalidateQueries({ queryKey: armyKeys.detail(army.id) });
        }
    }, [state?.success, army.id, queryClient]);

    return (
        <form action={action}>
            {/* ... */}
        </form>
    );
}
```

### 7.3 Coordination Pattern: Full Consistency

For complete consistency between the Next.js data cache and the React Query cache:

```typescript
// Server Action (src/web/src/actions/armies.ts):
// 1. Write to DB
// 2. revalidateTag() — busts Next.js cache for affected data

// Client Component (after action completes):
// 3. queryClient.invalidateQueries() — busts React Query cache

// Result:
// - Next.js re-fetches from DB on next server render
// - React Query refetches from server on next component mount/focus
// - No stale data visible to the user
```

**When to invalidate only Next.js cache (skip React Query)**: If the component does not use `useQuery` for this data (e.g., it receives data as props from a Server Component), React Query invalidation is unnecessary.

**When to invalidate only React Query cache (skip `revalidateTag`)**: If the mutation is purely client-side (no server writes) and you want to force a refetch without a Server Action.

---

## 8. Auth0 Integration in the Rendering Pipeline

### 8.1 Auth0 in Armoury

Auth0 is configured as a singleton client:

```typescript
// src/web/src/lib/auth0.ts
import { Auth0Client } from '@auth0/nextjs-auth0/server';

// All server-side auth operations go through this instance
export const auth0 = new Auth0Client();
```

### 8.2 Middleware: Optimistic Route Protection

The middleware handles Auth0 routes (`/auth/*`) and delegates everything else to i18n:

```typescript
// src/web/middleware.ts
export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Auth0 SDK routes — handled entirely by Auth0 middleware
    if (pathname.startsWith('/auth/')) {
        return (await auth0.middleware(request)) as NextResponse;
    }

    // All other routes — locale detection only
    // NOTE: middleware does NOT check auth for app routes.
    // Auth is verified in Server Components and Server Actions via verifySession().
    return intlMiddleware(request);
}
```

> **Why middleware doesn't protect app routes**: The `auth0.middleware()` call for non-auth routes adds latency without meaningful benefit — the Server Component re-verifies auth anyway via `verifySession()`. The middleware is intentionally minimal.

### 8.3 Server Components: Session Verification

```typescript
// src/web/src/dal/session.ts — called in every protected Server Component and Action
export const verifySession = cache(async () => {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/auth/login'); // Throws — terminates the render
    }

    return session;
});
```

Usage in a page:

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx (Server Component)
export default async function ArmiesPage() {
    // verifySession() redirects if not authenticated — no if-check needed at call site
    const session = await verifySession();

    // session.user.sub is the Auth0 user ID — use for data filtering
    const armies = await getArmies(session.user.sub);

    return <ArmyList armies={armies} />;
}
```

### 8.4 Session in Client Components

Auth session state is not exposed to Client Components directly. If a Client Component needs auth status (e.g., to show a user avatar), fetch it via React Query:

```typescript
// src/shared/frontend/auth/queries.ts (pure TypeScript — no React)
import { queryOptions } from '@tanstack/react-query';

// staleTime: 0 — auth state must always be fresh (FE-072)
export const sessionOptions = () =>
    queryOptions({
        queryKey: ['auth', 'session'],
        queryFn: () => fetch('/auth/session').then((r) => r.json()),
        staleTime: 0,
        gcTime: 30 * 60 * 1000,
        retry: 0,
    });

// Usage in Client Component:
// const { data: session } = useQuery(sessionOptions());
```

### 8.5 Auth0 Route Handlers

Auth0 v4 automatically handles these routes via `auth0.middleware()`:

| Route            | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `/auth/login`    | Initiates OAuth2 flow                       |
| `/auth/logout`   | Logs out and clears session cookie          |
| `/auth/callback` | OAuth2 callback — exchanges code for tokens |

No manual route handlers are needed. Do not create `app/auth/*/route.ts` files.

---

## 9. Decision Trees

### 9.1 Server Component vs. Client Component

```
Does this component need interactivity (onClick, onChange, form state)?
├── YES → 'use client'
│         └── Can you push the boundary deeper (wrap only the interactive part)?
│               └── YES → Do it. Keep the parent a Server Component.
└── NO
    Does it need hooks (useState, useEffect, useQuery, etc.)?
    ├── YES → 'use client'
    └── NO
        Does it access backend resources (DB, secrets, session)?
        ├── YES → Server Component (default)
        └── NO
            Does it need browser APIs (localStorage, window, navigator)?
            ├── YES → 'use client'
            └── NO → Server Component (default — no JS shipped)
```

### 9.2 Server Action vs. `useMutation`

```
Is this a form submission (user presses a submit button)?
├── YES → Server Action + useActionState
│         └── Need optimistic UI?
│               ├── YES → Compose: useMutation → mutationFn calls Server Action
│               └── NO  → Server Action alone (useOptimistic if needed)
└── NO
    Is it triggered programmatically (button click, drag, keyboard)?
    └── YES → useMutation (from @tanstack/react-query)
              └── Need server cache invalidation?
                    ├── YES → Call revalidateTag inside a Server Action that mutationFn invokes
                    └── NO  → useMutation + queryClient.invalidateQueries() is sufficient
```

### 9.3 State Tier for a New Piece of State

```
Is it server/remote data (API response, DB rows)?
└── YES → React Query (Tier 3) — see REACT_QUERY.md

Is it derived from server data (computed, filtered, sorted)?
└── YES → Compute inline or useMemo — see DERIVED_STATE.md

Is it local to one component (open/closed, input value)?
└── YES → useState (Tier 1)

Is it URL-addressable (selected tab, filter, page number)?
└── YES → URL params (Tier 2) — useSearchParams / router.push

Is it global, reactive, or updated by WebSocket/external events?
└── YES → RxJS BehaviorSubject (Tier 4) — see RXJS_STATE.md

Does it need to cross a provider boundary without prop drilling (theme, feature flags)?
└── YES → React Context (Tier 5) — only when RxJS is overkill
```

---

## 10. Auditing Checklist

Use this checklist when reviewing Server Actions or RSC-heavy pages.

### Server Action Review

- [ ] `verifySession()` called at the top — before any data access
- [ ] All `formData` values validated with Zod `safeParse` before use
- [ ] Ownership/authorization verified at the resource level (not just presence)
- [ ] Generic error messages returned — no stack traces, no record IDs in error responses
- [ ] `revalidateTag()` / `revalidatePath()` called after successful writes
- [ ] No secrets returned in the action response (tokens, private fields)
- [ ] No `console.log` with sensitive values left in

### RSC Page Review

- [ ] `'use client'` is as deep as possible — not on the page or layout
- [ ] Server Components do not pass non-serializable props (functions, Dates, class instances) to Client Components
- [ ] Data access goes through DAL functions — not raw `db` calls
- [ ] Independent data fetches use `Promise.all`, not sequential `await`
- [ ] `<Suspense>` boundaries placed around async Server Components
- [ ] `verifySession()` called (directly or via DAL) — no unauthenticated data access

### TanStack Query SSR Review

- [ ] `staleTime > 0` on every `queryOptions` used in SSR prefetch
- [ ] `HydrationBoundary` wraps the Client Component subtree that calls `useQuery`
- [ ] `dehydrate(queryClient)` passed to `HydrationBoundary state` prop
- [ ] Client Component uses the **same** `queryOptions` factory as the server prefetch
- [ ] `queryClient.invalidateQueries()` called after successful Server Action (if component uses `useQuery`)

### Security Review

- [ ] No sensitive values closed over in Server Actions without `'use server'` in module scope
- [ ] `.bind()` used only for opaque IDs — no secrets bound
- [ ] Taint APIs applied to objects containing sensitive fields (if `experimental.taint` is enabled)
- [ ] Auth routes (`/auth/*`) handled by Auth0 middleware — no manual session management in route handlers

---

## 11. Route Rendering Modes (Static / Dynamic / PPR)

Every Next.js route falls into one of three rendering modes. Choosing the right mode is the highest-leverage rendering decision you can make.

### 11.1 The Three Modes at a Glance

| Mode                           | When HTML is Generated                             | Dynamic APIs Allowed                 | Use Case                                          |
| ------------------------------ | -------------------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Static**                     | Build time (or ISR background)                     | ❌ No cookies, headers, searchParams | Public reference content, game datasheets         |
| **Dynamic**                    | Request time (every request)                       | ✅ Full access                       | Per-user pages, authenticated content             |
| **PPR** (Partial Prerendering) | Static shell at build + dynamic islands at request | ✅ Inside `<Suspense>` boundaries    | Mixed pages (public shell + personalised islands) |

### 11.2 What Forces Dynamic Rendering

Next.js opts a route into **dynamic rendering** the moment any of these APIs are called — unless the call is inside a `'use cache'` function:

| API                                            | Why It Forces Dynamic                  |
| ---------------------------------------------- | -------------------------------------- |
| `cookies()`                                    | Value unknown at build time            |
| `headers()`                                    | Value unknown at build time            |
| `searchParams` prop                            | Value unknown at build time            |
| `connection()`                                 | Explicit dynamic opt-in                |
| `noStore()` (legacy)                           | Explicit opt-out of caching            |
| `fetch()` without `cache` option (Next.js 15+) | Uncached `fetch` is dynamic by default |

> **Breaking change in Next.js 15**: `fetch()` is **no longer cached by default**. In Next.js 14, `fetch()` was force-cached. In Next.js 15+, you must explicitly pass `cache: 'force-cache'` or use the `'use cache'` directive to opt into caching.

### 11.3 Route Segment Config

These module-level exports control a route's rendering mode directly. Prefer `'use cache'` (§13) for fine-grained control; use segment config only when you need a route-wide override:

```typescript
// app/[locale]/[gameSystem]/reference/[id]/page.tsx

// Force static — error if dynamic APIs are used
export const dynamic = 'force-static';

// Force dynamic — skip all caching
export const dynamic = 'force-dynamic';

// Time-based revalidation (ISR) — seconds
export const revalidate = 3600; // 1 hour

// Control fallback behavior for generateStaticParams misses
export const dynamicParams = true; // 404 misses rendered on-demand (default)
export const dynamicParams = false; // 404 misses return 404 immediately
```

### 11.4 Partial Prerendering (PPR)

PPR is the recommended model for pages that mix static and dynamic content. The **static shell** (layout, navigation, reference data) is generated at build time. **Dynamic islands** (user data, real-time content) are streamed at request time via `<Suspense>` boundaries.

Enable PPR in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
    experimental: {
        ppr: true,
    },
};
```

Then opt individual routes in:

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx
export const experimental_ppr = true;

export default function ArmiesPage() {
    return (
        <>
            {/* Static shell — rendered at build time, zero latency */}
            <GameSystemHeader />
            <FactionFilterBar />

            {/* Dynamic island — streamed at request time */}
            <Suspense fallback={<ArmySkeleton />}>
                <UserArmyList /> {/* calls verifySession() — dynamic */}
            </Suspense>
        </>
    );
}
```

> **Key PPR constraint**: Any component that calls a Dynamic API (cookies, headers, searchParams) **must** be inside a `<Suspense>` boundary when `experimental_ppr` is enabled. Otherwise Next.js throws a build error.

---

## 12. Static Generation and ISR

### 12.1 `generateStaticParams` — Pre-building Dynamic Routes

`generateStaticParams` tells Next.js which path segments to pre-build at compile time. Without it, dynamic route segments (`[id]`, `[slug]`) are rendered on first request.

```typescript
// app/[locale]/[gameSystem]/reference/[unitId]/page.tsx

import { fetchAllUnits } from '@shared/providers/bsdata/index.js';

/**
 * Pre-build pages for all known unit IDs.
 * Next.js calls this at build time; the returned params list determines
 * which pages are statically generated.
 */
export async function generateStaticParams() {
    const units = await fetchAllUnits();

    return units.map((unit) => ({ unitId: unit.id }));
}

// 404 for any unitId not returned above — no on-demand fallback
export const dynamicParams = false;

// Revalidate every 24 hours (ISR)
export const revalidate = 86400;

export default async function UnitReferencePage({
    params,
}: {
    params: Promise<{ unitId: string; gameSystem: string }>;
}) {
    const { unitId, gameSystem } = await params;
    const unit = await getUnit(gameSystem, unitId);

    return <UnitDatasheet unit={unit} />;
}
```

### 12.2 Nested `generateStaticParams`

For nested dynamic segments, each segment level exports its own `generateStaticParams`. The parent's results are passed as `parentParams` to the child:

```typescript
// app/[locale]/[gameSystem]/reference/[factionId]/[unitId]/page.tsx

// Parent segment: app/[locale]/[gameSystem]/reference/[factionId]/layout.tsx
export async function generateStaticParams() {
    const factions = await fetchFactions();
    return factions.map((f) => ({ factionId: f.id }));
}

// Child segment: page.tsx
export async function generateStaticParams({ params: { factionId } }: { params: { factionId: string } }) {
    // Only called for factionIds returned by parent — reduces redundant fetches
    const units = await fetchUnitsByFaction(factionId);
    return units.map((u) => ({ unitId: u.id }));
}
```

### 12.3 ISR — Stale-While-Revalidate

**Time-based ISR** (`revalidate`): Serve cached immediately, trigger background revalidation after the interval expires. The stale page is served until the new one is ready.

```typescript
// Route that revalidates at most once per hour
export const revalidate = 3600;

// OR per-fetch (overrides route-level setting for this specific data):
const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
});
```

**On-demand ISR** (`revalidateTag`, `revalidatePath`): Trigger revalidation immediately from a Server Action or Webhook route handler when source data changes.

```typescript
// app/api/webhooks/bsdata/route.ts — called by BattleScribe data update webhook
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { gameSystem } = await request.json();

    // Revalidate all pages tagged with this game system's reference data
    revalidateTag(`reference:${gameSystem}`);

    return NextResponse.json({ revalidated: true });
}

// In the DAL function that fetches reference data:
const units = await fetch(`https://bsdata.example.com/${gameSystem}/units`, {
    next: { tags: [`reference:${gameSystem}`, 'reference'] },
});
```

### 12.4 ISR Semantics: Serve-Then-Refresh vs. Refresh-Then-Serve

```
Stale-While-Revalidate (revalidate > 0):
  Request 1 → Serve cached (instant) → Background: re-fetch → Update cache
  Request 2 → Serve updated cached page

On-Demand (revalidateTag):
  Webhook fires → Cache entry marked stale → Next request triggers fresh fetch
  → Background re-fetch happens → Page updated

ISR Error Fallback:
  If the re-fetch fails → Continue serving the stale cache
  → Do NOT serve an error page — stale data beats a 500
```

> **When to use time-based vs. on-demand ISR for Armoury:**
>
> - **Game datasheets** (units, factions, abilities): on-demand ISR triggered by BattleScribe data update webhook. Cache is authoritative until an update fires.
> - **Match results / army lists**: user-specific, dynamic — no ISR. Always dynamic rendering.
> - **Campaign rules / game system docs**: time-based ISR (daily revalidation). Updates are infrequent; webhook overhead is not justified.

### 12.5 Tag Naming Conventions for Armoury

Use a consistent hierarchy so on-demand invalidation is surgical:

```typescript
// Reference data (public, game-system-scoped)
`reference` // invalidates ALL reference data
`reference:${gameSystem}` // invalidates all data for one game system
`reference:${gameSystem}:unit` // invalidates all units for one game system
`reference:${gameSystem}:unit:${id}` // invalidates one specific unit
// User data (private, user-scoped) — used with revalidateTag in Server Actions
`armies:${userId}` // invalidates all armies for a user
`army:${armyId}` // invalidates one specific army
`roster:${armyId}`; // invalidates one army's roster
```

### 12.6 `dynamicParams` — The Fallback Replacement

| `dynamicParams` Value | Behaviour for Missing Params                     | Pages Router Equivalent                                        |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `true` (default)      | Generated on-demand at request time, then cached | `fallback: 'blocking'` (but streams via Suspense, no blocking) |
| `false`               | Returns 404 immediately                          | `fallback: false`                                              |

> **No Pages Router `fallback: true` equivalent.** There is no built-in "show a fallback skeleton while generating" mode. Instead, use `dynamicParams = true` with a `loading.tsx` or `<Suspense>` boundary — the streaming model replaces the old fallback UI pattern.

### 12.7 `fetchCache` — Route Segment Config for Bulk Fetch Control

When you cannot control individual `fetch()` calls (e.g., third-party SDK), `fetchCache` overrides caching behavior for all fetches in a route segment:

```typescript
// app/[locale]/[gameSystem]/reference/layout.tsx

// Force all fetches in this segment to cache — even if the SDK doesn't set cache options
export const fetchCache = 'force-cache';
```

| Value                | Behaviour                                                        |
| -------------------- | ---------------------------------------------------------------- |
| `'auto'` (default)   | Each fetch's own `cache` option is respected                     |
| `'default-cache'`    | Cache unless the caller explicitly opts out with `no-store`      |
| `'only-cache'`       | Error if any fetch uses `no-store`                               |
| `'force-cache'`      | Force-cache all fetches, ignoring individual `no-store`          |
| `'default-no-store'` | No-store unless the caller explicitly opts in with `force-cache` |
| `'only-no-store'`    | Error if any fetch uses `force-cache`                            |
| `'force-no-store'`   | No-store all fetches, ignoring individual `force-cache`          |

> ⚠️ **Cross-segment compatibility**: A parent segment with `'default-no-store'` cannot coexist with a child using `'auto'` or any `*-cache` variant. Keep shared parent layouts at `'auto'`; customize in leaf pages only.

### 12.8 `unstable_cache` — Caching Non-Fetch Data (ORM, SDK)

When your data comes from an ORM (Drizzle, Prisma), a direct database call, or a third-party SDK that doesn't use `fetch()`, wrap it with `unstable_cache` to participate in the Data Cache:

```typescript
// src/web/src/dal/factions.ts
import { unstable_cache } from 'next/cache';
import { db } from '@web/src/dal/db.js';

/**
 * Cached faction lookup. Participates in the Data Cache — tagged for on-demand invalidation.
 *
 * @requirements Must tag with game system for surgical cache busting.
 */
export const getCachedFactions = unstable_cache(
    async (gameSystem: string) => {
        return db.factions.findByGameSystem(gameSystem);
    },
    ['factions-by-system'], // cache key parts (appended to function args)
    {
        revalidate: 86400, // 24h time-based fallback
        tags: ['factions'], // on-demand: revalidateTag('factions')
    },
);
```

> ⚠️ **Closure variable gotcha**: Do NOT reference closure variables inside `unstable_cache` that aren't part of the cache key. The cache key is derived from the `keyParts` array + serialized function arguments. Closure variables are invisible to the cache key, causing stale data when the closure changes.

```typescript
// ❌ WRONG — gameSystem is a closure variable, not a cache key input
function makeCachedGetter(gameSystem: string) {
    return unstable_cache(
        async () => db.factions.findByGameSystem(gameSystem), // closure over gameSystem
        ['factions'],
        { tags: [`factions:${gameSystem}`] }, // tag uses closure too — same problem
    );
}

// ✅ CORRECT — gameSystem is a function argument, included in cache key automatically
export const getCachedFactions = unstable_cache(
    async (gameSystem: string) => db.factions.findByGameSystem(gameSystem),
    ['factions-by-system'],
    { revalidate: 86400, tags: ['factions'] },
);
// Invalidate per-system: pass system-specific tags via cacheTag() inside the function,
// or invalidate the broad 'factions' tag.
```

> ⚠️ **No Dynamic APIs inside `unstable_cache`**: Do not call `cookies()`, `headers()`, or other Dynamic APIs inside the cached function. Read them outside and pass values as arguments:

```typescript
// ❌ WRONG — cookies() inside unstable_cache behaves unexpectedly
const getCachedUserData = unstable_cache(async () => {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    return db.users.findById(userId!);
}, ['user-data']);

// ✅ CORRECT — read cookies outside, pass as argument
const getCachedUserData = unstable_cache(async (userId: string) => db.users.findById(userId), ['user-data'], {
    tags: ['users'],
});

// In Server Component:
const cookieStore = await cookies();
const userId = cookieStore.get('userId')?.value ?? '';
const user = await getCachedUserData(userId);
```

### 12.9 `revalidate` Minimum-Wins Rule

When multiple layers set `revalidate`, the **lowest value wins**:

```typescript
// layout.tsx: export const revalidate = 3600;  // 1 hour
// page.tsx:   export const revalidate = 60;    // 1 minute
// ↳ Route revalidates every 60 seconds (page wins because it's lower)

// A fetch inside the page with next: { revalidate: 30 } pushes it even lower.
// The entire route revalidates every 30 seconds.
```

> ⚠️ **`revalidate` must be a static literal number.** Expressions like `60 * 10` are not statically analyzable and will be rejected at build time. Use `600` directly.

---

## 13. The 4-Layer Cache Architecture

Next.js 15 has four distinct caches. Understanding their interaction is essential for avoiding stale data, double-fetching, and cache misses.

### 13.1 Cache Layer Overview

```
Request → [1. Request Memoization] → [2. Data Cache] → [3. Full Route Cache] → [4. Router Cache] → User
```

| Layer                      | Where                   | Duration          | What It Caches                                                   | Invalidation                                                               |
| -------------------------- | ----------------------- | ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **1. Request Memoization** | Server (per-render)     | Single request    | `React.cache()` results, duplicate `fetch()` calls               | Automatic — cleared after each render                                      |
| **2. Data Cache**          | Server (persistent)     | Until revalidated | `fetch()` responses tagged with `next.tags` or `next.revalidate` | `revalidateTag()`, `revalidatePath()`, time-based TTL                      |
| **3. Full Route Cache**    | Server (persistent)     | Until revalidated | Rendered HTML + RSC Payload for static routes                    | `revalidatePath()`, `revalidateTag()` on any tagged data used by the route |
| **4. Router Cache**        | Client (browser memory) | Session           | RSC Payloads for already-visited routes                          | `router.refresh()`, Server Action completion, `revalidatePath()`           |

### 13.2 Layer 1: Request Memoization

`React.cache()` deduplicates calls **within a single server render**. If three components each call `getArmies()` during the same request, only one DB query executes.

```typescript
// src/web/src/dal/armies.ts
import { cache } from 'react';

// Wrapped with React.cache() — safe to call from multiple components in one render
export const getArmies = cache(async (): Promise<ArmyDTO[]> => {
    const session = await verifySession(); // also React.cache() — one Auth0 lookup
    return db.armies.findByUserId(session.user.sub);
});
```

**Scope**: Request Memoization is automatically cleared between requests. It does not persist across deploys or requests.

**Important**: `React.cache()` is **not** the same as the Next.js Data Cache. It deduplicates within a render tree, not across requests.

### 13.3 Layer 2: Data Cache

The Data Cache persists `fetch()` responses on the server across requests. Tag-based invalidation (`revalidateTag`) or time-based (`revalidate`) refreshes specific entries.

```typescript
// In a DAL function — fetch with cache tags
const units = await fetch(`https://bsdata.example.com/${gameSystem}/units`, {
    // Tag this response — revalidateTag('reference:wh40k10e') will bust it
    next: { tags: [`reference:${gameSystem}`, `reference:${gameSystem}:unit`] },
    // Optional time-based TTL (ISR) — revalidate after 1 hour regardless
    // next: { revalidate: 3600 },
});

// Fetch that bypasses the Data Cache entirely (dynamic):
const dynamicData = await fetch('/api/live-data', { cache: 'no-store' });
```

**Next.js 15 default**: `fetch()` with no `cache` or `next` option is **not cached** (dynamic). This is a breaking change from Next.js 14, where `fetch()` was force-cached by default.

```typescript
// Next.js 14 behavior (deprecated):
const data = await fetch('/api/data'); // cached by default

// Next.js 15+ behavior:
const data = await fetch('/api/data'); // NOT cached (dynamic)
const data = await fetch('/api/data', { cache: 'force-cache' }); // cached
const data = await fetch('/api/data', { next: { tags: ['data'] } }); // cached + taggable
```

### 13.4 Layer 3: Full Route Cache

The Full Route Cache stores the **complete rendered output** (HTML + RSC Payload) of static routes. It is populated at build time (for `generateStaticParams` routes) or on first request (for ISR routes).

- Only applies to **statically rendered** routes. Dynamic routes are never Full Route Cached.
- Invalidated when `revalidateTag()` or `revalidatePath()` marks any tagged data used by the route as stale.
- After invalidation, the next request triggers a fresh render and repopulates the cache.

### 13.5 Layer 4: Router Cache (Client-Side)

The Router Cache stores RSC Payloads in the browser for routes the user has already visited. It enables instant back/forward navigation and prefetching.

**Next.js 15 breaking change**: Pages are **no longer cached by default** in the Router Cache (was 5 minutes in Next.js 14). Layouts are still cached. Prefetched routes are cached for 5 minutes.

```typescript
// Restore old behavior (not recommended — stale data risk):
// next.config.ts
export default {
    experimental: {
        staleTimes: {
            dynamic: 30, // cache dynamic pages for 30s
            static: 180, // cache static pages for 3min
        },
    },
};

// Programmatic invalidation (use after mutations):
import { useRouter } from 'next/navigation';
const router = useRouter();
router.refresh(); // Clears Router Cache and re-fetches from server
```

**Server Actions automatically invalidate** the Router Cache for the current route when they call `revalidatePath()` or `revalidateTag()`. The client sees updated data without a manual `router.refresh()`.

### 13.6 Cache Interaction Matrix

| Operation                              | Layer 1 (Memoization) | Layer 2 (Data Cache)             | Layer 3 (Full Route)                 | Layer 4 (Router)                           |
| -------------------------------------- | --------------------- | -------------------------------- | ------------------------------------ | ------------------------------------------ |
| `React.cache()` function call          | ✅ Deduplicated       | —                                | —                                    | —                                          |
| `fetch()` with `next.tags`             | ✅ Deduplicated       | ✅ Cached + tagged               | ✅ Route is static                   | —                                          |
| `fetch()` with `next.revalidate`       | ✅ Deduplicated       | ✅ Cached + TTL                  | ✅ Route is ISR                      | —                                          |
| `fetch()` with `cache: 'force-cache'`  | ✅ Deduplicated       | ✅ Cached (no tag/TTL)           | ✅ Route is static                   | —                                          |
| `fetch()` with `cache: 'no-store'`     | ✅ Deduplicated       | ❌ Bypassed                      | ❌ Route becomes dynamic             | —                                          |
| `unstable_cache()` wrapped function    | —                     | ✅ Cached + tagged               | — (doesn't affect route mode)        | —                                          |
| `generateStaticParams` route render    | —                     | ✅ Used if available             | ✅ Cached at build                   | ✅ Prefetched on `<Link>`                  |
| Dynamic route render (cookies/headers) | —                     | —                                | ❌ Not cached                        | ❌ Not prefetchable                        |
| `revalidateTag(tag)`                   | —                     | ✅ Busted (matching tags)        | ✅ Busted (routes using tagged data) | ✅ Busted (current route in Server Action) |
| `revalidatePath(path)`                 | —                     | ✅ Busted (all entries for path) | ✅ Busted (that route)               | ✅ Busted (that route)                     |
| `revalidatePath('/', 'layout')`        | —                     | ✅ Busted (all entries)          | ✅ Busted (all routes)               | ✅ Busted (all routes)                     |
| Server Action completes                | —                     | —                                | —                                    | ✅ Current route cleared                   |
| `router.refresh()`                     | —                     | —                                | —                                    | ✅ Current route cleared                   |
| `<Link prefetch={true}>`               | —                     | —                                | —                                    | ✅ Full route prefetched (5 min)           |
| `<Link prefetch={false}>`              | —                     | —                                | —                                    | ❌ No prefetch                             |
| `<Link>` (default)                     | —                     | —                                | —                                    | ✅ Shared layout prefetched                |

### 13.7 Data Cache Opt-Out Mechanisms

There are multiple ways to bypass the Data Cache. Understanding the scope of each is critical for avoiding unexpected dynamic rendering:

| Mechanism                                       | Scope                  | Effect                                                           | Use When                                           |
| ----------------------------------------------- | ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `cache: 'no-store'` on individual `fetch()`     | Single fetch           | That fetch bypasses Data Cache; **makes entire route dynamic**   | One fetch must be fresh but others can be cached   |
| `unstable_noStore()` from `next/cache`          | Function scope         | Marks calling function as dynamic; entire route becomes dynamic  | ORM/SDK call that must not be cached               |
| `fetchCache = 'force-no-store'` (route segment) | All fetches in segment | Every `fetch()` in the segment bypasses Data Cache               | Entire route must be dynamic (e.g., dashboard)     |
| `dynamic = 'force-dynamic'` (route segment)     | Entire route           | Route is always server-rendered; all Data Cache entries bypassed | Force dynamic for routes that read cookies/headers |
| `noStore()` from `next/cache` (deprecated)      | Function scope         | Same as `unstable_noStore()` — legacy alias                      | Don't use — prefer `unstable_noStore()`            |

> ⚠️ **Cascade rule**: Any single `cache: 'no-store'` fetch or `unstable_noStore()` call makes the entire route dynamic. You cannot have a "partially cached" route — either all fetches participate in the Data Cache (static/ISR) or the route is fully dynamic. PPR is the only exception: `<Suspense>` boundaries can isolate dynamic sections while keeping the shell static.

```typescript
// src/web/src/dal/matches.ts
import { unstable_noStore } from 'next/cache';

/**
 * Match data is always fresh — never cached in the Data Cache.
 * Calling this function makes the consuming route dynamic.
 */
export async function getActiveMatch(matchId: string) {
    unstable_noStore(); // explicit opt-out
    return db.matches.findById(matchId);
}
```

### 13.8 Router Cache `staleTimes` Deep Dive

The Router Cache has two distinct TTL categories that control how long RSC Payloads are cached client-side. Next.js 15 changed the defaults significantly:

| Property  | Next.js 14 Default | Next.js 15 Default                                    | Controls                                                                         |
| --------- | ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `dynamic` | 30 seconds         | **0 seconds**                                         | Pages without `generateStaticParams` or routes that read `cookies()`/`headers()` |
| `static`  | 5 minutes          | **0 seconds** for pages, **5 minutes** for prefetched | Pages with `generateStaticParams` or no dynamic APIs                             |

**What this means for Armoury**:

- **Reference pages** (`/reference/[gameSystem]/[unitId]`): Prefetched links stay in Router Cache for 5 minutes. Direct navigation fetches fresh data every time.
- **App pages** (`/(app)/armies`): Zero Router Cache by default — every navigation triggers a server roundtrip. This is correct for user-specific data.
- **Marketing pages** (`/(marketing)`): Zero Router Cache on direct navigation; 5 minutes on prefetched links.

```typescript
// next.config.ts — Armoury recommended configuration
// We do NOT override staleTimes. The v15 defaults are correct for our use case:
// - User-specific routes (armies, matches, campaigns) should never be stale
// - Reference routes get 5-min prefetch cache, which is fine for shared data
// - If we need to override, here's how:
//
// export default {
//     experimental: {
//         staleTimes: {
//             dynamic: 0,    // keep at 0 — user data must be fresh
//             static: 300,   // 5 min for reference pages (already the prefetch default)
//         },
//     },
// };
```

**Three ways the Router Cache is cleared:**

1. **`router.refresh()`** — Clears Router Cache for the current route and refetches from server. Use after client-side mutations that bypass Server Actions.
2. **Server Action with `revalidatePath()`/`revalidateTag()`** — Automatically clears Router Cache for affected routes. The recommended approach.
3. **TTL expiration** — Entries expire based on `staleTimes` config. With v15 defaults, dynamic pages expire immediately.

> **Prefetch behavior**: `<Link>` components prefetch by default on viewport entry. The prefetched payload is the **shared layout** segment (not the full page) unless `prefetch={true}` is explicitly set, which prefetches the full route. Prefetched data lives in the Router Cache for 5 minutes regardless of `staleTimes.static`.

---

## 14. Streaming, `loading.js`, and `after()`

### 14.1 How Streaming Works

When Next.js renders a page, it streams HTML progressively. Components wrapped in `<Suspense>` are **non-blocking** — the server sends the surrounding HTML immediately and streams in the suspended content when it resolves.

```
Time →
[Shell HTML + fallback]─────────────────[<ul> with army rows]
                         ^ Suspense fallback shown here
                                          ^ Data resolved; out-of-order chunk sent
```

The client progressively renders as chunks arrive — no full-page spinner, no wait for the slowest piece of data.

### 14.2 `loading.js` — Automatic Route-Level Suspense

`loading.js` in the `app/` directory creates an automatic `<Suspense>` boundary around the page. It shows while the page's Server Components are resolving:

```typescript
// app/[locale]/[gameSystem]/(app)/armies/loading.tsx
// Shown instantly while ArmiesPage (async Server Component) is resolving
export default function ArmiesLoading() {
    return (
        <main>
            <h1>Armies</h1>
            <ArmyGridSkeleton rows={6} />
        </main>
    );
}
```

**When to use `loading.js` vs. inline `<Suspense>`**:

| Use `loading.js`                                         | Use inline `<Suspense>`                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| Entire page is async and needs a full-page loading state | Only part of the page is async (above-the-fold renders immediately) |
| Simple routes where all content loads together           | PPR routes with multiple independent async sections                 |
| Navigation-level feedback (user clicked a link)          | Component-level streaming within a page                             |

### 14.3 Parallel Data Fetching with Independent `<Suspense>` Boundaries

For pages with multiple independent data sections, use separate `<Suspense>` boundaries so a slow fetch in one section does not block others:

```typescript
// app/[locale]/[gameSystem]/(app)/armies/[id]/page.tsx
export default async function ArmyDetailPage({ params }) {
    const { id } = await params;

    return (
        <main>
            {/* These two sections stream in independently */}
            <Suspense fallback={<ArmyHeaderSkeleton />}>
                <ArmyHeader id={id} />       {/* fast — minimal data */}
            </Suspense>

            <Suspense fallback={<RosterSkeleton />}>
                <RosterEditor id={id} />     {/* slow — full unit data */}
            </Suspense>

            <Suspense fallback={<MatchHistorySkeleton />}>
                <MatchHistory armyId={id} /> {/* independent — doesn't block roster */}
            </Suspense>
        </main>
    );
}
```

> **Anti-pattern**: Sequential `await` in a Server Component that feeds multiple `<Suspense>` boundaries creates a waterfall — all sections wait for the slowest fetch. Use `Promise.all` or separate async components instead.

### 14.4 `error.js` — Error Boundaries per Route Segment

`error.js` is the error boundary for a route segment. It catches errors thrown by Server Components and replaces the segment with an error UI.

```typescript
// app/[locale]/[gameSystem]/(app)/armies/error.tsx
'use client'; // error.js MUST be a Client Component

import { useEffect } from 'react';

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ArmiesError({ error, reset }: Props) {
    useEffect(() => {
        // Log to error reporting service
        console.error(error);
    }, [error]);

    return (
        <section>
            <h2>Failed to load armies</h2>
            <p>Something went wrong. Please try again.</p>
            <button onClick={reset}>Retry</button>
        </section>
    );
}
```

**Error boundary hierarchy**: `error.js` does not catch errors in `layout.js` of the same segment. To catch layout errors, place `error.js` in the **parent** segment.

### 14.5 `after()` — Post-Response Work

`after()` schedules work to run **after the response has been sent to the user**. Use it for logging, analytics, and cache warming that should not block the response.

```typescript
import { after } from 'next/server';

export default async function ArmyDetailPage({ params }) {
    const { id } = await params;
    const army = await getArmy(id);

    // Schedule analytics logging — does not affect TTFB
    after(async () => {
        await analytics.track('army.viewed', { armyId: id, gameSystem: army.gameSystem });
    });

    return <ArmyDatasheet army={army} />;
}
```

`after()` is also available in Server Actions:

```typescript
'use server';
import { after } from 'next/server';

export async function saveArmy(formData: FormData) {
    const session = await verifySession();
    // ... validate, write to DB ...

    after(async () => {
        // Non-blocking: warm the cache for this army after the response
        await fetch(`/api/cache/warm?armyId=${id}`);
    });

    revalidateTag(`army:${id}`);
    return { success: true };
}
```

> **Platform support**: `after()` requires the runtime to support deferred execution (Node.js runtime ✅, Edge runtime limited ⚠️). Verify platform support before using in production.

---

## 15. Route-Level Decision Guide

Use this guide when adding a new route or changing how an existing route renders. It extends the component-level decision trees in §9.

### 15.1 Choosing a Rendering Mode

```
Is the content identical for all users (public, unauthenticated)?
├── YES
│   Is the content static or updated infrequently?
│   ├── YES → Static Generation (generateStaticParams + revalidate)
│   │         └── Updated via webhook? → On-demand ISR (revalidateTag)
│   │         └── Updated on a schedule? → Time-based ISR (revalidate: N)
│   └── NO (real-time, always-changing) → Dynamic rendering (force-dynamic)
└── NO (user-specific or authenticated)
    Does the page have a meaningful static shell?
    ├── YES (nav, layout, public reference data) → PPR (experimental_ppr = true)
    │   └── Dynamic parts go inside <Suspense> boundaries
    └── NO (entirely personalised) → Dynamic rendering (no config needed — auth forces it)
```

### 15.2 Armoury Route Classification

| Route Pattern                         | Mode                                | Rationale                                 |
| ------------------------------------- | ----------------------------------- | ----------------------------------------- |
| `/(marketing)/**`                     | Static                              | No user data, infrequent updates          |
| `/reference/[gameSystem]/[unitId]`    | ISR (24h + webhook)                 | Shared data, updated by BSData releases   |
| `/reference/[gameSystem]/[factionId]` | ISR (24h + webhook)                 | Same as unit pages                        |
| `/(app)/armies`                       | PPR (static shell + dynamic list)   | Nav is static; army list is user-specific |
| `/(app)/armies/[id]`                  | PPR (static shell + dynamic detail) | Header shell static; roster dynamic       |
| `/(app)/armies/[id]/edit`             | Dynamic                             | Fully user-specific mutation page         |
| `/(app)/matches/**`                   | Dynamic                             | Real-time match state, user-specific      |
| `/(app)/campaigns/**`                 | Dynamic                             | User-specific campaign data               |
| `/auth/**`                            | Dynamic                             | Auth callbacks — always dynamic           |

### 15.3 Fetch Configuration Quick Reference

```typescript
// Static with tag — survives deploys, invalidated by revalidateTag()
await fetch(url, { next: { tags: ['my-tag'] } });

// Static with TTL — revalidated after N seconds
await fetch(url, { next: { revalidate: 3600 } });

// Force cache (Next.js 15+ explicit opt-in)
await fetch(url, { cache: 'force-cache' });

// Dynamic (no cache) — explicit
await fetch(url, { cache: 'no-store' });

// Dynamic (no cache) — also triggered by reading cookies/headers in same render
```

### 15.4 Cache Invalidation Decision

```
Did user data change?
├── User's own armies / rosters → revalidateTag(`armies:${userId}`) + revalidateTag(`army:${id}`)
└── Admin writes (game system update) → revalidateTag(`reference:${gameSystem}`)

Did reference data change via webhook?
└── BSData update → revalidateTag(`reference:${gameSystem}`)

Need to invalidate a specific page immediately?
└── revalidatePath('/path/to/page') — use sparingly (broad, expensive)

Need React Query cache to reflect the change client-side?
└── queryClient.invalidateQueries({ queryKey: ... }) after Server Action completes
    (see §7.2 for the coordination pattern)
```

---

## 16. Forward-Looking: `use cache` and Cache Components

Next.js is migrating from the current `fetch()`-level caching model to a **directive-based** caching model. The `'use cache'` directive (stable in Next.js 16, experimental in Next.js 15 via `dynamicIO`) replaces `unstable_cache`, `fetchCache`, and most manual cache configuration. This section covers the new APIs so Armoury is ready for the migration.

> **Version note**: Everything in this section requires `dynamicIO: true` in `next.config.ts` when using Next.js 15. In Next.js 16+, `dynamicIO` is the default and these APIs are stable.

### 16.1 The `'use cache'` Directive

`'use cache'` is a module-level or function-level directive (like `'use client'` and `'use server'`) that marks the boundary of cacheable work.

**Three scopes:**

| Scope               | Syntax                                        | What's Cached                        |
| ------------------- | --------------------------------------------- | ------------------------------------ |
| **Function-level**  | `'use cache'` at top of async function        | That function's return value         |
| **Module-level**    | `'use cache'` at top of file                  | All exports from the file            |
| **Component-level** | `'use cache'` at top of async React component | The component's rendered RSC Payload |

```typescript
// src/web/src/dal/factions.ts
// Function-level: cache this specific DAL function
export async function getCachedFactions(gameSystem: string) {
    'use cache';
    return db.factions.findByGameSystem(gameSystem);
}

// The cache key is automatically derived from:
// 1. The function's source code identity (file + export name)
// 2. All serializable arguments (gameSystem)
// No manual keyParts array needed — unlike unstable_cache
```

```typescript
// app/[locale]/[gameSystem]/reference/[factionId]/page.tsx
// Component-level: cache the entire component's RSC output
export default async function FactionPage({ params }) {
    'use cache';
    const { gameSystem, factionId } = await params;
    const faction = await getFaction(gameSystem, factionId);

    return (
        <article>
            <FactionHeader faction={faction} />
            <UnitGrid units={faction.units} />
        </article>
    );
}
// The entire RSC Payload for this component is cached.
// Cache key: params (gameSystem + factionId)
```

```typescript
// src/web/src/dal/reference.ts
// Module-level: every export from this file is cached
'use cache';

export async function getUnits(gameSystem: string) {
    return db.units.findByGameSystem(gameSystem);
}

export async function getFactions(gameSystem: string) {
    return db.factions.findByGameSystem(gameSystem);
}
// Both functions are cached independently with their own keys
```

**Key differences from `unstable_cache`:**

| `unstable_cache`                    | `'use cache'`                                      |
| ----------------------------------- | -------------------------------------------------- |
| Manual `keyParts` array required    | Automatic key derivation from arguments            |
| Closure variable gotcha (see §12.8) | No closure issues — compiler handles serialization |
| Must wrap at call site              | Declared at function definition                    |
| `tags` option for invalidation      | Use `cacheTag()` inside the function               |
| `revalidate` option for TTL         | Use `cacheLife()` inside the function              |

### 16.2 `cacheLife()` — TTL Presets and Custom Durations

`cacheLife()` replaces the `revalidate` option. Call it inside a `'use cache'` function to set the cache duration:

```typescript
import { cacheLife } from 'next/cache';

export async function getCachedFactions(gameSystem: string) {
    'use cache';
    cacheLife('hours'); // Use built-in preset
    return db.factions.findByGameSystem(gameSystem);
}
```

**Built-in presets:**

| Preset      | `stale` | `revalidate` | `expire`   | Use Case                                |
| ----------- | ------- | ------------ | ---------- | --------------------------------------- |
| `'seconds'` | —       | 1s           | 60s        | Near-real-time data (match scores)      |
| `'minutes'` | 5 min   | 1 min        | 1 hr       | Frequently changing data                |
| `'hours'`   | 5 min   | 1 hr         | 1 day      | Reference data (faction lists)          |
| `'days'`    | 5 min   | 1 day        | 1 week     | Infrequently changing content           |
| `'weeks'`   | 5 min   | 1 week       | 1 month    | Near-static content (rules text)        |
| `'max'`     | 5 min   | 1 month      | Indefinite | Static content (never auto-revalidates) |

**Semantic fields:**

- **`stale`**: How long the client can use a cached value without rechecking (served instantly, no server hit)
- **`revalidate`**: How long until the server considers the cached value stale and regenerates in the background (SWR pattern)
- **`expire`**: Hard upper bound — after this, the cache entry is deleted entirely and the next request waits for a fresh computation

**Custom profiles** can be defined in `next.config.ts` and referenced by name:

```typescript
// next.config.ts
const nextConfig = {
    experimental: {
        dynamicIO: true, // Required for Next.js 15; default in 16+
        cacheLife: {
            // Custom profile for Armoury reference data
            'game-reference': {
                stale: 300, // 5 min client stale window
                revalidate: 86400, // 24h server revalidation (matches our ISR pattern)
                expire: 604800, // 7 day hard expiry
            },
            // Custom profile for user-specific cached data
            'user-data': {
                stale: 0, // Never serve stale to client
                revalidate: 300, // 5 min server revalidation
                expire: 3600, // 1h hard expiry
            },
        },
    },
};

// Usage:
export async function getCachedFactions(gameSystem: string) {
    'use cache';
    cacheLife('game-reference'); // Custom profile
    return db.factions.findByGameSystem(gameSystem);
}
```

### 16.3 `cacheTag()` and On-Demand Invalidation

`cacheTag()` replaces the `tags` option of `unstable_cache`. Call it inside a `'use cache'` function to tag the cache entry for on-demand invalidation:

```typescript
import { cacheTag, cacheLife } from 'next/cache';

export async function getCachedFactions(gameSystem: string) {
    'use cache';
    cacheTag('factions', `factions:${gameSystem}`);
    cacheLife('game-reference');
    return db.factions.findByGameSystem(gameSystem);
}

// In a Server Action — invalidate by tag (same as today):
('use server');
import { revalidateTag } from 'next/cache';

export async function updateFaction(formData: FormData) {
    // ... validate, write to DB ...
    revalidateTag(`factions:${gameSystem}`);
}
```

`revalidateTag()` works exactly the same as today — it busts all cache entries with the matching tag across Data Cache and `'use cache'` entries.

### 16.4 Cache Components and Partial Prerendering (PPR)

The `'use cache'` directive on components enables **Cache Components** — a React component whose RSC Payload is cached independently. Combined with PPR, this creates a powerful model:

```
Page (dynamic — reads cookies)
├── <CachedNavigation />        ← 'use cache' component (static shell)
├── <Suspense fallback={<Skeleton />}>
│   └── <UserArmies />          ← dynamic (reads session)
└── <CachedReferencePanel />    ← 'use cache' component (reference data)
```

**How it works with PPR:**

1. At build time, Next.js renders the static shell (cache components + Suspense fallbacks)
2. At request time, dynamic components render and stream in
3. Cache components are served from cache — no re-render unless invalidated
4. Dynamic components render fresh on every request

```typescript
// app/[locale]/[gameSystem]/(app)/armies/page.tsx
import { Suspense } from 'react';

// The page itself is dynamic (reads session)
export default async function ArmiesPage() {
    const session = await auth0.getSession();

    return (
        <main>
            {/* Cache Component — rendered once, served from cache */}
            <GameSystemNav gameSystem={params.gameSystem} />

            {/* Dynamic — streams in with user data */}
            <Suspense fallback={<ArmyGridSkeleton />}>
                <UserArmyGrid userId={session.user.sub} />
            </Suspense>

            {/* Cache Component — reference data, cached separately */}
            <FactionQuickRef gameSystem={params.gameSystem} />
        </main>
    );
}

// components/reference/GameSystemNav.tsx
export async function GameSystemNav({ gameSystem }: { gameSystem: string }) {
    'use cache';
    cacheTag(`reference:${gameSystem}`);
    cacheLife('game-reference');

    const factions = await getFactions(gameSystem);
    return (
        <nav>
            {factions.map(f => (
                <FactionLink key={f.id} faction={f} />
            ))}
        </nav>
    );
}
```

### 16.5 Migration Path: `unstable_cache` → `'use cache'`

When migrating Armoury from Next.js 15 to 16:

| Current Pattern                                  | Migration Target                                       | Notes                                        |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| `unstable_cache(fn, keys, { tags, revalidate })` | `fn` with `'use cache'` + `cacheTag()` + `cacheLife()` | Remove wrapper; add directive + calls inside |
| `fetchCache = 'force-cache'` (route segment)     | Remove — `'use cache'` on individual functions         | Granular control replaces bulk config        |
| `export const revalidate = N` (route segment)    | `cacheLife()` inside cache functions                   | Per-function TTL instead of per-route        |
| `fetch(url, { next: { tags: [...] } })`          | Still works — `fetch()` inside `'use cache'` inherits  | No change needed for fetch-based data        |
| `fetch(url, { cache: 'no-store' })`              | `connection()` or move fetch outside `'use cache'`     | Explicit dynamic boundary                    |

```typescript
// BEFORE (Next.js 15 — unstable_cache)
import { unstable_cache } from 'next/cache';

export const getCachedFactions = unstable_cache(
    async (gameSystem: string) => db.factions.findByGameSystem(gameSystem),
    ['factions-by-system'],
    { revalidate: 86400, tags: ['factions'] },
);

// AFTER (Next.js 16 — 'use cache')
import { cacheTag, cacheLife } from 'next/cache';

export async function getCachedFactions(gameSystem: string) {
    'use cache';
    cacheTag('factions', `factions:${gameSystem}`);
    cacheLife('game-reference'); // 24h revalidate, 7d expire
    return db.factions.findByGameSystem(gameSystem);
}
```

> **No breaking change**: `unstable_cache` and `fetch()` cache options continue to work in Next.js 16. The migration is opt-in. However, `dynamicIO` mode (default in v16) changes `fetch()` caching behavior — uncached fetches inside `'use cache'` boundaries are automatically cached; uncached fetches outside are dynamic. Plan the migration route-by-route, not all-at-once.

---

**Related documents:**

- [BEST_PRACTICES.md](./plan/BEST_PRACTICES.md) — §8 App Router conventions, §9 Server/Client matrix, §21 anti-patterns
- [REACT_QUERY.md](./REACT_QUERY.md) — Query key factories, mutations, optimistic updates, SSR/RSC prefetch, cache tiers
- [STATE_MANAGEMENT.md](./plan/STATE_MANAGEMENT.md) — State tier hierarchy and decision framework
- [RXJS_STATE.md](./RXJS_STATE.md) — RxJS global state, WebSocket reactive patterns

**End of Next.js 15 + React 19 Rendering Strategy**
