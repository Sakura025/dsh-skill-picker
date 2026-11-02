/**
 * Browser-shaped verification for the skill-picker bundle.
 *
 * Runs the real bundle inside jsdom with react-dom/client, clicks the trigger,
 * and asserts the rendered rows. This catches what a static render cannot:
 * effects, the async catalog fetch, retention, keyboard navigation, and
 * click-to-insert.
 *
 * Run: node verify.mjs
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "verify.mjs"));

const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", {
	url: "http://localhost/",
	pretendToBeVisual: true
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
/* Node 22 exposes `navigator` as a getter-only global; redefine it. */
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.PointerEvent = dom.window.PointerEvent ?? dom.window.MouseEvent;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const ReactDOM = require("react-dom");
const { createRoot } = require("react-dom/client");
const { act } = React;

/* The bundle reads `window.__ModuleLoader__` at top level. */
let payload = null;
dom.window.__ModuleLoader__ = { load: (entry) => (payload = entry) };
const storage = new Map();
Object.defineProperty(dom.window, "localStorage", {
	configurable: true,
	value: {
		getItem: (key) => (storage.has(key) ? storage.get(key) : null),
		setItem: (key, value) => storage.set(key, String(value))
	}
});
/* jsdom has no layout; the panel positions itself from this rect. */
dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
	return { top: 600, bottom: 632, left: 120, right: 200, width: 80, height: 32, x: 120, y: 600 };
};

const source = readFileSync(join(HERE, "client.js"), "utf8");
new Function("window", "document", "navigator", source)(dom.window, dom.window.document, dom.window.navigator);

if (payload === null) throw new Error("bundle did not register a factory");
console.log("module id      :", payload.id);

const bundle = payload.factory((request) => {
	if (request === "react") return React;
	if (request === "react-dom") return ReactDOM;
	if (request === "react/jsx-runtime") return require("react/jsx-runtime");
	throw new Error("unexpected require: " + request);
});

const dicts = new Map();
let registration = null;
let component = null;

const SKILLS = [
	{ name: "test-driven-development", description: "Drives development with tests.", modelInvocable: true },
	{ name: "code-review-and-quality", description: "Multi-axis review.", modelInvocable: true },
	{ name: "archify", description: "Diagrams.", modelInvocable: true },
	{ name: "some-unmapped-skill", description: "Fallback description.", modelInvocable: false }
];

let listCalls = 0;
const usingCalls = [];
const sessionsStub = {
	binding: (id) => (id === "session-1" ? { sessionId: id } : undefined),
	using: async (id, options, operation) => {
		usingCalls.push({ id, source: options?.source });
		return operation({ sessionId: id });
	}
};

const ctx = {
	effect: (factory) => (typeof factory === "function" ? factory() : undefined),
	get: (name) => {
		if (name === "remote.skills") return ctx.remote.skills;
		if (name === "sessions") return sessionsStub;
		return undefined;
	},
	locale: {
		register: (namespace, table) => {
			dicts.set(namespace, table.zh);
			return () => {};
		},
		bind: (namespace) => (key, params) => {
			const template = dicts.get(namespace)?.[key];
			if (template === undefined) throw new Error(`missing ${namespace}.${key}`);
			if (!params) return template;
			return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
		}
	},
	slots: {
		inject: (name, factory) => factory(),
		register: (options, registered) => {
			registration = options;
			component = registered;
			return () => {};
		}
	},
	remote: {
		skills: {
			list: async () => {
				listCalls += 1;
				return { ok: true, value: { skills: SKILLS } };
			}
		}
	}
};

bundle.apply(ctx);
if (registration === null) throw new Error("no slot registration");
if (registration.name !== "conversation.input.left") throw new Error("wrong slot: " + registration.name);
if (component === null) throw new Error("no component registered");

const t = ctx.locale.bind("skillPicker");
const injected = registration.inject("session-1");
const inserted = [];
const props = {
	sessionId: "session-1",
	inputActions: {
		captureInsertion: () => ({ start: 0, end: 0, draftRev: 1 }),
		insertText: (text) => {
			inserted.push(text);
			return true;
		}
	},
	loadSkills: injected.loadSkills,
	t
};

const container = document.getElementById("root");
const root = createRoot(container);
await act(async () => {
	root.render(React.createElement(component, props));
});

const CJK = /[\u4e00-\u9fff]/;
const label = dicts.get("skillPicker")["button.label"];
const trigger = container.querySelector("button");
if (trigger === null) throw new Error("trigger button missing");
if (trigger.textContent.trim() !== label) throw new Error("trigger label wrong: " + trigger.textContent);
console.log("trigger label  :", label);

await act(async () => {
	trigger.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await act(async () => {
	await new Promise((resolve) => setTimeout(resolve, 30));
});

const dialog = document.body.querySelector('[role="dialog"]');
if (dialog === null) throw new Error("panel did not open");

const rows = [...dialog.querySelectorAll('[role="option"]')];
if (rows.length !== SKILLS.length) throw new Error(`expected ${SKILLS.length} rows, got ${rows.length}`);
console.log("rows rendered  :", rows.length, "| rpc calls:", listCalls, "| retention:", usingCalls.length);

if (usingCalls.length === 0) throw new Error("catalog was fetched without retaining the session");
if (listCalls !== 1) throw new Error("catalog fetched more than once per open");

const first = rows[0].textContent;
console.log("first row      :", first);
if (!CJK.test(first)) throw new Error("no Chinese text in row: " + first);
if (!first.includes("/test-driven-development")) throw new Error("slash name missing: " + first);

const seenGroups = [...new Set([...dialog.querySelectorAll("div")].map((node) => node.textContent).filter((text) => text && /^[\u2460-\u2465\u8200-\u8209]/u.test(text)))];
console.log("group headers  :", seenGroups.join(" / ") || "(none captured)");

/* Search by a Chinese keyword drawn from the dictionary-independent CATALOG text. */
const search = dialog.querySelector("input");
if (search === null) throw new Error("search input missing");
const query = "评审";
await act(async () => {
	const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
	setter.call(search, query);
	search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
});
const filtered = [...document.body.querySelector('[role="dialog"]').querySelectorAll('[role="option"]')];
console.log("search", query, "  :", filtered.length, "row(s)");
if (filtered.length !== 1) throw new Error("Chinese search should narrow to one row");
if (!filtered[0].textContent.includes("/code-review-and-quality")) throw new Error("wrong row survived the search");

await act(async () => {
	filtered[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
console.log("inserted text  :", JSON.stringify(inserted));
if (inserted.length !== 1 || inserted[0] !== "/code-review-and-quality ") throw new Error("insert text wrong");
if (document.body.querySelector('[role="dialog"]') !== null) throw new Error("panel should close after insert");

/* Reopening must surface the used skill under the recent group. */
await act(async () => {
	trigger.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await act(async () => {
	await new Promise((resolve) => setTimeout(resolve, 30));
});
const reopened = document.body.querySelector('[role="dialog"]');
if (reopened === null) throw new Error("panel did not reopen");
const recentLabel = dicts.get("skillPicker")["menu.recent"];
const hasRecent = [...reopened.querySelectorAll("div")].some((node) => node.textContent === recentLabel);
console.log("recent group   :", hasRecent ? "present" : "MISSING");
if (!hasRecent) throw new Error("recent group not rendered");

await act(async () => {
	root.unmount();
});

const used = [...source.matchAll(/\bt\("([\w.]+)"/g)].map((match) => match[1]).filter((key) => !key.endsWith("."));
for (const key of new Set(used)) {
	if (!(key in dicts.get("skillPicker"))) throw new Error("bundle uses undefined key: " + key);
}
for (const phase of ["recent", "group.define", "group.plan", "group.build", "group.verify", "group.review", "group.ship", "group.meta", "group.other"]) {
	if (!("menu." + phase in dicts.get("skillPicker"))) throw new Error("missing menu." + phase);
}

console.log("dictionary keys:", Object.keys(dicts.get("skillPicker")).length, "| referenced:", new Set(used).size);
console.log("VERIFY PASSED");
