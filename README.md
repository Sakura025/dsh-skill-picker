# Skill Picker for DeepSeek Harness

[中文](#中文) · [English](#english)

给 DeepSeek Harness 网页端输入框加一个「技能」入口：**按开发阶段浏览、用中文搜索、点一下插入，并且能在面板里直接装新技能**。

A **skill picker and in-app installer** for the DeepSeek Harness web composer: browse skills by phase, search in Chinese or English, click once to insert, and install new skills without leaving the panel.

---

<a id="中文"></a>

## 中文

### 它解决什么问题

DSH 原生的技能调用靠 `/` 菜单，你必须先知道技能叫什么、拼得对 kebab-case 英文名，而且候选列表按会话缓存，刚装的技能常常刷不出来。结果是：装了一堆技能，实际只会用最熟的那两个。

这个插件把同一份目录（宿主的 `skills/list`）做成一个常驻入口，并补上原生没有的东西：

| 原生 `/` 菜单 | 本插件 |
|---|---|
| 要记英文名 | 中文名 + 一句话说明，点哪行插哪行 |
| 只有名字，看不出用途 | 按六段开发阶段分组，左侧导航直达 |
| 只能搜英文名 | 中文、英文、说明全文都能搜 |
| 装技能要开终端 | 面板里填地址或粘内容就能装 |

### 功能

- **920×720 大面板**，左侧阶段导航（带计数）+ 右侧列表
- **六段开发阶段**：① 定义需求 → ② 规划拆解 → ③ 写代码 → ④ 测试验证 → ⑤ 评审加固 → ⑥ 交付上线
- **中文可读**：每条显示中文名 + `/英文名` + 一句话中文说明
- **中文可搜**：`测试`、`评审`、`上线`、`图` 都能命中；也支持英文名与描述
- **点一下就插入**：默认单选，点任意一行立即把 `/技能名` 放进草稿并关闭
- **多选**：右上角切换后勾选多个，一次拼成 `/a /b /c `
- **最近使用**：插过的前 8 个自动置顶
- **键盘操作**：`↑` `↓` 移动、`Enter` 插入、`Esc` 关闭、`Tab` 退出多选
- **三个标签页**：本次可用 / 本地已装 / 添加技能

### 添加技能（四种来源）

全部落到 `$DSH_HOME/skills/<name>/SKILL.md`。

| 方式 | 你填什么 | 例子 |
|---|---|---|
| 仓库路径 | `owner/repo` 或 `owner/repo/sub/path` | `addyosmani/agent-skills/skills/code-review-and-quality` |
| 原始地址 | 以 `SKILL.md` 结尾的 URL，或仓库 URL | `https://raw.githubusercontent.com/owner/repo/main/SKILL.md` |
| 粘贴全文 | 直接把 SKILL.md 内容贴进去 | 自己写的、从网页复制的 |
| 公共库搜索 | 关键词，点结果直接装 | `review`、`pdf`、`测试`（走 [skills.sh](https://skills.sh)） |

装完切「本地已装」就能看到，旁边有删除按钮和真实安装路径。

### 安装

**前提**：已安装 DSH 桌面版或 `dsh web`，Node.js ≥ 22.19。

#### 1. 找到你的 profile 目录

```bash
# macOS / Linux
ls ~/.dsh/profiles/

# Windows (PowerShell)
Get-ChildItem $env:USERPROFILE\.dsh\profiles
```

常见名字是 `desktop`、`standard`、`web`。下面用 `<profile>` 代指。

#### 2. 解压到 node_modules

```bash
# macOS / Linux
mkdir -p ~/.dsh/profiles/<profile>/node_modules/@local
unzip dsh-skill-picker-1.1.0.zip -d ~/.dsh/profiles/<profile>/node_modules/@local/
```

```powershell
# Windows
$dst = "$env:USERPROFILE\.dsh\profiles\<profile>\node_modules\@local"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Expand-Archive .\dsh-skill-picker-1.1.0.zip -DestinationPath $dst -Force
```

解压后应该是这样的结构（`client.js` 直接在这层，不要再套一层目录）：

```
node_modules/@local/dsh-skill-picker/
├── package.json
├── cordis.patch.yml
├── index.js
├── client.js
├── locale/{zh,en}.json
└── icon.svg
```

#### 3. 在 profile 的 patch 文件末尾追加

打开 `~/.dsh/profiles/<profile>/cordis.patch.yml`，在**最末尾**加三行：

```yaml
- insert:
    - id: dsh-skill-picker
      name: '@local/dsh-skill-picker'
```

> 注意缩进：`- insert:` 顶格，下面两行各缩进 4 空格和 6 空格。这个文件原本内容不要动。

#### 4. 完全退出 DSH 再启动

必须**完全退出进程**（托盘图标也要退出），不是只关窗口。Loader 不监听 patch 文件，改完必须重启。

#### 5. 硬刷新页面

`Ctrl+Shift+R`（macOS `Cmd+Shift+R`）。输入框左下角 ➕ 那一排最右边会出现「技能」按钮。

### 怎么用

**插入一个技能**

1. 点「技能」
2. 左侧点阶段（比如「④ 测试验证」），或在搜索框输入 `测试`
3. 点那一行 → `/技能名` 自动进草稿，面板关闭
4. 继续写你的需求，回车发送

插入的是纯文本 `/技能名`，由宿主识别并注入技能全文 —— 和手打完全同一条通路。

**一次挂多个技能**

点右上角切成「多选」→ 勾几行 → 底部「插入 N」。会拼成 `/a /b /c ` 一次性进草稿。

**装一个新技能**

点「添加技能」→ 选来源 → 填/贴 → 「安装」。成功后自动出现在「本地已装」。

**删掉一个**

「本地已装」→ 对应行右侧「删除」→ 确认。

### 卸载

1. 从 `cordis.patch.yml` 删掉那三行 `- insert:`
2. 删掉 `node_modules/@local/dsh-skill-picker` 整个目录
3. 重启 DSH

插件装的技能留在 `$DSH_HOME/skills/` 里，不受影响，想保留就留着。

### 常见问题

**重启后按钮没出现**

- 检查 `cordis.patch.yml` 末尾那三行缩进对不对
- 检查目录结构：`client.js` 必须在 `dsh-skill-picker/` 这一层，不能在 `dsh-skill-picker/dsh-skill-picker/`
- 确认重启的是进程，不是只刷新页面
- 打开设置 → 插件，看 `@local/dsh-skill-picker` 那一行有没有报错

**面板打开是空的**

最新版会在接口失败时回退到内置的 34 条清单，并在底部给出提示。如果连回退都没有，说明 `client.js` 没被加载，回到上一条检查。

**「添加技能」里报「宿主接口不可用」**

`index.js` 是 Host 半侧，只有重启进程才会挂上那 4 个接口。刷新页面不起作用。

**装完技能但列表里看不到**

新装的技能要等宿主重新扫描。切到别的标签页再切回来，或者关掉面板重开。若仍看不到，重启一次 DSH。

**技能插入后模型没反应**

插入的 `/技能名` 必须和技能目录名完全一致。用面板点选就不会错；手打容易拼错。

### 支持范围

| 项目 | 说明 |
|---|---|
| DSH 版本 | 0.2.x（`skills/list` RPC 与 `conversation.input.left` slot） |
| 平台 | Windows / macOS / Linux 的 Web 界面 |
| Node | ≥ 22.19 |
| 依赖 | 无运行时依赖，只需宿主已在运行 |

### 开发

```bash
npm install                 # react / react-dom / jsdom，仅测试用
npm run check               # 语法 + 词典审计 + 客户端 + 宿主 + 回归
node verify-skills.mjs      # 逐个校验 SKILL.md 是否符合宿主规则
node verify-provider.mjs    # 用宿主的真实 provider 加载全部技能
node verify-roundtrip.mjs   # 安装 → 发现 → 渲染 → 删除 全链路
```

`verify-host.mjs` / `verify-roundtrip.mjs` 会把 `DSH_HOME` 指到临时目录，**不会**写你的真实技能目录。

### 许可

MIT，见 [LICENSE](LICENSE)。

---

<a id="english"></a>

## English

### The problem it solves

DSH resolves skills through a `/` menu. That means you must already know a skill's kebab-case name, spell it exactly, and the candidate list is cached per session — so a freshly installed skill often does not show up. The practical result: you install a dozen skills and only ever use the two you remember.

This plugin turns the same host catalog (`skills/list`) into a permanent entry point and adds what the native menu does not have:

| Native `/` menu | This plugin |
|---|---|
| You must recall the English name | Title + one-line purpose, click the row |
| Names only, purpose unclear | Grouped into six lifecycle phases with a side rail |
| Search by English name only | Search title, purpose, and name text |
| Install skills from a terminal | Install from the panel: repo, URL, paste, or registry search |

### Features

- **920×720 dialog** with a phase rail (with counts) and a scrollable list
- **Six lifecycle phases**: ① Define → ② Plan → ③ Build → ④ Verify → ⑤ Review → ⑥ Ship
- **Readable titles**: each row shows the localized title, `/kebab-name`, and a one-line purpose
- **Full-text search**: match a phase, a purpose, or the slash name
- **Click to insert**: single-select by default — clicking a row drops `/skill-name` into the draft and closes
- **Multi-select**: flip the toggle, tick several rows, insert them as `/a /b /c `
- **Recent list**: the last 8 inserted skills float to the top
- **Keyboard**: `↑` `↓` move, `Enter` insert, `Esc` close, `Tab` leaves multi-select
- **Three tabs**: This session / Installed / Add skill

### Adding skills (four sources)

Everything lands in `$DSH_HOME/skills/<name>/SKILL.md`.

| Method | What you provide | Example |
|---|---|---|
| Repo path | `owner/repo` or `owner/repo/sub/path` | `addyosmani/agent-skills/skills/code-review-and-quality` |
| Raw URL | A URL ending in `SKILL.md`, or a repo URL | `https://raw.githubusercontent.com/owner/repo/main/SKILL.md` |
| Paste | The full SKILL.md text | Hand-written, or copied from a page |
| Registry search | A keyword; click a result to install | `review`, `pdf` (via [skills.sh](https://skills.sh)) |

Switch to the Installed tab to see it, with a remove button and the real on-disk path.

### Install

**Requires**: DSH desktop or `dsh web`, Node.js ≥ 22.19.

#### 1. Find your profile directory

```bash
# macOS / Linux
ls ~/.dsh/profiles/

# Windows (PowerShell)
Get-ChildItem $env:USERPROFILE\.dsh\profiles
```

Usual names are `desktop`, `standard`, `web`. Below, `<profile>` stands for yours.

#### 2. Unzip into node_modules

```bash
# macOS / Linux
mkdir -p ~/.dsh/profiles/<profile>/node_modules/@local
unzip dsh-skill-picker-1.1.0.zip -d ~/.dsh/profiles/<profile>/node_modules/@local/
```

```powershell
# Windows
$dst = "$env:USERPROFILE\.dsh\profiles\<profile>\node_modules\@local"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Expand-Archive .\dsh-skill-picker-1.1.0.zip -DestinationPath $dst -Force
```

The result must look like this — `client.js` sits directly in the package folder, with no extra nesting:

```
node_modules/@local/dsh-skill-picker/
├── package.json
├── cordis.patch.yml
├── index.js
├── client.js
├── locale/{zh,en}.json
└── icon.svg
```

#### 3. Append three lines to the profile patch

Open `~/.dsh/profiles/<profile>/cordis.patch.yml` and add this at the **very end**:

```yaml
- insert:
    - id: dsh-skill-picker
      name: '@local/dsh-skill-picker'
```

> Indentation matters: `- insert:` at column 0, the next two lines indented 4 and 6 spaces. Leave the existing content untouched.

#### 4. Quit DSH completely and start it again

Fully exit the process (including the tray icon) — closing the window is not enough. The loader does not watch the patch file.

#### 5. Hard-refresh the page

`Ctrl+Shift+R` (`Cmd+Shift+R` on macOS). A **Skills** button appears at the right end of the composer toolbar, next to the ➕.

### Usage

**Insert one skill**

1. Click **Skills**
2. Pick a phase on the rail (e.g. ④ Verify) or type `test` in the search box
3. Click the row — `/skill-name` goes into the draft, the dialog closes
4. Keep writing your request and press Enter

The inserted text is a plain `/skill-name` gesture. The host recognizes it and injects the full SKILL.md — the exact same path as typing it by hand.

**Attach several at once**

Flip the toggle to multi-select, tick the rows you want, then click **Insert N**. They are joined as `/a /b /c ` in one shot.

**Install a new skill**

Open the **Add skill** tab, choose a source, fill or paste, click **Install**. It shows up under **Installed** immediately.

**Remove one**

**Installed** tab → **Remove** on the row → confirm.

### Uninstall

1. Delete the three `- insert:` lines from `cordis.patch.yml`
2. Delete the `node_modules/@local/dsh-skill-picker` directory
3. Restart DSH

Skills you installed through the panel stay in `$DSH_HOME/skills/` and keep working.

### Troubleshooting

**The button does not appear after restart**

- Recheck the indentation of those three lines in `cordis.patch.yml`
- Recheck the folder layout: `client.js` must sit directly inside `dsh-skill-picker/`
- Make sure you restarted the process, not just refreshed the page
- Open Settings → Plugins and look for an error on the `@local/dsh-skill-picker` row

**The panel opens empty**

Recent builds fall back to a built-in list of 34 skills when the catalog RPC fails, with a note in the footer. If you do not even see the fallback, `client.js` was not loaded — see the previous item.

**"Host API unavailable" in the Add tab**

`index.js` is the host half; those four routes only mount after a process restart. Refreshing the page does not help.

**A newly installed skill is missing from the list**

The host rescans on demand. Switch tabs and back, or close and reopen the panel. If it still does not appear, restart DSH once.

**Inserted a skill but the model ignored it**

The `/skill-name` token must match the directory name exactly. Picking from the panel always matches; typing by hand easily does not.

### Compatibility

| Item | Notes |
|---|---|
| DSH version | 0.2.x (`skills/list` RPC and the `conversation.input.left` slot) |
| Platform | Web UI on Windows / macOS / Linux |
| Node | ≥ 22.19 |
| Dependencies | None at runtime; the host must already be running |

### Development

```bash
npm install                 # react / react-dom / jsdom, tests only
npm run check               # syntax + dictionary audit + client + host + regression
node verify-skills.mjs      # validate every SKILL.md against the host's own rules
node verify-provider.mjs    # load all skills through the real host provider
node verify-roundtrip.mjs   # install → discover → render → remove, end to end
```

`verify-host.mjs` and `verify-roundtrip.mjs` point `DSH_HOME` at a temp directory and **never** write to your real skill root.

### License

MIT — see [LICENSE](LICENSE).
