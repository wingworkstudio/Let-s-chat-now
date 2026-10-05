/* ============================================================
 * login.js —— 登录页逻辑
 * ============================================================ */
(function () {
  'use strict';

  const input = document.getElementById('nickname');
  const btn = document.getElementById('loginBtn');

  // 已有登录态则直接跳转
  const db = LC.load();
  if (db && db.selfId) {
    window.location.href = 'app.html';
    return;
  }

  const submit = () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      input.style.border = '2px solid #f87171';
      setTimeout(() => (input.style.border = 'none'), 800);
      return;
    }
    const selfId = 'self-' + LC.uid();
    LC.init(selfId);
    // 保存昵称
    const d = LC.getDB();
    d.selfName = name;
    LC.setDB(d);
    window.location.href = 'app.html';
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  input.focus();
})();
