# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chrome Proxy Helper — a Manifest V3 Chrome extension that drives `chrome.proxy.settings` so the user can switch Chrome's proxy independently of the OS. Supports multiple named profiles (work / home / travel), each with SOCKS4/5, HTTP(S), PAC URL, PAC script, WPAD auto-detect, system, and direct modes, plus Whitelist (bypass list) / Blacklist (proxy list) rules and proxy authentication.

There is **no build, bundler, test runner, or linter**. Everything is plain HTML/CSS/vanilla JS + jQuery 3.6 loaded straight from disk. The "build" is the repo itself.

## Common workflows

- **Load locally**: `chrome://extensions` → enable Developer mode → "Load unpacked" → select the repo root.
- **Reload after edits**: hit the reload icon on the extension card (or `Ctrl+R` while focused on it). Service-worker logs appear under "Inspect views: service worker"; popup/options have their own DevTools.
- **Release**: bump `manifest.json` `"version"` and add a `CHANGELOG` entry. The store update is published via `update_url` already in the manifest.

## Architecture

`javascripts/profiles.js` is the shared storage/model layer, loaded via `importScripts()` in the service worker and via a `<script>` tag in popup/options. All three contexts read/write the same `chrome.storage.local` keys:

- `profiles` — map of id → profile object. Shape = `DEFAULT_PROFILE_FIELDS` at the top of `profiles.js`: per-scheme hosts/ports, `socks_type`, `pac_type`/`pac_script_url`/`pac_data`, `bypasslist`/`proxylist`, `rules_mode`, `proxy_rule`, `internal` (`"china"`), `auth`, and the profile's own `mode` (`http` / `https` / `socks4` / `socks5` / `pac_url` / `pac_data` / `direct` / `system` / `auto_detect`).
- `activeProfileId` — which profile is currently driving Chrome's proxy.
- `schemaVersion` — profiles-store schema (`PROFILES_SCHEMA_VERSION`, currently 2). `ensureMigrated()` converts the legacy single `proxySetting`/`proxyInfo` keys into `profiles.default` and deletes them, and creates a default profile on fresh installs.
- `chinaList` — JSON string prepended to the bypass list when a profile has `internal: "china"`. Only ever the default `["*.cn"]`; the old bundled `data/` directory is gone and there is no UI to edit it (see `doc/TODO`).

### Entry points

- `background.js` (service worker) — sets the toolbar icon from the live `chrome.proxy.settings` (kept current via `chrome.proxy.settings.onChange`); answers `onAuthRequired` by reading the *active profile's* `auth` fresh from storage (no in-memory mirror); handles the `authUpdate` message; registers `Alt+O` (open options) and `Alt+P` (cycle profiles, ≥2 required); on update with an empty store (no `proxySetting`, no `profiles`) spawns the offscreen MV2→MV3 migration; opens the options page on fresh install; listens to `runtime.onStartup` only so the worker is woken on browser start and repaints the icon (`setIcon` doesn't persist across restarts and no other listener fires then, so the toolbar would keep the gray `default_icon`), without writing any proxy config.
- `popup.html` + `javascripts/popup.js` — quick switcher. Renders one expandable row per profile; the mode rows under it are the modes that profile has configured plus Direct, with System / Auto-detect tucked behind a "More" row unless the profile is currently using one of them. Clicking a mode calls `setActiveAndApplyMode()` from `profiles.js` (popup no longer builds proxy configs itself).
- `options.html` + `javascripts/options.js` + `javascripts/options-ui.js` — profile editor. The top bar does New / Rename / Duplicate / Delete (the active profile can't be deleted). Every form change auto-fires `save()`, which re-fetches `profiles` first (single read-modify-write) so a concurrent popup change isn't clobbered, then re-applies only if the profile being edited is the active one. `options-ui.js` owns the sidebar tab animation and the options-page i18n swap.
- `migration.html` + `javascripts/migration.js` — runs **only** inside the offscreen document spawned by `background.js` on MV2→MV3 update. It reads MV2-era `window.localStorage`, forwards auth to the SW via `authUpdate`, then sends `migrationDone` so the SW closes the offscreen document and runs `ensureMigrated()`.

### Cross-context messages

Two `chrome.runtime` actions exist; grep both contexts when changing either:

- `authUpdate` — migration offscreen doc → service worker. Writes `msg.data` into the active profile's `auth`. The options page no longer sends it: auth is edited as a normal profile field and read fresh on each auth challenge.
- `migrationDone` — migration offscreen doc → service worker. Triggers `chrome.offscreen.closeDocument()` + profile migration.

### Rules modes

`rules_mode` applies only to the fixed-server modes (HTTP/HTTPS/SOCKS); PAC/direct/system/auto-detect ignore it. Whitelist uses Chrome's native `bypassList` (plus `chinaList` when `internal === 'china'`). Blacklist has no native equivalent — `_profileBuildBlacklistPac()` synthesizes a PAC where listed hosts go through the proxy (no DIRECT fallback) and everything else goes direct; the two lists are stored separately (`bypasslist` / `proxylist`).

### i18n

`_locales/{en,ja,ru,zh_CN}/messages.json` are the message catalogs. HTML uses `data-i18n-content="<key>"` and a `$('[data-i18n-content]').each(...)` loop in `popup.js` / `options-ui.js` swaps in `chrome.i18n.getMessage(key)` at DOMContentLoaded. Strings built in JS (mode labels, profile prompts) go through the `i18nMessage(key, fallback)` helper in `profiles.js`. When adding a UI string, add the key to **all four** locale files (English is the `default_locale`, so a missing key falls back to English).

## Gotchas

- `manifest.json` is MV3 with `minimum_chrome_version: 88`, but newer APIs are used regardless: `chrome.offscreen` (migration path only, and only exists well above 88). There's no content script and no `web_accessible_resources` — keep it that way unless a feature actually needs them.
- Applied modes are `socks4`/`socks5` (`socks_type` picks), but the UI collapses them into one `socks` entry — convert with `normalizeMode()`/`resolveMode()` from `profiles.js` instead of comparing strings.
- Chrome's PAC fetcher only accepts `http://`, `https://`, and `data:` URLs (`file://` was removed in Chrome 69). Every read of `pac_type` must go through `normalizePacType()`; an empty PAC host degrades to a `direct` config rather than a broken URL.
- Generated PAC text must stay ASCII-only — non-ASCII characters in the script body broke the load once before (commit `246e5c5`).
- `chrome.proxy.settings.set` is asynchronous; the code sets the icon from the config it *applied* in the set callback. If you need the true post-set state, query `chrome.proxy.settings.get` — don't assume the set landed as requested.
- `ensureMigrated()` still initializes a default profile when the store has none, and `onInstalled` depends on the *empty* store state to decide whether the MV2 offscreen migration is needed — so no other startup path may create a profile before it runs.
- The popup renders from `listProfiles()` at open and refreshes after its own applies, but has no `storage.onChanged` listener — edits made elsewhere while it's open won't appear until it's reopened.
