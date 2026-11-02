window.__ModuleLoader__.load({
	id: "@local/dsh-skill-picker",
	factory(require) {
		const React = require("react");
		const ReactDOM = require("react-dom");
		const h = React.createElement;

		/** Dictionary namespace owned by this plugin. */
		const NS = "skillPicker";

		const zh = {
			"button.label": "技能",
			"button.tooltip": "浏览、搜索、安装技能（不用记技能名）",
			"button.inserted": "已插入",
			"panel.title": "技能",
			"panel.close": "关闭",
			"tab.catalog": "本次可用",
			"tab.installed": "本地已装",
			"tab.add": "添加技能",
			"search.placeholder": "搜索：中文名、说明、/英文名 都行",
			"search.count": "{count} 个",
			"search.empty": "没有匹配的技能",
			"loading": "正在加载…",
			"catalog.failed": "技能目录接口不可用，以下为内置清单（插入后仍由宿主解析）",
			"catalog.fallback": "宿主没返回技能清单，以下为内置清单（插入后仍由宿主解析）",
			"retry": "重试",
			"multi.on": "多选",
			"multi.off": "单选",
			"filter.all": "全部",
			"filter.count": "{count}",
			"tip.single": "点击任意一行即插入到输入框",
			"tip.multi": "已选 {count} 项 · 点插入一次性拼进草稿",
			"insert": "插入",
			"cancel": "取消",
			"recent": "最近使用",
			"group.define": "① 定义需求",
			"group.plan": "② 规划拆解",
			"group.build": "③ 写代码",
			"group.verify": "④ 测试验证",
			"group.review": "⑤ 评审加固",
			"group.ship": "⑥ 交付上线",
			"group.meta": "技能入口",
			"group.other": "其它",
			"needPick": "先选至少一个技能",
			"userOnly": "仅用户",
			"installed.empty": "本地还没有安装技能。切到「添加技能」装一个。",
			"installed.root": "安装目录",
			"installed.remove": "删除",
			"installed.confirmRemove": "确认删除「{name}」？",
			"installed.removed": "已删除 {name}",
			"add.tab.repo": "仓库 / 地址",
			"add.tab.paste": "粘贴 SKILL.md",
			"add.repo.label": "来源：owner/repo、owner/repo/skill，或 raw 地址",
			"add.repo.placeholder": "addyosmani/agent-skills/skills/code-review-and-quality",
			"add.name.label": "技能名（可选，须与 frontmatter 一致）",
			"add.name.placeholder": "code-review-and-quality",
			"add.overwrite": "允许覆盖同名技能",
			"add.submit": "安装",
			"add.installing": "正在安装…",
			"add.paste.label": "SKILL.md 全文（须含 YAML frontmatter 与 name）",
			"add.paste.placeholder": "---\nname: my-skill\ndescription: 什么时候用这个技能\n---\n\n正文…",
			"add.ok": "已安装 {name}",
			"add.fail": "安装失败",
			"add.registry": "从 skills.sh 搜索并安装",
			"add.registry.search": "搜索",
			"add.registry.placeholder": "搜索公共技能库，例如 review / 测试 / pdf",
			"add.registry.empty": "公共库里没有匹配项",
			"add.installs": "{count} 次安装",
			"add.needSource": "先填来源或粘贴内容",
			"add.unavailable": "宿主接口不可用：请确认插件已装进 profile 并重启过 DSH"
		};

		const en = {
			"button.label": "Skills",
			"button.tooltip": "Browse, search, install skills",
			"button.inserted": "Inserted",
			"panel.title": "Skills",
			"panel.close": "Close",
			"tab.catalog": "This session",
			"tab.installed": "Installed",
			"tab.add": "Add skill",
			"search.placeholder": "Search by title, purpose, or /name",
			"search.count": "{count}",
			"search.empty": "No matching skill",
			"loading": "Loading...",
			"catalog.failed": "Catalog unavailable; showing the built-in list",
			"catalog.fallback": "The host returned no skills; showing the built-in list",
			"retry": "Retry",
			"multi.on": "Multi",
			"multi.off": "Single",
			"filter.all": "All",
			"filter.count": "{count}",
			"tip.single": "Click a row to insert it into the composer",
			"tip.multi": "{count} selected · Insert to add them all",
			"insert": "Insert",
			"cancel": "Cancel",
			"recent": "Recent",
			"group.define": "1 Define",
			"group.plan": "2 Plan",
			"group.build": "3 Build",
			"group.verify": "4 Verify",
			"group.review": "5 Review",
			"group.ship": "6 Ship",
			"group.meta": "Entry",
			"group.other": "Other",
			"needPick": "Pick at least one skill",
			"userOnly": "user-only",
			"installed.empty": "Nothing installed yet. Use the Add tab.",
			"installed.root": "Install root",
			"installed.remove": "Remove",
			"installed.confirmRemove": "Remove \"{name}\"?",
			"installed.removed": "Removed {name}",
			"add.tab.repo": "Repo / URL",
			"add.tab.paste": "Paste SKILL.md",
			"add.repo.label": "Source: owner/repo, owner/repo/skill, or a raw URL",
			"add.repo.placeholder": "addyosmani/agent-skills/skills/code-review-and-quality",
			"add.name.label": "Skill name (optional, must match frontmatter)",
			"add.name.placeholder": "code-review-and-quality",
			"add.overwrite": "Overwrite an existing skill",
			"add.submit": "Install",
			"add.installing": "Installing...",
			"add.paste.label": "SKILL.md content (needs YAML frontmatter with name)",
			"add.paste.placeholder": "---\nname: my-skill\ndescription: when to use it\n---\n\nBody...",
			"add.ok": "Installed {name}",
			"add.fail": "Install failed",
			"add.registry": "Search skills.sh and install",
			"add.registry.search": "Search",
			"add.registry.placeholder": "Search the public registry",
			"add.registry.empty": "Nothing found",
			"add.installs": "{count} installs",
			"add.needSource": "Provide a source or paste content first",
			"add.unavailable": "Host API unavailable: make sure the plugin is installed in the profile and DSH was restarted"
		};

		/**
		 * Chinese title, one-line purpose, and lifecycle phase for every skill this
		 * deployment ships. Unknown names fall back to the provider description.
		 */
		const CATALOG = {
			"using-agent-skills": ["技能总入口", "按任务阶段路由到合适的技能；不知道用哪个时先看它", "meta"],
			"interview-me": ["需求访谈", "一问一答挖出你真正想要什么，适需求还没写清时", "define"],
			"idea-refine": ["点子打磨", "把模糊想法发散再收敛成可执行方案，顺手压测前提假设", "define"],
			"spec-driven-development": ["规格驱动开发", "新项目/新功能先写 spec：目标、范围、验收标准，再动手", "define"],
			"constraint-driven-development": ["质量标准契约", "把质量门槛写进 CONSTRAINTS.md，并盯住被偷偷放宽的断言与跳过测试", "define"],
			"planning-and-task-breakdown": ["任务拆解", "把 spec 或明确需求拆成有顺序、可验收的任务清单", "plan"],
			"incremental-implementation": ["增量实现", "把改动切成薄而可验证的切片，一次只落一小步", "build"],
			"context-engineering": ["上下文工程", "新会话开局、输出变差或切任务时，整理规则文件与项目上下文", "build"],
			"source-driven-development": ["文档驱动实现", "写码前先按官方文档核对做法，避免用过时的 API 与模式", "build"],
			"doubt-driven-development": ["怀疑驱动开发", "每个非平凡决定交给新上下文做对抗性复核，高风险改动必备", "build"],
			"frontend-ui-engineering": ["前端界面工程", "做符合 WCAG、自适应、生产级观感的界面与组件", "build"],
			"api-and-interface-design": ["API 与接口设计", "设计稳定的 API、模块边界与对外契约；写 REST/GraphQL 端点时用", "build"],
			"test-driven-development": ["测试驱动开发", "红—绿—重构：先写失败测试，再让它通过", "verify"],
			"debugging-and-error-recovery": ["调试与错误恢复", "测试挂、构建炸、昨天还好好的：系统定位根因，不靠猜", "verify"],
			"browser-testing-with-devtools": ["浏览器实测", "用 Chrome DevTools 在真实浏览器里看 DOM、报错、网络与性能", "verify"],
			"code-review-and-quality": ["代码评审", "多维度审 diff/PR：正确性、可读性、复杂度、安全、测试覆盖", "review"],
			"code-simplification": ["代码简化", "行为不变的前提下砍复杂度、减嵌套、去掉多余抽象", "review"],
			"security-and-hardening": ["安全加固", "输入校验、鉴权会话、OWASP Top 10 审查与依赖漏洞排查", "review"],
			"performance-optimization": ["性能优化", "先测量再动手：Core Web Vitals、慢查询、N+1、渲染与内存", "review"],
			"git-workflow-and-versioning": ["Git 工作流", "原子提交、分支策略、解冲突、把凌乱工作区拆成干净提交", "ship"],
			"ci-cd-and-automation": ["CI/CD 与自动化", "搭或改流水线：质量门禁、测试执行器、部署策略", "ship"],
			"documentation-and-adrs": ["文档与 ADR", "记录架构决策与变更理由，写给三个月后的自己和同事", "ship"],
			"observability-and-instrumentation": ["可观测性与埋点", "结构化日志、RED 指标、链路追踪、按症状告警", "ship"],
			"deprecation-and-migration": ["弃用与迁移", "下线旧系统/接口，或做不停机的库表迁移（expand/contract）", "ship"],
			"shipping-and-launch": ["上线与发布", "上线检查单、灰度策略、监控看板与回滚方案", "ship"],
			archify: ["架构图生成", "把系统架构、流程、时序画成可交互 HTML 图，可导出 PNG/SVG", "other"],
			office: ["Office 总入口", "创建、编辑、检查、转换 Word / Excel / PPT / PDF", "other"],
			"office-docx": ["Word 文档", "生成、读取、编辑并校验 .docx", "other"],
			"office-xlsx": ["Excel 表格", "读取、生成、编辑表格与公式（.xlsx）", "other"],
			"office-pptx": ["PPT 演示", "生成、读取、编辑 pptx", "other"],
			"office-render": ["文档渲染预览", "把文档渲染成图片，检查排版与视觉效果", "other"],
			"office-recalculate": ["表格公式重算", "刷新公式缓存并核对计算结果", "other"],
			"office-export-pdf": ["导出 PDF", "用 LibreOffice Kit 把 Office 文档转成 PDF", "other"],
			"diagnose-windows-sandbox-acl": ["Windows 沙箱 ACL 修复", "排查并修复 DSH 文件沙箱的权限拒绝问题", "other"]
		};

		/** Lifecycle order for the grouped list. */
		const PHASES = ["define", "plan", "build", "verify", "review", "ship", "meta", "other"];

		/** Host API prefix; must match `ROUTE_PREFIX` in index.js. */
		const API = "dsh-skill-picker/api/v1";

		/** localStorage key holding the most recently inserted skill names. */
		const RECENT_KEY = "dsh-skill-picker.recent";
		const RECENT_MAX = 8;

		const SURFACE = "var(--dsw-alias-bg-layer-2, #26262a)";
		const PANEL_BG = "var(--dsw-alias-bg-layer-1, #1c1c20)";
		const RAIL_BG = "var(--dsw-alias-bg-layer-3, #2f2f34)";
		const INPUT_BG = "var(--dsw-alias-bg-base, #141416)";
		const ROW_HOVER = "var(--dsw-alias-interactive-bg-hover, rgba(140,140,150,.16))";
		const ROW_ACTIVE = "var(--dsw-alias-interactive-bg-active, rgba(140,140,150,.24))";
		const BORDER = "var(--dsw-alias-border-l3, rgba(150,150,160,.30))";
		const LABEL = "var(--dsw-alias-label-primary, #f2f2f4)";
		const MUTED = "var(--dsw-alias-label-secondary, #a9a9b2)";
		const FAINT = "var(--dsw-alias-label-tertiary, #83838c)";
		const ACCENT = "var(--dsw-static-deepseek-450, #5686fe)";
		const DANGER = "var(--dsw-alias-state-error-primary, #f25a5a)";
		const OK = "var(--dsw-alias-state-success-primary, #22c55e)";
		const SHADOW = "0 24px 70px rgba(0,0,0,.62), 0 2px 12px rgba(0,0,0,.45), 0 0 0 .5px rgba(0,0,0,.6)";

		/** Resolve one host API path against the document base, like the market does. */
		function api(path) {
			const relative = `${API}/${path}`.replace(/^\/+/, "");
			if (typeof document === "undefined") return `/${relative}`;
			return new URL(relative, document.baseURI).pathname;
		}

		/** Read one JSON envelope from the host, surfacing the host's own error text. */
		async function apiJson(path, init) {
			const response = await fetch(api(path), { cache: "no-store", ...init });
			const text = await response.text();
			let payload;
			try {
				payload = text === "" ? {} : JSON.parse(text);
			} catch {
				throw new Error(`接口返回了非 JSON 内容（${response.status}）`);
			}
			if (!response.ok || payload.ok !== true) {
				const message = payload?.error?.message ?? `HTTP ${response.status}`;
				const detail = Array.isArray(payload?.error?.detail) ? payload.error.detail.join("；") : "";
				throw new Error(detail === "" ? message : `${message}（${detail}）`);
			}
			return payload.value;
		}

		function readRecent() {
			try {
				const raw = window.localStorage.getItem(RECENT_KEY);
				if (raw === null) return [];
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
			} catch {
				return [];
			}
		}

		function writeRecent(names) {
			try {
				window.localStorage.setItem(RECENT_KEY, JSON.stringify(names.slice(0, RECENT_MAX)));
			} catch {
				/* storage is best-effort */
			}
		}

		/** Chinese metadata for one skill, with provider text as the fallback. */
		function describe(skill) {
			const meta = CATALOG[skill.name];
			if (meta === undefined) {
				return { title: skill.name, purpose: String(skill.description ?? ""), phase: "other" };
			}
			return { title: meta[0], purpose: meta[1], phase: meta[2] };
		}

		/** Every searchable token for one row, compared lower-cased. */
		function haystack(skill, meta) {
			return `${skill.name} ${meta.title} ${meta.purpose} ${String(skill.description ?? "")}`.toLowerCase();
		}

		function SkillIcon({ size = 14 }) {
			return h(
				"svg",
				{ viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": true, style: { display: "block" } },
				h("path", { d: "M2.6 3.4h10.8v9.2H2.6z", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinejoin: "round" }),
				h("path", { d: "M5 6.4h6M5 9h3.6", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" })
			);
		}

		function Tick({ size = 10 }) {
			return h(
				"svg",
				{ viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": true },
				h("path", { d: "M3.4 8.4l3 3 6.2-6.6", fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" })
			);
		}

		const fieldStyle = {
			boxSizing: "border-box",
			width: "100%",
			padding: "7px 10px",
			borderRadius: "9px",
			border: `1px solid ${BORDER}`,
			background: INPUT_BG,
			color: LABEL,
			font: "inherit",
			fontSize: "13px",
			outline: "none"
		};

		function buttonStyle(primary, disabled) {
			return {
				padding: "6px 13px",
				borderRadius: "8px",
				border: `1px solid ${primary ? ACCENT : BORDER}`,
				background: primary ? ACCENT : "transparent",
				color: primary ? "#fff" : LABEL,
				font: "inherit",
				fontSize: "12px",
				fontWeight: primary ? 600 : 400,
				cursor: disabled ? "default" : "pointer",
				opacity: disabled ? 0.5 : 1,
				whiteSpace: "nowrap"
			};
		}

		/**
		 * The picker: a full-size dialog with three tabs.
		 * @param props - session props (`sessionId`, `inputActions`, `t`) plus the
		 *   injected `loadSkills`.
		 */
		function SkillPicker({ sessionId, inputActions, loadSkills, t }) {
			const [open, setOpen] = React.useState(false);
			const [tab, setTab] = React.useState("catalog");
			const [phase, setPhase] = React.useState("all");
			const [query, setQuery] = React.useState("");
			const [multi, setMulti] = React.useState(false);
			const [picked, setPicked] = React.useState([]);
			const [active, setActive] = React.useState(0);
			const [flash, setFlash] = React.useState("");
			const [recent, setRecent] = React.useState([]);
			const [reload, setReload] = React.useState(0);

			const [catalog, setCatalog] = React.useState({ phase: "idle", rows: [], note: "", error: "" });
			const [installed, setInstalled] = React.useState({ phase: "idle", rows: [], root: "", error: "" });

			const [addSource, setAddSource] = React.useState("");
			const [addName, setAddName] = React.useState("");
			const [addOverwrite, setAddOverwrite] = React.useState(false);
			const [addMode, setAddMode] = React.useState("repo");
			const [pasteText, setPasteText] = React.useState("");
			const [addState, setAddState] = React.useState({ phase: "idle", message: "", error: "" });
			const [registry, setRegistry] = React.useState({ phase: "idle", rows: [], error: "" });

			const buttonRef = React.useRef(null);
			const panelRef = React.useRef(null);
			const searchRef = React.useRef(null);
			const listRef = React.useRef(null);
			const seq = React.useRef(0);
			const loadRef = React.useRef(loadSkills);
			loadRef.current = loadSkills;
			const tRef = React.useRef(t);
			tRef.current = t;

			const close = React.useCallback(() => {
				setOpen(false);
				setQuery("");
				window.setTimeout(() => setFlash(""), 0);
			}, []);

			const openPanel = React.useCallback(() => {
				if (open) {
					close();
					return;
				}
				setRecent(readRecent());
				setActive(0);
				setQuery("");
				setPicked([]);
				setOpen(true);
			}, [open, close]);

			/* Close on Escape and on any pointer press outside the dialog. */
			React.useEffect(() => {
				if (!open) return undefined;
				const onPointerDown = (event) => {
					const target = event.target;
					if (panelRef.current !== null && panelRef.current.contains(target)) return;
					if (buttonRef.current !== null && buttonRef.current.contains(target)) return;
					setOpen(false);
					setQuery("");
				};
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					setOpen(false);
					setQuery("");
					if (buttonRef.current !== null) buttonRef.current.focus();
				};
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [open]);

			React.useEffect(() => {
				if (!open) return undefined;
				if (searchRef.current !== null) searchRef.current.focus();
				return undefined;
			}, [open, tab]);

			/* Load the session catalog once per open. */
			React.useEffect(() => {
				if (!open) return undefined;
				seq.current += 1;
				const mine = seq.current;
				const abort = new AbortController();
				setCatalog({ phase: "loading", rows: [], note: "", error: "" });
				const timer = window.setTimeout(() => {
					if (mine !== seq.current) return;
					setCatalog({ phase: "ready", rows: [], note: tRef.current("catalog.failed"), error: "timeout" });
				}, 8000);
				Promise.resolve()
					.then(() => (sessionId === undefined ? [] : loadRef.current(abort.signal)))
					.then(
						(rows) => {
							window.clearTimeout(timer);
							if (mine !== seq.current) return;
							const list = Array.isArray(rows) ? rows : [];
							setCatalog(
								list.length === 0
									? { phase: "ready", rows: [], note: tRef.current("catalog.fallback"), error: "" }
									: { phase: "ready", rows: list, note: "", error: "" }
							);
						},
						(cause) => {
							window.clearTimeout(timer);
							if (mine !== seq.current) return;
							setCatalog({
								phase: "ready",
								rows: [],
								note: tRef.current("catalog.failed"),
								error: cause instanceof Error ? cause.message : String(cause)
							});
						}
					);
				return () => {
					window.clearTimeout(timer);
					abort.abort();
				};
			}, [open, sessionId, reload]);

			/* Load the on-disk list whenever that tab is opened or a mutation lands. */
			React.useEffect(() => {
				if (!open || tab !== "installed") return undefined;
				const abort = new AbortController();
				setInstalled((current) => ({ ...current, phase: "loading", error: "" }));
				apiJson("installed").then(
					(value) => {
						if (abort.signal.aborted) return;
						setInstalled({ phase: "ready", rows: value.skills ?? [], root: value.root ?? "", error: "" });
					},
					(cause) => {
						if (abort.signal.aborted) return;
						setInstalled({ phase: "ready", rows: [], root: "", error: cause instanceof Error ? cause.message : String(cause) });
					}
				);
				return () => abort.abort();
			}, [open, tab, reload]);

			const insertNames = React.useCallback(
				(names) => {
					if (names.length === 0 || inputActions === undefined) return;
					const text = names.map((name) => `/${name}`).join(" ") + " ";
					if (inputActions.insertText(text, inputActions.captureInsertion()) === false) return;
					const next = [...names, ...readRecent().filter((name) => !names.includes(name))].slice(0, RECENT_MAX);
					writeRecent(next);
					setRecent(next);
					setFlash(names.join(" "));
					setPicked([]);
					close();
				},
				[inputActions, close]
			);

			const commit = React.useCallback(
				(names) => {
					if (names.length === 0) return;
					insertNames(names);
				},
				[insertNames]
			);

			/** Rows for the active tab, already filtered and grouped. */
			const model = React.useMemo(() => {
				const source = tab === "installed" ? installed.rows : catalog.rows;
				const needle = query.trim().toLowerCase();
				const matched = source.filter((skill) => needle === "" || haystack(skill, describe(skill)).includes(needle));
				const rows = matched.map((skill) => ({ skill, meta: describe(skill) }));
				const groups = [];
				const used = new Set();
				if (needle === "" && phase === "all" && tab === "catalog") {
					const recentRows = recent.map((name) => rows.find((row) => row.skill.name === name)).filter((row) => row !== undefined);
					if (recentRows.length > 0) {
						groups.push({ key: "recent", label: t("recent"), rows: recentRows });
						for (const row of recentRows) used.add(row.skill.name);
					}
				}
				const order = phase === "all" ? PHASES : [phase];
				for (const key of order) {
					const items = rows.filter((row) => !used.has(row.skill.name) && row.meta.phase === key);
					if (items.length > 0) groups.push({ key, label: t(`group.${key}`), rows: items });
				}
				return { groups, flat: groups.reduce((all, group) => all.concat(group.rows), []) };
			}, [tab, catalog.rows, installed.rows, query, phase, recent, t]);

			React.useEffect(() => {
				setActive((current) => (current >= model.flat.length ? 0 : current));
			}, [model.flat.length]);

			React.useEffect(() => {
				if (!open || listRef.current === null) return;
				const node = listRef.current.querySelector('[data-active="true"]');
				if (node !== null && typeof node.scrollIntoView === "function") node.scrollIntoView({ block: "nearest" });
			}, [active, open, model]);

			const onListKeyDown = (event) => {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					setActive((current) => (model.flat.length === 0 ? 0 : (current + 1) % model.flat.length));
					return;
				}
				if (event.key === "ArrowUp") {
					event.preventDefault();
					setActive((current) => (model.flat.length === 0 ? 0 : (current - 1 + model.flat.length) % model.flat.length));
					return;
				}
				if (event.key === "Enter") {
					event.preventDefault();
					if (multi) {
						commit(picked);
						return;
					}
					const row = model.flat[active];
					if (row !== undefined) commit([row.skill.name]);
					return;
				}
				if (event.key === "Tab" && multi) {
					event.preventDefault();
					setMulti(false);
					setPicked([]);
				}
			};

			const runInstall = async (source, content) => {
				setAddState({ phase: "busy", message: "", error: "" });
				try {
					const body = content === undefined
						? { source, name: addName.trim() === "" ? undefined : addName.trim(), overwrite: addOverwrite }
						: { content, name: addName.trim() === "" ? undefined : addName.trim(), overwrite: addOverwrite };
					const value = await apiJson("install", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(body)
					});
					setAddState({ phase: "done", message: t("add.ok", { name: value.name }), error: "" });
					setPasteText("");
					setAddSource("");
					setReload((n) => n + 1);
				} catch (cause) {
					const message = cause instanceof Error ? cause.message : String(cause);
					setAddState({
						phase: "error",
						message: "",
						error: message.includes("Failed to fetch") || message.includes("NetworkError") ? t("add.unavailable") : message
					});
				}
			};

			const runRegistry = async () => {
				const term = addSource.trim();
				if (term === "") {
					setRegistry({ phase: "idle", rows: [], error: t("add.needSource") });
					return;
				}
				setRegistry({ phase: "loading", rows: [], error: "" });
				try {
					const value = await apiJson(`search?q=${encodeURIComponent(term)}`);
					setRegistry({ phase: "ready", rows: value.skills ?? [], error: "" });
				} catch (cause) {
					setRegistry({ phase: "ready", rows: [], error: cause instanceof Error ? cause.message : String(cause) });
				}
			};

			const runRemove = async (name) => {
				if (!window.confirm(t("installed.confirmRemove", { name }))) return;
				try {
					await apiJson("remove", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ name })
					});
					setFlash(t("installed.removed", { name }));
					setReload((n) => n + 1);
				} catch (cause) {
					setInstalled((current) => ({ ...current, error: cause instanceof Error ? cause.message : String(cause) }));
				}
			};

			if (!open) {
				return h(
					"button",
					{
						ref: buttonRef,
						type: "button",
						"aria-haspopup": "dialog",
						"aria-expanded": false,
						"aria-label": t("button.tooltip"),
						title: t("button.tooltip"),
						onClick: openPanel,
						onMouseDown: (event) => event.preventDefault(),
						style: {
							display: "inline-flex",
							alignItems: "center",
							gap: "5px",
							padding: "4px 9px",
							borderRadius: "8px",
							border: `1px solid ${BORDER}`,
							background: "var(--dsw-specific-selector, #333338)",
							color: LABEL,
							font: "inherit",
							fontSize: "12px",
							lineHeight: "18px",
							fontWeight: 500,
							cursor: "pointer",
							whiteSpace: "nowrap"
						}
					},
					h(SkillIcon, { size: 13 }),
					h("span", null, flash === "" ? t("button.label") : `${t("button.inserted")} /${flash}`)
				);
			}

			const phasesPresent = PHASES.filter((key) =>
				(tab === "installed" ? installed.rows : catalog.rows).some((skill) => describe(skill).phase === key)
			);

			const tabButton = (id, label) =>
				h(
					"button",
					{
						key: id,
						type: "button",
						role: "tab",
						"aria-selected": tab === id,
						onClick: () => {
							setTab(id);
							setQuery("");
							setPhase("all");
							setPicked([]);
						},
						style: {
							padding: "7px 14px",
							borderRadius: "8px",
							border: "1px solid transparent",
							background: tab === id ? ROW_ACTIVE : "transparent",
							color: tab === id ? LABEL : MUTED,
							font: "inherit",
							fontSize: "13px",
							fontWeight: tab === id ? 600 : 400,
							cursor: "pointer"
						}
					},
					label
				);

			const listSection =
				tab === "add"
					? null
					: h(
							"div",
							{ style: { display: "flex", flex: "1 1 auto", minHeight: "0" } },
							h(
								"div",
								{
									style: {
										flex: "none",
										width: "168px",
										borderRight: `1px solid ${BORDER}`,
										background: RAIL_BG,
										padding: "8px 8px 12px",
										overflowY: "auto"
									}
								},
								[
									h(
										"button",
										{
											key: "all",
											type: "button",
											onClick: () => setPhase("all"),
											style: {
												display: "flex",
												justifyContent: "space-between",
												width: "100%",
												padding: "7px 9px",
												marginBottom: "2px",
												border: "none",
												borderRadius: "7px",
												background: phase === "all" ? ROW_ACTIVE : "transparent",
												color: phase === "all" ? LABEL : MUTED,
												font: "inherit",
												fontSize: "12.5px",
												cursor: "pointer"
											}
										},
										h("span", null, t("filter.all")),
										h("span", { style: { color: FAINT } }, (tab === "installed" ? installed.rows : catalog.rows).length)
									),
									...phasesPresent.map((key) => {
										const count = (tab === "installed" ? installed.rows : catalog.rows).filter((skill) => describe(skill).phase === key).length;
										return h(
											"button",
											{
												key,
												type: "button",
												onClick: () => setPhase(key),
												style: {
													display: "flex",
													justifyContent: "space-between",
													width: "100%",
													padding: "7px 9px",
													marginBottom: "2px",
													border: "none",
													borderRadius: "7px",
													background: phase === key ? ROW_ACTIVE : "transparent",
													color: phase === key ? LABEL : MUTED,
													font: "inherit",
													fontSize: "12.5px",
													cursor: "pointer",
													textAlign: "left"
												}
											},
											h("span", null, t(`group.${key}`)),
											h("span", { style: { color: FAINT } }, count)
										);
									})
								]
							),
							h(
								"div",
								{ style: { flex: "1 1 auto", minWidth: "0", display: "flex", flexDirection: "column" } },
								h(
									"div",
									{ ref: listRef, role: "listbox", tabIndex: -1, onKeyDown: onListKeyDown, style: { flex: "1 1 auto", minHeight: "0", overflowY: "auto", padding: "6px 8px 12px" } },
									catalog.phase === "loading" && tab === "catalog"
										? h("div", { style: { padding: "24px 12px", color: MUTED } }, t("loading"))
										: installed.phase === "loading" && tab === "installed"
											? h("div", { style: { padding: "24px 12px", color: MUTED } }, t("loading"))
											: model.flat.length === 0
												? h(
														"div",
														{ style: { padding: "24px 12px", color: MUTED } },
														tab === "installed"
															? h(React.Fragment, null, t("installed.empty"), installed.error === "" ? null : h("div", { style: { color: DANGER, marginTop: "6px", fontSize: "12px" } }, installed.error))
															: h(React.Fragment, null, t("search.empty"), catalog.note === "" ? null : h("div", { style: { marginTop: "6px", fontSize: "12px", color: FAINT } }, catalog.note))
													)
												: model.groups.map((group) =>
														h(
															React.Fragment,
															{ key: group.key },
															h(
																"div",
																{
																	style: {
																		padding: "10px 10px 4px",
																		color: FAINT,
																		fontSize: "11px",
																		fontWeight: 700,
																		letterSpacing: "0.05em",
																		position: "sticky",
																		top: 0,
																		background: PANEL_BG,
																		zIndex: 1
																	}
																},
																group.label
															),
															...group.rows.map((row) => {
																const index = model.flat.indexOf(row);
																const name = row.skill.name;
																const isActive = index === active;
																const isPicked = picked.includes(name);
																return h(
																	"button",
																	{
																		key: name,
																		type: "button",
																		role: multi ? "menuitemcheckbox" : "option",
																		"aria-selected": multi ? isPicked : isActive,
																		"data-active": isActive ? "true" : "false",
																		onMouseEnter: () => setActive(index),
																		onClick: () => {
																			if (multi) {
																				setPicked((current) =>
																					current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
																				);
																				return;
																			}
																			commit([name]);
																		},
																		style: {
																			display: "flex",
																			alignItems: "flex-start",
																			gap: "10px",
																			width: "100%",
																			textAlign: "left",
																			padding: "9px 10px",
																			border: "none",
																			borderRadius: "8px",
																			background: isPicked || isActive ? ROW_ACTIVE : "transparent",
																			color: LABEL,
																			font: "inherit",
																			cursor: "pointer"
																		}
																	},
																	multi
																		? h(
																				"span",
																				{
																					"aria-hidden": true,
																					style: {
																						flex: "none",
																						width: "15px",
																						height: "15px",
																						marginTop: "3px",
																						borderRadius: "4px",
																						border: `1px solid ${isPicked ? ACCENT : BORDER}`,
																						background: isPicked ? ACCENT : "transparent",
																						display: "inline-flex",
																						alignItems: "center",
																						justifyContent: "center"
																					}
																				},
																				isPicked ? h(Tick) : null
																			)
																		: h("span", { "aria-hidden": true, style: { flex: "none", marginTop: "2px", color: FAINT } }, h(SkillIcon, { size: 15 })),
																	h(
																		"span",
																		{ style: { minWidth: "0", display: "flex", flexDirection: "column", gap: "2px", flex: "1 1 auto" } },
																		h(
																			"span",
																			{ style: { display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" } },
																			h("span", { style: { fontSize: "13.5px", fontWeight: 600, lineHeight: "20px" } }, row.meta.title),
																			h(
																				"span",
																				{ style: { fontSize: "11px", lineHeight: "16px", color: FAINT, fontFamily: "var(--ds-font-family-code, ui-monospace, monospace)" } },
																				`/${name}`
																			),
																			row.skill.modelInvocable === false
																				? h(
																						"span",
																						{ style: { fontSize: "10px", lineHeight: "15px", padding: "0 5px", borderRadius: "4px", border: `1px solid ${BORDER}`, color: MUTED } },
																						t("userOnly")
																					)
																				: null
																		),
																		row.meta.purpose === ""
																			? null
																			: h("span", { style: { fontSize: "12px", lineHeight: "17px", color: MUTED, wordBreak: "break-word" } }, row.meta.purpose)
																	),
																	tab === "installed"
																		? h(
																				"span",
																				{
																					role: "button",
																					tabIndex: 0,
																					onClick: (event) => {
																						event.stopPropagation();
																						runRemove(name);
																					},
																					style: { flex: "none", alignSelf: "center", fontSize: "11px", color: DANGER, padding: "2px 6px", borderRadius: "6px", border: `1px solid ${BORDER}` }
																				},
																				t("installed.remove")
																			)
																		: null
																);
															})
														)
													)
								)
							)
						);

			const addSection = h(
				"div",
				{ style: { flex: "1 1 auto", minHeight: "0", overflowY: "auto", padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: "14px" } },
				h(
					"div",
					{ style: { display: "flex", gap: "6px" } },
					h(
						"button",
						{ type: "button", onClick: () => setAddMode("repo"), style: buttonStyle(addMode === "repo", false) },
						t("add.tab.repo")
					),
					h(
						"button",
						{ type: "button", onClick: () => setAddMode("paste"), style: buttonStyle(addMode === "paste", false) },
						t("add.tab.paste")
					)
				),
				addMode === "repo"
					? h(
							React.Fragment,
							null,
							h(
								"label",
								{ style: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: MUTED } },
								t("add.repo.label"),
								h("input", {
									type: "text",
									value: addSource,
									placeholder: t("add.repo.placeholder"),
									onChange: (event) => setAddSource(event.target.value),
									style: fieldStyle
								})
							),
							h(
								"div",
								{ style: { display: "flex", gap: "8px", alignItems: "flex-end" } },
								h(
									"label",
									{ style: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: MUTED, flex: "1 1 auto" } },
									t("add.name.label"),
									h("input", {
										type: "text",
										value: addName,
										placeholder: t("add.name.placeholder"),
										onChange: (event) => setAddName(event.target.value),
										style: fieldStyle
									})
								),
								h(
									"button",
									{
										type: "button",
										onClick: () => runInstall(addSource.trim(), undefined),
										disabled: addState.phase === "busy" || addSource.trim() === "",
										style: buttonStyle(true, addState.phase === "busy" || addSource.trim() === "")
									},
									addState.phase === "busy" ? t("add.installing") : t("add.submit")
								)
							),
							h(
								"label",
								{ style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: MUTED } },
								h("input", { type: "checkbox", checked: addOverwrite, onChange: (event) => setAddOverwrite(event.target.checked) }),
								t("add.overwrite")
							),
							h(
								"div",
								{ style: { borderTop: `1px solid ${BORDER}`, paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" } },
								h("div", { style: { fontSize: "12px", fontWeight: 600, color: LABEL } }, t("add.registry")),
								h(
									"div",
									{ style: { display: "flex", gap: "8px" } },
									h("input", {
										type: "text",
										value: addSource,
										placeholder: t("add.registry.placeholder"),
										onChange: (event) => setAddSource(event.target.value),
										onKeyDown: (event) => {
											if (event.key === "Enter") runRegistry();
										},
										style: fieldStyle
									}),
									h(
										"button",
										{ type: "button", onClick: runRegistry, disabled: registry.phase === "loading", style: buttonStyle(false, registry.phase === "loading") },
										registry.phase === "loading" ? t("loading") : t("add.registry.search")
									)
								),
								registry.error === ""
									? null
									: h("div", { style: { fontSize: "12px", color: DANGER } }, registry.error),
								registry.rows.length === 0
									? registry.phase === "ready"
										? h("div", { style: { fontSize: "12px", color: FAINT } }, t("add.registry.empty"))
										: null
									: h(
											"div",
											{ style: { display: "flex", flexDirection: "column", gap: "2px", maxHeight: "240px", overflowY: "auto" } },
											...registry.rows.map((row) =>
												h(
													"div",
													{
														key: row.id,
														style: { display: "flex", alignItems: "center", gap: "10px", padding: "7px 8px", borderRadius: "8px", background: ROW_HOVER }
													},
													h(
														"span",
														{ style: { display: "flex", flexDirection: "column", gap: "1px", minWidth: "0", flex: "1 1 auto" } },
														h("span", { style: { fontSize: "13px", fontWeight: 600 } }, `/${row.name}`),
														h("span", { style: { fontSize: "11px", color: FAINT } }, `${row.source} · ${t("add.installs", { count: row.installs })}`)
													),
													h(
														"button",
														{
															type: "button",
															disabled: addState.phase === "busy",
															onClick: () => runInstall(row.source, undefined),
															style: buttonStyle(true, addState.phase === "busy")
														},
														t("add.submit")
													)
												)
											)
										)
							)
						)
					: h(
							"label",
							{ style: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: MUTED, flex: "1 1 auto", minHeight: "0" } },
							t("add.paste.label"),
							h("textarea", {
								value: pasteText,
								placeholder: t("add.paste.placeholder"),
								onChange: (event) => setPasteText(event.target.value),
								style: { ...fieldStyle, minHeight: "260px", resize: "vertical", fontFamily: "var(--ds-font-family-code, ui-monospace, monospace)", lineHeight: "18px" }
							}),
							h(
								"div",
								{ style: { display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" } },
								h("label", { style: { display: "flex", alignItems: "center", gap: "8px", marginRight: "auto" } },
									h("input", { type: "checkbox", checked: addOverwrite, onChange: (event) => setAddOverwrite(event.target.checked) }),
									t("add.overwrite")
								),
								h(
									"button",
									{
										type: "button",
										onClick: () => runInstall(undefined, pasteText),
										disabled: addState.phase === "busy" || pasteText.trim() === "",
										style: buttonStyle(true, addState.phase === "busy" || pasteText.trim() === "")
									},
									addState.phase === "busy" ? t("add.installing") : t("add.submit")
								)
							)
						),
				addState.message === "" ? null : h("div", { style: { fontSize: "12px", color: OK } }, addState.message),
				addState.error === "" ? null : h("div", { style: { fontSize: "12px", color: DANGER, whiteSpace: "pre-wrap", wordBreak: "break-word" } }, `${t("add.fail")}：${addState.error}`)
			);

			const panel = ReactDOM.createPortal(
				h(
					"div",
					{
						ref: panelRef,
						role: "dialog",
						"aria-modal": true,
						"aria-label": t("panel.title"),
						style: {
							position: "fixed",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							width: "min(920px, 94vw)",
							height: "min(720px, 86vh)",
							display: "flex",
							flexDirection: "column",
							background: PANEL_BG,
							color: LABEL,
							border: `1px solid ${BORDER}`,
							borderRadius: "16px",
							boxShadow: SHADOW,
							overflow: "hidden",
							zIndex: 2147483000,
							fontSize: "13px",
							lineHeight: "20px",
							fontFamily: "inherit",
							opacity: 1
						}
					},
					h(
						"div",
						{ style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flex: "none" } },
						h("span", { style: { fontSize: "15px", fontWeight: 600 } }, t("panel.title")),
						h("div", { role: "tablist", style: { display: "flex", gap: "4px" } }, [
							tabButton("catalog", t("tab.catalog")),
							tabButton("installed", t("tab.installed")),
							tabButton("add", t("tab.add"))
						]),
						h("span", { style: { flex: "1 1 auto" } }),
						tab === "add"
							? null
							: h(
									"button",
									{
										type: "button",
										onClick: () => {
											setMulti((current) => !current);
											setPicked([]);
										},
										style: {
											padding: "4px 10px",
											borderRadius: "999px",
											border: `1px solid ${multi ? ACCENT : BORDER}`,
											background: multi ? ACCENT : "transparent",
											color: multi ? "#fff" : MUTED,
											font: "inherit",
											fontSize: "11px",
											cursor: "pointer"
										}
									},
									multi ? t("multi.on") : t("multi.off")
								),
						h(
							"button",
							{
								type: "button",
								"aria-label": t("panel.close"),
								onClick: close,
								style: { width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, cursor: "pointer", fontSize: "15px", lineHeight: "1" }
							},
							"×"
						)
					),
					tab === "add"
						? null
						: h(
								"div",
								{ style: { padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: "10px", alignItems: "center", flex: "none" } },
								h("input", {
									ref: searchRef,
									type: "text",
									value: query,
									placeholder: t("search.placeholder"),
									"aria-label": t("search.placeholder"),
									onChange: (event) => setQuery(event.target.value),
									onKeyDown: onListKeyDown,
									style: { ...fieldStyle, flex: "1 1 auto" }
								}),
								h("span", { style: { fontSize: "11px", color: FAINT, flex: "none" } }, t("search.count", { count: model.flat.length }))
							),
					tab === "add" ? addSection : listSection,
					h(
						"div",
						{
							style: {
								display: "flex",
								alignItems: "center",
								gap: "10px",
								padding: "10px 16px",
								borderTop: `1px solid ${BORDER}`,
								flex: "none",
								background: RAIL_BG
							}
						},
						h(
							"span",
							{ style: { fontSize: "12px", color: MUTED, flex: "1 1 auto", minWidth: "0" } },
							tab === "add"
								? installed.root === "" ? "" : `${t("installed.root")}：${installed.root}`
								: multi ? t("tip.multi", { count: picked.length }) : t("tip.single")
						),
						multi && tab !== "add"
							? h(
									"span",
									{ style: { display: "inline-flex", gap: "8px", flex: "none" } },
									h(
										"button",
										{
											type: "button",
											onClick: () => {
												setPicked([]);
												close();
											},
											style: buttonStyle(false, false)
										},
										t("cancel")
									),
									h(
										"button",
										{ type: "button", disabled: picked.length === 0, onClick: () => commit(picked), style: buttonStyle(true, picked.length === 0) },
										`${t("insert")}${picked.length === 0 ? "" : ` ${picked.length}`}`
									)
								)
							: null
					)
				),
				document.body
			);

			return h(
				React.Fragment,
				null,
				h(
					"button",
					{
						ref: buttonRef,
						type: "button",
						"aria-haspopup": "dialog",
						"aria-expanded": true,
						"aria-label": t("button.tooltip"),
						title: t("button.tooltip"),
						onClick: openPanel,
						onMouseDown: (event) => event.preventDefault(),
						style: {
							display: "inline-flex",
							alignItems: "center",
							gap: "5px",
							padding: "4px 9px",
							borderRadius: "8px",
							border: `1px solid ${ACCENT}`,
							background: ROW_ACTIVE,
							color: LABEL,
							font: "inherit",
							fontSize: "12px",
							lineHeight: "18px",
							fontWeight: 500,
							cursor: "pointer",
							whiteSpace: "nowrap"
						}
					},
					h(SkillIcon, { size: 13 }),
					h("span", null, t("button.label"))
				),
				panel
			);
		}

		/**
		 * Client plugin body: register the composer control.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(
				() =>
					ctx.locale.register(NS, {
						zh,
						en
					}),
				"skill-picker: dictionaries"
			);

			const skillRemote = () => {
				const direct = ctx.get("remote.skills");
				if (direct !== undefined) return direct;
				const remote = ctx.get("remote");
				if (remote !== undefined && remote !== null && remote.skills !== undefined) return remote.skills;
				try {
					if (ctx.remote !== undefined && ctx.remote !== null && ctx.remote.skills !== undefined) return ctx.remote.skills;
				} catch {
					/* absence, not an error */
				}
				return undefined;
			};

			ctx.slots.inject("conversation.input.left", () =>
				ctx.slots.register(
					{
						name: "conversation.input.left",
						id: "dsh-skill-picker",
						order: 100,
						locale: NS,
						inject: (sessionId) => ({
							loadSkills: async (signal) => {
								if (sessionId === undefined) return [];
								const remote = skillRemote();
								if (remote === undefined) throw new Error("skills remote unavailable");
								const sessions = ctx.get("sessions");
								const query = async () => {
									const result = await remote.list({ sessionId }, signal);
									if (result === undefined || result.ok !== true) {
										throw new Error(result === undefined ? "no response" : `${result.error.code}: ${result.error.message}`);
									}
									return result.value.skills;
								};
								if (sessions === undefined || sessions.binding(sessionId) === undefined) return query();
								return sessions.using(sessionId, { source: "skillPicker", signal }, query);
							}
						})
					},
					SkillPicker
				)
			);
		}

		return {
			inject: ["slots", "locale"],
			apply
		};
	}
});
