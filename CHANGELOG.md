# Changelog

All notable changes to this plugin are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-11-02

### Added
- **920×720 dialog** with a lifecycle-phase rail, replacing the small popover.
- **Three tabs**: this session's catalog, on-disk installed skills, and add-skill.
- **In-app skill installation** from four sources: `owner/repo` paths, raw URLs,
  pasted `SKILL.md` text, and [skills.sh](https://skills.sh) registry search.
- **Installed tab** with the real on-disk path and one-click removal.
- **Host half** (`index.js`) mounting `/dsh-skill-picker/api/v1/{search,installed,install,remove}`
  behind the host's own `connection.requestRejection` gate.
- **Bilingual metadata** in `locale/{zh,en}.json` and a bilingual README.
- Test suites: `verify-host.mjs` (route contract), `verify-skills.mjs` (host
  frontmatter rules), `verify-provider.mjs` (real provider load), and
  `verify-roundtrip.mjs` (install → discover → render → remove).

### Changed
- Search matches titles, purposes, descriptions, and slash names.
- Dictionary keys renamed from `menu.*` to `search.*` / `tab.*` / `installed.*`
  to match the new layout; `audit.mjs` now enforces zh/en key parity.

### Fixed
- **Empty panel**: the catalog effect no longer depends on the state it writes,
  so it cannot abort its own in-flight request. Guarded with `regression.mjs`.
- **Missing catalog**: an empty or failed `skills/list` falls back to the
  built-in 34-entry catalog instead of a blank panel.
- **Session retention**: the catalog fetch now retains the session with
  `sessions.using(...)` before calling the RPC, matching the official `/` menu.
- `scrollIntoView` is feature-detected instead of assumed.

## [1.0.0] — 2026-11-02

### Added
- Composer trigger at `conversation.input.left`.
- Phase-grouped list with Chinese titles and one-line purposes.
- Chinese and English search, recent list, multi-select, keyboard navigation.
- `/name` insertion through `inputActions.captureInsertion()`/`insertText()`
  with `draftRev` CAS.
- Offline smoke test and a jsdom mount test.
