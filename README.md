# dsh-skill-picker

给 DeepSeek Harness 网页端输入框加一个「技能」按钮：不用记技能名，按开发阶段分组浏览、用中文搜索，点一下就把 `/技能名` 插进草稿。

## 为什么

DSH 原生的 skill 调用依赖 `/` 菜单，需要记住 kebab-case 英文名，且候选按会话缓存、刷新不及时。这个插件把同一份 `skills/list` 目录做成一个常驻入口：

- **按阶段分组**：① 定义需求 → ② 规划拆解 → ③ 写代码 → ④ 测试验证 → ⑤ 评审加固 → ⑥ 交付上线
- **中文可读**：每条显示中文名 + `/英文名` + 一句话中文说明
- **中文可搜**：输入 `测试`、`评审`、`上线`、`图` 都能命中；也支持英文名与描述
- **点一下就走**：默认单选模式，点任意一行立即插入并关闭
- **最近使用**：插过的前 6 个自动置顶
- **多选**：右上角切换后勾选多个，一次拼成 `/a /b /c `
- **键盘直通**：`↑` `↓` 移动、`Enter` 插入、`Esc` 关闭
- **不透明面板**：实色背景，不依赖宿主的半透明菜单材质

插入的是纯文本 `/name`，由宿主 `dsh-tool-skill` 的 pre-step 钩子识别并注入 SKILL.md 全文 —— 和手打 `/name` 完全同一条通路，因此一个回合可以同时挂多个技能。

## 安装

### 方式一：手动放进 profile（当前唯一稳定方式）

```bash
# 1. 解压到 profile 的 node_modules 下
#    Windows: %USERPROFILE%\.dsh\profiles\<profile>\node_modules\@local\dsh-skill-picker
#    macOS/Linux: ~/.dsh/profiles/<profile>/node_modules/@local/dsh-skill-picker
mkdir -p ~/.dsh/profiles/desktop/node_modules/@local
unzip dsh-skill-picker-1.0.0.zip -d ~/.dsh/profiles/desktop/node_modules/@local/dsh-skill-picker
```

```yaml
# 2. 在 ~/.dsh/profiles/desktop/cordis.patch.yml 末尾追加
- insert:
    - id: dsh-skill-picker
      name: '@local/dsh-skill-picker'
```

3. 完全退出 DeepSeek Harness 再启动（Loader 不 watch `cordis.patch.yml`）
4. 页面按 `Ctrl+Shift+R` 硬刷新

### 方式二：作为 bundle 安装

若你的 profile 支持 `plugin_manager` 工具，可用 `install_bundle` 指向解压后的目录，效果相同。

## 目录结构

```
dsh-skill-picker/
├── package.json        dsh.bundle.patch + dsh.client（platform: web, immediately）
├── cordis.patch.yml    insert 一行 @local/dsh-skill-picker
├── index.js            Host 半侧（空 apply，渲染全在浏览器）
├── client.js           插件本体：按钮 + 分组面板 + 中文文案表
├── locale/
│   ├── zh.json         插件元信息（标题/描述）
│   └── en.json
├── icon.svg            插件图标
├── verify.mjs          jsdom + React DOM 真实挂载测试
├── regression.mjs      「面板永远空」bug 的回归测试
└── audit.mjs           中文文案覆盖率审计
```

## 关键实现点

| 位置 | 说明 |
|---|---|
| `client.js` `apply()` | 注册到 `conversation.input.left`（列表型 slot，在 ➕ 那一排） |
| `inject: (sessionId) => ({ loadSkills })` | 闭包拿到会话 id，产出加载函数 |
| `sessions.using(sessionId, { source: "skillPicker" }, …)` | **必须先保留会话引用**，否则宿主解析不到该会话的技能注册表，会返回空清单 |
| `ctx.remote.skills.list({ sessionId })` | 与 `/` 菜单同一份目录 |
| `inputActions.captureInsertion()` + `insertText()` | 带 `draftRev` CAS 的精确插入，不会写坏草稿 |
| `CATALOG` 常量 | 技能名 → [中文名, 中文说明, 阶段]；未收录的技能回退到 provider 描述 |

## 已知约束

- **会话保留是必需的**：直接裸调 `skills/list` 且不 retain，宿主可能返回空数组（这是最初版本「看不到任何 skill」的根因）。
- **effect 依赖不能含 `phase`**：加载 effect 若依赖自身写入的 state，会被 cleanup abort 掉，表现为永久 loading。
- **Host 重启才生效 patch**：`client.js` 改动只需刷新页面；`cordis.patch.yml` 改动必须重启进程。
- **技能清单来自宿主**：面板列出的是 `skills/list` 返回的内容。清单为空或接口失败时，插件回退到内置的 34 条目录并在底部提示，插入的 `/name` 仍由宿主解析。
- **样式不自带 CSS 文件**：全部 inline style + 宿主 theme token，避免与宿主样式表打架。

## 开发

```bash
npm install          # react / react-dom / jsdom（仅测试用）
npm run audit        # 中文文案覆盖率：已装技能是否都有中文条目
npm run verify       # jsdom 真实挂载：点开、搜索、插入、最近使用
npm run regression   # 慢 RPC + 反复重渲染下的空面板回归
```

三个脚本都会在失败时 `exit 1`，可直接接 CI。

## License

MIT
