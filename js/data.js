/* ============================================================
 * data.js —— 数据层：localStorage 持久化 + 初始假数据
 * 全局命名空间 window.LC
 * ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'lets-chatnow-data-v1';

  /* ---------- 工具 ---------- */
  const uid = () => Math.random().toString(36).slice(2, 10);
  const now = () => Date.now();
  const timeStr = (ts) => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  /* ---------- 初始假数据 ---------- */
  function defaultData(selfId) {
    return {
      selfId: selfId,
      contacts: [
        { id: 'u-1001', name: '小A同学', avatar: 'A' },
        { id: 'u-1002', name: '设计小姐姐', avatar: '设' },
        { id: 'u-1003', name: '老王', avatar: '王' },
      ],
      groups: [
        { id: 'g-2001', name: '前端交流群', members: ['u-1001', 'u-1002', 'u-1003'] },
        { id: 'g-2002', name: '周末开黑群', members: ['u-1003'] },
      ],
      circles: [
        { id: 'c-3001', name: '摄影圈', desc: '分享照片与器材' },
        { id: 'c-3002', name: '美食圈', desc: '今天你吃了啥' },
      ],
      sessions: {
        'u-1001': [
          { id: uid(), from: 'u-1001', text: '嘿，在忙吗？', ts: now() - 3600e3 },
          { id: uid(), from: selfId, text: '刚开完会，怎么啦', ts: now() - 3500e3 },
          { id: uid(), from: 'u-1001', text: '晚上一起吃饭呀 🍜', ts: now() - 3400e3 },
        ],
        'g-2001': [
          { id: uid(), from: 'u-1002', text: '有人看过最新的 React 文档吗？', ts: now() - 7200e3 },
          { id: uid(), from: 'u-1001', text: '看了，Server Components 挺香的', ts: now() - 7000e3 },
        ],
        'c-3001': [
          { id: uid(), from: 'u-1003', text: '分享一张今天拍的晚霞 🌅', ts: now() - 86400e3 },
          { id: uid(), from: 'u-1001', text: '色彩太棒了，用的什么镜头？', ts: now() - 86000e3 },
        ],
        'ai-1': [
          { id: uid(), from: 'ai', text: '你好，我是你的 AI 助手 🤖 有什么可以帮你的？', ts: now() - 600e3 },
        ],
      },
    };
  }

  /* ---------- 读写 ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  function init(selfId) {
    const db = defaultData(selfId);
    save(db);
    return db;
  }
  function getDB() { return load(); }
  function setDB(db) { save(db); }

  /* ---------- 会话相关 ---------- */
  // 返回所有会话条目（含未读数、最后一条消息）
  function listSessions(db, typeFilter) {
    const result = [];
    const all = collectAllSessions(db);
    all.forEach((sess) => {
      if (typeFilter && sess.type !== typeFilter) return;
      const msgs = db.sessions[sess.id] || [];
      const last = msgs[msgs.length - 1];
      result.push({
        id: sess.id,
        type: sess.type,
        name: sess.name,
        avatar: sess.avatar,
        desc: sess.desc,
        lastText: last ? last.text : '',
        lastTs: last ? last.ts : 0,
        unread: 0,
      });
    });
    result.sort((a, b) => b.lastTs - a.lastTs);
    return result;
  }

  // 聚合四类会话的目标对象
  function collectAllSessions(db) {
    const arr = [];
    db.contacts.forEach((c) => arr.push({ id: c.id, type: 'private', name: c.name, avatar: c.avatar }));
    db.groups.forEach((g) => arr.push({ id: g.id, type: 'group', name: g.name, avatar: g.name.slice(0, 1) }));
    db.circles.forEach((c) => arr.push({ id: c.id, type: 'circle', name: c.name, avatar: c.name.slice(0, 1), desc: c.desc }));
    arr.push({ id: 'ai-1', type: 'ai', name: 'AI 助手', avatar: 'AI' });
    return arr;
  }

  function getSessionMeta(db, sessId) {
    const all = collectAllSessions(db);
    return all.find((s) => s.id === sessId) || null;
  }

  function getMessages(db, sessId) {
    return db.sessions[sessId] || [];
  }

  // 追加消息
  function appendMessage(db, sessId, msg) {
    if (!db.sessions[sessId]) db.sessions[sessId] = [];
    db.sessions[sessId].push(msg);
    save(db);
  }

  // 根据会话类型决定"别人"的回复内容（模拟）
  function getAutoReply(db, sessId, userText) {
    const meta = getSessionMeta(db, sessId);
    if (!meta) return null;
    const lower = userText.toLowerCase();
    // 极简关键词回复
    if (/\b(hi|hello|你好|在吗)\b/.test(lower)) return '在的，说吧～';
    if (/谢谢|thx|thanks/.test(lower)) return '不客气 😊';
    if (/[?？]/.test(userText) && userText.length < 20) return '这是个好问题，我再想想…';
    const replies = [
      '收到！',
      '哈哈，有意思～',
      '我在忙，稍等回你',
      '同意你的看法',
      '等会儿详细聊',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  /* ---------- AI 回复（前端模拟大模型） ---------- */
  function getAIReply(userText) {
    const t = userText.trim();
    if (!t) return '想聊点什么呢？';
    const greet = /(你好|hi|hello|在吗)/i;
    if (greet.test(t)) return '你好呀！我是 lets-chatnow 的 AI 助手，可以陪你聊天、答疑、写点小文案，试试问我问题吧～';
    if (/(你是谁|叫什么)/.test(t)) return '我是内置在 lets-chatnow 里的 AI 助手，纯前端模拟实现，无需联网就能对话。';
    if (/(时间|几点)/.test(t)) return `现在是 ${new Date().toLocaleTimeString()}，注意别熬太晚哦 ⏰`;
    if (/(笑话|开心一下)/.test(t)) return '许仙给白娘子买了一顶帽子，白娘子戴上后——就变成了「白帽子」😂';
    if (t.endsWith('?') || t.endsWith('？')) return `关于「${t.slice(0, 30)}」，这是个值得探讨的话题。作为演示版 AI，我只能给个简单回应：保持好奇，继续追问吧！`;
    if (/(写|生成|作诗|诗)/.test(t)) return '好的，送你一首小诗：\n春风拂面花自开，\n键盘轻敲思绪来。\n一行代码一片天，\n聊到深处笑开怀。';
    return `你刚才说：「${t.slice(0, 60)}」\n\n（这是前端模拟的 AI 回复，接入真实大模型后这里会返回更智能的回答。）`;
  }

  global.LC = {
    KEY, uid, now, timeStr,
    load, save, init, getDB, setDB,
    listSessions, getSessionMeta, getMessages,
    appendMessage, getAutoReply, getAIReply,
  };
})(window);
