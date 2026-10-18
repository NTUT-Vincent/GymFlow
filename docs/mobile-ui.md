# GymFlow Responsive Mobile UI

> Updated: 2026-10-18. Source: `app/globals.css`, `Header`, `Sidebar`, `NavButton`, `BookingPage`, and `SchedulePage`.

## Layout behavior

| Viewport | Navigation / layout |
|---|---|
| Desktop (>1050px) | 230px member sidebar; desktop header mode switch |
| Compact/tablet (761–1050px) | 82px compact icon sidebar; 2-column equipment/stat cards where space allows |
| Mobile (<=760px) | Fixed four-item member bottom navigation, compact header, account menu for navigation/login/logout; stacked member and admin content |
| Very narrow (<=360px) | Reduced horizontal padding to protect content space |

The fixed bottom navigation uses `env(safe-area-inset-bottom)` spacing. Account menu includes a staff/admin link only for authorized roles (or local demo). Role-based UI does not replace Supabase RLS.

## Mobile improvements implemented

- Home: shorter hero, primary booking action emphasized, subdued illustration, stacked dashboard cards.
- Booking: semantic `fieldset` + `legend`, `aria-pressed` category buttons, large touch targets, stacked fields, 16px form controls.
- Equipment: single-column equipment cards and wrapping category filters.
- Schedule: timeline becomes standalone vertical booking cards, with larger cancellation actions.
- Admin: vertically stacked header/actions, two-column stat cards, horizontally scrollable tabs within their container, single-column gym/equipment management and touch-sized controls.
- Navigation: labeled four-item bottom bar with `aria-current` and accessible account menu.

## Horizontal overflow incident and mitigation

- A 393px iPhone 16 browser-device screenshot showed content extending beyond the viewport **before** the overflow correction.
- `57da62e` changed many `1fr` tracks to `minmax(0, 1fr)`, converted main content sizing away from viewport-based fixed calculations, constrained controls, and added wrapping/shrink rules.
- Root containers also apply `overflow-x: clip` as a defense; clipping alone cannot prove the inner layout fits. Review actual DOM widths, not just the absence of a visible scrollbar.
- Vercel build of the CSS fix was reported successful. **No confirmed screenshot or actual-device acceptance of the fix has been recorded yet.** Do not mark mobile QA complete on this basis.

## Pending validation

Follow `docs/qa-checklist.md` at 320, 375, 393, and optionally 428px widths. Verify all member routes plus `/admin`, both portrait and landscape when feasible; check no body-level horizontal scrolling and that every button/form is visible and usable.

Relevant commits: `78de0cb`, `ed7d6e4`, `57da62e`.
