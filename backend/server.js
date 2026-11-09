const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword, verifyPassword, token, sanitizeUser } = require('./security');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'database', 'db.json');
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const DEFAULT_POSITIONS = ['Estagiário', 'Auxiliar de usinagem', 'Operador de máquinas', 'Torneiro mecânico júnior', 'Torneiro mecânico pleno', 'Soldador', 'Auxiliar de solda', 'Mecânico de manutenção', 'Inspetor de qualidade', 'Projetista mecânico', 'Supervisor de produção', 'Gestor geral'];

function readDb() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(data)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', c => raw += c); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON inválido')); } }); }); }
function auth(req, db) {
  const bearer = String(req.headers.authorization || '').replace('Bearer ', '');
  const session = db.sessions.find(s => s.token === bearer);
  return session ? db.users.find(u => u.id === session.userId && u.active && (u.role === 'gestor' || !u.accessStatus || u.accessStatus === 'aprovado')) : null;
}
function today() { return new Date().toISOString().slice(0, 10); }
function getPositions(db) {
  return [...new Set([
    ...DEFAULT_POSITIONS,
    ...(Array.isArray(db.positions) ? db.positions : []),
    ...db.users.map(user => user.position).filter(Boolean),
  ])].sort((first, second) => first.localeCompare(second, 'pt-BR'));
}
function isValidPosition(value) {
  return typeof value === 'string'
    && value.trim().length >= 2
    && value.trim().length <= 60
    && /^[\p{L}\p{M}0-9]+(?:[ .'-][\p{L}\p{M}0-9]+)*$/u.test(value.trim());
}
function isValidCpf(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length) => {
    let total = 0;
    for (let index = 0; index < length; index += 1) {
      total += Number(cpf[index]) * (length + 1 - index);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9])
    && calculateDigit(10) === Number(cpf[10]);
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

async function api(req, res, pathname) {
  const db = readDb();
  if (req.method === 'POST' && pathname === '/api/login') {
    const { email, password, role } = await body(req);
    const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.role === role && u.active);
    if (!user || !verifyPassword(password, user.passwordHash)) return json(res, 401, { error: 'E-mail, senha ou perfil inválido.' });
    if (role === 'liderado' && ['pendente', 'reprovado'].includes(user.accessStatus)) return json(res, 200, { accessStatus: user.accessStatus });
    const sessionToken = token(); db.sessions = db.sessions.filter(s => s.userId !== user.id); db.sessions.push({ token: sessionToken, userId: user.id, createdAt: new Date().toISOString() }); writeDb(db);
    return json(res, 200, { token: sessionToken, user: sanitizeUser(user) });
  }
  if (req.method === 'POST' && pathname === '/api/recovery') {
    const { email } = await body(req); const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (user) { const code = crypto.randomInt(100000, 999999).toString(); db.resetTokens.push({ email: user.email, code, expires: Date.now() + 900000 }); writeDb(db); console.log(`[E-MAIL SIMULADO] Código de recuperação para ${email}: ${code}`); }
    return json(res, 200, { message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.' });
  }
  if (req.method === 'POST' && pathname === '/api/register') {
    const data = await body(req);
    if (!data.name || !data.email || !data.cpf || !data.phone || !data.address || !data.cep || !data.password) return json(res, 400, { error: 'Preencha todos os dados obrigatorios.' });
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+([ '-][A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+)*$/.test(String(data.name).trim())) return json(res, 400, { error: 'Informe um nome válido, usando somente letras e espaços.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) return json(res, 400, { error: 'Informe um e-mail válido.' });
    if (!isValidCpf(data.cpf)) return json(res, 400, { error: 'Informe um CPF válido.' });
    if (!isValidPhone(data.phone)) return json(res, 400, { error: 'Informe um telefone com DDD e 10 ou 11 números.' });
    if (String(data.cep).replace(/\D/g, '').length !== 8) return json(res, 400, { error: 'Informe um CEP com oito números.' });
    if (String(data.address).trim().length < 5 || String(data.address).length > 120) return json(res, 400, { error: 'Informe um endereço válido.' });
    if (String(data.password).length < 6) return json(res, 400, { error: 'A senha deve ter pelo menos 6 caracteres.' });
    if (db.users.some(u => u.email.toLowerCase() === String(data.email).toLowerCase() || u.cpf === data.cpf)) return json(res, 409, { error: 'E-mail ou CPF ja cadastrado.' });
    const newUser = { id: `usr-${token().slice(0, 8)}`, name: data.name, email: data.email, cpf: data.cpf, phone: data.phone, address: data.address, cep: data.cep, role: 'liderado', position: data.position || 'Estagiario', passwordHash: hashPassword(data.password), active: true, accessStatus: 'pendente', createdAt: new Date().toISOString() };
    db.users.push(newUser); writeDb(db); return json(res, 201, { user: sanitizeUser(newUser) });
  }
  const user = auth(req, db);
  if (pathname.startsWith('/api/') && !user) return json(res, 401, { error: 'Sessão expirada.' });
  if (req.method === 'GET' && pathname === '/api/me') return json(res, 200, { user: sanitizeUser(user) });
  if (req.method === 'GET' && pathname === '/api/dashboard') {
    const date = today(); const punches = db.punches.filter(p => p.userId === user.id && p.date === date); const reports = db.reports.filter(r => r.userId === user.id);
    const justifications = db.justifications || [];
    return json(res, 200, user.role === 'gestor' ? { users: db.users.filter(u => u.active).map(sanitizeUser), punches: db.punches, reports: db.reports, justifications, positions: getPositions(db) } : { punches, reports, justifications: justifications.filter(j => j.userId === user.id) });
  }
  if (user.role === 'gestor' && req.method === 'POST' && pathname === '/api/positions') {
    const { name } = await body(req);
    const position = String(name || '').trim().replace(/\s+/g, ' ');
    if (!isValidPosition(position)) return json(res, 400, { error: 'Informe um cargo válido com até 60 caracteres.' });
    const positions = getPositions(db);
    if (positions.some(existing => existing.toLocaleLowerCase('pt-BR') === position.toLocaleLowerCase('pt-BR'))) {
      return json(res, 409, { error: 'Esse cargo já está cadastrado.' });
    }
    db.positions = [...(Array.isArray(db.positions) ? db.positions : []), position];
    writeDb(db);
    return json(res, 201, { positions: getPositions(db) });
  }
  if (user.role === 'gestor' && req.method === 'PATCH' && pathname.startsWith('/api/access/')) {
    const id = pathname.split('/').pop(); const target = db.users.find(u => u.id === id && u.role === 'liderado');
    if (!target) return json(res, 404, { error: 'Conta nao encontrada.' });
    const data = await body(req);
    if (!['aprovado', 'reprovado'].includes(data.accessStatus)) return json(res, 400, { error: 'Status de acesso invalido.' });
    target.accessStatus = data.accessStatus; target.reviewedAt = new Date().toISOString(); target.reviewedBy = user.id;
    writeDb(db); return json(res, 200, { user: sanitizeUser(target) });
  }
  if (user.role === 'gestor' && req.method === 'DELETE' && pathname.startsWith('/api/users/')) {
    const id = pathname.split('/').pop();
    const target = db.users.find(u => u.id === id && u.role === 'liderado');
    if (!target) return json(res, 404, { error: 'Conta de colaborador nao encontrada.' });
    db.users = db.users.filter(u => u.id !== id);
    db.sessions = db.sessions.filter(s => s.userId !== id);
    db.punches = db.punches.filter(p => p.userId !== id);
    db.reports = db.reports.filter(r => r.userId !== id);
    db.justifications = (db.justifications || []).filter(j => j.userId !== id);
    db.resetTokens = (db.resetTokens || []).filter(t => t.email !== target.email);
    writeDb(db); return json(res, 200, { message: 'Conta excluida com sucesso.' });
  }
  if (user.role === 'liderado' && req.method === 'POST' && pathname === '/api/punch') {
    const { type } = await body(req); const allowed = ['entrada', 'almoco_saida', 'almoco_volta', 'saida'];
    if (!allowed.includes(type)) return json(res, 400, { error: 'Tipo de marcação inválido.' });
    if (type === 'saida' && !db.reports.some(r => r.userId === user.id && r.date === today())) return json(res, 400, { error: 'Preencha o relatório diário antes da saída final.' });
    const punch = { id: token().slice(0, 10), userId: user.id, date: today(), type, time: new Date().toISOString() }; db.punches.push(punch); writeDb(db); return json(res, 201, { punch });
  }
  if (user.role === 'liderado' && req.method === 'POST' && pathname === '/api/reports') {
    const data = await body(req); if (!data.activities || !data.tomorrow) return json(res, 400, { error: 'Responda às duas perguntas.' });
    const report = { id: token().slice(0, 10), userId: user.id, date: today(), activities: data.activities, tomorrow: data.tomorrow, status: 'pendente', createdAt: new Date().toISOString() }; db.reports = db.reports.filter(r => !(r.userId === user.id && r.date === today())); db.reports.push(report); writeDb(db); return json(res, 201, { report });
  }
  if (req.method === 'POST' && pathname === '/api/justifications') {
    const data = await body(req); if (!data.date || !data.reason) return json(res, 400, { error: 'Informe a data e o motivo da justificativa.' });
    db.justifications = db.justifications || [];
    const justification = { id: token().slice(0, 10), userId: user.id, date: data.date, reason: data.reason, status: 'pendente', createdAt: new Date().toISOString() };
    db.justifications.push(justification); writeDb(db); return json(res, 201, { justification });
  }
  if (user.role === 'gestor' && req.method === 'PATCH' && pathname.startsWith('/api/justifications/')) {
    const id = pathname.split('/').pop(); const data = await body(req); db.justifications = db.justifications || [];
    const justification = db.justifications.find(j => j.id === id); if (!justification) return json(res, 404, { error: 'Justificativa não encontrada.' });
    if (!['aprovada', 'recusada'].includes(data.status)) return json(res, 400, { error: 'Status inválido.' });
    justification.status = data.status; justification.reviewedAt = new Date().toISOString(); justification.reviewedBy = user.id; writeDb(db); return json(res, 200, { justification });
  }
  if (user.role === 'gestor' && req.method === 'PATCH' && pathname.startsWith('/api/reports/')) {
    const id = pathname.split('/').pop(); const data = await body(req); const report = db.reports.find(r => r.id === id);
    if (!report) return json(res, 404, { error: 'Relatorio nao encontrado.' });
    if (!['aprovado', 'pendente'].includes(data.status)) return json(res, 400, { error: 'Status invalido.' });
    report.status = data.status; report.reviewedAt = new Date().toISOString(); report.reviewedBy = user.id; writeDb(db); return json(res, 200, { report });
  }
  if (user.role === 'gestor' && req.method === 'POST' && pathname === '/api/users') {
    const data = await body(req); if (!data.name || !data.email || !data.cpf || !data.phone || !data.address || !data.cep) return json(res, 400, { error: 'Preencha todos os dados obrigatórios.' });
    const selectedPosition = data.position || 'Estagi\u00e1rio';
    if (!isValidPosition(selectedPosition) || !getPositions(db).includes(selectedPosition)) return json(res, 400, { error: 'Selecione um cargo cadastrado.' });
    const newUser = { id: `usr-${token().slice(0, 8)}`, ...data, role: 'liderado', position: selectedPosition, passwordHash: hashPassword('123456'), active: true, createdAt: new Date().toISOString() }; db.users.push(newUser); writeDb(db); return json(res, 201, { user: sanitizeUser(newUser) });
  }
  if (user.role === 'gestor' && req.method === 'PATCH' && pathname.startsWith('/api/users/')) {
    const id = pathname.split('/').pop();
    const target = db.users.find(account => account.id === id && account.role === 'liderado');
    if (!target) return json(res, 404, { error: 'Conta n\u00e3o encontrada.' });
    const { position } = await body(req);
    if (!isValidPosition(position) || !getPositions(db).includes(position)) return json(res, 400, { error: 'Selecione um cargo cadastrado.' });
    target.position = position;
    writeDb(db);
    return json(res, 200, { user: sanitizeUser(target) });
  }
  return json(res, 404, { error: 'Rota não encontrada.' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try { if (url.pathname === '/') { res.writeHead(302, { Location: '/frontend/index.html' }); return res.end(); } if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname); const file = url.pathname.slice(1); const full = path.join(ROOT, file); if (!full.startsWith(ROOT) || !fs.existsSync(full)) return json(res, 404, { error: 'Não encontrado.' }); res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'text/plain' }); fs.createReadStream(full).pipe(res); } catch (e) { console.error(e); json(res, 500, { error: 'Erro interno.' }); }
});
server.listen(PORT, () => console.log(`TAG Servicos de Torno e Solda Ltda - Sistema de Ponto em http://localhost:${PORT}`));
