// Informe aqui a URL pública do backend depois de publicá-lo.
// Exemplo: https://sistema-de-ponto-api.onrender.com
window.APP_CONFIG = Object.freeze({
  apiBaseUrl: '',
});

window.apiUrl = function apiUrl(path) {
  const baseUrl = String(window.APP_CONFIG.apiBaseUrl || '').replace(/\/+$/, '');
  return `${baseUrl}${path}`;
};
