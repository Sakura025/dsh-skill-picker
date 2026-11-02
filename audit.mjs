/**
 * Dictionary parity and key coverage.
 *
 * The bundle's `t("key")` calls and its zh/en tables must agree, or a missing
 * translation renders as the raw key in the panel. This also re-checks the
 * CATALOG coverage so a newly installed skill cannot silently degrade to raw
 * provider text.
 *
 * Run: node audit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(HERE, "client.js"), "utf8");

function tableSlice(name, nextMarker) {
	const start = source.indexOf(`const ${name} = {`);
	if (start < 0) throw new Error(`missing ${name} table`);
	const end = source.indexOf(nextMarker, start);
	if (end < 0) throw new Error(`missing marker ${nextMarker}`);
	return source.slice(start, end);
}

const zh = tableSlice("zh", "const en = {");
const en = tableSlice("en", "\t\t/**");

function keysOf(slice) {
	const out = new Set();
	for (const match of slice.matchAll(/^\t\t\t"([\w.]+)":/gm)) out.add(match[1]);
	return out;
}

const zhKeys = keysOf(zh);
const enKeys = keysOf(en);
console.log("zh keys          :", zhKeys.size);
console.log("en keys          :", enKeys.size);

const onlyZh = [...zhKeys].filter((key) => !enKeys.has(key));
const onlyEn = [...enKeys].filter((key) => !zhKeys.has(key));
if (onlyZh.length > 0) console.log("only in zh       :", onlyZh.join(", "));
if (onlyEn.length > 0) console.log("only in en       :", onlyEn.join(", "));

/* Keys built by concatenation in code are checked explicitly. */
const dynamic = ["group.define", "group.plan", "group.build", "group.verify", "group.review", "group.ship", "group.meta", "group.other"];
const missingDynamic = dynamic.filter((key) => !zhKeys.has(key) || !enKeys.has(key));
if (missingDynamic.length > 0) console.log("missing dynamic  :", missingDynamic.join(", "));

/* Every literal t("…") the bundle uses must exist in both tables. */
const used = new Set();
for (const match of source.matchAll(/\bt\("([\w.]+)"/g)) used.add(match[1]);
const unresolved = [...used].filter((key) => !zhKeys.has(key) || !enKeys.has(key));
if (unresolved.length > 0) console.log("undefined keys   :", unresolved.join(", "));
else console.log("undefined keys   : none");

/* CATALOG must cover every skill installed on this machine. */
const catalogBlock = source.match(/const CATALOG = \{[\s\S]*?\n\t\t\};/);
if (catalogBlock === null) throw new Error("CATALOG block not found");
const catalogued = new Set();
for (const match of catalogBlock[0].matchAll(/^\t\t\t([A-Za-z0-9-]+|"[A-Za-z0-9-]+"):\s*\[/gm)) {
	catalogued.add(match[1].replaceAll('"', ""));
}
console.log("CATALOG entries  :", catalogued.size);

const ROOTS = ["C:/Users/32361/.dsh/skills", "C:/Users/32361/.dsh/redteam/skills"];
const installed = new Set();
for (const root of ROOTS) {
	let names = [];
	try {
		names = readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());
	} catch {
		continue;
	}
	for (const name of names) {
		try {
			statSync(join(root, name, "SKILL.md"));
			installed.add(name);
		} catch {
			/* not a skill */
		}
	}
}
const uncatalogued = [...installed].filter((name) => !catalogued.has(name)).sort();
console.log("installed skills :", installed.size);
console.log("uncatalogued     :", uncatalogued.length === 0 ? "none" : uncatalogued.join(", "));

const failed = onlyZh.length + onlyEn.length + missingDynamic.length + unresolved.length + uncatalogued.length > 0;
console.log(failed ? "AUDIT FAILED" : "AUDIT PASSED");
if (failed) process.exitCode = 1;
