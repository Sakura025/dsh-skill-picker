# Contributing

Issues and pull requests are welcome, in Chinese or English.

## Local development

```bash
npm install            # react / react-dom / jsdom — tests only
npm run check          # the full gate; must pass before a PR
```

Individual suites:

| Command | What it proves |
|---|---|
| `node audit.mjs` | zh/en dictionary key parity, CATALOG coverage of installed skills |
| `node verify.mjs` | the dialog mounts, searches, inserts, and drives all three tabs in jsdom |
| `node verify-host.mjs` | every host route: name grammar, frontmatter checks, overwrite refusal, removal, search proxy |
| `node verify-skills.mjs` | each `$DSH_HOME/skills/*/SKILL.md` parses under the host's own rules |
| `node verify-provider.mjs` | the real `dsh-skill-filesystem` provider loads and renders every skill |
| `node verify-roundtrip.mjs` | install → discover → render → remove, end to end |
| `node regression.mjs` | the "empty panel" abort bug cannot come back |

`verify-host.mjs` and `verify-roundtrip.mjs` redirect `DSH_HOME` to a temp
directory and never touch your real skill root.

## Ground rules

- `client.js` is a hand-authored browser bundle: it registers a lazy factory
  through `window.__ModuleLoader__.load` and gets React from the host table.
  Do not add a bundler step or a second React copy.
- `index.js` is the host half. Any filesystem write must go through
  `writeSkill()`, which enforces kebab-case names, `$DSH_HOME/skills` as the only
  root, and the no-overwrite default.
- New UI text needs a key in both `zh` and `en`; `audit.mjs` fails otherwise.
- Style with inline styles and host theme tokens (`--dsw-alias-*`). No separate
  stylesheet, no hardcoded light-mode colors.
- Effects that fetch must not depend on state they write. Use a request sequence
  counter for staleness, not the abort flag alone.

## Reporting a bug

Include the DSH version, your OS, the plugin version, and the exact steps. If the
panel misbehaves, open DevTools → Console and paste any `skill-picker` errors.
