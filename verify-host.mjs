/**
 * Host-half verification without a running Harness.
 *
 * Boots `index.js` against a fake Cordis context that records the registered
 * webServer routes, then drives each one with synthetic requests. This proves
 * the install/search/remove contract — path validation, frontmatter checks,
 * overwrite refusal, and the catalog passthrough — before it ever reaches a
 * real profile.
 *
 * Every write is redirected to a temp directory through DSH_HOME, so the real
 * skill root is never touched.
 *
 * Run: node verify-host.mjs
 */
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sandbox = await mkdtemp(join(tmpdir(), "skill-picker-host-"));
process.env.DSH_HOME = sandbox;

const { apply, ROUTE_PREFIX } = await import("./index.js");

/** Every route the plugin mounted, keyed by path. */
const routes = new Map();
const fakeServer = {
	register(route) {
		routes.set(route.path, route);
		return () => routes.delete(route.path);
	}
};

/** Minimal Cordis stand-in: `inject` runs immediately, `effect` tracks disposal. */
const disposers = [];
const ctx = {
	inject: (services, factory) => factory({ webServer: fakeServer, get: () => undefined }),
	effect: (factory, label) => {
		const dispose = factory();
		disposers.push({ label, dispose });
		return dispose;
	},
	get: () => undefined
};

apply(ctx);

const mounted = [...routes.keys()].sort();
console.log("routes mounted :", mounted.map((path) => path.replace(ROUTE_PREFIX, "")).join(", "));
if (mounted.length !== 4) throw new Error("expected 4 routes, got " + mounted.length);

/** Drive one registered route with a synthetic request. */
async function call(path, method, body, query = "") {
	const route = [...routes.values()].find((candidate) => path.startsWith(candidate.path));
	if (route === undefined) throw new Error("no route for " + path);
	const url = `${route.path}${query}`;
	const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body), "utf8")];
	const request = {
		method,
		url,
		[Symbol.asyncIterator]: async function* iterate() {
			for (const chunk of chunks) yield chunk;
		}
	};
	let status = 0;
	let payload = null;
	const response = {
		writeHead(code) {
			status = code;
		},
		end(data) {
			payload = data === undefined ? null : JSON.parse(data);
		}
	};
	await route.handler(request, response);
	return { status, payload };
}

const skillText = "---\nname: my-test-skill\ndescription: 用于验证宿主写入\nauthor: test\n---\n\n# body\n";

/* 1. Paste install writes SKILL.md under DSH_HOME/skills. */
const pasted = await call(`${ROUTE_PREFIX}/install`, "POST", { content: skillText });
console.log("paste install  :", pasted.status, pasted.payload?.value?.name);
if (pasted.status !== 200 || pasted.payload.value.name !== "my-test-skill") throw new Error("paste install failed");
const written = await readFile(join(sandbox, "skills", "my-test-skill", "SKILL.md"), "utf8");
if (written !== skillText) throw new Error("written bytes differ from input");

/* 2. A second install without overwrite is refused with a typed code. */
const duplicate = await call(`${ROUTE_PREFIX}/install`, "POST", { content: skillText });
console.log("duplicate      :", duplicate.status, duplicate.payload?.error?.code);
if (duplicate.status !== 400 || duplicate.payload.error.code !== "exists") throw new Error("overwrite refusal missing");

/* 3. Overwrite is honored when asked for. */
const overwritten = await call(`${ROUTE_PREFIX}/install`, "POST", { content: skillText, overwrite: true });
if (overwritten.status !== 200) throw new Error("overwrite failed");
console.log("overwrite      :", overwritten.status);

/* 4. Name mismatch and bad frontmatter are rejected before any write. */
const mismatch = await call(`${ROUTE_PREFIX}/install`, "POST", { content: skillText, name: "other-name" });
console.log("name mismatch  :", mismatch.status, mismatch.payload?.error?.code);
if (mismatch.status !== 400 || mismatch.payload.error.code !== "name-mismatch") throw new Error("mismatch not rejected");

const noFrontmatter = await call(`${ROUTE_PREFIX}/install`, "POST", { content: "# just markdown" });
console.log("no frontmatter :", noFrontmatter.status, noFrontmatter.payload?.error?.code);
if (noFrontmatter.status !== 400 || noFrontmatter.payload.error.code !== "missing-file") throw new Error("frontmatter check missing");

const traversal = await call(`${ROUTE_PREFIX}/install`, "POST", { content: "---\nname: ../escape\n---\n" });
console.log("path traversal :", traversal.status, traversal.payload?.error?.code);
if (traversal.status !== 400 || traversal.payload.error.code !== "bad-name") throw new Error("name grammar not enforced");
if (existsSync(join(sandbox, "escape"))) throw new Error("traversal escaped the skill root");

/* 5. Installed listing parses frontmatter and reports the root. */
await mkdir(join(sandbox, "skills", "no-manifest"), { recursive: true });
await writeFile(join(sandbox, "skills", "no-manifest", "readme.txt"), "x", "utf8");
const listing = await call(`${ROUTE_PREFIX}/installed`, "GET");
const names = listing.payload.value.skills.map((row) => row.name);
console.log("installed list :", names.join(", "), "| root:", listing.payload.value.root.endsWith("skills"));
if (!names.includes("my-test-skill")) throw new Error("installed skill missing from listing");
if (names.includes("no-manifest")) throw new Error("directory without SKILL.md leaked into the listing");
if (!listing.payload.value.root.endsWith("skills")) throw new Error("root not reported");

/* 6. Repo install resolves a raw URL; a 404 chain surfaces as not-found. */
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
	const text = String(url);
	if (text.includes("raw.githubusercontent.com/acme/skills") && text.includes("/skills/remote-skill/SKILL.md")) {
		return { ok: true, status: 200, headers: new Map(), text: async () => "---\nname: remote-skill\ndescription: fetched\n---\n" };
	}
	return { ok: false, status: 404, statusText: "Not Found", headers: new Map(), text: async () => "" };
};
const remote = await call(`${ROUTE_PREFIX}/install`, "POST", { source: "acme/skills", name: "remote-skill" });
console.log("repo install   :", remote.status, remote.payload?.value?.name ?? remote.payload?.error?.code);
if (remote.status !== 200 || remote.payload.value.name !== "remote-skill") throw new Error("repo install failed");

const missing = await call(`${ROUTE_PREFIX}/install`, "POST", { source: "ghost/nothing", name: "nope" });
console.log("missing source :", missing.status, missing.payload?.error?.code);
if (missing.status !== 404 || missing.payload.error.code !== "not-found") throw new Error("missing source not reported");

/* 7. Registry search proxies skills.sh and normalizes rows. */
globalThis.fetch = async (url) => {
	if (String(url).startsWith("https://skills.sh/api/search")) {
		return {
			ok: true,
			status: 200,
			headers: new Map(),
			text: async () => JSON.stringify({ skills: [{ id: "a/b/review", source: "a/b", skillId: "review", name: "review", installs: 12 }] })
		};
	}
	return { ok: false, status: 500, statusText: "boom", headers: new Map(), text: async () => "" };
};
const searched = await call(`${ROUTE_PREFIX}/search`, "GET", undefined, "?q=review");
console.log("registry search:", searched.status, searched.payload?.value?.skills?.length, "row(s)");
if (searched.status !== 200 || searched.payload.value.skills[0].name !== "review") throw new Error("search proxy failed");

const blankSearch = await call(`${ROUTE_PREFIX}/search`, "GET", undefined, "?q=");
if (blankSearch.payload.value.skills.length !== 0) throw new Error("empty query should not hit the registry");

/* 8. Method guard and removal. */
const wrongMethod = await call(`${ROUTE_PREFIX}/install`, "GET");
console.log("method guard   :", wrongMethod.status);
if (wrongMethod.status !== 405) throw new Error("method guard missing");

const removed = await call(`${ROUTE_PREFIX}/remove`, "POST", { name: "my-test-skill" });
console.log("remove         :", removed.status, removed.payload?.value?.removed);
if (removed.status !== 200) throw new Error("remove failed");
if (existsSync(join(sandbox, "skills", "my-test-skill"))) throw new Error("directory survived removal");

const badRemove = await call(`${ROUTE_PREFIX}/remove`, "POST", { name: "../etc" });
console.log("remove guard   :", badRemove.status, badRemove.payload?.error?.code);
if (badRemove.status !== 400) throw new Error("remove accepted an invalid name");

/* 9. Disposal unmounts every route. */
for (const entry of disposers) entry.dispose();
console.log("after dispose  :", routes.size, "route(s)");
if (routes.size !== 0) throw new Error("routes survived disposal");

globalThis.fetch = realFetch;
await rm(sandbox, { recursive: true, force: true });
console.log("VERIFY-HOST PASSED");
