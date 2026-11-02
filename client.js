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
			"button.tooltip": "选择本次要用的技能（不用记技能名）",
			"button.inserted": "已插入",
			"menu.title": "选择技能",
			"menu.count": "共 {count} 项",
			"menu.hint": "输入中文或英文筛选 · ↑↓ 选择 · Enter 插入 · Esc 关闭",
			"menu.search": "搜索技能，例如：测试 / 评审 / 上线 / review",
			"menu.empty": "没有匹配的技能",
			"menu.loading": "正在加载技能…",
			"menu.failed": "目录接口不可用，以下是内置清单（插入后仍由宿主解析）",
			"menu.fallback": "宿主没返回技能清单，以下为内置清单（插入后由宿主解析）",
			"menu.retry": "重试",
			"menu.multi": "多选",
			"menu.single": "单选",
			"menu.apply": "插入",
			"menu.cancel": "取消",
			"menu.recent": "最近使用",
			"menu.group.define": "① 定义需求",
			"menu.group.plan": "② 规划拆解",
			"menu.group.build": "③ 写代码",
			"menu.group.verify": "④ 测试验证",
			"menu.group.review": "⑤ 评审加固",
			"menu.group.ship": "⑥ 交付上线",
			"menu.group.meta": "技能入口",
			"menu.group.other": "其它",
			"menu.needPick": "先选至少一个技能",
			"menu.tip.single": "点击任意技能即插入到输入框",
			"menu.tip.multi": "已选 {count} 项 · Tab 切回单选",
			"menu.userOnly": "仅用户"
		};

		const en = {
			"button.label": "Skills",
			"button.tooltip": "Pick skills for this message",
			"button.inserted": "Inserted",
			"menu.title": "Pick skills",
			"menu.count": "{count} skills",
			"menu.hint": "Type to filter · ↑↓ move · Enter insert · Esc close",
			"menu.search": "Search skills",
			"menu.empty": "No matching skill",
			"menu.loading": "Loading skills...",
			"menu.failed": "Catalog unavailable; showing the built-in list (the host still resolves each /name)",
			"menu.fallback": "The host returned no skills; showing the built-in list (the host still resolves each /name)",
			"menu.retry": "Retry",
			"menu.multi": "Multi",
			"menu.single": "Single",
			"menu.apply": "Insert",
			"menu.cancel": "Cancel",
			"menu.recent": "Recent",
			"menu.group.define": "1 Define",
			"menu.group.plan": "2 Plan",
			"menu.group.build": "3 Build",
			"menu.group.verify": "4 Verify",
			"menu.group.review": "5 Review",
			"menu.group.ship": "6 Ship",
			"menu.group.meta": "Entry",
			"menu.group.other": "Other",
			"menu.needPick": "Pick at least one skill",
			"menu.tip.single": "Click a skill to insert it into the composer",
			"menu.tip.multi": "{count} selected · Tab back to single",
			"menu.userOnly": "user-only"
		};

		/**
		 * Chinese title, one-line purpose, and lifecycle phase for every skill this
		 * deployment ships. Unknown names fall back to the provider description and
		 * the "other" phase, so a newly installed skill still lists correctly.
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

		/**
		 * Last-resort rows built from CATALOG alone. The picker stays usable when the
		 * host catalog RPC is unavailable (blank session, provider error, or a
		 * preset that mounts no filesystem skill provider): `/name` still resolves
		 * through the host pre-step hook if the skill is installed.
		 */
		const FALLBACK_SKILLS = Object.keys(CATALOG).map((name) => ({
			name,
			description: CATALOG[name][1],
			modelInvocable: true
		}));

		/** localStorage key holding the most recently inserted skill names. */
		const RECENT_KEY = "dsh-skill-picker.recent";
		const RECENT_MAX = 6;

		/* Opaque surfaces and solid text: the panel must never inherit the host's
		   translucent menu material, which made an earlier version unreadable. */
		const SURFACE = "var(--dsw-alias-bg-layer-2, #26262a)";
		const INPUT_BG = "var(--dsw-alias-bg-layer-1, #1c1c20)";
		const FOOT_BG = "var(--dsw-alias-bg-layer-3, #2f2f34)";
		const ROW_HOVER = "var(--dsw-alias-interactive-bg-hover, rgba(140,140,150,.16))";
		const ROW_ACTIVE = "var(--dsw-alias-interactive-bg-active, rgba(140,140,150,.22))";
		/* Opaque chip fill so the trigger is legible on any composer background. */
		const CHIP = "var(--dsw-specific-selector, #333338)";
		const BORDER = "var(--dsw-alias-border-l3, rgba(150,150,160,.30))";
		const LABEL = "var(--dsw-alias-label-primary, #f2f2f4)";
		const MUTED = "var(--dsw-alias-label-secondary, #a9a9b2)";
		const ACCENT = "var(--dsw-static-deepseek-450, #5686fe)";
		const SHADOW = "0 18px 50px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.4), 0 0 0 .5px rgba(0,0,0,.6)";

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
			return `${skill.name} ${meta.title} ${meta.purpose}`.toLowerCase();
		}

		function SkillIcon({ size = 13 }) {
			return h(
				"svg",
				{ viewBox: "0 0 16 16", width: size, height: size, "aria-hidden": true, style: { display: "block" } },
				h("path", {
					d: "M2.6 3.4h10.8v9.2H2.6z",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.25,
					strokeLinejoin: "round"
				}),
				h("path", { d: "M5 6.4h6M5 9h3.6", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" })
			);
		}

		/**
		 * Composer control: opens a grouped, searchable skill list and inserts the
		 * chosen names as `/name` gestures, so the host pre-step hook injects each
		 * skill's instructions for this turn.
		 * @param props - Session props (`sessionId`, `inputActions`, `t`) plus this
		 *   registration's injected `loadSkills`.
		 * @returns the button and, while open, its portal-mounted panel.
		 */
		function SkillPicker({ sessionId, inputActions, loadSkills, t }) {
			const [open, setOpen] = React.useState(false);
			const [phase, setPhase] = React.useState("idle");
			const [skills, setSkills] = React.useState([]);
			const [error, setError] = React.useState("");
			const [query, setQuery] = React.useState("");
			const [multi, setMulti] = React.useState(false);
			const [picked, setPicked] = React.useState([]);
			const [active, setActive] = React.useState(0);
			const [anchor, setAnchor] = React.useState(null);
			const [flash, setFlash] = React.useState("");
			const [notice, setNotice] = React.useState("");
			const [recent, setRecent] = React.useState([]);
			/** Retry counter: bumping it re-runs the catalog effect without touching `phase`. */
			const [reload, setReload] = React.useState(0);
			/** Monotonic request id, so a superseded fetch can never write state. */
			const requestSeq = React.useRef(0);
			const buttonRef = React.useRef(null);
			const panelRef = React.useRef(null);
			const searchRef = React.useRef(null);
			const listRef = React.useRef(null);

			const close = React.useCallback(() => {
				setOpen(false);
				setQuery("");
				setNotice("");
			}, []);

			const place = React.useCallback(() => {
				const node = buttonRef.current;
				if (node === null) return;
				const rect = node.getBoundingClientRect();
				const width = Math.min(620, Math.max(430, window.innerWidth - 32));
				const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
				const room = window.innerHeight - rect.top - 20;
				setAnchor({
					left,
					bottom: window.innerHeight - rect.top + 10,
					width,
					maxHeight: Math.max(300, Math.min(600, room))
				});
			}, []);

			const openMenu = React.useCallback(() => {
				if (open) {
					close();
					return;
				}
				setRecent(readRecent());
				setActive(0);
				setNotice("");
				place();
				setOpen(true);
			}, [open, close, place]);

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
				const reposition = () => place();
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKeyDown, true);
				window.addEventListener("resize", reposition);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
					window.removeEventListener("resize", reposition);
				};
			}, [open, place]);

			React.useEffect(() => {
				if (!open) return undefined;
				if (searchRef.current !== null) searchRef.current.focus();
				return undefined;
			}, [open]);

			/**
			 * Catalog loader read through a ref so identity churn in props can never
			 * re-trigger (and therefore abort) the in-flight fetch.
			 */
			const loadRef = React.useRef(loadSkills);
			loadRef.current = loadSkills;
			const tRef = React.useRef(t);
			tRef.current = t;

			React.useEffect(() => {
				if (!open) return undefined;
				requestSeq.current += 1;
				const seq = requestSeq.current;
				const abort = new AbortController();
				setPhase("loading");
				setError("");
				/* A hung RPC must not leave the panel on skeletons forever. */
				const timer = window.setTimeout(() => {
					if (seq !== requestSeq.current) return;
					setSkills(FALLBACK_SKILLS);
					setPhase("ready");
					setNotice(tRef.current("menu.failed"));
				}, 8000);
				Promise.resolve()
					.then(() => (sessionId === undefined ? [] : loadRef.current(abort.signal)))
					.then(
						(list) => {
							window.clearTimeout(timer);
							if (seq !== requestSeq.current) return;
							const rows = Array.isArray(list) ? list : [];
							if (rows.length === 0) {
								/* Empty catalog: keep the built-in catalog so the picker is
								   never a dead panel. `/name` still resolves host-side. */
								setSkills(FALLBACK_SKILLS);
								setPhase("ready");
								setNotice(tRef.current("menu.fallback"));
								return;
							}
							setSkills(rows);
							setPhase("ready");
						},
						(cause) => {
							window.clearTimeout(timer);
							if (seq !== requestSeq.current) return;
							setError(cause instanceof Error ? cause.message : String(cause));
							setSkills(FALLBACK_SKILLS);
							setPhase("ready");
							setNotice(tRef.current("menu.failed"));
						}
					);
				return () => {
					window.clearTimeout(timer);
					abort.abort();
				};
			}, [open, sessionId, reload]);

			/** Rows in render order, shared by the list and keyboard navigation. */
			const model = React.useMemo(() => {
				const needle = query.trim().toLowerCase();
				const matched = skills.filter((skill) => needle === "" || haystack(skill, describe(skill)).includes(needle));
				const rows = matched.map((skill) => ({ skill, meta: describe(skill) }));
				const groups = [];
				const used = new Set();
				if (needle === "") {
					const recentRows = recent
						.map((name) => rows.find((row) => row.skill.name === name))
						.filter((row) => row !== undefined);
					if (recentRows.length > 0) {
						groups.push({ key: "recent", label: t("menu.recent"), rows: recentRows });
						for (const row of recentRows) used.add(row.skill.name);
					}
				}
				for (const key of PHASES) {
					const items = rows.filter((row) => !used.has(row.skill.name) && row.meta.phase === key);
					if (items.length > 0) groups.push({ key, label: t("menu.group." + key), rows: items });
				}
				return { groups, flat: groups.reduce((all, group) => all.concat(group.rows), []) };
			}, [skills, query, recent, t]);

			React.useEffect(() => {
				setActive((current) => (current >= model.flat.length ? 0 : current));
			}, [model.flat.length]);

			const insertNames = React.useCallback(
				(names) => {
					if (names.length === 0 || inputActions === undefined) return;
					const text = names.map((name) => "/" + name).join(" ") + " ";
					const applied = inputActions.insertText(text, inputActions.captureInsertion());
					if (applied === false) {
						setNotice(t("menu.needPick"));
						return;
					}
					const next = [...names, ...readRecent().filter((name) => !names.includes(name))].slice(0, RECENT_MAX);
					writeRecent(next);
					setRecent(next);
					setFlash(names.join(" "));
					window.setTimeout(() => setFlash(""), 1600);
					setPicked([]);
					close();
				},
				[inputActions, close, t]
			);

			const commit = React.useCallback(
				(names) => {
					if (multi && names.length === 0) {
						setNotice(t("menu.needPick"));
						return;
					}
					insertNames(names);
				},
				[multi, insertNames, t]
			);

			const onRowClick = (name) => {
				if (multi) {
					setPicked((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
					setNotice("");
					return;
				}
				commit([name]);
			};

			const onKeyDown = (event) => {
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

			React.useEffect(() => {
				if (!open || listRef.current === null) return;
				const node = listRef.current.querySelector('[data-active="true"]');
				if (node === null || typeof node.scrollIntoView !== "function") return;
				node.scrollIntoView({ block: "nearest" });
			}, [active, open, model]);

			let cursor = -1;
			const rowNodes = [];
			for (const group of model.groups) {
				rowNodes.push(
					h(
						"div",
						{
							key: "g:" + group.key,
							style: {
								padding: "10px 12px 5px",
								color: MUTED,
								fontSize: "11px",
								fontWeight: 700,
								letterSpacing: "0.05em",
								position: "sticky",
								top: 0,
								background: SURFACE,
								zIndex: 1
							}
						},
						group.label
					)
				);
				for (const row of group.rows) {
					cursor += 1;
					const index = cursor;
					const name = row.skill.name;
					const isActive = index === active;
					const isPicked = picked.includes(name);
					rowNodes.push(
						h(
							"button",
							{
								key: name,
								id: "skill-row-" + index,
								type: "button",
								role: multi ? "menuitemcheckbox" : "option",
								"aria-selected": multi ? isPicked : isActive,
								"data-active": isActive ? "true" : "false",
								onMouseEnter: () => setActive(index),
								onClick: () => onRowClick(name),
								style: {
									display: "flex",
									alignItems: "flex-start",
									gap: "10px",
									width: "100%",
									textAlign: "left",
									padding: "8px 12px",
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
												border: "1px solid " + (isPicked ? ACCENT : BORDER),
												background: isPicked ? ACCENT : "transparent",
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center"
											}
										},
										isPicked
											? h(
													"svg",
													{ viewBox: "0 0 16 16", width: "10", height: "10", "aria-hidden": true },
													h("path", {
														d: "M3.4 8.4l3 3 6.2-6.6",
														fill: "none",
														stroke: "#fff",
														strokeWidth: 2,
														strokeLinecap: "round",
														strokeLinejoin: "round"
													})
												)
											: null
									)
								: h(
										"span",
										{ "aria-hidden": true, style: { flex: "none", marginTop: "2px", color: MUTED } },
										h(SkillIcon, { size: 14 })
									),
							h(
								"span",
								{ style: { minWidth: "0", display: "flex", flexDirection: "column", gap: "1px" } },
								h(
									"span",
									{ style: { display: "flex", alignItems: "baseline", gap: "7px", flexWrap: "wrap" } },
									h("span", { style: { fontSize: "13.5px", fontWeight: 600, lineHeight: "20px" } }, row.meta.title),
									h(
										"span",
										{
											style: {
												fontSize: "11px",
												lineHeight: "16px",
												color: MUTED,
												fontFamily: "var(--ds-font-family-code, ui-monospace, monospace)"
											}
										},
										"/" + name
									),
									row.skill.modelInvocable === false
										? h(
												"span",
												{
													style: {
														fontSize: "10px",
														lineHeight: "15px",
														padding: "0 5px",
														borderRadius: "4px",
														border: "1px solid " + BORDER,
														color: MUTED
													}
												},
												t("menu.userOnly")
											)
										: null
								),
								row.meta.purpose === ""
									? null
									: h(
											"span",
											{ style: { fontSize: "12px", lineHeight: "18px", color: MUTED, wordBreak: "break-word" } },
											row.meta.purpose
										)
							)
						)
					);
				}
			}

			const panel =
				open && anchor !== null
					? ReactDOM.createPortal(
							h(
								"div",
								{
									ref: panelRef,
									role: "dialog",
									"aria-label": t("menu.title"),
									style: {
										position: "fixed",
										left: anchor.left + "px",
										bottom: anchor.bottom + "px",
										width: anchor.width + "px",
										maxHeight: anchor.maxHeight + "px",
										display: "flex",
										flexDirection: "column",
										background: SURFACE,
										color: LABEL,
										border: "1px solid " + BORDER,
										borderRadius: "14px",
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
									{
										style: {
											padding: "12px 14px 10px",
											borderBottom: "1px solid " + BORDER,
											display: "flex",
											flexDirection: "column",
											gap: "9px",
											flex: "none"
										}
									},
									h(
										"div",
										{ style: { display: "flex", alignItems: "center", gap: "10px" } },
										h("span", { style: { fontSize: "14px", fontWeight: 600 } }, t("menu.title")),
										h("span", { style: { color: MUTED, fontSize: "11px" } }, t("menu.count", { count: skills.length })),
										h("span", { style: { flex: "1 1 auto" } }),
										h(
											"button",
											{
												type: "button",
												onClick: () => {
													setMulti((current) => !current);
													setPicked([]);
													setNotice("");
												},
												style: {
													padding: "3px 9px",
													borderRadius: "999px",
													border: "1px solid " + (multi ? ACCENT : BORDER),
													background: multi ? ACCENT : "transparent",
													color: multi ? "#fff" : MUTED,
													font: "inherit",
													fontSize: "11px",
													cursor: "pointer"
												}
											},
											multi ? t("menu.multi") : t("menu.single")
										)
									),
									h("input", {
										ref: searchRef,
										type: "text",
										value: query,
										placeholder: t("menu.search"),
										"aria-label": t("menu.search"),
										onChange: (event) => setQuery(event.target.value),
										onKeyDown: onKeyDown,
										style: {
											boxSizing: "border-box",
											width: "100%",
											padding: "7px 10px",
											borderRadius: "9px",
											border: "1px solid " + BORDER,
											background: INPUT_BG,
											color: LABEL,
											font: "inherit",
											fontSize: "13px",
											outline: "none"
										}
									}),
									h("span", { style: { color: MUTED, fontSize: "11px", lineHeight: "15px" } }, t("menu.hint"))
								),
								h(
									"div",
									{
										ref: listRef,
										role: "listbox",
										"aria-activedescendant": "skill-row-" + active,
										style: { flex: "1 1 auto", minHeight: "0", overflowY: "auto", padding: "4px 6px 8px" }
									},
									phase === "loading"
										? h("div", { style: { padding: "16px 10px", color: MUTED } }, t("menu.loading"))
										: phase === "failed"
											? h(
													"div",
													{ style: { padding: "16px 10px", color: MUTED } },
													t("menu.failed") + "：" + error,
													h(
														"button",
														{
															type: "button",
															onClick: () => setPhase("idle"),
															style: {
																marginLeft: "10px",
																padding: "2px 8px",
																borderRadius: "6px",
																border: "1px solid " + BORDER,
																background: "transparent",
																color: "inherit",
																font: "inherit",
																cursor: "pointer"
															}
														},
														t("menu.retry")
													)
												)
											: model.flat.length === 0
												? h("div", { style: { padding: "16px 10px", color: MUTED } }, t("menu.empty"))
												: rowNodes
								),
								h(
									"div",
									{
										style: {
											display: "flex",
											alignItems: "center",
											gap: "8px",
											padding: "9px 14px",
											borderTop: "1px solid " + BORDER,
											flex: "none",
											background: FOOT_BG
										}
									},
									h(
										"span",
										{ style: { color: MUTED, fontSize: "12px", flex: "1 1 auto", minWidth: "0" } },
										notice !== "" ? notice : multi ? t("menu.tip.multi", { count: picked.length }) : t("menu.tip.single")
									),
									multi
										? h(
												"span",
												{ style: { display: "inline-flex", gap: "6px", flex: "none" } },
												h(
													"button",
													{
														type: "button",
														onClick: () => {
															setPicked([]);
															close();
														},
														style: {
															padding: "5px 11px",
															borderRadius: "8px",
															border: "1px solid " + BORDER,
															background: "transparent",
															color: LABEL,
															font: "inherit",
															fontSize: "12px",
															cursor: "pointer"
														}
													},
													t("menu.cancel")
												),
												h(
													"button",
													{
														type: "button",
														onClick: () => commit(picked),
														disabled: picked.length === 0,
														style: {
															padding: "5px 11px",
															borderRadius: "8px",
															border: "1px solid " + ACCENT,
															background: ACCENT,
															color: "#fff",
															font: "inherit",
															fontSize: "12px",
															cursor: picked.length === 0 ? "default" : "pointer",
															opacity: picked.length === 0 ? 0.5 : 1
														}
													},
													picked.length === 0 ? t("menu.apply") : t("menu.apply") + " " + picked.length
												)
											)
										: null
								)
							),
							document.body
						)
					: null;

			return h(
				React.Fragment,
				null,
				h(
					"button",
					{
						ref: buttonRef,
						type: "button",
						"aria-haspopup": "dialog",
						"aria-expanded": open,
						"aria-label": t("button.tooltip"),
						title: t("button.tooltip"),
						onClick: openMenu,
						onMouseDown: (event) => event.preventDefault(),
						style: {
							display: "inline-flex",
							alignItems: "center",
							gap: "5px",
							padding: "4px 9px",
							borderRadius: "8px",
							border: "1px solid " + (open ? ACCENT : BORDER),
							background: open ? ROW_ACTIVE : CHIP,
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
					h("span", null, flash === "" ? t("button.label") : t("button.inserted") + " /" + flash)
				),
				panel
			);
		}

		/**
		 * Client plugin body: register the composer control that inserts skills.
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

			/**
			 * Resolve the skills remote lazily. Injecting `remote.skills` as a hard
			 * dependency would disable the whole trigger whenever that one service is
			 * absent or not yet registered; the picker must still render its built-in
			 * list in that case, so the dependency is probed per call instead.
			 * @returns the remote's `skills` face, or undefined when unavailable.
			 */
			const skillRemote = () => {
				const direct = ctx.get("remote.skills");
				if (direct !== undefined) return direct;
				const remote = ctx.get("remote");
				if (remote !== undefined && remote !== null && remote.skills !== undefined) return remote.skills;
				try {
					if (ctx.remote !== undefined && ctx.remote !== null && ctx.remote.skills !== undefined) return ctx.remote.skills;
				} catch {
					/* an unresolvable injection path is the absence case, not an error */
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
								/* The host resolves the catalog from the session's live Agent
								   (or its preset). A bare RPC without a retained reference can
								   answer with an empty list, so retain first — exactly how the
								   official slash-command source does it. */
								const sessions = ctx.get("sessions");
								const query = async () => {
									const result = await remote.list({ sessionId }, signal);
									if (result === undefined || result.ok !== true) {
										const detail =
											result === undefined
												? "no response"
												: result.error.code + ": " + result.error.message;
										throw new Error(detail);
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
