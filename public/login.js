const $ = s => document.querySelector(s);
let role = 'parent'; // Şagird tabı = Valideyn hesabı

function setTab(r) {
  role = r === 'teacher' ? 'teacher' : 'parent';
  $('#tab-student').setAttribute('aria-selected', role === 'parent');
  $('#tab-teacher').setAttribute('aria-selected', role === 'teacher');
  $('#teacherExtra').hidden = true; // Google düyməsi işləmir, gizlədirik
  $('#studentPanel').hidden = role === 'teacher';
  $('#teacherPanel').hidden = role !== 'teacher';
  $('#okMsg').textContent = '';
}
$('#tab-student').onclick = () => setTab('parent');
$('#tab-teacher').onclick = () => setTab('teacher');

$('#eye').onclick = () => {
  const p = $('#password'), show = p.type === 'password';
  p.type = show ? 'text' : 'password';
  $('#eye').textContent = show ? 'Gizlət' : 'Göstər';
};

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const identity = $('#identity').value.trim();
  const password = $('#password').value;
  $('#idMsg').textContent = identity ? '' : 'E-poçtu yazın';
  $('#passMsg').textContent = password ? '' : 'Şifrəni yazın';
  if (!identity || !password) return;

  const btn = $('#submitBtn');
  btn.disabled = true;
  $('#okMsg').textContent = 'Daxil olunur...';
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, password })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Giriş alınmadı');
    if (j.user.role !== role)
      throw new Error(role === 'teacher' ? 'Bu hesab müəllim hesabı deyil' : 'Bu hesab valideyn hesabı deyil');
    localStorage.setItem('t', j.token);
    location.href = '/app.html';
  } catch (err) {
    $('#okMsg').textContent = '';
    $('#passMsg').textContent = err.message;
    btn.disabled = false;
  }
});

setTab('parent');