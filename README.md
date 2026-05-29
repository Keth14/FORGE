# FORGE

> Behavioral continuity system. Built for Keth.

FORGE is not a habit tracker. It is an external continuity structure for a mind that naturally fragments under its own intensity. It detects psychological collapse trajectories before they happen, adapts its UI to your current behavioral state, and provides a direct conversational interface with an AI that knows your specific patterns.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# 3. Run dev server
npm run dev
# Opens at http://localhost:3000
```

---

## Environment Variables

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

If you don't want to use an env variable, you can enter your API key directly in the app under **ME → JARVIS KEY**. It will be stored in localStorage.

---

## Project Structure

```
forge/
├── public/
│   ├── icon.svg              # App icon
│   └── manifest.json         # PWA manifest
├── src/
│   ├── constants/
│   │   ├── contracts.js      # The 10 Integrity Contracts (never modify casually)
│   │   ├── habits.js         # Default habits, stabilization habits, grace reasons
│   │   ├── modes.js          # Mode config, levels, getLevel/getNextLevel
│   │   ├── prompts.js        # All JARVIS system prompts
│   │   └── signals.js        # Language detection word arrays
│   ├── lib/
│   │   ├── api.js            # OpenAI API calls
│   │   ├── signals.js        # All psychological inference logic
│   │   └── storage.js        # localStorage helpers, state init/load/save
│   ├── hooks/
│   │   └── useForge.js       # Main state management hook
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Bar.jsx       # Progress bars
│   │   │   ├── Buttons.jsx   # Reusable button components
│   │   │   └── Modal.jsx     # Modal shell + field input
│   │   ├── modals/
│   │   │   └── index.jsx     # All modal components
│   │   ├── views/
│   │   │   ├── TodayView.jsx
│   │   │   ├── GoalsView.jsx
│   │   │   ├── LogView.jsx
│   │   │   ├── IntelView.jsx
│   │   │   ├── TalkView.jsx
│   │   │   ├── YouView.jsx   # Abstract identity avatar + behavioral stats
│   │   │   └── MeView.jsx
│   │   ├── Header.jsx
│   │   ├── JarvisOverlay.jsx
│   │   ├── Nav.jsx
│   │   ├── PinLock.jsx
│   │   └── Splash.jsx
│   ├── App.jsx               # Root component, routing, JARVIS runner
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles + animations
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Deploy as PWA (Android)

```bash
# Build for production
npm run build

# The /dist folder is your deployable app
# Option 1: Drag /dist contents to netlify.com/drop
# Option 2: netlify deploy --dir=dist

# On Android Chrome:
# Open the URL → 3-dot menu → Add to Home Screen
```

---

## Key Architecture Decisions

### Why no backend
All data stays on device by design. Keth's requirement: no cloud, no accounts, no sync. Each device is an independent journey.

### Why OpenAI via browser
OpenAI allows browser-direct API calls with proper Authorization headers. The API key is stored in localStorage and sent directly — never proxied.

### Why the 5 core trackers
Momentum, Drift, Resistance, Self-Betrayal, and State are derived from behavioral patterns, not self-reported feelings. They power mode inference and collapse risk scoring.

### Why stabilization mode disables goal creation
The collapse pattern disguises itself as transformation. During destabilization, the mind tries to escape through planning and vision expansion. The app must not enable this.

### Why XP is atmospheric
XP risks becoming performance theater. It's kept quiet — shown in small text, never animated dramatically. Evidence of accumulated alignment, not coins.

---

## Extending FORGE

### Add a new language signal
Edit `src/constants/signals.js`. Add words to the appropriate array. The inference engine picks them up automatically.

### Change collapse risk weights
Edit the `calcCollapseRisk` function in `src/lib/signals.js`. Each signal's weight is clearly commented.

### Add a new JARVIS prompt
Add to `src/constants/prompts.js`, import where needed.

### Add a new habit
Add to `DEFAULT_HABITS` in `src/constants/habits.js`. Set `locked: true` to prevent deletion.

### Add a new view
1. Create `src/components/views/YourView.jsx`
2. Add tab to `src/components/Nav.jsx`
3. Wire in `src/App.jsx`

---

## Important Constraints — Do Not Break

1. **No cloud sync** — localStorage only. Cross-device is config-only (habits, missions, username).
2. **Stabilization disables goal creation** — `collapseRisk.phase === 'stabilization'` blocks the goal modal.
3. **Reset uses `localStorage.clear()`** — not just the storage key. Full wipe.
4. **The 66-day counter never stops** — `dayCount` increments indefinitely. No finish line.
5. **JARVIS tone is observational, never motivational** — see system prompts in `constants/prompts.js`.
6. **"I SEE IT" button is once per day** — `state.awarenessAcknowledged` stores today's date.
7. **Behavior > insight** — every feature should increase real-world execution. If it doesn't, remove it.
