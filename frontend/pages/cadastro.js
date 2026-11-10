const form = document.querySelector('#registerForm');
const message = document.querySelector('#message');
const cpfInput = document.querySelector('#cpf');
const phoneInput = document.querySelector('#phone');
const cepInput = document.querySelector('#cep');
const nameInput = document.querySelector('#name');
const addressInput = document.querySelector('#address');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#passwordConfirm');
const apiBaseUrl = (window.APP_CONFIG?.apiBaseUrl
  || document.querySelector('meta[name="api-base-url"]')?.content
  || '').replace(/\/+$/, '');

const registerApiUrl = path => `${apiBaseUrl}${path}`;

function unavailableApiMessage() {
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  return localHost
    ? 'O servidor do cadastro não está disponível. Execute “npm start” e acesse http://localhost:3000.'
    : 'Este site está hospedado sem o backend do cadastro. Publique a API Node.js e configure a URL em api-base-url.';
}

async function readApiResponse(response) {
  const responseText = await response.text();
  let result = {};

  if (responseText.trim()) {
    try {
      result = JSON.parse(responseText);
    } catch {
      if (responseText.trimStart().startsWith('<')) {
        throw new Error(unavailableApiMessage());
      }
      throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');
    }
  }

  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível criar o cadastro.');
  }

  return result;
}

function showMessage(text, isSuccess = false) {
  message.textContent = text;
  message.className = `message show${isSuccess ? ' ok' : ''}`;
}

function onlyDigits(value, maxLength) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function formatCpf(digits) {
  let formatted = digits.slice(0, 3);

  if (digits.length >= 3) formatted += `.${digits.slice(3, 6)}`;
  if (digits.length >= 6) formatted += `.${digits.slice(6, 9)}`;
  if (digits.length >= 9) formatted += `-${digits.slice(9, 11)}`;

  return formatted;
}

function formatPhone(digits) {
  if (!digits) return '';

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const isMobile = digits.length > 10;
  const prefixLength = isMobile ? 5 : 4;
  let formatted = `(${areaCode}`;

  if (digits.length >= 2) formatted += ')';
  if (digits.length > 2) formatted += ` ${subscriber.slice(0, prefixLength)}`;
  if (subscriber.length > prefixLength) {
    formatted += `-${subscriber.slice(prefixLength, prefixLength + 4)}`;
  }

  return formatted;
}

function formatCep(digits) {
  if (digits.length < 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

function isValidCpf(value) {
  const cpf = value.replace(/\D/g, '');

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

function isValidName(value) {
  return /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(value.trim());
}

function updateNameValidity() {
  const value = nameInput.value.trim();
  nameInput.setCustomValidity(
    value && !isValidName(value)
      ? 'Informe um nome usando somente letras, espaços, hífen ou apóstrofo.'
      : '',
  );
}

function updateCpfValidity() {
  const digitCount = onlyDigits(cpfInput.value, 11).length;
  cpfInput.setCustomValidity(
    digitCount > 0 && (digitCount !== 11 || !isValidCpf(cpfInput.value))
      ? 'Informe um CPF válido com 11 números.'
      : '',
  );
}

function updatePhoneValidity() {
  const digitCount = onlyDigits(phoneInput.value, 11).length;
  phoneInput.setCustomValidity(
    digitCount > 0 && digitCount !== 10 && digitCount !== 11
      ? 'Informe um telefone com DDD e 10 ou 11 números.'
      : '',
  );
}

function updateCepValidity() {
  const digitCount = onlyDigits(cepInput.value, 8).length;
  cepInput.setCustomValidity(
    digitCount > 0 && digitCount !== 8
      ? 'Informe um CEP com oito números.'
      : '',
  );
}

cpfInput.addEventListener('input', () => {
  cpfInput.value = formatCpf(onlyDigits(cpfInput.value, 11));
  updateCpfValidity();
});

phoneInput.addEventListener('input', () => {
  phoneInput.value = formatPhone(onlyDigits(phoneInput.value, 11));
  updatePhoneValidity();
});

cepInput.addEventListener('input', () => {
  cepInput.value = formatCep(onlyDigits(cepInput.value, 8));
  updateCepValidity();
});

nameInput.addEventListener('input', () => {
  nameInput.value = nameInput.value.replace(/[^\p{L}\p{M}'’ -]/gu, '');
  updateNameValidity();
});

addressInput.addEventListener('input', () => {
  addressInput.value = addressInput.value.replace(/[^\p{L}\p{M}0-9 .,'’ºª/#-]/gu, '');
});

emailInput.addEventListener('input', () => {
  emailInput.value = emailInput.value.replace(/\s/g, '');
  emailInput.setCustomValidity(
    emailInput.validity.typeMismatch ? 'Informe um e-mail válido, como nome@exemplo.com.' : '',
  );
});

passwordConfirmInput.addEventListener('input', () => {
  passwordConfirmInput.setCustomValidity(
    passwordConfirmInput.value && passwordConfirmInput.value !== passwordInput.value
      ? 'As senhas precisam ser iguais.'
      : '',
  );
});

passwordInput.addEventListener('input', () => {
  passwordConfirmInput.setCustomValidity(
    passwordConfirmInput.value && passwordConfirmInput.value !== passwordInput.value
      ? 'As senhas precisam ser iguais.'
      : '',
  );
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form));
  delete data.passwordConfirm;

  try {
    const response = await fetch(registerApiUrl('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await readApiResponse(response);

    showMessage('Cadastro criado. Seu acesso aguarda aprovação dos gestores. Redirecionando...', true);
    setTimeout(() => {
      location.href = 'login.html';
    }, 1800);
  } catch (error) {
    showMessage(error instanceof TypeError ? unavailableApiMessage() : error.message);
  }
});
