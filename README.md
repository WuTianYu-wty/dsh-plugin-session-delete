# DeepSeek Harness - 会话删除插件 (Session Delete Plugin)

一个为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 开发的增强插件。解决原版在工作区对话列表处“只能归档、无法彻底删除”的痛点。

---

## ✨ 功能特性

- 🗑️ **会话更多菜单项**：在工作区会话的「`...`」菜单末尾添加「删除会话」选项。
- ⚡ **悬浮快捷按钮**：鼠标悬停在会话条目时，在原有的“归档”与“置顶”操作旁增加快捷删除（垃圾桶）按钮。
- 🛡️ **防误删二次确认**：点击删除后弹出居中模态对话框，清晰展示将要删除的会话名称并标红警告，支持 `Esc` 键或遮罩点击取消。
- 🧹 **彻底清理底层数据**：
  - 自动从所有工作区（`workspace`）解绑并实时推送更新。
  - 清理该会话在全局的归档（`archivedSessionIds`）与置顶（`pinnedSessionIds`）状态。
  - 停止该会话正在执行的后台活动与子智能体任务。
  - 彻底删除本地磁盘会话文件（`~/.dsh/sessions/*/<sessionId>`）与投影缓存文件（`~/.dsh/storages/session_projcache/sessions/<sessionId>.json`）。
- 🔄 **平滑切换活动会话**：若删除的是当前正在查看的会话，自动新建空白会话，保证界面连贯不报错。
- 🌐 **双语国际化支持**：根据界面当前语言自动适配简体中文与英文显示。

---

## 📁 目录结构

```text
├── package.json          # 插件清单与客户端激活声明
├── cordis.patch.yml      # Cordis 加载补丁配置
├── index.js              # Host 端服务：注册 /api/delete-session HTTP 路由与磁盘/工作区清理
├── client.js             # Client 端模块：注册会话菜单项、悬浮按钮及确认弹窗
├── icon.svg              # 插件专属矢量图标
├── locale/
│   ├── zh.json           # 中文元数据说明
│   └── en.json           # 英文元数据说明
└── README.md             # 使用说明文档
```

---

## 🚀 安装方法

在 DeepSeek Harness 环境中，可以通过 Harness 的 `plugin_manager` 或者是将本目录加入 Harness 的 bundle patch 进行安装：

1. 克隆或下载本仓库至本地目录，例如：`C:\path\to\dsh-plugin-session-delete`
2. 在 Harness 中使用插件管理工具安装 Bundle：
   ```bash
   dsh bundle install C:\path\to\dsh-plugin-session-delete
   ```
   或通过 AI 助手对话：
   > “帮我安装本地插件 Bundle：C:\path\to\dsh-plugin-session-delete”

---

## 📄 开源许可

[MIT License](LICENSE)
