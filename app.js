/* ============================================================
   app.js — Jobema Frontend v2
   Novidades: modalidade cliente, histórico por cliente,
   vale imprimível, usuário logado auto-preenchido,
   exportar fechamento PDF
   ============================================================ */

// ============================================================
// ESTADO GLOBAL
// ============================================================
let _clientes = [];
let _caminhoes = [];
let _usuarios = [];
let _operacoes = [];
let _vales = [];
let _currentUser = null;

const MESES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ============================================================
// UTILITÁRIOS
// ============================================================

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  const icon = type === "success" ? "✓" : "✕";
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.className = `toast ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.className = "toast hidden";
  }, 3500);
}

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return d.toLocaleDateString("pt-BR");
}

function fmtDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  return (
    d.toLocaleDateString("pt-BR") +
    " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function fmtMoney(val) {
  if (val === null || val === undefined || val === "") return "—";
  return Number(val).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDateInput(val) {
  if (!val) return "";
  return val.slice(0, 10);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function setTbody(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function emptyRow(cols, msg = "Nenhum registro encontrado.") {
  return `<tr><td colspan="${cols}" class="empty">${msg}</td></tr>`;
}

// ============================================================
// LOOKUPS
// ============================================================

function clienteNome(id) {
  const c = _clientes.find((x) => x.id_cliente == id);
  return c ? c.nome : `#${id}`;
}

function caminhaoPlaca(id) {
  const c = _caminhoes.find((x) => x.id_caminhao == id);
  return c ? c.placa : `#${id}`;
}

function usuarioNome(id) {
  const u = _usuarios.find((x) => x.id_usuario == id);
  return u ? u.nome : `#${id}`;
}

function valeDeOperacao(idOp) {
  return _vales.find((v) => v.id_operacao == idOp);
}

// ============================================================
// AUTH
// ============================================================

function showLogin() {
  document.getElementById("page-login").classList.add("active");
  document.getElementById("page-app").classList.remove("active");
}

function showApp(user) {
  _currentUser = user;
  document.getElementById("page-login").classList.remove("active");
  document.getElementById("page-app").classList.add("active");

  const nome = user?.nome || user?.login || "—";
  document.getElementById("user-label").textContent = nome;
  document.getElementById("user-role").textContent = user?.perfil || "";
  document.getElementById("user-avatar").textContent = nome
    .charAt(0)
    .toUpperCase();

  navigateTo("dashboard");
}

document.getElementById("btn-login").addEventListener("click", async () => {
  const login = document.getElementById("login-user").value.trim();
  const senha = document.getElementById("login-pass").value;
  const err = document.getElementById("login-error");
  err.classList.add("hidden");

  if (!login || !senha) {
    err.textContent = "Preencha login e senha.";
    err.classList.remove("hidden");
    return;
  }

  try {
    const data = await api.auth.login(login, senha);
    setToken(data.data?.token || data.token);
    const user = data.data?.usuario || data.usuario || { login };
    localStorage.setItem("jobema_user", JSON.stringify(user));
    showApp(user);
  } catch (e) {
    err.textContent = e.message || "Login ou senha incorretos.";
    err.classList.remove("hidden");
  }
});

document.getElementById("login-pass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-login").click();
});

document.getElementById("btn-logout").addEventListener("click", () => {
  clearToken();
  _currentUser = null;
  showLogin();
});

// ============================================================
// NAVEGAÇÃO
// ============================================================

function navigateTo(mod) {
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".module")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelector(`.nav-item[data-module="${mod}"]`)
    ?.classList.add("active");
  document.getElementById(`mod-${mod}`)?.classList.add("active");

  const loaders = {
    dashboard: loadDashboard,
    clientes: loadClientes,
    caminhoes: loadCaminhoes,
    operacoes: loadOperacoes,
    vales: loadVales,
    historico: initHistorico,
    fechamentos: loadFechamentos,
    usuarios: loadUsuarios,
  };
  loaders[mod]?.();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.module));
});

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  try {
    const [cl, ca, op, va] = await Promise.all([
      api.clientes.list(),
      api.caminhoes.list(),
      api.operacoes.list(),
      api.vales.list(),
    ]);

    _clientes = cl.data || [];
    _caminhoes = ca.data || [];
    _operacoes = op.data || [];
    _vales = va.data || [];

    document.getElementById("stat-clientes").textContent = _clientes.length;
    document.getElementById("stat-caminhoes").textContent = _caminhoes.length;
    document.getElementById("stat-operacoes").textContent = _operacoes.length;
    document.getElementById("stat-vales").textContent = _vales.length;

    const recent = [..._operacoes].reverse().slice(0, 10);
    const rows = recent
      .map(
        (op) => `
      <tr>
        <td><code>${op.id_operacao}</code></td>
        <td><span class="badge badge-${op.tipo?.toLowerCase()}">${op.tipo}</span></td>
        <td>${clienteNome(op.id_cliente)}</td>
        <td>${caminhaoPlaca(op.id_caminhao)}</td>
        <td>${Number(op.quantidade).toLocaleString("pt-BR")} m³</td>
        <td>${fmtMoney(op.valor)}</td>
        <td>${fmtDate(op.data_operacao)}</td>
      </tr>`,
      )
      .join("");

    setTbody("dash-op-body", rows || emptyRow(7));
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// CLIENTES
// ============================================================

async function loadClientes() {
  try {
    const res = await api.clientes.list();
    _clientes = res.data || [];
    const rows = _clientes
      .map(
        (c) => `
      <tr>
        <td><code>${c.id_cliente}</code></td>
        <td><strong>${c.nome}</strong></td>
        <td>${modalidadeBadge(c.modalidade)}</td>
        <td>${c.telefone || "—"}</td>
        <td>${c.endereco || "—"}</td>
        <td>${fmtDate(c.criado_em)}</td>
        <td><div class="actions">
          <button class="btn-icon" onclick="editCliente(${c.id_cliente})">Editar</button>
          <button class="btn-icon danger" onclick="deleteCliente(${c.id_cliente})">Excluir</button>
        </div></td>
      </tr>`,
      )
      .join("");
    setTbody("clientes-body", rows || emptyRow(7));
  } catch (e) {
    showToast(e.message, "error");
  }
}

function modalidadeBadge(m) {
  if (!m) return "—";
  const map = {
    ENTREGA: "badge-entrega",
    RETIRADA: "badge-retirada",
    AMBAS: "badge-ambas",
  };
  return `<span class="badge ${map[m] || ""}">${m}</span>`;
}

function resetClienteForm() {
  document.getElementById("cliente-id").value = "";
  document.getElementById("cliente-nome").value = "";
  document.getElementById("cliente-modalidade").value = "";
  document.getElementById("cliente-preco-m3").value = "";
  document.getElementById("cliente-telefone").value = "";
  document.getElementById("cliente-endereco").value = "";
  document.getElementById("modal-cliente-title").textContent = "Novo Cliente";
}

document
  .getElementById("btn-save-cliente")
  .addEventListener("click", async () => {
    const id = document.getElementById("cliente-id").value;
    const nome = document.getElementById("cliente-nome").value.trim();
    if (!nome) {
      showToast("Nome é obrigatório.", "error");
      return;
    }

    const body = {
      nome,
      modalidade: document.getElementById("cliente-modalidade").value || null,
      preco_m3:
        parseFloat(document.getElementById("cliente-preco-m3").value) || null,
      telefone:
        document.getElementById("cliente-telefone").value.trim() || null,
      endereco:
        document.getElementById("cliente-endereco").value.trim() || null,
    };
    try {
      if (id) {
        await api.clientes.update(id, body);
        showToast("Cliente atualizado!");
      } else {
        await api.clientes.create(body);
        showToast("Cliente cadastrado!");
      }
      closeModal("modal-cliente");
      loadClientes();
    } catch (e) {
      showToast(e.message, "error");
    }
  });

async function editCliente(id) {
  try {
    const res = await api.clientes.get(id);
    const c = res.data;
    document.getElementById("cliente-id").value = c.id_cliente;
    document.getElementById("cliente-nome").value = c.nome || "";
    document.getElementById("cliente-modalidade").value = c.modalidade || "";
    document.getElementById("cliente-preco-m3").value = c.preco_m3 || "";
    document.getElementById("cliente-telefone").value = c.telefone || "";
    document.getElementById("cliente-endereco").value = c.endereco || "";
    document.getElementById("modal-cliente-title").textContent =
      "Editar Cliente";
    openModal("modal-cliente");
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function deleteCliente(id) {
  if (!confirm("Excluir este cliente? Esta ação não pode ser desfeita."))
    return;
  try {
    await api.clientes.remove(id);
    showToast("Cliente excluído.");
    loadClientes();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// CAMINHÕES
// ============================================================

async function loadCaminhoes() {
  try {
    const res = await api.caminhoes.list();
    _caminhoes = res.data || [];
    const rows = _caminhoes
      .map(
        (c) => `
      <tr>
        <td><code>${c.id_caminhao}</code></td>
        <td><strong>${c.placa}</strong></td>
        <td>${c.motorista || "—"}</td>
        <td>${c.ano || "—"}</td>
        <td>${c.capacidade_litros ? Number(c.capacidade_litros).toLocaleString("pt-BR") + " m³" : "—"}</td>
        <td><div class="actions">
          <button class="btn-icon" onclick="editCaminhao(${c.id_caminhao})">Editar</button>
          <button class="btn-icon danger" onclick="deleteCaminhao(${c.id_caminhao})">Excluir</button>
        </div></td>
      </tr>`,
      )
      .join("");
    setTbody("caminhoes-body", rows || emptyRow(6));
  } catch (e) {
    showToast(e.message, "error");
  }
}

function resetCaminhaoForm() {
  [
    "caminhao-id",
    "caminhao-placa",
    "caminhao-motorista",
    "caminhao-ano",
    "caminhao-capacidade-litros",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("modal-caminhao-title").textContent = "Novo Caminhão";
}

document
  .getElementById("btn-save-caminhao")
  .addEventListener("click", async () => {
    const id = document.getElementById("caminhao-id").value;
    const placa = document
      .getElementById("caminhao-placa")
      .value.trim()
      .toUpperCase();
    if (!placa) {
      showToast("Placa é obrigatória.", "error");
      return;
    }

    const body = {
      placa,
      motorista:
        document.getElementById("caminhao-motorista").value.trim() || null,
      ano: document.getElementById("caminhao-ano").value
        ? parseInt(document.getElementById("caminhao-ano").value)
        : null,
      capacidade_litros:
        Number(document.getElementById("caminhao-capacidade-litros").value) ||
        null,
    };
    try {
      if (id) {
        await api.caminhoes.update(id, body);
        showToast("Caminhão atualizado!");
      } else {
        await api.caminhoes.create(body);
        showToast("Caminhão cadastrado!");
      }
      closeModal("modal-caminhao");
      loadCaminhoes();
    } catch (e) {
      showToast(e.message, "error");
    }
  });

async function editCaminhao(id) {
  try {
    const res = await api.caminhoes.get(id);
    const c = res.data;
    document.getElementById("caminhao-id").value = c.id_caminhao;
    document.getElementById("caminhao-placa").value = c.placa || "";
    document.getElementById("caminhao-motorista").value = c.motorista || "";
    document.getElementById("caminhao-ano").value = c.ano || "";
    document.getElementById("caminhao-capacidade-litros").value =
      c.capacidade_litros || "";
    document.getElementById("modal-caminhao-title").textContent =
      "Editar Caminhão";
    openModal("modal-caminhao");
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function deleteCaminhao(id) {
  if (!confirm("Excluir este caminhão?")) return;
  try {
    await api.caminhoes.remove(id);
    showToast("Caminhão excluído.");
    loadCaminhoes();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// OPERAÇÕES
// ============================================================

async function loadOperacoes() {
  try {
    const [opRes, clRes, caRes, usRes, vaRes] = await Promise.all([
      api.operacoes.list(),
      api.clientes.list(),
      api.caminhoes.list(),
      api.usuarios.listForSelect(),
      api.vales.list(),
    ]);
    _operacoes = opRes.data || [];
    _clientes = clRes.data || [];
    _caminhoes = caRes.data || [];
    _usuarios = usRes.data || [];
    _vales = vaRes.data || [];

    const rows = _operacoes
      .map((op) => {
        const temVale = valeDeOperacao(op.id_operacao);
        return `
      <tr>
        <td><code>${op.id_operacao}</code></td>
        <td><span class="badge badge-${op.tipo?.toLowerCase()}">${op.tipo}</span></td>
        <td>${clienteNome(op.id_cliente)}</td>
        <td>${caminhaoPlaca(op.id_caminhao)}</td>
        <td>${usuarioNome(op.id_usuario)}</td>
        <td>${Number(op.quantidade).toLocaleString("pt-BR")} m³</td>
        <td>${fmtMoney(op.valor)}</td>
        <td>${fmtDate(op.data_operacao)}</td>
        <td>${op.observacao ? `<span title="${op.observacao}">💬</span>` : "—"}</td>
        <td><div class="actions">
          <button class="btn-icon" onclick="editOperacao(${op.id_operacao})">Editar</button>
          ${!temVale ? `<button class="btn-icon success" onclick="criarValeRapido(${op.id_operacao},${op.valor})">Vale</button>` : ""}
          <button class="btn-icon danger" onclick="deleteOperacao(${op.id_operacao})">Excluir</button>
        </div></td>
      </tr>`;
      })
      .join("");

    setTbody("operacoes-body", rows || emptyRow(10));
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function populateOperacaoSelects(
  selectedCliente,
  selectedCaminhao,
  selectedUsuario,
) {
  if (_clientes.length === 0)
    _clientes = (await api.clientes.list()).data || [];
  if (_caminhoes.length === 0)
    _caminhoes = (await api.caminhoes.list()).data || [];
  if (_usuarios.length === 0)
    _usuarios = (await api.usuarios.listForSelect()).data || [];

  document.getElementById("operacao-cliente").innerHTML =
    '<option value="">Selecione o cliente...</option>' +
    _clientes
      .map(
        (c) =>
          `<option value="${c.id_cliente}" ${c.id_cliente == selectedCliente ? "selected" : ""}>${c.nome}</option>`,
      )
      .join("");

  document.getElementById("operacao-caminhao").innerHTML =
    '<option value="">Selecione o caminhão...</option>' +
    _caminhoes
      .map(
        (c) =>
          `<option value="${c.id_caminhao}" ${c.id_caminhao == selectedCaminhao ? "selected" : ""}>${c.placa}${c.motorista ? " — " + c.motorista : ""}</option>`,
      )
      .join("");

  document.getElementById("operacao-usuario").innerHTML = _usuarios
    .map(
      (u) =>
        `<option value="${u.id_usuario}" ${u.id_usuario == selectedUsuario ? "selected" : ""}>${u.nome}</option>`,
    )
    .join("");
}

function resetOperacaoForm() {
  document.getElementById("operacao-id").value = "";
  document.getElementById("operacao-tipo").value = "";
  document.getElementById("operacao-quantidade").value = "";
  document.getElementById("operacao-valor").value = "";
  document.getElementById("operacao-observacao").value = "";
  document.getElementById("modal-operacao-title").textContent = "Nova Operação";

  // Auto-preencher usuário logado (US03 CA02)
  const currentId = _currentUser?.id_usuario;
  populateOperacaoSelects(null, null, currentId);
}

function calcularValorOperacao() {
  const idCliente = document.getElementById("operacao-cliente").value;
  const quantidade =
    parseFloat(document.getElementById("operacao-quantidade").value) || 0;

  const cliente = _clientes.find((c) => c.id_cliente == idCliente);

  if (cliente && cliente.preco_m3 && quantidade > 0) {
    const valor = (quantidade * parseFloat(cliente.preco_m3)).toFixed(2);
    document.getElementById("operacao-valor").value = valor;
  }
}

document
  .getElementById("btn-save-operacao")
  .addEventListener("click", async () => {
    const id = document.getElementById("operacao-id").value;
    const body = {
      id_cliente: Number(document.getElementById("operacao-cliente").value),
      id_caminhao: Number(document.getElementById("operacao-caminhao").value),
      id_usuario: Number(document.getElementById("operacao-usuario").value),
      tipo: document.getElementById("operacao-tipo").value,
      quantidade: Number(document.getElementById("operacao-quantidade").value),
      valor: Number(document.getElementById("operacao-valor").value),
      observacao:
        document.getElementById("operacao-observacao").value.trim() || null,
    };

    if (
      !body.id_cliente ||
      !body.id_caminhao ||
      !body.id_usuario ||
      !body.tipo ||
      !body.quantidade ||
      !body.valor
    ) {
      showToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {
      if (id) {
        await api.operacoes.update(id, body);
        showToast("Operação atualizada!");
      } else {
        await api.operacoes.create(body);
        showToast("Operação registrada e vale gerado!");
        const res = await api.operacoes.create(body);
        const novaOp = res.data;
        await api.vales.create({
          id_operacao: novaOp.id_operacao,
          valor: novaOp.valor,
          pago: false,
          data_pagamento: null,
        });
        showToast("Operação registrada e vale gerado!");
      }
      closeModal("modal-operacao");
      loadOperacoes();
    } catch (e) {
      showToast(e.message, "error");
    }
  });
async function editOperacao(id) {
  try {
    const res = await api.operacoes.get(id);
    const op = res.data;
    await populateOperacaoSelects(op.id_cliente, op.id_caminhao, op.id_usuario);
    document.getElementById("operacao-id").value = op.id_operacao;
    document.getElementById("operacao-tipo").value = op.tipo;
    document.getElementById("operacao-quantidade").value = op.quantidade;
    document.getElementById("operacao-valor").value = op.valor;
    document.getElementById("operacao-observacao").value = op.observacao || "";
    document.getElementById("modal-operacao-title").textContent =
      "Editar Operação";
    openModal("modal-operacao");
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function deleteOperacao(id) {
  if (
    !confirm(
      "Excluir esta operação? Se houver vale vinculado, exclua-o primeiro.",
    )
  )
    return;
  try {
    await api.operacoes.remove(id);
    showToast("Operação excluída.");
    loadOperacoes();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// Criar vale rapidamente a partir da listagem de operações
async function criarValeRapido(idOperacao, valorOp) {
  await resetValeForm();
  document.getElementById("vale-operacao").value = idOperacao;
  document.getElementById("vale-valor").value = valorOp;
  document.getElementById("modal-vale-title").textContent = "Novo Vale";
  openModal("modal-vale");
}

// ============================================================
// VALES
// ============================================================

async function loadVales() {
  try {
    const [vaRes, opRes, clRes] = await Promise.all([
      api.vales.list(),
      api.operacoes.list(),
      api.clientes.list(),
    ]);
    _vales = vaRes.data || [];
    _operacoes = opRes.data || [];
    _clientes = clRes.data || [];

    const rows = _vales
      .map((v) => {
        const op = _operacoes.find((o) => o.id_operacao == v.id_operacao);
        const cl = op ? clienteNome(op.id_cliente) : "—";
        return `
      <tr>
        <td><code>${v.id_vale}</code></td>
        <td><code>#${v.id_operacao}</code></td>
        <td>${cl}</td>
        <td><strong>${fmtMoney(v.valor)}</strong></td>
        <td>${fmtDate(v.data_emissao)}</td>
        <td><span class="badge ${v.pago ? "badge-pago" : "badge-pendente"}">${v.pago ? "✓ Pago" : "⏳ Pendente"}</span></td>
        <td>${fmtDate(v.data_pagamento)}</td>
        <td><div class="actions">
          <button class="btn-icon" onclick="imprimirVale(${v.id_vale})">🖨 Imprimir</button>
          <button class="btn-icon" onclick="editVale(${v.id_vale})">Editar</button>
          <button class="btn-icon danger" onclick="deleteVale(${v.id_vale})">Excluir</button>
        </div></td>
      </tr>`;
      })
      .join("");
    setTbody("vales-body", rows || emptyRow(8));
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function populateValeSelects(selectedOp) {
  if (_operacoes.length === 0)
    _operacoes = (await api.operacoes.list()).data || [];
  if (_clientes.length === 0)
    _clientes = (await api.clientes.list()).data || [];

  document.getElementById("vale-operacao").innerHTML =
    '<option value="">Selecione a operação...</option>' +
    _operacoes
      .map((op) => {
        const cl = clienteNome(op.id_cliente);
        return `<option value="${op.id_operacao}" ${op.id_operacao == selectedOp ? "selected" : ""}>#${op.id_operacao} — ${op.tipo} — ${cl} — ${fmtMoney(op.valor)}</option>`;
      })
      .join("");
}
function preencherValorVale() {
  const idOp = document.getElementById("vale-operacao").value;
  const op = _operacoes.find((o) => o.id_operacao == idOp);
  if (op) {
    document.getElementById("vale-valor").value = op.valor;
  }
}

async function resetValeForm() {
  document.getElementById("vale-id").value = "";
  document.getElementById("vale-valor").value = "";
  document.getElementById("vale-pago").value = "false";
  document.getElementById("vale-data-pagamento").value = "";
  document.getElementById("modal-vale-title").textContent = "Novo Vale";
  await populateValeSelects(null);
}

document.getElementById("btn-save-vale").addEventListener("click", async () => {
  const id = document.getElementById("vale-id").value;
  const idOp = document.getElementById("vale-operacao").value;
  const valor = document.getElementById("vale-valor").value;
  if (!idOp || !valor) {
    showToast("Operação e valor são obrigatórios.", "error");
    return;
  }

  const pago = document.getElementById("vale-pago").value === "true";
  const body = {
    id_operacao: Number(idOp),
    valor: Number(valor),
    pago,
    data_pagamento:
      document.getElementById("vale-data-pagamento").value || null,
  };
  try {
    if (id) {
      await api.vales.update(id, body);
      showToast("Vale atualizado!");
    } else {
      await api.vales.create(body);
      showToast("Vale emitido!");
    }
    closeModal("modal-vale");
    loadVales();
  } catch (e) {
    showToast(e.message, "error");
  }
});

async function editVale(id) {
  try {
    const res = await api.vales.get(id);
    const v = res.data;
    await populateValeSelects(v.id_operacao);
    document.getElementById("vale-id").value = v.id_vale;
    document.getElementById("vale-valor").value = v.valor;
    document.getElementById("vale-pago").value = String(v.pago);
    document.getElementById("vale-data-pagamento").value = fmtDateInput(
      v.data_pagamento,
    );
    document.getElementById("modal-vale-title").textContent = "Editar Vale";
    openModal("modal-vale");
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function deleteVale(id) {
  if (!confirm("Excluir este vale?")) return;
  try {
    await api.vales.remove(id);
    showToast("Vale excluído.");
    loadVales();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// VALE IMPRIMÍVEL (US04 CA03 / CA04)
// ============================================================

async function imprimirVale(id) {
  try {
    const vaRes = await api.vales.get(id);
    const v = vaRes.data;

    if (_operacoes.length === 0)
      _operacoes = (await api.operacoes.list()).data || [];
    if (_clientes.length === 0)
      _clientes = (await api.clientes.list()).data || [];
    if (_caminhoes.length === 0)
      _caminhoes = (await api.caminhoes.list()).data || [];

    if (_usuarios.length === 0)
      _usuarios = (await api.usuarios.listForSelect()).data || [];

    const op = _operacoes.find((o) => o.id_operacao == v.id_operacao);
    const nCl = op ? clienteNome(op.id_cliente) : "—";
    const placa = op ? caminhaoPlaca(op.id_caminhao) : "—";
    const resp = op ? usuarioNome(op.id_usuario) : "—";

    document.getElementById("vale-print-area").innerHTML = `
      <div class="vale-print-header">
        <div class="vale-print-brand">
          <svg width="42" height="42" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="8" fill="#1565C0"/>
            <path d="M10 28 C10 20 16 14 22 14 C28 14 34 20 34 28" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/>
            <path d="M14 28 C14 22 17.5 18 22 18 C26.5 18 30 22 30 28" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <rect x="18" y="28" width="8" height="5" rx="2" fill="white"/>
          </svg>
          <div>
            <div class="vale-print-brand-name">Jobema</div>
            <div class="vale-print-brand-sub">Distribuidora de Água Ltda<br>Rua Pedro Stancato, 1084 — Campo dos Amarais — Campinas SP<br>Fone: (19) 3246-1750</div>
          </div>
        </div>
        <div class="vale-print-number">
          <div class="title">FORNECIMENTO DE ÁGUA</div>
          <div class="num">Nº ${String(v.id_vale).padStart(5, "0")}</div>
        </div>
      </div>
      <div class="vale-print-body">
        <div class="vale-print-field">
          <label>Cliente</label>
          <span>${nCl}</span>
        </div>
        <div class="vale-print-field">
          <label>Tipo de Serviço</label>
          <span>${op?.tipo || "—"}</span>
        </div>
        <div class="vale-print-field">
          <label>Quantidade</label>
          <span>${op ? Number(op.quantidade).toLocaleString("pt-BR") + " m³." : "—"}</span>
        </div>
        <div class="vale-print-field">
          <label>Placa do Caminhão</label>
          <span>${placa}</span>
        </div>
        <div class="vale-print-field">
          <label>Data</label>
          <span>${fmtDateTime(op?.data_operacao)}</span>
        </div>
        <div class="vale-print-field">
          <label>Valor</label>
          <span>${fmtMoney(v.valor)}</span>
        </div>
        <div class="vale-print-field">
          <label>Responsável</label>
          <span>${resp}</span>
        </div>
        <div class="vale-print-field">
          <label>Status</label>
          <span>${v.pago ? "PAGO" : "PENDENTE"}</span>
        </div>
      </div>
      <div class="vale-print-footer">
        <div class="assinatura">Ass. ________________________</div>
        <div class="vale-print-contact">
          (19) 3246-1750<br>
          Campinas, SP
        </div>
      </div>
    `;
    openModal("modal-vale-print");
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// HISTÓRICO POR CLIENTE (US05)
// ============================================================

async function initHistorico() {
  // Preencher select de clientes
  if (_clientes.length === 0) {
    const res = await api.clientes.list();
    _clientes = res.data || [];
  }
  const sel = document.getElementById("hist-cliente");
  sel.innerHTML =
    '<option value="">Selecione o cliente...</option>' +
    _clientes
      .map((c) => `<option value="${c.id_cliente}">${c.nome}</option>`)
      .join("");

  // Datas padrão: mês atual
  const hoje = new Date();
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  document.getElementById("hist-data-ini").value = ini
    .toISOString()
    .slice(0, 10);
  document.getElementById("hist-data-fim").value = hoje
    .toISOString()
    .slice(0, 10);

  document.getElementById("hist-resultado").style.display = "none";
}

document
  .getElementById("btn-buscar-historico")
  .addEventListener("click", async () => {
    const idCliente = document.getElementById("hist-cliente").value;
    const dataIni = document.getElementById("hist-data-ini").value;
    const dataFim = document.getElementById("hist-data-fim").value;

    if (!idCliente) {
      showToast("Selecione um cliente.", "error");
      return;
    }

    try {
      if (_operacoes.length === 0)
        _operacoes = (await api.operacoes.list()).data || [];
      if (_vales.length === 0) _vales = (await api.vales.list()).data || [];
      if (_usuarios.length === 0)
        _usuarios = (await api.usuarios.listForSelect()).data || [];

      // filtrar por cliente e período
      let ops = _operacoes.filter((op) => op.id_cliente == idCliente);

      if (dataIni) ops = ops.filter((op) => op.data_operacao >= dataIni);
      if (dataFim)
        ops = ops.filter((op) => op.data_operacao <= dataFim + "T23:59:59");

      // ordenar mais recentes primeiro (US05 CA04)
      ops = ops.sort(
        (a, b) => new Date(b.data_operacao) - new Date(a.data_operacao),
      );

      const cl = clienteNome(idCliente);
      document.getElementById("hist-titulo").textContent =
        `${cl} — ${dataIni ? fmtDate(dataIni) : "início"} até ${dataFim ? fmtDate(dataFim) : "hoje"}`;
      const totalValor = ops.reduce(
        (acc, op) => acc + Number(op.valor || 0),
        0,
      );

      document.getElementById("hist-titulo").textContent =
        `${cl} — ${dataIni ? fmtDate(dataIni) : "início"} até ${dataFim ? fmtDate(dataFim) : "hoje"}`;
      document.getElementById("hist-total").textContent =
        `${ops.length} operação(ões) · Total: ${fmtMoney(totalValor)}`;

      const rows = ops
        .map((op) => {
          const vale = valeDeOperacao(op.id_operacao);
          return `
        <tr>
          <td><code>${op.id_operacao}</code></td>
          <td><span class="badge badge-${op.tipo?.toLowerCase()}">${op.tipo}</span></td>
          <td>${Number(op.quantidade).toLocaleString("pt-BR")} m³</td>
          <td>${fmtMoney(op.valor)}</td>
          <td>${fmtDate(op.data_operacao)}</td>
          <td>${usuarioNome(op.id_usuario)}</td>
          <td>${op.observacao || "—"}</td>
          <td>${vale ? `<button class="btn-icon" onclick="imprimirVale(${vale.id_vale})">🖨 #${vale.id_vale}</button>` : "—"}</td>
        </tr>`;
        })
        .join("");

      setTbody(
        "hist-body",
        rows || emptyRow(8, "Nenhuma operação encontrada para este período."),
      );
      document.getElementById("hist-resultado").style.display = "block";
    } catch (e) {
      showToast(e.message, "error");
    }
  });

// ============================================================
// FECHAMENTOS (US06 / US07)
// ============================================================

async function loadFechamentos() {
  try {
    const res = await api.fechamentos.list();
    const fechamentos = res.data || [];

    if (_clientes.length === 0) {
      _clientes = (await api.clientes.list()).data || [];
    }

    const rows = fechamentos
      .map(
        (f) => `
      <tr>
        <td><code>${f.id_fechamento}</code></td>
        <td>${clienteNome(f.id_cliente)}</td>
        <td>${MESES[f.mes] || f.mes} / ${f.ano}</td>
        <td>${f.total_operacoes}</td>
        <td>${Number(f.total_quantidade).toLocaleString("pt-BR")} m³</td>
        <td>${fmtMoney(f.total_valor)}</td>
        <td>${fmtDate(f.gerado_em)}</td>
        <td><div class="actions">
          <button class="btn-icon success" onclick="exportarFechamentoPDF(${f.id_fechamento})">📄 PDF</button>
        </div></td>
      </tr>`,
      )
      .join("");
    setTbody("fechamentos-body", rows || emptyRow(8));
  } catch (e) {
    showToast(e.message, "error");
  }
}

document
  .getElementById("btn-gerar-fechamento")
  .addEventListener("click", async () => {
    if (
      !confirm(
        "Gerar/atualizar fechamento mensal com base em todas as operações registradas?",
      )
    )
      return;
    try {
      await api.fechamentos.gerar();
      showToast("Fechamento gerado com sucesso!");
      loadFechamentos();
    } catch (e) {
      showToast(e.message, "error");
    }
  });

// Exportar fechamento como PDF usando a janela de impressão (RF11, US07)
async function exportarFechamentoPDF(id) {
  try {
    if (_operacoes.length === 0)
      _operacoes = (await api.operacoes.list()).data || [];
    if (_clientes.length === 0)
      _clientes = (await api.clientes.list()).data || [];
    if (_vales.length === 0) _vales = (await api.vales.list()).data || [];

    const res = await api.fechamentos.get(id);
    const f = res.data;
    const cl = clienteNome(f.id_cliente);

    // operações do cliente neste mês/ano
    const opsDoMes = _operacoes.filter((op) => {
      if (op.id_cliente != f.id_cliente) return false;
      const d = new Date(op.data_operacao);
      return d.getMonth() + 1 === f.mes && d.getFullYear() === f.ano;
    });

    const linhas = opsDoMes
      .map((op) => {
        const vale = valeDeOperacao(op.id_operacao);
        return `<tr>
        <td>${fmtDate(op.data_operacao)}</td>
        <td>${op.tipo}</td>
        <td>${Number(op.quantidade).toLocaleString("pt-BR")} m³</td>
        <td>${fmtMoney(op.valor)}</td>
        <td>${vale ? `Vale #${vale.id_vale}` : "—"}</td>
      </tr>`;
      })
      .join("");

    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <title>Fechamento ${MESES[f.mes]}/${f.ano} — ${cl}</title>
        <style>
          body { font-family: Barlow, Arial, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 22px; color: #1565C0; }
          h2 { font-size: 15px; color: #444; font-weight: normal; margin-top: 4px; }
          .info { display: flex; gap: 40px; margin: 24px 0; border-top: 2px solid #1565C0; padding-top: 16px; }
          .info div { flex:1; }
          .info label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1px; display: block; margin-bottom: 2px; }
          .info span { font-size: 18px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #1565C0; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          tr:nth-child(even) td { background: #f4f6f9; }
          .footer { margin-top: 32px; font-size: 12px; color: #888; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Jobema — Fechamento Mensal</h1>
        <h2>${cl} — ${MESES[f.mes]} de ${f.ano}</h2>
        <div class="info">
          <div><label>Total de operações</label><span>${f.total_operacoes}</span></div>
          <div><label>Total fornecido</label><span>${Number(f.total_quantidade).toLocaleString("pt-BR")} L</span></div><div><label>Total a receber</label><span>${fmtMoney(f.total_valor)}</span></div>
          <div><label>Gerado em</label><span>${fmtDate(f.gerado_em)}</span></div>
        </div>
        <table>
          <thead><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Valor</th><th>Vale</th></tr></thead>
          <tbody>${linhas || '<tr><td colspan="5" style="text-align:center;color:#888">Nenhuma operação</td></tr>'}</tbody>
        </table>
        <div class="footer">
          Jobema Distribuidora de Água Ltda · Rua Pedro Stancato, 1084 · Campinas SP · (19) 3246-1750
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// USUÁRIOS
// ============================================================

async function loadUsuarios() {
  try {
    const res = await api.usuarios.list();
    _usuarios = res.data || [];
    const rows = _usuarios
      .map(
        (u) => `
      <tr>
        <td><code>${u.id_usuario}</code></td>
        <td>${u.nome}</td>
        <td>${u.login}</td>
        <td><span class="badge ${u.perfil === "admin" ? "badge-admin" : "badge-operador"}">${u.perfil === "admin" ? "Administrador" : "Operador"}</span></td>
        <td><div class="actions">
          <button class="btn-icon" onclick="editUsuario(${u.id_usuario})">Editar</button>
          <button class="btn-icon danger" onclick="deleteUsuario(${u.id_usuario})">Excluir</button>
        </div></td>
      </tr>`,
      )
      .join("");
    setTbody("usuarios-body", rows || emptyRow(5));
  } catch (e) {
    showToast(e.message, "error");
  }
}

function resetUsuarioForm() {
  ["usuario-id", "usuario-nome", "usuario-login", "usuario-senha"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("usuario-perfil").value = "";
  document.getElementById("modal-usuario-title").textContent = "Novo Usuário";
}

document
  .getElementById("btn-save-usuario")
  .addEventListener("click", async () => {
    const id = document.getElementById("usuario-id").value;
    const senha = document.getElementById("usuario-senha").value;
    const nome = document.getElementById("usuario-nome").value.trim();
    const login = document.getElementById("usuario-login").value.trim();
    const perfil = document.getElementById("usuario-perfil").value;

    if (!nome || !login || !perfil) {
      showToast("Preencha nome, login e perfil.", "error");
      return;
    }
    if (!id && !senha) {
      showToast("Senha é obrigatória para novo usuário.", "error");
      return;
    }

    const body = { nome, login, perfil };
    if (senha) body.senha = senha;

    try {
      if (id) {
        await api.usuarios.update(id, body);
        showToast("Usuário atualizado!");
      } else {
        await api.usuarios.create(body);
        showToast("Usuário cadastrado!");
      }
      closeModal("modal-usuario");
      loadUsuarios();
    } catch (e) {
      showToast(e.message, "error");
    }
  });

async function editUsuario(id) {
  try {
    const res = await api.usuarios.get(id);
    const u = res.data;
    document.getElementById("usuario-id").value = u.id_usuario;
    document.getElementById("usuario-nome").value = u.nome || "";
    document.getElementById("usuario-login").value = u.login || "";
    document.getElementById("usuario-senha").value = "";
    document.getElementById("usuario-perfil").value = u.perfil || "";
    document.getElementById("modal-usuario-title").textContent =
      "Editar Usuário";
    openModal("modal-usuario");
  } catch (e) {
    showToast(e.message, "error");
  }
}

async function deleteUsuario(id) {
  if (!confirm("Excluir este usuário?")) return;
  try {
    await api.usuarios.remove(id);
    showToast("Usuário excluído.");
    loadUsuarios();
  } catch (e) {
    showToast(e.message, "error");
  }
}

// ============================================================
// CÁLCULO AUTOMÁTICO DE VALOR NA OPERAÇÃO
// ============================================================

document
  .getElementById("operacao-cliente")
  .addEventListener("change", calcularValorOperacao);
document
  .getElementById("operacao-quantidade")
  .addEventListener("input", calcularValorOperacao);
document
  .getElementById("vale-operacao")
  .addEventListener("change", preencherValorVale);

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Fechar modais clicando no overlay
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

// Verificar sessão persistida
(function init() {
  const token = getToken();
  if (token) {
    const user = JSON.parse(localStorage.getItem("jobema_user") || "{}");
    showApp(user);
  } else {
    showLogin();
  }
})();
