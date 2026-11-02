/**
 * Browser-shaped verification for the skill-picker bundle.
 *
 * Mounts the real bundle in jsdom, drives the dialog: open, filter by a Chinese
 * keyword, insert by click, switch to the installed tab, and exercise the add
 * tab's paste path against a stubbed host API.
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

const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
for (const key of ["HTMLElement", "Node", "Event", "KeyboardEvent", "MouseEvent", "FormData", "URL"]) {
	globalThis[key] = dom.window[key];
}
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
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ top: 0, bottom: 32, left: 0, right: 80, width: 80, height: 32, x: 0, y: 0 });
dom.window.confirm = () => true;

const source = readFileSync(join(HERE, "client.js"), "utf8");
new Function("window", "document", source)(dom.window, dom.window.document);
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

const CATALOG_ROWS = [
	{ name: "test-driven-development", description: "Drives development with tests.", modelInvocable: true },
	{ name: "code-review-and-quality", description: "Multi-axis review.", modelInvocable: true },
	{ name: "archify", description: "Diagrams.", modelInvocable: true },
	{ name: "some-unmapped-skill", description: "Fallback description.", modelInvocable: false }
];
const INSTALLED_ROWS = [
	{ name: "archify", description: "Diagrams.", path: "C:/skills/archify/SKILL.md" },
	{ name: "some-unmapped-skill", description: "Fallback description.", path: "C:/skills/some-unmapped-skill/SKILL.md" }
];

/** Stubbed host API: records calls and answers with the fixtures above. */
const calls = [];
const stubFetch = async (url, init) => {
	const method = init?.method ?? "GET";
	calls.push({ url: String(url), method });
	const json = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
	if (String(url).includes("/installed")) return json(200, { ok: true, value: { skills: INSTALLED_ROWS, root: "C:/skills" } });
	if (String(url).includes("/search")) {
		return json(200, { ok: true, value: { skills: [{ id: "mattpocock/skills/review", source: "mattpocock/skills", name: "review", installs: 89883 }] } });
	}
	if (String(url).includes("/install")) {
		const body = JSON.parse(init.body);
		if (body.content !== undefined && !body.content.includes("name:")) {
			return json(400, { ok: false, error: { code: "missing-file", message: "不是合法的 SKILL.md：缺少 YAML frontmatter" } });
		}
		return json(200, { ok: true, value: { name: body.name ?? "pasted-skill", path: "C:/skills/pasted-skill/SKILL.md", source: body.content ? "paste" : "repo" } });
	}
	if (String(url).includes("/remove")) return json(200, { ok: true, value: { name: "archify", removed: true } });
	return json(404, { ok: false, error: { code: "not-found", message: "no route" } });
};

/* The bundle calls the bare global `fetch`, so both scopes must see the stub. */
dom.window.fetch = stubFetch;
globalThis.fetch = stubFetch;

let listCalls = 0;
const usingCalls = [];
const sessionsStub = {
	binding: (id) => (id === "session-1" ? { sessionId: id } : undefined),
	using: async (id, options, operation) => {
		usingCalls.push(options?.source);
		return operation({ sessionId: id });
	}
};

const ctx = {
	effect: (factory) => (typeof factory === "function" ? factory() : undefined),
	get: (name) => (name === "remote.skills" ? ctx.remote.skills : name === "sessions" ? sessionsStub : undefined),
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
				return { ok: true, value: { skills: CATALOG_ROWS } };
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
const container = document.getElementById("root");
const root = createRoot(container);

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

const flush = async (ms = 30) => {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
};

await act(async () => {
	root.render(React.createElement(component, props));
});

const trigger = container.querySelector("button");
const label = dicts.get("skillPicker")["button.label"];
if (trigger === null || trigger.textContent.trim() !== label) throw new Error("trigger missing or mislabeled");
console.log("trigger label  :", label);

await act(async () => {
	trigger.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush();

const dialog = document.body.querySelector('[role="dialog"]');
if (dialog === null) throw new Error("dialog did not open");

const dialogBox = dialog.getAttribute("style") ?? "";
if (!/width:\s*min\(920px/.test(dialogBox)) throw new Error("dialog is not the widened layout: " + dialogBox);
console.log("dialog width   : min(920px, 94vw)");
console.log("catalog rows   :", dialog.querySelectorAll('[role="option"]').length, "| rpc:", listCalls, "| retention:", usingCalls.length);
if (dialog.querySelectorAll('[role="option"]').length !== CATALOG_ROWS.length) throw new Error("catalog rows wrong");

const tabs = [...dialog.querySelectorAll('[role="tab"]')].map((node) => node.textContent);
console.log("tabs           :", tabs.join(" | "));
if (tabs.length !== 3) throw new Error("expected 3 tabs");

/* Chinese search narrows the list. */
const search = dialog.querySelector("input");
await act(async () => {
	const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
	setter.call(search, "评审");
	search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
});
await flush(5);
const filtered = [...document.body.querySelector('[role="dialog"]').querySelectorAll('[role="option"]')];
console.log("search 评审    :", filtered.length);
if (filtered.length !== 1 || !filtered[0].textContent.includes("/code-review-and-quality")) throw new Error("Chinese search failed");

await act(async () => {
	filtered[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
console.log("inserted       :", JSON.stringify(inserted));
if (inserted[0] !== "/code-review-and-quality ") throw new Error("insert wrong");
if (document.body.querySelector('[role="dialog"]') !== null) throw new Error("dialog should close after insert");

/* Installed tab hits the host route. */
await act(async () => {
	trigger.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush();
const reopened = document.body.querySelector('[role="dialog"]');
const installedTab = [...reopened.querySelectorAll('[role="tab"]')].find((node) => node.textContent === dicts.get("skillPicker")["tab.installed"]);
await act(async () => {
	installedTab.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush(60);
const installedRows = document.body.querySelector('[role="dialog"]').querySelectorAll('[role="option"]');
console.log("installed rows :", installedRows.length, "| api calls:", calls.map((c) => `${c.method} ${c.url.split("/").pop()}`).join(", "));
if (installedRows.length !== INSTALLED_ROWS.length) throw new Error("installed tab did not load from the host");
if (!calls.some((call) => call.url.includes("/installed"))) throw new Error("installed route never called");

/* Add tab: paste path, including the host's validation error. */
const addTab = [...document.body.querySelector('[role="dialog"]').querySelectorAll('[role="tab"]')].find((node) => node.textContent === dicts.get("skillPicker")["tab.add"]);
await act(async () => {
	addTab.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush(5);
const addPane = document.body.querySelector('[role="dialog"]');
const modeButtons = [...addPane.querySelectorAll("button")];
const pasteMode = modeButtons.find((node) => node.textContent === dicts.get("skillPicker")["add.tab.paste"]);
await act(async () => {
	pasteMode.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush(5);
const textarea = document.body.querySelector('[role="dialog"] textarea');
if (textarea === null) throw new Error("paste textarea missing");
await act(async () => {
	const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
	setter.call(textarea, "no frontmatter here");
	textarea.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
});
const submit = [...document.body.querySelector('[role="dialog"]').querySelectorAll("button")].find((node) => node.textContent === dicts.get("skillPicker")["add.submit"]);
await act(async () => {
	submit.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush(40);
const errorText = document.body.querySelector('[role="dialog"]').textContent;
console.log("paste error    :", errorText.includes("SKILL.md") ? "surfaced from host" : "MISSING");
if (!errorText.includes("SKILL.md")) throw new Error("host validation error was not surfaced");

await act(async () => {
	const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
	setter.call(document.body.querySelector('[role="dialog"] textarea'), "---\nname: pasted-skill\ndescription: d\n---\nbody");
	document.body.querySelector('[role="dialog"] textarea').dispatchEvent(new dom.window.Event("input", { bubbles: true }));
});
await flush(5);
const submit2 = [...document.body.querySelector('[role="dialog"]').querySelectorAll("button")].find((node) => node.textContent === dicts.get("skillPicker")["add.submit"]);
await act(async () => {
	submit2.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
});
await flush(40);
const okText = document.body.querySelector('[role="dialog"]').textContent;
console.log("paste success  :", /已安装|Installed/.test(okText) ? "shown" : "MISSING");
if (!/已安装|Installed/.test(okText)) throw new Error("install success not reported");

await act(async () => root.unmount());
console.log("VERIFY PASSED");
