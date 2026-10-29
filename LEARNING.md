# Learning Next.js through this project

Guided, step-by-step walkthrough of this codebase for someone who knows React
but is new to Next.js. One lesson at a time: explain the concept using the real
files here, then give a small hands-on exercise in this project, then review it.

## Lessons

| # | Lesson | Where it lives | Status |
|---|---|---|---|
| 1 | Files become pages: routing, layouts, route groups `(app)` | `src/app/` | ✅ taught, exercise pending |
| 2 | Server Components: reading the DB directly in a component | `src/app/(app)/page.tsx` | |
| 3 | Client Components: when and why `"use client"` | `src/components/med-checklist.tsx`, `add/[type]/forms.tsx` | |
| 4 | Server Actions: saving data without writing an API | `src/app/actions/entries.ts` | |
| 5 | Forms, validation, error messages (`useActionState`, `useForm`) | `src/components/use-form.ts` | |
| 6 | Dynamic routes & URL params (`[type]`, `?range=3m`) | `add/[type]/page.tsx`, `progress/page.tsx` | |
| 7 | Login: cookies, sessions, protecting pages | `src/lib/auth.ts`, `(app)/layout.tsx` | |
| 8 | Database with Drizzle: schema, queries, migrations | `src/db/`, `drizzle/` | |
| 9 | Styling: Tailwind 4, dark mode, RTL (Hebrew/Arabic) | `src/app/globals.css` | |
| 10 | Build & deploy: what happens on `flyctl deploy` | `Dockerfile`, `fly.toml` | |

## Where we are

**Exercise 1 (pending):** create a page at `/about` that is behind login and
shows the bottom nav. The point is choosing the right folder (`src/app/(app)/about/page.tsx`)
so the `(app)` layout wraps it. Bonus: make it `async` and show
`user.displayName` via `requireUser()`.

Next step: review exercise 1, then Lesson 2.
