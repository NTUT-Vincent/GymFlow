# GymFlow Responsive Mobile UI

## Changes made on 2026-10-18

- Mobile navigation: the member shell switches from a desktop sidebar to a four-item fixed bottom navigation at viewports up to 760px. The header's mobile account menu exposes member navigation, conditional staff/admin entry, and authentication controls.
- Home page: the hero is shorter on mobile, with the primary booking action emphasized and decorative illustration softened.
- Booking: category choices use a fieldset and touch-sized buttons; inputs/selects stack to one column and use a minimum 16px font size to reduce browser zoom when editing.
- Schedule: a vertically stacked, touch-friendly card layout replaces the dense timeline on mobile.
- Admin: summary stats, actions, tabs, and management forms adapt to narrow screens.
- Horizontal overflow: fixed grid columns that used intrinsic minimums are switched to `minmax(0, 1fr)` or equivalent, main and admin widths are relative to the container, and text/controls may shrink and wrap.

## Validation

- GitHub commits: `ed7d6e4` and `57da62e`.
- Vercel build statuses were successful when checked.
- **Pending manual verification**: use browser device emulation and a real mobile device (at least 320px, 375px, and 393px), then inspect the home, booking, equipment, schedule, and admin routes for horizontal scrolling and tap targets.
- If another overflow is present, inspect the offending DOM element with browser devtools before introducing any additional clipping rules.
