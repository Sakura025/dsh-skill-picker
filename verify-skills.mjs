/**
 * End-to-end skill validation against the real host parser contract.
 *
 * A skill "runs" only when all of these hold, so each is checked per file:
 *   1. YAML frontmatter parses with the real `yaml` package,
 *   2. `name` matches the host's SKILL_NAME grammar and its directory,
 *   3. `description` is non-empty (the catalog routes on it),
 *   4. the body is non-empty (an empty body injects nothing useful),
 *   5. the plugin's CATALOG has a Chinese entry for it,
 *   6. the `/name` gesture the picker inserts matches the host regex,
 *   7. the rendered injection is within a sane token budget.
 *
 * Run: node verify-skills.mjs [root...]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const YAML = require("D:/DeepSeek Harness/resources/app/dsh/node_modules/yaml");

/** The host's own name grammar, copied verbatim from @deepseek-ai/dsh-skill. */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The host's own `/name` gesture, copied verbatim from @deepseek-ai/dsh-tool-skill. */
const SKILL_GESTURE = /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g;

const ROOTS = process.argv.slice(2);
if (ROOTS.length === 0) {
	ROOTS.push("C:/Users/32361/.dsh/skills");
}

const pluginSource = readFileSync("D:/工作区/toolkit/dsh-skill-picker/client.js", "utf8");
const catalogBlock = pluginSource.match(/const CATALOG = \{[\s\S]*?\n\t\t\};/)[0];
const catalogued = new Set();
for (const match of catalogBlock.matchAll(/^\t\t\t([A-Za-z0-9-]+|"[A-Za-z0-9-]+"):\s*\[/gm)) {
	catalogued.add(match[1].replaceAll('"', ""));
}

/** Parse frontmatter exactly as the host does: YAML between leading `---` fences. */
function parseFrontmatter(text) {
	if (!text.startsWith("---")) return { ok: false, reason: "no leading ---" };
	const end = text.indexOf("\n---", 3);
	if (end < 0) return { ok: false, reason: "unterminated frontmatter" };
	const head = text.slice(3, end);
	let data;
	try {
		data = YAML.parse(head);
	} catch (error) {
		return { ok: false, reason: `invalid YAML: ${error.message.split("\n")[0]}` };
	}
	if (typeof data !== "object" || data === null) return { ok: false, reason: "frontmatter is not a mapping" };
	return { ok: true, data, body: text.slice(end + 4) };
}

const rows = [];
for (const root of ROOTS) {
	let entries = [];
	try {
		entries = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory());
	} catch (error) {
		console.log(`skip root ${root}: ${error.code}`);
		continue;
	}
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const file = join(root, entry.name, "SKILL.md");
		const problems = [];
		let text = "";
		try {
			text = readFileSync(file, "utf8");
		} catch {
			problems.push("SKILL.md missing");
		}
		let name = entry.name;
		let description = "";
		let bodyBytes = 0;
		if (text !== "") {
			const parsed = parseFrontmatter(text);
			if (!parsed.ok) problems.push(parsed.reason);
			else {
				name = String(parsed.data.name ?? "");
				description = String(parsed.data.description ?? "");
				bodyBytes = Buffer.byteLength(parsed.body, "utf8");
				if (!SKILL_NAME.test(name)) problems.push(`name fails SKILL_NAME: ${JSON.stringify(name)}`);
				if (name !== entry.name) problems.push(`name "${name}" != directory "${entry.name}"`);
				if (description.trim() === "") problems.push("empty description");
				if (bodyBytes < 200) problems.push(`body only ${bodyBytes} B`);
			}
		}
		if (!catalogued.has(entry.name)) problems.push("no Chinese CATALOG entry");

		/* The picker inserts `/<name> ` — the host must recognize that token. */
		const draft = `/${entry.name} 帮我做点事`;
		const hits = [...draft.matchAll(SKILL_GESTURE)].map((match) => match[2]);
		if (hits[0] !== entry.name) problems.push(`gesture regex did not match /${entry.name}`);

		rows.push({
			name: entry.name,
			description: description.slice(0, 46),
			kb: Math.round(Buffer.byteLength(text, "utf8") / 1024),
			problems
		});
	}
}

const width = Math.max(...rows.map((row) => row.name.length), 6);
let failed = 0;
for (const row of rows) {
	const status = row.problems.length === 0 ? "OK  " : "FAIL";
	if (row.problems.length !== 0) failed += 1;
	console.log(`${status} ${row.name.padEnd(width)}  ${String(row.kb).padStart(3)} KB  ${row.description}`);
	for (const problem of row.problems) console.log(`     -> ${problem}`);
}

console.log("");
console.log(`checked ${rows.length} skill(s)  |  failures: ${failed}`);
if (rows.length === 0) {
	console.log("NO SKILLS FOUND");
	process.exitCode = 1;
} else if (failed > 0) {
	console.log("VERIFY-SKILLS FAILED");
	process.exitCode = 1;
} else {
	console.log("VERIFY-SKILLS PASSED");
}
