/**
 * Coverage audit: every skill installed under the DSH user root must have a
 * Chinese title/purpose/phase in the bundle's CATALOG, otherwise the picker
 * silently degrades those rows to raw provider text.
 *
 * Run: node audit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(HERE, "client.js"), "utf8");

const catalogBlock = source.match(/const CATALOG = \{[\s\S]*?\n\t\t\};/);
if (catalogBlock === null) throw new Error("CATALOG block not found");

const keys = new Set();
for (const match of catalogBlock[0].matchAll(/^\t\t\t([A-Za-z0-9-]+|"[A-Za-z0-9-]+"):\s*\[/gm)) {
	keys.add(match[1].replaceAll('"', ""));
}
console.log("CATALOG entries :", keys.size);

const ROOTS = ["C:/Users/32361/.dsh/skills", "C:/Users/32361/.dsh/redteam/skills"];
const installed = [];
for (const root of ROOTS) {
	let names = [];
	try {
		names = readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());
	} catch {
		continue;
	}
	for (const name of names) {
		let hasManifest = true;
		try {
			statSync(join(root, name, "SKILL.md"));
		} catch {
			hasManifest = false;
		}
		if (hasManifest) installed.push(name);
	}
}

const unique = [...new Set(installed)].sort();
console.log("installed skills:", unique.length, "from", ROOTS.length, "root(s)");

const missing = unique.filter((name) => !keys.has(name));
const extra = [...keys].filter((name) => !unique.includes(name)).sort();

if (missing.length > 0) console.log("MISSING (falls back to raw text):", missing.join(", "));
else console.log("MISSING         : none");

if (extra.length > 0) console.log("EXTRA (catalogued but not installed):", extra.join(", "));

const phaseValues = new Set([...catalogBlock[0].matchAll(/"([a-z]+)"\]\s*,?\s*$/gm)].map((m) => m[1]));
console.log("phases used     :", [...phaseValues].sort().join(", "));

if (missing.length > 0) {
	console.log("AUDIT FAILED");
	process.exitCode = 1;
} else {
	console.log("AUDIT PASSED");
}
