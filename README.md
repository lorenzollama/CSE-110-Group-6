# CSE-110-Group-6

Konva + TypeScript game built with Vite, using an MVC structure.

## Setup

```
npm ci            # install exact dependency versions from package-lock.json
npm run dev       # start the dev server
npm test          # run Vitest tests
npm run typecheck # type-check with tsc
npm run build     # production build
```

## Structure

- `src/main.ts`: `App` creates the stage and layers and switches between screens
- `src/types.ts`: shared `View`, `ScreenController`, `Screen`, `ScreenSwitcher`
- Each screen or minigame gets its own folder with a Model, View, and Controller
- Popups draw on the popup layer, above the screen layer

`vite.config.ts` proxies `/api` requests to `http://localhost:3001`.
