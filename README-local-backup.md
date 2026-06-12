# Mitsuki website

Static marketing site for Mitsuki, plus the hosted Privacy Policy.
No build step — plain HTML/CSS/JS. Deploy the folder as-is to GitHub Pages,
Netlify, Vercel, or any static host.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page (hero, features, Pro, privacy strip). The homepage focuses on Dictionary + Flashcards; secondary tools are listed only as extras in Features. |
| `privacy.html` | Full Privacy Policy, ported from the in-app `PrivacyPolicyView` |
| `css/style.css` | Design tokens + all styling. Colors come from the app's `Theme.swift` (`.sakura` light / `.indigoNight` dark); easing curves from `MotionTokens.swift` |
| `js/main.js` | Theme toggle, petal canvas, scroll reveals, hero typing demo |
| `assets/icon.png` | App icon / logo (also used as favicon) |

## Placeholders to fill in later

Search for `aria-disabled="true"` and `TODO` in `index.html`:

1. **Mac / iPhone download buttons** (hero, `#download`) — replace `href="#"`
   with the App Store links and remove `aria-disabled` + the `Soon` pill.
2. **continue-watching download button** — currently described as an extra in the Features section. Add a real link later if you create a dedicated download area.
3. **Alexa skill setup** — currently described as an extra in the Features section. Add the real skill name, store link, and invocation phrase later if you create a dedicated setup page.

## After deploying

Set the public policy URL in the app so the in-app "Open Privacy Policy
Website" button goes live — closes TODO(#8):

```swift
// mitsuki-app/Mitsuki/ProPaywallView.swift
static let privacyPolicyURL: URL? = URL(string: "https://<your-domain>/privacy.html")
```

If the in-app policy text changes, update `privacy.html` to match (and vice
versa) — the two are meant to be identical.

## Notes

- Theme follows the OS by default; the toggle persists to `localStorage`
  (`mitsuki-theme`). Dark mode uses the View Transitions API for the circular
  reveal where supported, with a plain switch elsewhere.
- All animation honors `prefers-reduced-motion` (petals off, reveals instant),
  matching the app's reduce-motion behavior.
- Fonts (Fraunces + Inter) load from Google Fonts; the site falls back to
  system fonts if blocked.
