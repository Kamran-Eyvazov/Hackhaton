const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S = { token: localStorage.getItem('t'), user: null };
const NEEDS = { none: 'Yoxdur', dyslexia: 'Disleksiya', vision: 'Görmə məhdudiyyəti', hearing: 'Eşitmə məhdudiyyəti' };
const TYPES = { concept: 'Səhv anlayış', calculation: 'Hesablama səhvi', gap: 'Əvvəlki mövzuda boşluq' };
const col = p => p >= 50 ? 'var(--bad)' : p >= 30 ? 'var(--warn)' : 'var(--ok)';

async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (S.token || '') },
    body: body ? JSON.stringify(body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Xəta');
  return j;
}
function logout() { localStorage.removeItem('t'); S.token = null; S.user = null; init(); }
function setWho() {
  $('#who').innerHTML = S.user ? `<span class="mu">${esc(S.user.name)} (${S.user.role === 'teacher' ? 'Müəllim' : 'Valideyn'})</span> <button id="lo">Çıxış</button>` : '';
  if (S.user) $('#lo').onclick = logout;
}

// ---------- Giriş / Qeydiyyat ----------
function authView() {
  let mode = 'login', role = 'parent';
  const draw = () => {
    $('#app').innerHTML = `<div class="card" style="max-width:420px;margin:30px auto">
      <h2>MəktəbAI</h2><div class="mu">Düşündürən AI müəllim</div><br>
      <div class="tabs"><button data-m="login" class="${mode==='login'?'on':''}">Giriş</button><button data-m="reg" class="${mode==='reg'?'on':''}">Qeydiyyat</button></div>
      ${mode === 'reg' ? `<select id="role"><option value="parent" ${role==='parent'?'selected':''}>Valideyn</option><option value="teacher" ${role==='teacher'?'selected':''}>Sinif rəhbəri (müəllim)</option></select>
      <input id="name" placeholder="Ad Soyad">${role === 'teacher' ? '<input id="cn" placeholder="Sinif (məs. 5a)">' : ''}` : ''}
      <input id="em" placeholder="E-poçt"><input id="pw" type="password" placeholder="Şifrə">
      <div class="err" id="er"></div><button class="p" id="go" style="width:100%">${mode==='login'?'Daxil ol':'Qeydiyyatdan keç'}</button></div>`;
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    if ($('#role')) $('#role').onchange = e => { role = e.target.value; draw(); };
    $('#go').onclick = async () => {
      try {
        const body = { email: $('#em').value, password: $('#pw').value };
        if (mode === 'reg') Object.assign(body, { role, name: $('#name').value, className: $('#cn')?.value });
        const r = await api(mode === 'login' ? '/login' : '/register', 'POST', body);
        S.token = r.token; localStorage.setItem('t', r.token); S.user = r.user;
        if (r.classCode) alert('Sinif kodunuz: ' + r.classCode + '\nValideynlərə bu kodu verin.');
        route();
      } catch (e) { $('#er').textContent = e.message; }
    };
  };
  draw();
}

// ---------- Valideyn ----------
async function parentView() {
  const kids = await api('/children');
  $('#app').innerHTML = `<div class="card"><h2>Uşaqlarım</h2><div id="kids">${kids.length ? '' : '<div class="mu">Hələ uşaq əlavə etməmisiniz.</div>'}</div></div>
  <div class="card"><h3>Uşaq əlavə et</h3><div class="row">
    <input id="kn" placeholder="Uşağın adı"><input id="kc" placeholder="Sinif kodu (müəllimdən)">
    <select id="kd">${Object.entries(NEEDS).map(([k, v]) => `<option value="${k}">Xüsusi ehtiyac: ${v}</option>`).join('')}</select>
    <button class="p" id="ka">Əlavə et</button></div><div class="err" id="ke"></div></div><div id="rep"></div>`;
  $('#kids').innerHTML = kids.map(k => `<div class="row sp" style="padding:8px 0;border-bottom:1px solid var(--bd)">
    <div><b>${esc(k.name)}</b> <span class="mu">· ${esc(k.class_name)} sinfi${k.needs !== 'none' ? ' · ' + NEEDS[k.needs] : ''}</span></div>
    <div class="row"><button data-r="${k.id}">📊 Hesabat</button><button class="p" data-c="${k.id}">🎒 Uşaq rejimi</button></div></div>`).join('');
  $('#ka').onclick = async () => {
    try { await api('/children', 'POST', { name: $('#kn').value, classCode: $('#kc').value, needs: $('#kd').value }); parentView(); }
    catch (e) { $('#ke').textContent = e.message; }
  };
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => report(b.dataset.r));
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => childMode(kids.find(k => k.id == b.dataset.c)));
}
async function report(id) {
  const r = await api(`/children/${id}/report`);
  $('#rep').innerHTML = `<div class="card"><h2>${esc(r.child.name)}: hesabat</h2>
    <div class="grid" style="margin:10px 0"><div class="stat"><span class="mu">Ümumi uğur</span><b>${r.success ?? '—'}${r.success !== null ? '%' : ''}</b></div>
    <div class="stat"><span class="mu">Cəhd sayı</span><b>${r.total}</b></div></div>
    <h3>Mövzular</h3>${r.topics.map(t => { const p = Math.round(t.err / t.n * 100); return `<div>${esc(t.topic)} <span class="mu">(${p}% səhv)</span></div><div class="bar"><i style="width:${p}%;background:${col(p)}"></i></div>`; }).join('') || '<div class="mu">Hələ məlumat yoxdur</div>'}
    <h3>Səhv növləri</h3>${r.types.map(t => `<span class="tag" style="background:var(--pr);margin-right:6px">${TYPES[t.error_type]}: ${t.n}</span>`).join('') || '<div class="mu">—</div>'}
    <br><br><button class="p" id="adv">🤖 AI tövsiyəsi al</button><div class="sum" id="advt" style="display:none"></div></div>`;
  $('#adv').onclick = async () => {
    const o = $('#advt'); o.style.display = 'block'; o.textContent = 'AI təhlil edir...';
    try { o.textContent = (await api(`/children/${id}/advice`, 'POST')).text; } catch (e) { o.textContent = 'Xəta: ' + e.message; }
  };
  $('#rep').scrollIntoView({ behavior: 'smooth' });
}

// ---------- Uşaq rejimi ----------
function childMode(kid) {
  const msgs = [];
  const view = [{ role: 'ai', text: `Salam, ${kid.name}! 👋 Hansı tapşırıq üzərində işləyirik? Həllini yaz, mən suallarla kömək edim.` }];
  $('#app').innerHTML = `<div class="card ${['vision', 'dyslexia'].includes(kid.needs) ? 'big' : ''}" id="cc">
    <div class="row sp"><h2>${esc(kid.name)}: öyrənmə vaxtı</h2><button id="ex">⬅ Valideyn rejiminə qayıt</button></div>
    <div class="row"><select id="tp"><option>Adi kəsrlər</option><option>Onluq kəsrlər</option><option>Kəsrlərin müqayisəsi</option></select>
    <button id="bg">🔠 Böyük şrift</button></div><br><div id="chat"></div>
    <div class="row"><input id="in" placeholder="Həllini və ya sualını yaz... (məs: 1/2 + 1/3 = 2/5)"><button class="p" id="sd">Göndər</button></div></div>`;
  const draw = () => {
    const c = $('#chat'); c.innerHTML = '';
    view.forEach((m, i) => {
      const d = document.createElement('div'); d.className = 'm ' + m.role; d.textContent = m.text;
      if (m.role === 'ai' && i > 0 && !m.temp) {
        const t = document.createElement('div'); t.className = 'tools';
        const s = document.createElement('button'); s.textContent = '✨ Sadələşdir'; s.onclick = () => simplify(i);
        const v = document.createElement('button'); v.textContent = '🔊 Səsləndir'; v.onclick = () => speak(m.text);
        t.append(s, v); d.append(t);
      }
      c.append(d);
    });
    c.scrollTop = c.scrollHeight;
  };
  async function simplify(i) {
    view.push({ role: 'ai', text: 'Sadələşdirirəm...', temp: 1 }); draw();
    try { view[view.length - 1] = { role: 'ai', text: (await api('/simplify', 'POST', { text: view[i].text })).text }; }
    catch (e) { view[view.length - 1] = { role: 'ai', text: 'Xəta: ' + e.message }; }
    draw();
  }
  async function send() {
    const v = $('#in').value.trim(); if (!v) return; $('#in').value = '';
    view.push({ role: 'me', text: v }); msgs.push({ role: 'user', content: v });
    view.push({ role: 'ai', text: 'Düşünürəm...', temp: 1 }); draw(); $('#sd').disabled = true;
    try {
      const r = await api('/chat', 'POST', { childId: kid.id, topic: $('#tp').value, messages: msgs });
      view[view.length - 1] = { role: 'ai', text: r.reply }; msgs.push({ role: 'assistant', content: r.reply });
    } catch (e) { view[view.length - 1] = { role: 'ai', text: 'Xəta: ' + e.message }; msgs.pop(); }
    $('#sd').disabled = false; draw();
  }
  $('#sd').onclick = send; $('#in').onkeydown = e => { if (e.key === 'Enter') send(); };
  $('#bg').onclick = () => $('#cc').classList.toggle('big');
  $('#ex').onclick = () => { speechSynthesis.cancel(); parentView(); };
  $('#tp').onchange = () => { msgs.length = 0; view.splice(1); draw(); };
  draw();
}
function speak(t) {
  if (!('speechSynthesis' in window)) return alert('Brauzer səsləndirməni dəstəkləmir');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t), vs = speechSynthesis.getVoices();
  const v = vs.find(x => /^az/i.test(x.lang)) || vs.find(x => /^tr/i.test(x.lang));
  u.lang = v ? v.lang : 'tr-TR'; if (v) u.voice = v; u.rate = .9; speechSynthesis.speak(u);
}

// ---------- Müəllim ----------
async function teacherView() {
  const d = await api('/class');
  const st = s => s.success === null ? ['Məlumat yox', 'var(--mu)'] : s.success < 55 ? ['Risk', 'var(--bad)'] : s.success < 75 ? ['Diqqət', 'var(--warn)'] : ['Yaxşı', 'var(--ok)'];
  $('#app').innerHTML = `<div class="card"><h2>${esc(d.class.name)} sinfi · ${esc(S.user.name)}</h2>
    <div class="mu">Sinif kodu (valideynlərə verin): <span class="code">${esc(d.class.code)}</span></div>
    <div class="grid" style="margin-top:12px"><div class="stat"><span class="mu">Şagird sayı</span><b>${d.students.length}</b></div>
    <div class="stat"><span class="mu">Orta uğur</span><b>${d.avg ?? '—'}${d.avg !== null ? '%' : ''}</b></div>
    <div class="stat"><span class="mu">Risk altında</span><b style="color:var(--bad)">${d.risk.length}</b></div></div></div>
    <div class="card"><h3>Ən çətin mövzular</h3>${d.topics.map(t => `<div class="row sp"><span>${esc(t.topic)}</span><b>${t.errorPct}% səhv</b></div><div class="bar"><i style="width:${t.errorPct}%;background:${col(t.errorPct)}"></i></div>`).join('') || '<div class="mu">Hələ məlumat yoxdur</div>'}
    <div style="margin-top:6px">${d.types.map(t => `<span class="tag" style="background:var(--pr);margin-right:6px">${TYPES[t.error_type]}: ${t.n}</span>`).join('')}</div></div>
    <div class="card sc"><h3>Şagirdlər</h3><table><tr><th>Şagird</th><th>Uğur</th><th>Cəhd</th><th>Xüsusi ehtiyac</th><th>Status</th></tr>
    ${d.students.map(s => { const [l, c] = st(s); return `<tr><td>${esc(s.name)}</td><td>${s.success ?? '—'}${s.success !== null ? '%' : ''}</td><td>${s.n}</td><td>${NEEDS[s.needs]}</td><td><span class="tag" style="background:${c}">${l}</span></td></tr>`; }).join('')}</table></div>
    <div class="card"><h3>🤖 AI sinif xülasəsi</h3><button class="p" id="sb">Xülasə yarat</button><div class="sum" id="so" style="display:none"></div></div>`;
  $('#sb').onclick = async () => {
    const o = $('#so'); o.style.display = 'block'; o.textContent = 'AI təhlil edir...';
    try { o.textContent = (await api('/class/summary', 'POST')).text; } catch (e) { o.textContent = 'Xəta: ' + e.message; }
  };
}

function route() { setWho(); S.user.role === 'teacher' ? teacherView() : parentView(); }
async function init() {
  if (S.token) { try { S.user = await api('/me'); return route(); } catch { logout(); return; } }
  setWho(); authView();
}
init();
