(() => {
  const media = matchMedia('(prefers-color-scheme: dark)');
  let choice;
  try { choice = localStorage.getItem('vs-theme'); } catch { /* Storage is optional. */ }
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
  };
  apply(['light', 'dark'].includes(choice) ? choice : media.matches ? 'dark' : 'light');
  media.addEventListener('change', () => { if (!choice) apply(media.matches ? 'dark' : 'light'); });
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelector('#theme-toggle')?.addEventListener('click', () => {
      choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('vs-theme', choice); } catch { /* Continue without persistence. */ }
      apply(choice);
    });
  });
})();
