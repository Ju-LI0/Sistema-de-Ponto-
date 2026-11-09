# TAG Serviços de Torno e Solda Ltda — Sistema de Ponto

Sistema web para uma empresa especializada em tornearia, usinagem, solda e recuperação de peças. O projeto reúne uma página institucional e um sistema interno para controle de jornada, relatórios diários e administração de colaboradores.

## Inicialização rápida

Para ver o projeto funcionando localmente:

### 1. Abra o terminal na pasta do projeto

```bash
cd "C:\Users\Usuario\Desktop\Sistema de Ponto - FATEC"
```

### 2. Inicie o servidor

```bash
npm start
```

O terminal deverá mostrar:

```text
TAG Servicos de Torno e Solda Ltda - Sistema de Ponto em http://localhost:3000
```

### 3. Abra o sistema no navegador

Acesse:

```text
http://localhost:3000
```

Você verá a página inicial da TAG Serviços de Torno e Solda Ltda. Para testar o sistema de ponto, clique em **Acessar sistema**.

### 4. Use uma conta de teste

Gestor:

```text
E-mail: gestor@tagservicos.com.br
Senha: 123456
Perfil: Gestor
```

Liderada:

```text
E-mail: ana@tagservicos.com.br
Senha: 123456
Perfil: Liderado
```

### Modo desenvolvimento

Para iniciar o servidor com reinício automático ao alterar arquivos do backend:

```bash
npm run dev
```

Para encerrar o servidor:

```text
Ctrl + C
```

> É necessário ter o Node.js 18 ou superior instalado. A versão atual utiliza o banco local `database/db.json` e não exige instalação de dependências externas.

## Sobre o projeto

A TAG Serviços de Torno e Solda Ltda trabalha com fabricação de peças sob medida, usinagem, corte, retífica, abertura de roscas e canais, soldagem, recuperação de componentes desgastados e reparos em estruturas e máquinas industriais.

O sistema centraliza o registro de ponto dos colaboradores e facilita o acompanhamento da rotina pelo gestor. A interface utiliza uma identidade visual industrial com preto, branco, azul e vermelho, priorizando clareza, responsividade e navegação simples.

## Funcionalidades

### Página institucional

- apresentação da empresa, serviços e diferenciais;
- destaque para tornearia, usinagem e solda;
- seção “Sobre a empresa”;
- indicadores institucionais e chamada para o sistema;
- layout responsivo para computador e celular.

### Liderado

- login por e-mail, senha e perfil;
- registro de entrada, saída para almoço, volta do almoço e saída final;
- visualização dos horários registrados;
- relatório diário com atividades realizadas e planejamento do dia seguinte;
- bloqueio da saída final enquanto o relatório do dia não for preenchido.

### Gestor

- painel administrativo;
- visualização de colaboradores ativos, pontos e relatórios;
- identificação de relatórios pendentes;
- cadastro de novas contas;
- definição inicial de cargo;
- gerenciamento de nome, CPF, telefone, endereço, CEP e e-mail.

### Segurança

- senhas novas protegidas com `crypto.scryptSync` e salt aleatório;
- comparação de hashes em tempo constante;
- sessões baseadas em tokens criptograficamente aleatórios;
- respostas da API sem exposição de `passwordHash`;
- recuperação de acesso preparada por e-mail;
- tokens de recuperação com expiração curta.

> Atualmente o envio de recuperação de senha é simulado no console do servidor. Para produção, é necessário configurar SMTP ou um provedor transacional.

## Estrutura do projeto

```text
Sistema de Ponto - FATEC/
├── .gitignore
├── package.json
├── README.md
├── TGA.png
├── frontend/
│   ├── index.html
│   ├── index.css
│   ├── index.js
│   └── pages/
│       ├── login.html
│       ├── login.css
│       ├── login.js
│       ├── cadastro.html
│       ├── cadastro.css
│       ├── cadastro.js
│       ├── dashboard.html
│       ├── dashboard.css
│       └── dashboard.js
├── backend/
│   ├── server.js
│   └── security.js
├── database/
│   ├── db.json
│   └── README.md
└── CIBERSECURITY/
    └── README.md
```

## O que cada pasta e arquivo faz

### `frontend/`

Camada visual e interação com o usuário.

- `index.html`, `index.css` e `index.js`: página institucional, serviços, seção sobre, rodapé e navegação para login/cadastro.
- `pages/login.html`, `login.css` e `login.js`: página centralizada de login, seleção de perfil e recuperação de acesso.
- `pages/cadastro.html`, `cadastro.css` e `cadastro.js`: formulário de cadastro de liderados com validação de senha.
- `pages/dashboard.html`, `dashboard.css` e `dashboard.js`: painel autenticado, pontos, relatórios, justificativas, colaboradores e tema claro/escuro.

### `backend/`

Servidor e regras de negócio.

- `server.js`: inicia o servidor HTTP, entrega o frontend e implementa as rotas da API.
- `security.js`: hash e verificação de senha, geração de tokens e remoção de dados sensíveis.

Rotas principais:

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/login` | Autenticar gestor ou liderado |
| `POST` | `/api/register` | Criar cadastro de liderado |
| `POST` | `/api/recovery` | Iniciar recuperação de acesso |
| `GET` | `/api/me` | Consultar usuário autenticado |
| `GET` | `/api/dashboard` | Buscar dados do painel |
| `POST` | `/api/punch` | Registrar marcação de ponto |
| `POST` | `/api/reports` | Criar ou atualizar relatório diário |
| `POST` | `/api/users` | Criar colaborador, somente gestor |
| `PATCH` | `/api/users/:id` | Alterar colaborador, somente gestor |
| `PATCH` | `/api/reports/:id` | Aprovar relatório, somente gestor |
| `POST` | `/api/justifications` | Enviar justificativa |
| `PATCH` | `/api/justifications/:id` | Aprovar ou recusar justificativa |

### `database/`

Persistência local usada pelo protótipo.

- `db.json`: armazena usuários, pontos, relatórios, sessões e tokens de recuperação.
- `README.md`: explica a organização do banco e recomendações para migração.

O JSON é adequado para demonstração local. Em produção, recomenda-se PostgreSQL ou MySQL com migrations, índices, backup e controle de acesso.

### `CIBERSECURITY/`

Diretrizes de proteção do sistema.

- `README.md`: documenta as medidas implementadas e os cuidados antes da publicação.

### Arquivos da raiz

- `TGA.png`: logo oficial utilizada pela TAG em todas as páginas do frontend.
- `package.json`: nome do projeto e comandos `npm start` e `npm run dev`.
- `.gitignore`: evita versionar dependências, `.env` e logs.
- `README.md`: documentação geral.

## Requisitos

- Node.js 18 ou superior;
- npm instalado;
- navegador moderno.

O projeto não exige banco externo nem dependências npm para iniciar a versão atual.

## Como iniciar

No terminal, dentro da pasta do projeto:

```bash
cd "C:\Users\Usuario\Desktop\Sistema de Ponto - FATEC"
npm start
```

Depois, abra `http://localhost:3000` no navegador. Para desenvolvimento com reinício automático do backend:

```bash
npm run dev
```

Para encerrar o servidor, pressione `Ctrl + C`.

## Contas de demonstração

Gestor:

```text
E-mail: gestor@tagservicos.com.br
Senha: 123456
Perfil: Gestor
```

Liderada:

```text
E-mail: ana@tagservicos.com.br
Senha: 123456
Perfil: Liderado
```

Essas contas existem apenas para testes locais. Antes de publicar, remova-as e crie usuários com senhas reais armazenadas por hash.

## Fluxo do liderado

1. Acessa o sistema e escolhe o perfil `Liderado`.
2. Registra a entrada.
3. Registra a saída para almoço e a volta.
4. Preenche atividades realizadas e planejamento de amanhã.
5. Envia o relatório.
6. Registra a saída final.

O gestor não precisa aprovar o relatório para a saída final, mas o relatório precisa existir no dia atual.

## Fluxo do gestor

1. Acessa o sistema com o perfil `Gestor`.
2. Visualiza colaboradores, pontos e relatórios pendentes.
3. Consulta relatórios enviados.
4. Cria novas contas com os dados obrigatórios.
5. Pode atualizar dados de contas pela API.

## Recuperação de senha

`POST /api/recovery` responde de forma genérica para não revelar se um e-mail está cadastrado. Quando encontra o usuário, gera um código com expiração de 15 minutos e imprime o código no console.

Para transformar isso em um fluxo real:

1. configurar SMTP por variáveis de ambiente;
2. enviar link HTTPS com token de uso único;
3. criar tela para definir nova senha;
4. limitar tentativas por IP e e-mail;
5. invalidar o token após o primeiro uso;
6. registrar eventos sem salvar senhas ou códigos em texto puro.

## Recomendações para produção

- trocar o banco JSON por banco relacional;
- habilitar HTTPS;
- usar cookies `HttpOnly`, `Secure` e `SameSite`;
- mover segredos para variáveis de ambiente;
- remover contas de demonstração;
- validar CPF, CEP, telefone e e-mail no backend;
- adicionar rate limiting e proteção contra brute force;
- usar logs estruturados, monitoramento e backups;
- criar testes automatizados de API e interface;
- configurar CORS de forma restritiva;
- adicionar proteção CSRF caso a autenticação use cookies;
- revisar LGPD, retenção de dados e política de privacidade;
- proteger dados pessoais como CPF, endereço e telefone.

## Tecnologias utilizadas

- HTML5;
- CSS3;
- JavaScript;
- Node.js;
- APIs nativas do Node.js (`http`, `fs`, `crypto`);
- JSON como persistência inicial;
- Google Fonts para tipografia.

## Estado atual

Esta versão é um protótipo funcional para desenvolvimento local e apresentação. Os fluxos principais já estão implementados, mas as recomendações de produção devem ser realizadas antes do uso com dados reais de funcionários.
