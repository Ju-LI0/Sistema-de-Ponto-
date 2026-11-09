# Cibersegurança

O backend já utiliza `crypto.scryptSync` com salt aleatório para novas senhas, comparação em tempo constante, tokens criptograficamente aleatórios para sessões e tokens de recuperação, além de remover `passwordHash` das respostas da API.

O fluxo de recuperação atual registra o código no console para desenvolvimento local. Em produção, ele deve ser trocado por um provedor SMTP ou serviço transacional, com token de uso único, expiração curta e limitação de tentativas.
