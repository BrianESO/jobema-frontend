# Frontend — Jobema

## Visão Geral

Interface web responsável pela interação dos usuários com o sistema Jobema.

A aplicação consome uma API REST para gerenciamento de clientes, caminhões, operações, vales, fechamentos mensais e usuários.

## Stack Tecnológica

| Item        | Tecnologia                    |
| ----------- | ----------------------------- |
| Linguagem   | JavaScript (ES6+)             |
| Estrutura   | Single Page Application (SPA) |
| Interface   | HTML5 + CSS3                  |
| Comunicação | Fetch API                     |
| Integração  | API REST                      |

---

## Arquitetura

O frontend está organizado em módulos responsáveis pela interface, comunicação com a API e controle de estado da aplicação.

Estrutura principal:

text
frontend/
├── index.html
├── style.css
├── api.js
└── app.js


| Arquivo    | Responsabilidade                         |
| ---------- | ---------------------------------------- |
| index.html | Estrutura da aplicação                   |
| style.css  | Camada de apresentação                   |
| api.js     | Comunicação com a API                    |
| app.js     | Regras de interface e fluxo da aplicação |

---

## Módulos Funcionais

### Autenticação

Responsável pela autenticação do usuário e gerenciamento da sessão da aplicação.

Funcionalidades:

* Login
* Controle de sessão
* Logout
* Proteção de telas restritas

---

### Dashboard

Painel inicial para visualização consolidada das informações do sistema.

Funcionalidades:

* Indicadores operacionais
* Resumo de registros
* Consulta rápida de informações recentes

---

### Clientes

Gerenciamento completo dos registros de clientes.

Funcionalidades:

* Listagem
* Cadastro
* Edição
* Exclusão

---

### Caminhões

Gerenciamento da frota utilizada nas operações.

Funcionalidades:

* Listagem
* Cadastro
* Edição
* Exclusão

---

### Operações

Módulo principal de registro operacional.

Funcionalidades:

* Listagem
* Cadastro
* Edição
* Exclusão
* Consulta histórica

---

### Vales

Gerenciamento dos vales vinculados às operações.

Funcionalidades:

* Listagem
* Consulta
* Atualização
* Controle de pagamento

---

### Fechamentos Mensais

Consulta e geração dos fechamentos consolidados.

Funcionalidades:

* Listagem
* Consulta detalhada
* Reprocessamento de fechamento
* Exportação de relatórios

---

### Usuários

Administração dos usuários do sistema.

Funcionalidades:

* Listagem
* Cadastro
* Edição
* Exclusão

---

## Integração com API

O frontend consome recursos disponibilizados pela API REST do backend.

Principais recursos consumidos:

text
/auth
/clientes
/caminhoes
/operacoes
/vales
/fechamentos
/usuarios


A configuração do endereço da API é realizada no módulo responsável pela comunicação HTTP.

---

## Sessão e Segurança

A autenticação é baseada em tokens JWT fornecidos pelo backend.

Todas as requisições protegidas são realizadas mediante envio do token de autenticação.

O controle de acesso e autorização é validado pelo backend.

---

## Execução Local

### Pré-requisitos

* Node.js
* Backend em execução
* Dependências instaladas

### Inicialização

bash
npx serve . -l 3001


A aplicação ficará disponível no endereço configurado localmente.

---

## Dependências Externas

* Navegador compatível com ES6+
* API Jobema disponível e acessível
* Conectividade com o banco de dados através do backend
