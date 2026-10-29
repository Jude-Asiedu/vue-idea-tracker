# Idea Deck — Improvement Backlog

Findings from a codebase review, grounded in specific files. Status is tracked
per item; "In progress" items are being implemented now.

## Data integrity & security

1. **[Done] Guard Supabase mutations with `user_id`.**
   `SupabaseIdeaService.update/remove/restore/permanentlyDelete` filtered only
   by `.eq('id', id)`, relying entirely on RLS (not checked into the repo) to
   stop a user mutating someone else's idea. Added a `requireUserId()` guard
   and `.eq('user_id', userId)` on every mutation as defense in depth.

2. **[Done] Add optimistic-lock / conflict detection.**
   `useIdeaStore.updateIdea()` did blind last-write-wins with no version
   check. Added an `expectedUpdatedAt` parameter threaded through
   `IIdeaService.update()`; both services now reject (via `ConflictError`)
   when the row changed since it was read, and the store refetches to
   reconcile instead of silently clobbering.

3. **[Not started] Actually purge old trash.**
   The 90-day retention is enforced only in the read path (`fetchDeleted`);
   nothing ever calls `permanentlyDelete` after the cutoff, so soft-deleted
   rows accumulate forever.

## Testing

4. **[Not started] Add a test suite.** No vitest/jest config or test files
   exist. Start with store logic and the sanitization layer.

## Performance

5. **[Not started] Paginate/virtualize large lists.** `fetchAll()` loads the
   entire table unbounded; `TableView` renders every row with no
   virtualization.

6. **[Done] Batch bulk operations.** `bulkMoveStatus`/`bulkDeleteByStatus`
   looped and awaited one request per idea. Added `bulkUpdateStatus()` and
   `bulkRemove()` to `IIdeaService`, implemented as a single batched
   `.in('id', ids)` call in `SupabaseIdeaService` and a single `save()` in
   `LocalIdeaService`; the store now does one optimistic update + one network
   call per bulk action.

7. **[Not started] Throttle rapid keyboard moves.** `useKanbanKeyboard`'s
   arrow-key handler fires a network call per keydown with no debounce.

## Architecture / code quality

8. **[Done] Extract shared logic between the two services.**
   `LocalIdeaService` and `SupabaseIdeaService` duplicated the 90-day
   retention cutoff/sort math and `deleted_at` normalization. Extracted to
   `src/features/ideas/services/ideaServiceUtils.ts`.

9. **[Done] Fix stage ID generation.** `useStagesStore.addStage()` used
   `stage_${Date.now()}`, which can collide under fast double-clicks or
   concurrent tabs. Switched to `crypto.randomUUID()`.

10. **[Done] Surface stage-sync failures.** `_persist()` silently swallowed
    Supabase write errors with `catch { /* non-critical */ }`. It now sets a
    `syncError` ref that `AppLayout` surfaces through the existing toast.

## UX / resilience

11. **[Done] Offer guest→account data migration.** Guest/demo data lived only
    in `localStorage` with no path into a new Supabase account. Added
    `migrateGuestIdeas()`; it imports real (non-seed) local ideas into the
    account and clears local storage on success. Triggered reactively from
    `AppLayout` on sign-in (not just on page load) and surfaces the result as
    a toast — the first version only ran once at app boot, which missed the
    normal sign-up → confirm email → sign in flow since that transition
    happens inside the already-running app, and gave no feedback either way.

12. **[Done] Add offline detection and retry.** Network failures just set a
    plain error string with no recovery path. Added `useOnlineStatus()` (shown
    as a banner in `AppLayout`) and a `withRetry()` wrapper applied to the
    read paths (`fetchAll`/`fetchDeleted`) in `SupabaseIdeaService`, which are
    safe to retry because they're idempotent; mutations are left single-shot
    since retrying a write that actually succeeded could duplicate it.

13. **[Not started] Add a realtime subscription.** Pairs with #2 — subscribing
    to Supabase realtime changes would let multi-device edits reconcile
    instead of relying on reactive conflict detection alone.

## Nice-to-haves

14. **[Not started] Generate `database.types.ts` from Supabase** rather than
    hand-maintaining it.

15. **[Not started] Commit RLS policies as SQL migrations** so the security
    model is reviewable and reproducible.

## Content Security Policy

`vercel.json` already shipped a reasonable CSP (`default-src 'self'`,
`script-src 'self'`, no inline scripts anywhere in the codebase). Hardened it
further:

- Added `object-src 'none'` — blocks `<object>`/`<embed>` plugin content.
- Added `base-uri 'self'` — stops an injected `<base>` tag from rewriting
  relative URLs.
- Added `frame-ancestors 'none'` — a CSP-level backstop for the existing
  `X-Frame-Options: DENY` (and works in more contexts than that header alone).
- Added `form-action 'self'` — forms can't be hijacked to submit elsewhere.
- Added `upgrade-insecure-requests`.
- Added a `Strict-Transport-Security` header (HSTS) alongside it, since it's
  the other half of "serve this only over HTTPS, always."

`style-src 'unsafe-inline'` stays — the app uses Vue's `:style` bindings
(inline `style=""` attributes), which is otherwise unavoidable without a
larger refactor, and is a much narrower risk than `script-src 'unsafe-inline'`
would be.
