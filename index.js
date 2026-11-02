/**
 * Host half of the skill-picker bundle.
 *
 * The browser cannot write `~/.dsh/skills`, and it cannot reach third-party
 * registries through the app's own origin, so both jobs land here: a tiny HTTP
 * face on the host webServer that (1) searches skills.sh, (2) installs one
 * skill from a git repo or a raw URL, (3) writes a pasted SKILL.md, and
 * (4) lists/removes skills this plugin installed.
 *
 * Every mutating route is deliberately narrow:
 *   - only kebab-case skill names reach the filesystem,
 *   - installs land under `$DSH_HOME/skills/<name>`, never elsewhere,
 *   - an existing directory is never overwritten without `overwrite: true`,
 *   - upstream content must parse as YAML frontmatter with a matching `name`.
 *
 * @module @local/dsh-skill-picker
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

/** Route prefix; the browser half uses the same constant. */
export const ROUTE_PREFIX = "/dsh-skill-picker/api/v1";

/** Kebab-case, matching the host skill-name grammar. */
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Skills fetched over the network are capped so a bad URL cannot fill the disk. */
const MAX_DOWNLOAD_BYTES = 1_500_000;

/** Registry search page size. */
const SEARCH_LIMIT = 24;

/** Public skill registry used for discovery. */
const REGISTRY = "https://skills.sh/api/search";

/**
 * Resolve the directory user-installed skills live in.
 * @returns absolute path to `$DSH_HOME/skills`.
 */
function skillRoot() {
	const home = process.env.DSH_HOME;
	const base = typeof home === "string" && home.trim() !== "" ? home : join(homedir(), ".dsh");
	return join(base, "skills");
}

/**
 * Split a SKILL.md into frontmatter fields and body without a YAML dependency.
 * Only the flat `key: value` shape skills actually use is understood.
 * @param text - raw file content.
 * @returns parsed name/description, or undefined when there is no frontmatter.
 */
function parseFrontmatter(text) {
	if (!text.startsWith("---")) return undefined;
	const end = text.indexOf("\n---", 3);
	if (end < 0) return undefined;
	const head = text.slice(3, end);
	const fields = {};
	for (const line of head.split(/\r?\n/)) {
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (match === null) continue;
		let value = match[2].trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		fields[match[1]] = value;
	}
	return fields;
}

/**
 * Read and validate one candidate SKILL.md.
 * @param text - file content from a paste or a download.
 * @param expected - optional name the caller asked for.
 * @returns the name and description, or a reason why it was rejected.
 */
function validateSkill(text, expected) {
	const fields = parseFrontmatter(text);
	if (fields === undefined) return { ok: false, reason: "missing-file", message: "不是合法的 SKILL.md：缺少 YAML frontmatter" };
	const name = fields.name;
	if (typeof name !== "string" || !NAME_PATTERN.test(name)) {
		return { ok: false, reason: "bad-name", message: "frontmatter 里的 name 必须是小写 kebab-case" };
	}
	if (expected !== undefined && name !== expected) {
		return { ok: false, reason: "name-mismatch", message: `请求安装的是 ${expected}，内容却是 ${name}` };
	}
	if (text.length > MAX_DOWNLOAD_BYTES) return { ok: false, reason: "too-large", message: "文件超过大小上限" };
	return { ok: true, name, description: fields.description ?? "" };
}

/**
 * Fetch a URL as text with a hard byte ceiling and a timeout.
 * @param url - absolute http(s) URL.
 * @param init - extra fetch options.
 * @returns the response body text.
 */
async function fetchText(url, init = {}) {
	const response = await fetch(url, {
		...init,
		redirect: "follow",
		signal: AbortSignal.timeout(20_000),
		headers: { "user-agent": "dsh-skill-picker", accept: "text/plain, application/json, */*", ...(init.headers ?? {}) }
	});
	if (!response.ok) throw new Error(`upstream ${response.status} ${response.statusText}`);
	const declared = Number(response.headers.get("content-length") ?? "0");
	if (declared > MAX_DOWNLOAD_BYTES) throw new Error("upstream file is too large");
	const text = await response.text();
	if (text.length > MAX_DOWNLOAD_BYTES) throw new Error("upstream file is too large");
	return text;
}

/**
 * Turn a GitHub-style reference into raw candidate URLs for its SKILL.md.
 * Accepts `owner/repo`, `owner/repo/skill`, a repo URL, or a raw URL.
 * @param input - user-supplied source reference.
 * @param name - skill name to append when the reference names only a repo.
 * @returns ordered candidate URLs.
 */
function candidateSkillUrls(input, name) {
	const trimmed = input.trim();
	if (/^https?:\/\//i.test(trimmed)) {
		if (/\/SKILL\.md$/i.test(trimmed)) return [trimmed];
		const base = trimmed.replace(/\/+$/, "").replace(/\.git$/, "");
		return [`${base}/SKILL.md`, `${base}/skills/${name}/SKILL.md`];
	}
	const parts = trimmed.split("/").filter((part) => part !== "");
	if (parts.length < 2) return [];
	const [owner, repo, ...rest] = parts;
	const refs = ["main", "master"];
	const urls = [];
	for (const branch of refs) {
		if (rest.length > 0) urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest.join("/")}/SKILL.md`);
		urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/skills/${name}/SKILL.md`);
		urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${name}/SKILL.md`);
		urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`);
	}
	return urls;
}

/**
 * Write one skill directory, refusing to clobber an existing one.
 * @param name - validated kebab-case name.
 * @param text - SKILL.md content.
 * @param overwrite - replace an existing directory.
 * @returns the installed path.
 */
async function writeSkill(name, text, overwrite) {
	const root = skillRoot();
	const dir = join(root, name);
	await mkdir(root, { recursive: true });
	if (!overwrite) {
		try {
			await stat(dir);
			throw Object.assign(new Error(`技能 ${name} 已存在`), { code: "exists" });
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
	}
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "SKILL.md"), text, "utf8");
	return dir;
}

/** Read a JSON body with a small ceiling. */
async function readJson(request) {
	const chunks = [];
	let size = 0;
	for await (const chunk of request) {
		size += chunk.length;
		if (size > 2_000_000) throw new Error("request body too large");
		chunks.push(chunk);
	}
	if (chunks.length === 0) return {};
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Send JSON with no-store caching. */
function sendJson(response, status, payload) {
	const body = JSON.stringify(payload);
	response.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(body)
	});
	response.end(body);
}

/**
 * Search the public skill registry.
 * @param query - free-text query.
 * @returns normalized rows.
 */
async function searchRegistry(query) {
	const url = `${REGISTRY}?q=${encodeURIComponent(query)}`;
	const payload = JSON.parse(await fetchText(url));
	const rows = Array.isArray(payload.skills) ? payload.skills : [];
	return rows.slice(0, SEARCH_LIMIT).map((row) => ({
		id: String(row.id ?? ""),
		source: String(row.source ?? ""),
		name: String(row.skillId ?? row.name ?? ""),
		installs: Number(row.installs ?? 0)
	}));
}

/**
 * List skills this plugin can see on disk, with their frontmatter.
 * @returns rows sorted by name.
 */
async function listInstalled() {
	const root = skillRoot();
	let names = [];
	try {
		names = await readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const rows = [];
	for (const entry of names) {
		if (!entry.isDirectory() || !NAME_PATTERN.test(entry.name)) continue;
		try {
			const text = await readFile(join(root, entry.name, "SKILL.md"), "utf8");
			const fields = parseFrontmatter(text) ?? {};
			rows.push({
				name: entry.name,
				description: fields.description ?? "",
				path: join(root, entry.name, "SKILL.md")
			});
		} catch {
			/* a directory without SKILL.md is not a skill */
		}
	}
	rows.sort((left, right) => left.name.localeCompare(right.name));
	return rows;
}

/**
 * Remove one skill this plugin installed.
 * @param name - validated kebab-case name.
 * @returns whether a directory was removed.
 */
async function removeSkill(name) {
	const dir = join(skillRoot(), name);
	await rm(dir, { recursive: true, force: true });
	return true;
}

/**
 * Host plugin body: mount the picker's API on the web server.
 * @param ctx - host context; `webServer` and `connection` are optional.
 */
export function apply(ctx) {
	ctx.inject(["webServer"], (hostCtx) => {
		const server = hostCtx.webServer;

		/**
		 * Every route runs behind the host's own request gate when one exists, so
		 * an authenticated browser tab is required — a bare `curl` from another
		 * origin is refused before any handler runs.
		 * @param route - path, method set, and handler.
		 * @returns the disposer.
		 */
		const mount = (path, methods, handler) => {
			const guarded = async (request, response) => {
				const connection = hostCtx.get("connection");
				const gate = connection?.requestRejection;
				if (typeof gate === "function") {
					const rejection = gate.call(connection, request);
					if (rejection !== undefined) {
						sendJson(response, rejection, { ok: false, error: { code: "unauthorized", message: "需要先从 DSH 页面访问" } });
						return;
					}
				}
				if (!methods.includes(request.method ?? "GET")) {
					response.writeHead(405, { allow: methods.join(", ") });
					response.end();
					return;
				}
				try {
					await handler(request, response);
				} catch (error) {
					sendJson(response, 400, {
						ok: false,
						error: { code: error.code ?? "failed", message: error instanceof Error ? error.message : String(error) }
					});
				}
			};
			return server.register({ kind: "prefix", path, handler: guarded });
		};

		const disposers = [
			mount(`${ROUTE_PREFIX}/search`, ["GET"], async (request, response) => {
				const url = new URL(request.url ?? "/", "http://localhost");
				const query = (url.searchParams.get("q") ?? "").trim();
				if (query === "") {
					sendJson(response, 200, { ok: true, value: { skills: [] } });
					return;
				}
				const skills = await searchRegistry(query);
				sendJson(response, 200, { ok: true, value: { skills, registry: REGISTRY } });
			}),

			mount(`${ROUTE_PREFIX}/installed`, ["GET"], async (request, response) => {
				sendJson(response, 200, { ok: true, value: { skills: await listInstalled(), root: skillRoot() } });
			}),

			mount(`${ROUTE_PREFIX}/install`, ["POST"], async (request, response) => {
				const body = await readJson(request);
				const source = typeof body.source === "string" ? body.source.trim() : "";
				const content = typeof body.content === "string" ? body.content : undefined;
				const expected = typeof body.name === "string" && body.name !== "" ? body.name : undefined;
				const overwrite = body.overwrite === true;

				if (content !== undefined) {
					const checked = validateSkill(content, expected);
					if (!checked.ok) {
						sendJson(response, 400, { ok: false, error: { code: checked.reason, message: checked.message } });
						return;
					}
					const path = await writeSkill(checked.name, content, overwrite);
					sendJson(response, 200, { ok: true, value: { name: checked.name, path, source: "paste" } });
					return;
				}

				if (source === "") {
					sendJson(response, 400, { ok: false, error: { code: "bad-source", message: "需要 source 或 content" } });
					return;
				}
				const wanted = expected ?? source.split("/").filter((part) => part !== "").pop() ?? "";
				const urls = candidateSkillUrls(source, NAME_PATTERN.test(wanted) ? wanted : "");
				if (urls.length === 0) {
					sendJson(response, 400, { ok: false, error: { code: "bad-source", message: "无法解析这个来源" } });
					return;
				}
				const failures = [];
				for (const url of urls) {
					try {
						const text = await fetchText(url);
						const checked = validateSkill(text, NAME_PATTERN.test(wanted) ? wanted : undefined);
						if (!checked.ok) {
							failures.push(`${url}: ${checked.message}`);
							continue;
						}
						const path = await writeSkill(checked.name, text, overwrite);
						sendJson(response, 200, { ok: true, value: { name: checked.name, path, source: url } });
						return;
					} catch (error) {
						failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
					}
				}
				sendJson(response, 404, {
					ok: false,
					error: { code: "not-found", message: `没找到可安装的 SKILL.md（试过 ${urls.length} 个地址）`, detail: failures.slice(0, 4) }
				});
			}),

			mount(`${ROUTE_PREFIX}/remove`, ["POST"], async (request, response) => {
				const body = await readJson(request);
				const name = typeof body.name === "string" ? body.name : "";
				if (!NAME_PATTERN.test(name)) {
					sendJson(response, 400, { ok: false, error: { code: "bad-name", message: "name 必须是小写 kebab-case" } });
					return;
				}
				await removeSkill(name);
				sendJson(response, 200, { ok: true, value: { name, removed: true } });
			})
		];

		ctx.effect(() => () => {
			for (const dispose of disposers) dispose();
		}, "skill-picker: host routes");
	});
}

export const name = "dsh-skill-picker-host";
