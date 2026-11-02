/**
 * Live round-trip: install a skill through the plugin's own host routes, then
 * confirm the real host provider discovers and renders it — the exact path a
 * user's click takes. Cleanup removes everything it created.
 *
 * Writes go to a temp DSH_HOME so the real skill root stays untouched, then the
 * provider is pointed at that same temp root.
 *
 * Run: node verify-roundtrip.mjs
 */
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const APP = "D:/DeepSeek Harness/resources/app/dsh/node_modules/@deepseek-ai";
const asUrl = (relative) => pathToFileURL(join(APP, relative)).href;

const sandbox = await mkdtemp(join(tmpdir(), "skill-roundtrip-"));
process.env.DSH_HOME = sandbox;

const { apply, ROUTE_PREFIX } = await import(pathToFileURL("D:/工作区/toolkit/dsh-skill-picker/index.js").href);
const { FileSystemSkillProvider } = await import(asUrl("dsh-skill-filesystem/lib/index.js"));
const { renderSkillContent } = await import(asUrl("dsh-skill/lib/index.js"));

/** Mount the plugin's routes on a recording server. */
const routes = new Map();
const ctx = {
	inject: (services, factory) => factory({ webServer: { register: (route) => (routes.set(route.path, route), () => routes.delete(route.path)) }, get: () => undefined }),
	effect: (factory) => (typeof factory === "function" ? factory() : undefined),
	get: () => undefined
};
apply(ctx);

async function call(path, method, body, query = "") {
	const route = [...routes.values()].find((candidate) => path.startsWith(candidate.path));
	const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body), "utf8")];
	let status = 0;
	let payload = null;
	await route.handler(
		{
			method,
			url: `${route.path}${query}`,
			[Symbol.asyncIterator]: async function* iterate() {
				for (const chunk of chunks) yield chunk;
			}
		},
		{
			writeHead(code) {
				status = code;
			},
			end(data) {
				payload = data === undefined ? null : JSON.parse(data);
			}
		}
	);
	return { status, payload };
}

/** The same provider configuration a DSH profile uses. */
function provider() {
	return new FileSystemSkillProvider(
		{ logger: { warn() {}, info() {}, debug() {}, error() {} }, effect: (f) => (typeof f === "function" ? f() : undefined), on() {}, get: () => undefined },
		{ invalidate: () => {}, signal: new AbortController().signal },
		{
			providerName: "roundtrip",
			includeDefaultRoots: false,
			dshHome: sandbox,
			agentsHome: join(sandbox, "agents"),
			customSkillDirs: [join(sandbox, "skills")],
			watch: false,
			watchUsePolling: false,
			watchStabilityThresholdMs: 200,
			watchPollIntervalMs: 100,
			watchMaxProjects: 4,
			watchFollowSymlinks: false
		}
	);
}

const SKILL = `---
name: roundtrip-demo
description: Verifies the picker's install path end to end.
---

# Roundtrip demo

When this skill loads, the install route, the frontmatter validation, the
filesystem write, and the host provider discovery all worked in one pass.

## Steps
1. Read the request.
2. Confirm the skill body reached the model verbatim.
`;

/* 1. Install through the plugin's paste route. */
const installed = await call(`${ROUTE_PREFIX}/install`, "POST", { content: SKILL });
console.log("install route  :", installed.status, installed.payload?.value?.name);
if (installed.status !== 200) throw new Error("install route failed");

/* 2. The real provider must discover it. */
const fsProvider = provider();
const candidates = await fsProvider.list({ cwd: sandbox });
const list = Array.isArray(candidates) ? candidates : candidates.candidates;
const names = list.map((candidate) => candidate.name);
console.log("discovered     :", names.join(", ") || "(none)");
if (!names.includes("roundtrip-demo")) throw new Error("provider did not discover the installed skill");

/* 3. Loading it must yield the exact body the model would see. */
const skill = await fsProvider.get(list.find((candidate) => candidate.name === "roundtrip-demo"), { signal: new AbortController().signal });
const rendered = renderSkillContent(skill);
const bodyOk = rendered.includes("When this skill loads, the install route");
const nameOk = rendered.includes('<skill_content name="roundtrip-demo">');
console.log("render body    :", bodyOk ? "verbatim" : "LOST");
console.log("render name    :", nameOk ? "ok" : "LOST");
if (!bodyOk || !nameOk) throw new Error("rendered injection is wrong");

/* 4. The picker would insert `/roundtrip-demo `; the host gesture must match. */
const GESTURE = /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g;
const hit = [...`/roundtrip-demo 帮我做点事`.matchAll(GESTURE)].map((match) => match[2]);
console.log("gesture        :", hit[0] === "roundtrip-demo" ? "/roundtrip-demo matched" : "NO MATCH");
if (hit[0] !== "roundtrip-demo") throw new Error("inserted gesture would not resolve");

/* 5. The installed tab lists it with the parsed description. */
const listing = await call(`${ROUTE_PREFIX}/installed`, "GET");
const row = listing.payload.value.skills.find((entry) => entry.name === "roundtrip-demo");
console.log("installed tab  :", row === undefined ? "MISSING" : row.description);
if (row === undefined) throw new Error("installed tab does not show the new skill");

/* 6. Removal takes it out of the provider's view too. */
await call(`${ROUTE_PREFIX}/remove`, "POST", { name: "roundtrip-demo" });
const after = await fsProvider.list({ cwd: sandbox });
const afterList = Array.isArray(after) ? after : after.candidates;
console.log("after remove   :", afterList.length, "skill(s) visible");
if (afterList.some((candidate) => candidate.name === "roundtrip-demo")) throw new Error("removal did not propagate");
console.log("remaining dirs :", (await readdir(join(sandbox, "skills"))).length);

await fsProvider.dispose?.();
await rm(sandbox, { recursive: true, force: true });
console.log("VERIFY-ROUNDTRIP PASSED");
