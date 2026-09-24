# Snip design language

A dark, minimal workspace with a warm creative glow and generous breathing room. The interface should feel focused and optimistic without using branded artwork or copy.

## Tokens

- Background: `#0d0f0e`; raised background: `#121614`
- Surface: `#171b18`; raised surface: `#1e2420`
- Text: `#f5f2eb`; muted text: `#a1aaa3`; faint text: `#737d76`
- Accent gradient: `linear-gradient(110deg, #ff806f 0%, #f69bb8 48%, #ffbd73 100%)`
- Accent solid: `#ff9a83`; positive: `#b9e3b0`; danger: `#ffb4a9`
- Font: `"Helvetica Neue", "Segoe UI", sans-serif`; use a clean, compact sans-serif hierarchy
- Type scale: 0.75rem labels, 0.9rem metadata, 1rem body, 1.25rem section headings, clamp(2.7rem, 7vw, 5.6rem) hero heading
- Spacing: 0.5rem base unit; use 1rem controls, 1.5rem surfaces, 3rem section gaps, 5rem hero breathing room
- Radii: 0.75rem controls, 1.25rem surfaces, 999px chat input
- Borders: `1px solid rgba(245, 242, 235, 0.12)`; active border uses the warm accent
- Shadows: `0 24px 80px rgba(0, 0, 0, 0.28)` for large surfaces; keep controls softly lifted
- Glow: a fixed, pointer-transparent full-width top band using the accent gradient, blurred and faded into the background

## Element mapping

- Page header: the hero, centered with a short muted subline and no heavy card frame
- URL form: the centerpiece chat-style input, pill-rounded with the primary action attached on the right
- Result notice: a quiet raised surface with an accent edge and a bright short-link action
- Error notice: the same surface language with a restrained coral warning treatment
- Links table: a generously rounded surface card with subtle borders, low-contrast rows, and accent short-code links
- Empty state: the same table surface with muted copy and no decorative illustration
