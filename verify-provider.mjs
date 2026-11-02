/**
 * Prove the real host skill provider discovers and parses every installed skill.
 *
 * Rather than trusting file presence, this boots the actual
 * `@deepseek-ai/dsh-skill-filesystem` provider against the live `$DSH_HOME`
 * skill root with a stub Cordis context, then asserts each skill yields a body
 * whose `renderSkillContent` output is what the model would receive.
 *
 * Run: node verify-provider.mjs
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const APP = "D:/DeepSeek Harness/resources/app/dsh/node_modules/@deepseek-ai";
const require = createRequire(join(APP, "noop.js"));

const dshHome = process.env.DSH_HOME ?? "C:/Users/32361/.dsh";
process.env.DSH_HOME = dshHome;

/* ESM needs file:// URLs on Windows; bare absolute paths are rejected. */
const asUrl = (relative) => pathToFileURL(join(APP, relative)).href;

const { FileSystemSkillProvider } = await import(asUrl("dsh-skill-filesystem/lib/index.js"));
const { renderSkillContent, isModelInvocable, isUserInvocable, isSkillName } = await import(asUrl("dsh-skill/lib/index.js"));

/* A Cordis-shaped context: the provider only needs a logger, an abort signal and
   an optional fs service (absent here, so it falls back to node:fs). */
const ctx = {
	logger: { warn: (message) => console.log("[warn]", message), info() {}, debug() {}, error: (m) => console.log("[error]", m) },
	effect: (factory) => (typeof factory === "function" ? factory() : undefined),
	on() {},
	get: () => undefined
};

const control = { invalidate: () => {}, signal: new AbortController().signal };
const provider = new FileSystemSkillProvider(ctx, control, {
	providerName: "verify",
	includeDefaultRoots: false,
	dshHome,
	agentsHome: join(dshHome, ".."),
	customSkillDirs: [join(dshHome, "skills")],
	watch: false,
	watchUsePolling: false,
	watchStabilityThresholdMs: 200,
	watchPollIntervalMs: 100,
	watchMaxProjects: 8,
	watchFollowSymlinks: false
});

const candidates = await provider.list({ cwd: process.cwd() });
const list = Array.isArray(candidates) ? candidates : candidates.candidates;
console.log("discovered     :", list.length, "via the real provider");

const onDisk = readdirSync(join(dshHome, "skills"), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();
console.log("on disk        :", onDisk.length);

const failures = [];
let injectedBytes = 0;
for (const candidate of list) {
	const skill = await provider.get(candidate, { signal: new AbortController().signal });
	if (skill === undefined) {
		failures.push(`${candidate.name}: provider refused to load`);
		continue;
	}
	if (!isSkillName(skill.name)) failures.push(`${skill.name}: invalid kebab-case name`);
	if (!isUserInvocable(skill)) failures.push(`${skill.name}: not user-invocable`);
	if (!isModelInvocable(skill)) failures.push(`${skill.name}: not model-invocable`);
	if (typeof skill.content !== "string" || skill.content.trim() === "") failures.push(`${skill.name}: empty body`);

	const rendered = renderSkillContent(skill);
	injectedBytes += Buffer.byteLength(rendered, "utf8");
	if (!rendered.includes(`<skill_content name="${skill.name}">`)) failures.push(`${skill.name}: render lost its name attribute`);
	if (!rendered.includes("<skill_instructions>")) failures.push(`${skill.name}: render missing instructions block`);
	if (skill.resourceBase?.kind !== "directory") failures.push(`${skill.name}: no resource base`);

	console.log(
		`  ${skill.name.padEnd(34)} ${String(Math.round(rendered.length / 1024)).padStart(3)} KB rendered  ${skill.description.slice(0, 40)}`
	);
}

const loaded = list.length - failures.filter((failure) => failure.includes("refused")).length;
const missing = onDisk.filter((name) => !list.some((candidate) => candidate.name === name));
if (missing.length > 0) failures.push(`provider did not discover: ${missing.join(", ")}`);

console.log("");
console.log(`loaded          : ${loaded}/${list.length}`);
console.log(`rendered total  : ${(injectedBytes / 1024).toFixed(0)} KB`);
console.log(`failures        : ${failures.length}`);
for (const failure of failures) console.log(`  -> ${failure}`);

await provider.dispose?.();

if (failures.length === 0 && list.length === onDisk.length) {
	console.log("VERIFY-PROVIDER PASSED");
} else {
	console.log("VERIFY-PROVIDER FAILED");
	process.exitCode = 1;
}
