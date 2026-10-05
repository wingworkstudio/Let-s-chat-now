/* ============================================================
 * app.js —— 主界面逻辑：私聊 / 群聊 / 圈子 / AI
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 鉴权 ---------- */
  let db = LC.load();
  if (!db || !db.selfId) {
    window.location.href = 'index.html';
    return;
  }

  /* ---------- 元素 ---------- */
  const $ = (id) => document.getElementById(id);
  const meAvatar = $('meAvatar');
  const meName = $('meName');
  const logoutBtn = $('logoutBtn');
  const tabs = document.querySelectorAll('.tab');
  const sessionList = $('sessionList');
  const searchInput = $('searchInput');
  const chatTitle = $('chatTitle');
  const chatDesc = $('chatDesc');
  const msgBox = $('msgBox');
  const msgInput = $('msgInput');
  const sendBtn = $('sendBtn');

  /* ---------- 状态 ---------- */
  let currentTab = 'private';
  let currentSessionId = null;
  let keyword = '';

  /* ---------- 初始化个人信息 ---------- */
  const selfName = db.selfName || '我';
  meName.textContent = selfName;
  meAvatar.textContent = selfName.slice(0, 1);

  /* ---------- 渲染会话列表 ---------- */
  function renderSessions() {
    const list = LC.listSessions(db, currentTab);
    const filtered = keyword
      ? list.filter((s) => s.name.includes(keyword))
      : list;

    sessionList.innerHTML = '';
    if (filtered.length === 0) {
      sessionList.innerHTML = '<div class="no-session">暂无会话</div>';
      return;
    }

    filtered.forEach((s) => {
      const el = document.createElement('div');
      el.className = 'session' + (s.id === currentSessionId ? ' active' : '');
      el.dataset.id = s.id;
      el.innerHTML = `
        <div class="avatar">${s.avatar}</div>
        <div class="sess-info">
          <div class="sess-top">
            <span class="sess-name">${s.name}</span>
            <span class="sess-time">${s.lastTs ? LC.timeStr(s.lastTs) : ''}</span>
          </div>
          <div class="sess-preview">${s.lastText || '暂无消息'}</div>
        </div>
      `;
      el.addEventListener('click', () => selectSession(s.id));
      sessionList.appendChild(el);
    });
  }

  /* ---------- 选择会话 ---------- */
  function selectSession(sessId) {
    currentSessionId = sessId;
    const meta = LC.getSessionMeta(db, sessId);
    if (!meta) return;

    chatTitle.textContent = meta.name;
    if (meta.type === 'private') chatDesc.textContent = '私聊 · 你们是好友';
    else if (meta.type === 'group') chatDesc.textContent = '群聊 · ' + (db.groups.find(g => g.id === sessId)?.members.length || 0) + ' 位成员';
    else if (meta.type === 'circle') chatDesc.textContent = '圈子 · ' + (meta.desc || '公开交流');
    else chatDesc.textContent = 'AI 助手 · 随时在线';

    msgInput.disabled = false;
    sendBtn.disabled = false;
    msgInput.focus();
    renderSessions();
    renderMessages();
  }

  /* ---------- 渲染消息 ---------- */
  function renderMessages() {
    if (!currentSessionId) return;
    const msgs = LC.getMessages(db, currentSessionId);
    const meta = LC.getSessionMeta(db, currentSessionId);

    msgBox.innerHTML = '';
    msgs.forEach((m) => {
      const mine = m.from === db.selfId;
      const row = document.createElement('div');
      row.className = 'msg' + (mine ? ' me' : '');

      let whoName = '';
      let avatar = meta.avatar;
      if (!mine) {
        if (m.from === 'ai') { whoName = 'AI 助手'; avatar = 'AI'; }
        else {
          const c = db.contacts.find(x => x.id === m.from);
          whoName = c ? c.name : '群友';
          avatar = c ? c.avatar : '?';
        }
      } else {
        whoName = selfName;
        avatar = selfName.slice(0, 1);
      }

      const bubbleClass = m.from === 'ai' ? 'msg-bubble msg-ai' : 'msg-bubble';
      const nameLine = meta.type === 'group' && !mine ? `<div class="msg-meta">${whoName}</div>` : '';

      row.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div style="min-width:0">
          ${nameLine}
          <div class="${bubbleClass}">${escapeHtml(m.text)}</div>
        </div>
      `;
      msgBox.appendChild(row);
    });
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (s) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[s]));
  }

  /* ---------- 发送消息 ---------- */
  function sendMessage() {
    const text = msgInput.value.trim();
    if (!text || !currentSessionId) return;

    LC.appendMessage(db, currentSessionId, {
      id: LC.uid(),
      from: db.selfId,
      text: text,
      ts: LC.now(),
    });
    msgInput.value = '';
    db = LC.getDB();
    renderSessions();
    renderMessages();

    // 模拟回复
    const meta = LC.getSessionMeta(db, currentSessionId);
    if (meta.type === 'ai') {
      simulateAIReply(text);
    } else {
      simulateReply(currentSessionId);
    }
  }

  // 模拟普通会话对方回复
  function simulateReply(sessId) {
    const meta = LC.getSessionMeta(db, sessId);
    const delay = 600 + Math.random() * 900;
    setTimeout(() => {
      const db2 = LC.getDB();
      const reply = LC.getAutoReply(db2, sessId, '');
      if (!reply) return;
      let fromId = db2.selfId;
      if (meta.type === 'private') fromId = sessId;
      else if (meta.type === 'group') fromId = (db2.groups.find(g => g.id === sessId)?.members[0]) || 'u-1001';
      else if (meta.type === 'circle') fromId = 'u-1003';

      LC.appendMessage(db2, sessId, {
        id: LC.uid(), from: fromId, text: reply, ts: LC.now(),
      });
      if (currentSessionId === sessId) {
        db = LC.getDB();
        renderMessages();
      }
      renderSessions();
    }, delay);
  }

  // 模拟 AI 流式打字
  function simulateAIReply(userText) {
    const reply = LC.getAIReply(userText);
    setTimeout(() => {
      const db2 = LC.getDB();
      LC.appendMessage(db2, 'ai-1', {
        id: LC.uid(), from: 'ai', text: reply, ts: LC.now(),
      });
      if (currentSessionId === 'ai-1') {
        db = LC.getDB();
        renderMessages();
      }
      renderSessions();
    }, 500);
  }

  /* ---------- 事件绑定 ---------- */
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      // 切换 tab 不清空当前会话，但重新渲染列表
      renderSessions();
    });
  });

  searchInput.addEventListener('input', () => {
    keyword = searchInput.value.trim();
    renderSessions();
  });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  logoutBtn.addEventListener('click', () => {
    if (confirm('确定要退出登录吗？本地数据会保留。')) {
      // 保留数据，仅清除登录态标记
      const d = LC.getDB();
      d.selfId = null;
      LC.setDB(d);
      window.location.href = 'index.html';
    }
  });

  /* ---------- 启动：默认选中第一个会话 ---------- */
  renderSessions();
  const first = LC.listSessions(db, currentTab)[0];
  if (first) selectSession(first.id);
})();
