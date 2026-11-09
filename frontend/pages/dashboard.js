const state = { token: localStorage.getItem('mf_token'), user: JSON.parse(localStorage.getItem('mf_user') || 'null'), section: 'overview' };
const $ = selector => document.querySelector(selector);
const today = () => new Date().toISOString().slice(0, 10);
const isApproved = user => user.role === 'liderado' && (!user.accessStatus || user.accessStatus === 'aprovado');
function toast(message, error = false) { const el = $('#toast'); el.textContent = message; el.style.borderLeft = `3px solid ${error ? '#ec3e36' : '#1d5bff'}`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
async function api(url, options = {}) { const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}`, ...(options.headers || {}) } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Nao foi possivel concluir.'); return data; }
function theme() { const dark = document.body.classList.toggle('dark-mode'); localStorage.setItem('mf_theme', dark ? 'dark' : 'light'); $('.theme-toggle').innerHTML = dark ? '☀ <span>Modo claro</span>' : '☾ <span>Modo escuro</span>'; }
function navItems() { return state.user.role === 'gestor' ? [['overview', '▦', 'Visao geral'], ['punches', '◷', 'Meu ponto'], ['users', '♙', 'Colaboradores'], ['reports', '▤', 'Relatorios'], ['justifications', '✓', 'Justificativas']] : [['overview', '▦', 'Visao geral'], ['punches', '◷', 'Meu ponto'], ['reports', '▤', 'Meus relatorios'], ['justifications', '✓', 'Justificativas']]; }
function start() { if (!state.token || !state.user) return location.href = '/frontend/pages/login.html'; if (localStorage.getItem('mf_theme') === 'dark') document.body.classList.add('dark-mode'); document.querySelector('#dashboard').innerHTML = `<div class="dash"><aside class="sidebar"><div class="dash-logo"><span class="brand-mark">MF</span><b>METAL<span>FORTE</span></b></div><div class="profile"><div class="avatar">${state.user.name.slice(0, 2).toUpperCase()}</div><div><b>${state.user.name}</b><small>${state.user.position}</small></div></div><nav class="side-nav">${navItems().map(([key, icon, label]) => `<a href="#${key}" class="side-link ${key === state.section ? 'active' : ''}" data-section="${key}">${icon}<span>${label}</span></a>`).join('')}</nav><button class="theme-toggle">☾ <span>Modo escuro</span></button><button class="logout">↪ Sair da conta</button></aside><main class="main"><header class="topbar"><div><p class="eyebrow"><i></i> ${state.user.role === 'gestor' ? 'PAINEL DO GESTOR' : 'AREA DO COLABORADOR'}</p><h1>Ola, ${state.user.name.split(' ')[0]}.</h1><p class="today">${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())}</p></div><span class="online">● Sistema online</span></header><div id="content"></div></main></div>`; $('.theme-toggle').onclick = theme; $('.logout').onclick = () => { localStorage.clear(); location.href = '/'; }; document.querySelectorAll('.side-link').forEach(link => link.onclick = event => { event.preventDefault(); state.section = link.dataset.section; document.querySelectorAll('.side-link').forEach(item => item.classList.remove('active')); link.classList.add('active'); load(); }); load(); }
function panel(title, body, action = '') { return `<div class="panel"><div class="panel-head"><h3>${title}</h3>${action}</div>${body}</div>`; }
function approvalPanel(data) { const pending = data.users.filter(u => u.role === 'liderado' && u.accessStatus === 'pendente'); return panel(`Contas aguardando aprovação (${pending.length})`, pending.length ? pending.map(u => `<div class="justification-card"><div><b>${u.name}</b><small>${u.email} · ${u.position}</small></div><div class="justification-actions"><button onclick="reviewAccess('${u.id}','aprovado')">Aprovar acesso</button><button onclick="reviewAccess('${u.id}','reprovado')">Reprovar acesso</button></div></div>`).join('') : '<p class="today">Não há contas aguardando análise.</p>', '<button class="btn small" data-go="users">Ver todas</button>'); }
async function load() { try { const data = await api('/api/dashboard'); state.positions = data.positions || []; const content = $('#content'); if (state.section === 'overview') return overview(content, data); if (state.section === 'punches') return punches(content, data); if (state.section === 'reports') return reports(content, data); if (state.section === 'justifications') return justifications(content, data); if (state.section === 'users') return users(content, data); } catch (error) { toast(error.message, true); } }
function overview(c, data) { if (state.user.role === 'gestor') { const pending = data.reports.filter(r => r.status === 'pendente').length; const collaborators = data.users.filter(isApproved); c.innerHTML = `<div class="metric-grid"><div class="metric"><span>COLABORADORES ATIVOS</span><strong>${collaborators.length}</strong><b class="up">↑ Equipe ativa</b></div><div class="metric"><span>PONTOS REGISTRADOS</span><strong>${data.punches.length}</strong><b class="up">↑ Todos os registros</b></div><div class="metric"><span>RELATORIOS PENDENTES</span><strong>${pending}</strong><b class="attention">Aguardando analise</b></div></div>${approvalPanel(data)}<div class="layout-grid"><div>${panel('Colaboradores aprovados', `<div class="table-wrap"><table><thead><tr><th>COLABORADOR</th><th>CARGO</th><th>STATUS</th></tr></thead><tbody>${collaborators.map(u => `<tr><td><div class="user-cell"><span class="mini-avatar">${u.name.slice(0, 2)}</span>${u.name}</div></td><td>${u.position}</td><td><span class="tag aprovado">Aprovado</span></td></tr>`).join('')}</tbody></table></div>`, '<button class="btn small" data-go="users">+ Nova conta</button>')}</div><div>${panel('Acoes rapidas', '<div class="quick-actions"><button data-go="punches">◷ Ver todos os pontos</button><button data-go="reports">▤ Analisar relatorios</button><button data-go="justifications">✓ Ver justificativas</button></div>')}</div></div>`; } else { const points = data.punches.filter(p => p.date === today()); c.innerHTML = `<div class="welcome-card">${panel('Jornada de hoje', `<p>${points.length}/4 marcacoes registradas.</p><p class="today">Registre os horarios com precisao.</p>`)}</div><div class="layout-grid"><div>${punchPanel(data)}</div><div>${reportSummary(data)}${panel('Justificativas', '<p class="today">Registre faltas, atrasos ou ocorrencias.</p><button class="btn outline" data-go="justifications">Abrir justificativas</button>')}</div></div>`; } document.querySelectorAll('[data-go]').forEach(button => button.onclick = () => { state.section = button.dataset.go; document.querySelectorAll('.side-link').forEach(item => item.classList.toggle('active', item.dataset.section === state.section)); load(); }); }
function punchPanel(data) { const types = [['entrada', 'Entrada', '↘'], ['almoco_saida', 'Saida almoco', '☼'], ['almoco_volta', 'Volta almoco', '↗'], ['saida', 'Saida final', '↗']]; const points = data.punches.filter(p => p.date === today()); return panel('Meu ponto', types.map(([key, label, icon], index) => { const point = points.find(p => p.type === key); const enabled = index === points.length && !(key === 'saida' && !data.reports.some(r => r.date === today())); return `<div class="punch-row"><div class="punch-icon">${icon}</div><div><b>${label}</b><small>${point ? new Date(point.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Aguardando marcacao'}</small></div>${point ? '<span class="check">✓</span>' : `<button ${enabled ? '' : 'disabled'} onclick="markPunch('${key}')">Marcar</button>`}</div>`; }).join(''), `<span>${points.length}/4</span>`); }
function punches(c, data) { c.innerHTML = state.user.role === 'liderado' ? punchPanel(data) + panel('Historico de pontos', pointTable(data.punches)) : panel('Todos os pontos marcados', `<div class="table-wrap"><table><thead><tr><th>COLABORADOR</th><th>DATA</th><th>TIPO</th><th>HORARIO</th></tr></thead><tbody>${data.punches.slice().reverse().map(p => { const user = data.users.find(u => u.id === p.userId); return `<tr><td>${user?.name || p.userId}</td><td>${p.date}</td><td>${label(p.type)}</td><td>${new Date(p.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td></tr>`; }).join('')}</tbody></table></div>`); }
function pointTable(points) { return `<div class="table-wrap"><table><thead><tr><th>DATA</th><th>TIPO</th><th>HORARIO</th></tr></thead><tbody>${points.slice().reverse().map(p => `<tr><td>${p.date}</td><td>${label(p.type)}</td><td>${new Date(p.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td></tr>`).join('')}</tbody></table></div>`; }
function label(type) { return ({ entrada: 'Entrada', almoco_saida: 'Saida almoco', almoco_volta: 'Volta almoco', saida: 'Saida final' })[type] || type; }
function reportSummary(data) { return panel('Meus relatorios', data.reports.slice().reverse().slice(0, 3).map(r => `<div class="activity-row"><div><b>${r.date}</b><small>${r.activities}</small></div><span class="tag ${r.status}">${r.status}</span></div>`).join('') || '<p class="today">Nenhum relatorio enviado.</p>', '<button class="btn outline" data-go="reports">Ver todos</button>'); }
function reports(c, data) { if (state.user.role === 'liderado') { const report = data.reports.find(r => r.date === today()); c.innerHTML = reportSummary(data) + panel('Relatorio diario', `<form id="reportForm" class="form-panel"><label>Quais atividades foram feitas hoje?<textarea name="activities" required>${report?.activities || ''}</textarea></label><label>O que sera feito amanha?<textarea name="tomorrow" required>${report?.tomorrow || ''}</textarea></label><button class="btn" type="submit">${report ? 'Atualizar' : 'Enviar'} relatorio</button></form>`); $('#reportForm').onsubmit = async event => { event.preventDefault(); await send('/api/reports', Object.fromEntries(new FormData(event.target)), 'Relatorio enviado.'); }; return; } c.innerHTML = panel('Todos os relatorios', data.reports.slice().reverse().map(r => { const user = data.users.find(u => u.id === r.userId); return `<article class="report-card"><div class="report-card-head"><div><b>${user?.name || r.userId}</b><small>${r.date} · ${r.status}</small></div>${r.status === 'pendente' ? `<button class="btn small" onclick="reviewReport('${r.id}')">Aprovar</button>` : '<span class="tag aprovado">Aprovado</span>'}</div><p><strong>Atividades:</strong> ${r.activities}</p><p><strong>Amanha:</strong> ${r.tomorrow}</p></article>`; }).join('') || '<p class="today">Nenhum relatorio enviado.</p>'); }
function justifications(c, data) { const form = state.user.role === 'liderado' ? panel('Nova justificativa', `<form id="justificationForm" class="form-panel"><div class="form-grid"><label>Data<input type="date" name="date" required></label><label class="wide">Motivo<textarea name="reason" required placeholder="Explique o que aconteceu..."></textarea></label></div><button class="btn" type="submit">Enviar justificativa</button></form>`) : ''; c.innerHTML = form + panel(state.user.role === 'gestor' ? 'Justificativas dos liderados' : 'Minhas justificativas', (data.justifications || []).slice().reverse().map(j => { const user = data.users?.find(u => u.id === j.userId); return `<div class="justification-card"><div><b>${user?.name || 'Minha justificativa'}</b><small>${j.date} · ${j.reason}</small></div><span class="tag ${j.status}">${j.status}</span>${state.user.role === 'gestor' && j.status === 'pendente' ? `<div class="justification-actions"><button onclick="reviewJustification('${j.id}','aprovada')">Aprovar</button><button onclick="reviewJustification('${j.id}','recusada')">Recusar</button></div>` : ''}</div>`; }).join('') || '<p class="today">Nenhuma justificativa registrada.</p>'); if ($('#justificationForm')) $('#justificationForm').onsubmit = async event => { event.preventDefault(); await send('/api/justifications', Object.fromEntries(new FormData(event.target)), 'Justificativa enviada.'); }; }
function users(c, data) { const collaborators = data.users.filter(isApproved); const pending = data.users.filter(u => u.role === 'liderado' && u.accessStatus === 'pendente'); const approvals = pending.length ? pending.map(u => `<div class="justification-card"><div><b>${u.name}</b><small>${u.email}</small></div><div class="justification-actions"><button onclick="reviewAccess('${u.id}','aprovado')">Aprovar</button><button onclick="reviewAccess('${u.id}','reprovado')">Reprovar</button></div></div>`).join('') : '<p class="today">Nenhum cadastro aguardando aprovação.</p>'; c.innerHTML = panel('Aprovações de acesso', approvals) + panel('Colaboradores aprovados', `<div class="table-wrap"><table><thead><tr><th>NOME</th><th>CPF</th><th>CARGO</th><th>EMAIL</th><th>ACESSO</th><th>AÇÃO</th></tr></thead><tbody>${collaborators.map(u => `<tr><td>${u.name}</td><td>${u.cpf}</td><td>${u.position}</td><td>${u.email}</td><td>Aprovado</td><td><button class="btn small danger" onclick="deleteUser('${u.id}','${u.name.replace(/'/g, '')}')">Excluir</button></td></tr>`).join('')}</tbody></table></div>`, '<button class="btn small" onclick="showUserForm()">+ Nova conta</button>') + '<div id="user-form"></div>'; }
function showUserForm() { $('#user-form').innerHTML = panel('Adicionar colaborador', `<form id="newUser" class="form-panel"><div class="form-grid"><label>Nome<input name="name" required></label><label>CPF<input name="cpf" required></label><label>Telefone<input name="phone" required></label><label>E-mail<input type="email" name="email" required></label><label class="wide">Endereco<input name="address" required></label><label>CEP<input name="cep" required></label><label>Cargo<select name="position"><option>Estagiario</option><option>Junior</option><option>Pleno</option><option>Administrador</option></select></label></div><button class="btn" type="submit">Criar conta</button></form>`); $('#newUser').onsubmit = async event => { event.preventDefault(); await send('/api/users', Object.fromEntries(new FormData(event.target)), 'Conta criada. Senha inicial: 123456'); }; }
async function send(url, data, success) { try { await api(url, { method: 'POST', body: JSON.stringify(data) }); toast(success); load(); } catch (error) { toast(error.message, true); } }
async function markPunch(type) { await send('/api/punch', { type }, 'Ponto registrado com sucesso.'); }
async function reviewReport(id) { try { await api(`/api/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'aprovado' }) }); toast('Relatorio aprovado.'); load(); } catch (error) { toast(error.message, true); } }
async function reviewJustification(id, status) { try { await api(`/api/justifications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(`Justificativa ${status}.`); load(); } catch (error) { toast(error.message, true); } }
async function reviewAccess(id, accessStatus) { try { await api(`/api/access/${id}`, { method: 'PATCH', body: JSON.stringify({ accessStatus }) }); toast(accessStatus === 'aprovado' ? 'Acesso aprovado.' : 'Acesso reprovado.'); load(); } catch (error) { toast(error.message, true); } }
async function deleteUser(id, name) { if (!confirm(`Excluir a conta de ${name}? Os registros de ponto, relatórios e justificativas dessa conta também serão removidos.`)) return; try { await api(`/api/users/${id}`, { method: 'DELETE' }); toast('Conta excluída.'); load(); } catch (error) { toast(error.message, true); } }
function punches(c, data) {
  if (state.user.role !== 'gestor') {
    c.innerHTML = punchPanel(data) + panel('Histórico de pontos', pointTable(data.punches));
    return;
  }

  const filters = state.pointFilters || { userId: '', date: '' };
  const employees = data.users.filter(account => account.role === 'liderado');
  const employeeOptions = employees
    .map(account => `<option value="${escapeHtml(account.id)}" ${filters.userId === account.id ? 'selected' : ''}>${escapeHtml(account.name)}</option>`)
    .join('');
  const filteredPunches = data.punches.filter(punch => (
    (!filters.userId || punch.userId === filters.userId)
    && (!filters.date || punch.date === filters.date)
  ));
  const groupedPunches = new Map();

  for (const punch of filteredPunches) {
    const key = `${punch.userId}|${punch.date}`;
    if (!groupedPunches.has(key)) groupedPunches.set(key, []);
    groupedPunches.get(key).push(punch);
  }

  const sortedGroups = [...groupedPunches.entries()].sort(([firstKey], [secondKey]) => {
    const [firstUserId, firstDate] = firstKey.split('|');
    const [secondUserId, secondDate] = secondKey.split('|');
    return secondDate.localeCompare(firstDate)
      || (data.users.find(account => account.id === firstUserId)?.name || '').localeCompare(
        data.users.find(account => account.id === secondUserId)?.name || '',
        'pt-BR',
      );
  });

  const resultGroups = sortedGroups.map(([key, points]) => {
    const [userId, date] = key.split('|');
    const employee = data.users.find(account => account.id === userId);
    const employeeName = employee?.name || 'Colaborador removido';
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
      dateStyle: 'full',
    });
    const rows = points
      .sort((first, second) => new Date(first.time) - new Date(second.time))
      .map(point => `<tr><td>${escapeHtml(label(point.type))}</td><td>${new Date(point.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td></tr>`)
      .join('');

    return `<section class="panel point-day"><div class="panel-head"><h3>${escapeHtml(employeeName)}</h3><span>${escapeHtml(formattedDate)}</span></div><div class="table-wrap"><table><thead><tr><th>REGISTRO</th><th>HORÁRIO</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join('');

  c.innerHTML = `<form id="pointFilters" class="point-filters"><label for="pointUserFilter">Colaborador<select id="pointUserFilter" name="userId"><option value="">Todos os colaboradores</option>${employeeOptions}</select></label><label for="pointDateFilter">Dia<input id="pointDateFilter" type="date" name="date" value="${escapeHtml(filters.date)}"></label><button class="btn" type="submit">Filtrar</button><button class="btn outline" type="button" id="clearPointFilters">Limpar</button><button class="btn outline" type="button" id="refreshPoints">Atualizar registros</button></form><p class="today">${filteredPunches.length} registro(s) encontrado(s).</p>${resultGroups || '<div class="panel"><p class="today">Nenhum ponto encontrado para esses filtros.</p></div>'}`;

  $('#pointFilters').addEventListener('submit', event => {
    event.preventDefault();
    state.pointFilters = Object.fromEntries(new FormData(event.currentTarget));
    punches(c, data);
  });
  $('#clearPointFilters').addEventListener('click', () => {
    state.pointFilters = { userId: '', date: '' };
    punches(c, data);
  });
  $('#refreshPoints').addEventListener('click', load);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function users(c, data) {
  const collaborators = data.users.filter(isApproved);
  const pending = data.users.filter(account => account.role === 'liderado' && account.accessStatus === 'pendente');
  const positions = data.positions || [];
  const approvals = pending.length
    ? pending.map(account => `<div class="justification-card"><div><b>${escapeHtml(account.name)}</b><small>${escapeHtml(account.email)}</small></div><div class="justification-actions"><button onclick="reviewAccess('${account.id}','aprovado')">Aprovar</button><button onclick="reviewAccess('${account.id}','reprovado')">Reprovar</button></div></div>`).join('')
    : '<p class="today">Nenhum cadastro aguardando aprovação.</p>';
  const rows = collaborators.map(account => {
    const options = positions.map(position => `<option value="${escapeHtml(position)}" ${position === account.position ? 'selected' : ''}>${escapeHtml(position)}</option>`).join('');
    return `<tr><td>${escapeHtml(account.name)}</td><td>${escapeHtml(account.cpf)}</td><td><select id="position-${account.id}" aria-label="Cargo de ${escapeHtml(account.name)}">${options}</select><button class="btn small" onclick="updatePosition('${account.id}')">Salvar cargo</button></td><td>${escapeHtml(account.email)}</td><td>Aprovado</td><td><button class="btn small danger" onclick="deleteUser('${account.id}','${escapeHtml(account.name)}')">Excluir</button></td></tr>`;
  }).join('');
  const positionList = positions.map(position => `<li>${escapeHtml(position)}</li>`).join('');

  c.innerHTML = panel('Aprovações de acesso', approvals)
    + panel('Colaboradores aprovados', `<div class="table-wrap"><table><thead><tr><th>NOME</th><th>CPF</th><th>CARGO</th><th>E-MAIL</th><th>ACESSO</th><th>AÇÃO</th></tr></thead><tbody>${rows}</tbody></table></div>`, '<button class="btn small" onclick="showUserForm()">+ Nova conta</button>')
    + panel('Cargos da TAG Serviços', `<ul class="position-list">${positionList}</ul><form id="positionForm" class="position-form"><label for="newPosition">Adicionar cargo</label><input id="newPosition" name="name" type="text" minlength="2" maxlength="60" pattern="[A-Za-zÀ-ÖØ-öø-ÿĀ-ž0-9]+([ .'-][A-Za-zÀ-ÖØ-öø-ÿĀ-ž0-9]+)*" required placeholder="Ex.: Ajustador mecânico"><button class="btn" type="submit">Adicionar cargo</button></form>`)
    + '<div id="user-form"></div>';

  $('#positionForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name').trim();
    try {
      await api('/api/positions', { method: 'POST', body: JSON.stringify({ name }) });
      toast('Cargo adicionado.');
      load();
    } catch (error) {
      toast(error.message, true);
    }
  });
}

function showUserForm() {
  const options = (state.positions || []).map(position => `<option value="${escapeHtml(position)}">${escapeHtml(position)}</option>`).join('');
  $('#user-form').innerHTML = panel('Adicionar colaborador', `<form id="newUser" class="form-panel"><div class="form-grid"><label>Nome<input name="name" required></label><label>CPF<input name="cpf" required></label><label>Telefone<input name="phone" required></label><label>E-mail<input type="email" name="email" required></label><label class="wide">Endereço<input name="address" required></label><label>CEP<input name="cep" required></label><label>Cargo<select name="position" required>${options}</select></label></div><button class="btn" type="submit">Criar conta</button></form>`);
  $('#newUser').onsubmit = async event => {
    event.preventDefault();
    await send('/api/users', Object.fromEntries(new FormData(event.target)), 'Conta criada. Senha inicial: 123456');
  };
}

async function updatePosition(userId) {
  const position = $(`#position-${userId}`).value;
  try {
    await api(`/api/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ position }) });
    toast('Cargo atualizado.');
    load();
  } catch (error) {
    toast(error.message, true);
  }
}

start();
setTimeout(() => { const logo = document.querySelector('.dash-logo'); if (logo) logo.innerHTML = '<img class="brand-logo" src="/TGA.png" alt="Logo TAG"><b>TAG <span>SERVICOS</span></b>'; }, 0);
