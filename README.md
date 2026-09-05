# Happy Birthday, Priya 🤍 — Interactive Love Story

A premium, mobile-first, cinematic birthday website. Dark romantic theme, glassmorphism, floating hearts/sparkles, scroll-triggered storytelling, and a handful of playful interactions (balloon pop, bouquet reveal, flip cards, love letter, candle-blowing cake, scratch card, fireworks finale).

## Files
- `index.html` — structure + all CSS (design tokens at the top of the `<style>` block)
- `script.js` — all interactivity + the `CONFIG` object where you personalize text
- `manifest.json`, `sw.js` — makes it installable / works offline (PWA)

## Quick personalization (edit `script.js`, top of file)
Open `script.js` and edit the `CONFIG` object:
- `name` — the birthday person's name (shown in the hero)
- `subtitleLines` — the rotating hero subtitle lines
- `loveThings` — the 6 flip cards ("Things I Love About You")
- `wishes` — the 4 birthday wish cards
- `dreams` — the 5 "Future Together" items
- `letter` — the full love letter text (typewriter animation)
- `signature` — the sign-off shown under the letter
- `hiddenMessages` — the 5 secret messages under the floating hearts

To change the balloon word sequence (currently "YOU / ARE / SO / SPECIAL"), edit `balloonWords`.

## Adding real photos (optional)
Right now the hero, bouquet, and cake are hand-drawn SVG illustrations (no photo dependency, keeps load fast, and no fake stock photos). If you'd like to swap in a real couple photo for the hero, replace the `.hero-silhouette` SVG block with an `<img>` tag using `loading="lazy"`.

## Running locally
No build step needed — it's plain HTML/CSS/JS. Just serve the folder:
```
npx serve .
```
or open `index.html` directly in a browser (the service worker works best when served over http/https rather than `file://`).

## Deploying
Drag-and-drop the whole folder onto Netlify/Vercel, or push to GitHub Pages. Because it's a PWA, once visited over https it can be "installed" to a phone's home screen.

## Tech used
GSAP + ScrollTrigger (parallax/reveals), Typed.js (hero subtitle), AOS (scroll fade-ins), canvas-confetti (confetti & bursts), hand-rolled canvas particle field, fireworks, and scratch-card logic. Respects `prefers-reduced-motion` and keeps all interactive elements keyboard-accessible.
