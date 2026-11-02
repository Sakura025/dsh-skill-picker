/**
 * Regression test for the "empty panel" bug.
 *
 * The first released build listed `phase` in the catalog effect's dependency
 * array. `setPhase("loading")` re-ran the effect, its cleanup aborted the
 * in-flight request, and the aborted callback returned early — so the panel sat
 * on skeletons forever and looked empty. This test drives the *unstable props*
 * case (a fresh `t`/`loadSkills` identity on every render) and asserts rows
 * still appear, which is what a real host does.
 *
 * Run: node verify-regression.mjs
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "regression.mjs"));

const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
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

let payload = null;
dom.window.__ModuleLoader__ = { load: (entry) => (payload = entry) };
const storage = new Map();
Object.defineProperty(dom.window, "localStorage", {
	configurable: true,
	value: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)) }
});
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ top: 600, bottom: 632, left: 120, right: 200, width: 80, height: 32, x: 120, y: 600 });

const source = readFileSync(join(HERE, "client.js"), "utf8");
new Function("window", "document", "navigator", source)(dom.window, dom.window.document, dom.window.navigator);
const bundle = payload.factory((request) => {
	if (request === "react") return React;
	if (request === "react-dom") return ReactDOM;
	if (request === "react/jsx-runtime") return require("react/jsx-runtime");
	throw new Error("unexpected require: " + request);
});

const dicts = new Map();
let registration = null;
let component = null;
const sessionsStub = { binding: (id) => (id === "s" ? { sessionId: id } : undefined), using: async (id, o, op) => op({ sessionId: id }) };
const ctx = {
	effect: (f) => (typeof f === "function" ? f() : undefined),
	get: (name) => (name === "remote.skills" ? ctx.remote.skills : name === "sessions" ? sessionsStub : undefined),
	locale: {
		register: (ns, table) => (dicts.set(ns, table.zh), () => {}),
		bind: (ns) => (key, params) => {
			const template = dicts.get(ns)?.[key];
			if (template === undefined) throw new Error(`missing ${ns}.${key}`);
			if (!params) return template;
			return template.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m));
		}
	},
	slots: { inject: (n, f) => f(), register: (o, c) => ((registration = o), (component = c), () => {}) },
	remote: {
		skills: {
			/* A slow host: resolve after a macrotask, like a real RPC. */
			list: () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, value: { skills: [
				{ name: "test-driven-development", description: "d", modelInvocable: true },
				{ name: "code-review-and-quality", description: "d", modelInvocable: true }
			] } }), 25))
		}
	}
};
bundle.apply(ctx);

const injected = registration.inject("s");
const inserted = [];
const baseT = ctx.locale.bind("skillPicker");
const container = document.getElementById("root");
const root = createRoot(container);

/* Fresh function identities on every render: the shape that used to abort. */
function Wrapper({ tick }) {
	const t = baseT;
	const loadSkills = injected.loadSkills;
	return React.createElement(
		component,
		{
			sessionId: "s",
			inputActions: { captureInsertion: () => ({ start: 0, end: 0, draftRev: 1 }), insertText: (text) => (inserted.push(text), true) },
			loadSkills,
			t,
			key: undefined,
			"data-tick": tick
		}
	);
}

await act(async () => {
	root.render(React.createElement(Wrapper, { tick: 0 }));
});
await act(async () => {
	container.querySelector("button").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
/* Force parent re-renders while the fetch is in flight. */
for (let tick = 1; tick <= 3; tick += 1) {
	await act(async () => {
		root.render(React.createElement(Wrapper, { tick }));
		await new Promise((resolve) => setTimeout(resolve, 5));
	});
}
await act(async () => {
	await new Promise((resolve) => setTimeout(resolve, 80));
});

const dialog = document.body.querySelector('[role="dialog"]');
if (dialog === null) throw new Error("panel did not open");
const rows = [...dialog.querySelectorAll('[role="option"]')];
const skeleton = dialog.textContent.includes(dicts.get("skillPicker")["menu.loading"]);
console.log("rows           :", rows.length);
console.log("still loading? :", skeleton ? "YES (REGRESSION)" : "no");
if (rows.length === 0) throw new Error("REGRESSION: panel rendered no rows after an in-flight re-render");

await act(async () => {
	rows[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
console.log("inserted       :", JSON.stringify(inserted));
if (inserted.length !== 1) throw new Error("click-to-insert stopped working");
await act(async () => root.unmount());
console.log("REGRESSION PASSED");
