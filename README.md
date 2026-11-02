# dsh-skill-picker

给 DeepSeek Harness 网页端输入框加一个「技能」入口：按开发阶段浏览、用中文搜索、一键插入，并且能在面板里直接装新技能。

## 为什么

DSH 原生的 skill 调用依赖 `/` 菜单，要记 kebab-case 英文名，候选按会话缓存、刷新不及时。这个插件把同一份 `skills/list` 目录做成常驻入口，并把「装技能」也搬进界面：

- **大面板**：920×720 对话框，左侧阶段导航，右侧列表，不再是个小气泡
- **按阶段分组**：① 定义需求 → ② 规划拆解 → ③ 写代码 → ④ 测试验证 → ⑤ 评审加固 → ⑥ 交付上线
- **中文可读**：每条显示中文名 + `/英文名` + 一句话中文说明
- **中文可搜**：输入 `测试`、`评审`、`上线`、`图` 都能命中；也支持英文名与描述
- **点一下就走**：默认单选，点任意一行立即插入并关闭
- **多选**：右上角切换后勾选多个，一次拼成 `/a /b /c `
- **最近使用**：插过的前 8 个自动置顶
- **键盘直通**：`↑` `↓` 移动、`Enter` 插入、`Esc` 关闭、`Tab` 退出多选
- **三个标签页**：本次可用 / 本地已装 / 添加技能

## 添加技能（扩展性）

「添加技能」页提供四种来源，全部落到 `$DSH_HOME/skills/<name>/SKILL.md`：

| 方式 | 输入 | 说明 |
|---|---|---|
| 仓库路径 | `owner/repo`、`owner/repo/skill` | 依次尝试 `raw.githubusercontent.com` 的 `main`/`master` 下的常见布局 |
| 原始地址 | `https://…/SKILL.md` 或仓库 URL | 直接抓取；非 SKILL.md 结尾时自动补路径 |
| 粘贴 | SKILL.md 全文 | 适合自己写或从别处复制 |
| 公共库搜索 | 关键词 | 走 `skills.sh` 搜索接口，点结果直接装 |

装完后切回「本地已装」即可看到，可一键删除。

宿主侧的写入约束（都在 `index.js`）：

- 只允许小写 kebab-case 技能名，`../escape` 这类名字在任何写操作前就被拒
- 只写 `$DSH_HOME/skills/`，不碰其它路径
- 同名目录默认拒绝覆盖，勾选「允许覆盖」才替换
- 上游内容必须解析出 YAML frontmatter 且 `name` 合法，可选校验与请求的名字一致
- 单文件下载上限 1.5 MB，请求体上限 2 MB，超时 20 秒

## 安装

### 手动放进 profile

```bash
mkdir -p ~/.dsh/profiles/<profile>/node_modules/@local
unzip dsh-skill-picker-1.0.0.zip -d ~/.dsh/profiles/<profile>/node_modules/@local/
```

```yaml
# ~/.dsh/profiles/<profile>/cordis.patch.yml 末尾
- insert:
    - id: dsh-skill-picker
      name: '@local/dsh-skill-picker'
```

3. 完全退出 DeepSeek Harness 再启动（Loader 不 watch `cordis.patch.yml`）
4. 页面 `Ctrl+Shift+R` 硬刷新

Windows 的 profile 目录是 `%USERPROFILE%\.dsh\profiles\<profile>\node_modules\@local\`。

## 目录结构

```
dsh-skill-picker/
├── package.json        dsh.bundle.patch + dsh.client（platform: web）
├── cordis.patch.yml    insert 一行 @local/dsh-skill-picker
├── index.js            Host 半侧：/dsh-skill-picker/api/v1 的四个路由
├── client.js           插件本体：按钮 + 三标签对话框
├── locale/{zh,en}.json 插件元信息
├── icon.svg
├── verify.mjs          jsdom + React DOM：开面板、搜索、插入、切页、粘贴安装
├── verify-host.mjs     宿主路由：路径校验、frontmatter 校验、覆盖、删除、搜索代理
├── regression.mjs      「面板永远空」bug 的回归测试
└── audit.mjs           zh/en 词典对齐 + CATALOG 覆盖率
```

## 关键实现点

| 位置 | 说明 |
|---|---|
| `client.js` `apply()` | 注册到 `conversation.input.left`（列表型 slot，➕ 那一排） |
| `sessions.using(sessionId, { source: "skillPicker" }, …)` | **必须先保留会话引用**，否则宿主解析不到该会话的技能注册表，返回空清单 |
| `ctx.remote.skills.list({ sessionId })` | 与 `/` 菜单同一份目录 |
| `inputActions.captureInsertion()` + `insertText()` | 带 `draftRev` CAS 的精确插入 |
| `index.js` `mount()` | 每个路由先过宿主 `connection.requestRejection`，再从请求里读 JSON |
| `writeSkill()` | 唯一落盘点；`mkdir` 前先 `stat` 判重，除非显式 overwrite |

## 已知约束

- **会话保留是必需的**：裸调 `skills/list` 且不 retain，宿主可能返回空数组。
- **加载 effect 的依赖不能含自身写入的 state**（如 `phase`），否则 cleanup 会 abort 掉 in-flight 请求，表现为永久 loading。
- **Host 重启才生效 patch**：`client.js` 与 `index.js` 改动只需刷新页面即可重新组合（`index.js` 改动建议重启，宿主模块有缓存）。
- **清单来自宿主**：界面列出的是 `skills/list` 返回的内容；为空或接口失败时回退到内置 34 条目录并给出提示。
- **宿主路由需要已认证页面**：所有 API 走 `connection.requestRejection`，裸 curl 会被 403/401 拒。
- **样式不自带 CSS 文件**：全部 inline style + 宿主 theme token。

## 开发

```bash
npm install              # react / react-dom / jsdom，仅测试用
npm run check            # 语法 + 词典审计 + 客户端验证 + 宿主验证 + 回归
node verify.mjs          # 单独跑客户端
node verify-host.mjs     # 单独跑宿主路由
node audit.mjs           # 词典与 CATALOG 覆盖率
node regression.mjs      # 空面板回归
```

`verify-host.mjs` 会把 `DSH_HOME` 指到临时目录，绝不写真实技能目录。

## License

MIT
