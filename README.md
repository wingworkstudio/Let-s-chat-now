# lets-chatnow

> 一个纯前端、零依赖、开箱即用的即时通讯风格 Web 应用原型。
> 类似微信 / QQ 的聊天体验，涵盖私聊、群聊、圈子、AI 助手四大场景。

## ✨ 特性

- **零依赖、无构建**：纯 HTML + CSS + 原生 JavaScript，没有任何框架和打包步骤，双击 `index.html` 就能跑
- **四大聊天场景**：私聊、群聊、圈子、AI 助手，通过左侧标签页切换
- **数据本地持久化**：基于 `localStorage` 存储，刷新不丢失
- **模拟真实交互**：发送消息后对方/AI 自动回复，带打字延迟
- **内置示例数据**：首次进入即有三组好友、两个群、两个圈子及历史对话
- **现代化 UI**：渐变登录页、毛玻璃卡片、聊天气泡、响应式布局

## 🚀 快速开始

### 方式一：直接打开

双击 `index.html`，用浏览器（推荐 Chrome / Edge）打开即可。

### 方式二：本地服务器（推荐）

```bash
# 任选其一
python3 -m http.server 8080
# 或
npx serve .
```

然后访问 `http://localhost:8080`。

### 使用说明

1. 在登录页输入任意昵称，点击「进入聊天」
2. 左侧点击标签页切换 **私聊 / 群聊 / 圈子 / AI**
3. 选择一个会话，在底部输入框发消息（回车即可发送）
4. AI 面板支持关键词回复、讲笑话、作诗等小功能

## 📁 目录结构

```
lets-chatnow/
├── index.html          # 登录页
├── app.html            # 主聊天界面
├── css/
│   └── style.css       # 全部样式
├── js/
│   ├── data.js         # 数据层：localStorage 读写 + 初始假数据 + AI 回复逻辑
│   ├── login.js        # 登录页逻辑
│   └── app.js          # 主界面逻辑：会话管理、消息渲染、自动回复
├── .gitignore
└── README.md
```

## 🧩 后续可扩展方向

- 接入 WebSocket 实现多端实时互通
- 替换 AI 面板为真实大模型 API（OpenAI / 通义千问等）
- 支持图片、表情、语音、文件发送
- 消息已读回执、撤回、@提醒
- 加好友、创建群聊、圈子发帖界面
- 移动端响应式适配与 PWA 离线支持

## 📄 License

MIT © 2026 wingworkstudio

## 🔐 推送到 GitHub

仓库地址：<https://github.com/wingworkstudio/let-s-chat-now>

首次推送可使用仓库内的 `push.sh` 脚本，支持经典 token 与 fine-grained token：

```bash
GITHUB_TOKEN=ghp_xxx ./push.sh
# 或 fine-grained
GITHUB_TOKEN=github_pat_xxx ./push.sh
```

> fine-grained token 需在 <https://github.com/settings/tokens?type=beta> 创建时勾选本仓库的 **Contents: Read and write** 权限。脚本执行后会自动移除含 token 的 remote 地址，token 不会残留在本地配置中。

