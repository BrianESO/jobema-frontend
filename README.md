# Jobema — Front-end

Sistema de gerenciamento operacional da **Jobema Distribuidora de Água Ltda**, desenvolvido como projeto de extensão acadêmica na FATEC.

---

## 🚀 Tecnologias

- HTML5
- CSS3
- JavaScript (ES6+)

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- Pacote `serve` instalado globalmente:

```bash
npm install -g serve
```

- [Back-end Jobema](https://github.com/giuladislau/jobema-backend) rodando na porta 3000

---

## ▶️ Como executar

```bash
cd jobema-frontend
serve . -l 3001
```

Acesse: **http://localhost:3001**

---

## 📁 Estrutura de arquivos

jobema-frontend/
├── index.html # Estrutura HTML — todas as telas e modais
├── style.css # Estilo visual — identidade Jobema
├── api.js # Camada de comunicação com o back-end
└── app.js # Lógica de todos os módulos

---

## ⚙️ Configuração

No arquivo `api.js`, linha 7, ajuste a URL do back-end se necessário:

```javascript
const BASE_URL = "http://localhost:3000";
```

---

## 📦 Módulos

| Módulo      | Descrição                              |
| ----------- | -------------------------------------- |
| Login       | Autenticação com JWT                   |
| Dashboard   | Visão geral com estatísticas           |
| Clientes    | Cadastro com modalidade e preço por m³ |
| Caminhões   | Gestão da frota                        |
| Operações   | Registro de entregas e retiradas       |
| Vales       | Comprovantes imprimíveis               |
| Histórico   | Consulta por cliente e período         |
| Fechamentos | Consolidação mensal com exportação PDF |
| Usuários    | Controle de acesso (apenas admin)      |

---

## 👥 Equipe

- Brian Evangelista
- Giullia Ladislau
- Larissa Lopufe

**Curso:** Análise e Desenvolvimento de Sistemas — FATEC  
**Disciplinas:** Laboratório de Banco de Dados / Gestão de Projetos / Engenharia de Software III
