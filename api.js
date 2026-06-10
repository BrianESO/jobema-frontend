/* ============================================================
   api.js — camada de comunicação com o back-end Jobema
   Ajuste BASE_URL conforme seu ambiente
   ============================================================ */

const BASE_URL = 'http://localhost:3000';

// ---------- helpers ----------

function getToken() {
  return localStorage.getItem('jobema_token');
}

function setToken(token) {
  localStorage.setItem('jobema_token', token);
}

function clearToken() {
  localStorage.removeItem('jobema_token');
  localStorage.removeItem('jobema_user');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: authHeaders(),
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Erro ${res.status}`);
  }

  return data;
}

// ---------- Auth ----------

const api = {
  auth: {
    login: (login, senha) =>
      fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');
        return data;
      }),
  },

  // ---------- Clientes ----------
  clientes: {
    list:   ()         => request('GET',    '/clientes'),
    get:    (id)       => request('GET',    `/clientes/${id}`),
    create: (body)     => request('POST',   '/clientes', body),
    update: (id, body) => request('PUT',    `/clientes/${id}`, body),
    remove: (id)       => request('DELETE', `/clientes/${id}`),
  },

  // ---------- Caminhões ----------
  caminhoes: {
    list:   ()         => request('GET',    '/caminhoes'),
    get:    (id)       => request('GET',    `/caminhoes/${id}`),
    create: (body)     => request('POST',   '/caminhoes', body),
    update: (id, body) => request('PUT',    `/caminhoes/${id}`, body),
    remove: (id)       => request('DELETE', `/caminhoes/${id}`),
  },

  // ---------- Operações ----------
  operacoes: {
    list:   ()         => request('GET',    '/operacoes'),
    get:    (id)       => request('GET',    `/operacoes/${id}`),
    create: (body)     => request('POST',   '/operacoes', body),
    update: (id, body) => request('PUT',    `/operacoes/${id}`, body),
    remove: (id)       => request('DELETE', `/operacoes/${id}`),
  },

  // ---------- Vales ----------
  vales: {
    list:   ()         => request('GET',    '/vales'),
    get:    (id)       => request('GET',    `/vales/${id}`),
    create: (body)     => request('POST',   '/vales', body),
    update: (id, body) => request('PUT',    `/vales/${id}`, body),
    remove: (id)       => request('DELETE', `/vales/${id}`),
  },

  // ---------- Fechamentos ----------
  fechamentos: {
    list:   ()   => request('GET',  '/fechamentos'),
    get:    (id) => request('GET',  `/fechamentos/${id}`),
    gerar:  ()   => request('POST', '/fechamentos/gerar'),
  },

  // ---------- Usuários ----------
  usuarios: {
    list:   ()         => request('GET',    '/usuarios'),
    get:    (id)       => request('GET',    `/usuarios/${id}`),
    create: (body)     => request('POST',   '/usuarios', body),
    update: (id, body) => request('PUT',    `/usuarios/${id}`, body),
    remove: (id)       => request('DELETE', `/usuarios/${id}`),
  },
};
