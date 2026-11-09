const menuButton = document.querySelector('.menu');
const navigationLinks = document.querySelector('.nav-links');

function closeNavigation() {
  navigationLinks?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu de navegação');
}

menuButton?.addEventListener('click', () => {
  const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';

  navigationLinks?.classList.toggle('open', !isExpanded);
  menuButton.setAttribute('aria-expanded', String(!isExpanded));
  menuButton.setAttribute(
    'aria-label',
    isExpanded ? 'Abrir menu de navegação' : 'Fechar menu de navegação',
  );
});

navigationLinks?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    closeNavigation();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNavigation();
  }
});
