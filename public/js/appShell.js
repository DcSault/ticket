// App Shell unifié: en-tête et pied de page communs, style moderne (inspiration Windows 11 / Fluent)
(function () {
  function createHeader() {
    const header = document.createElement('header');
    header.className = 'sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800';

    header.innerHTML = `
      <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow">
            CF
          </div>
          <a href="/" class="hidden sm:block font-semibold text-gray-900 dark:text-gray-100">CallFix</a>
        </div>
        <nav class="hidden md:flex items-center gap-6 text-sm">
          <a href="/" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Accueil</a>
          <a href="/archives" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Archives</a>
          <a href="/stats" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Statistiques</a>
          <a href="/report" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Rapport</a>
        </nav>
        <div class="flex items-center gap-2">
          <button id="app-theme-toggle" type="button" aria-label="Basculer le thème" class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            <svg id="app-theme-sun" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zM4.464 5.05a1 1 0 011.414 0L6.586 5.76a1 1 0 11-1.414 1.415L4.464 6.465a1 1 0 010-1.414zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"/></svg>
            <svg id="app-theme-moon" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 116.707 2.707a8 8 0 1010.586 10.586z"/></svg>
          </button>
        </div>
      </div>
    `;
    return header;
  }

  function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'mt-8 border-t border-gray-200 dark:border-gray-800';
    footer.innerHTML = `
      <div class="mx-auto max-w-7xl px-4 py-6 text-sm text-gray-600 dark:text-gray-400 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <span>Version <span class="app-version"></span></span>
        </div>
        <div>
          <span>Développé par <span class="app-developer"></span></span>
        </div>
        <a class="app-github-link hover:text-blue-600 dark:hover:text-blue-400" target="_blank" rel="noopener">GitHub</a>
      </div>
    `;
    return footer;
  }

  function initThemeToggle() {
    const btn = document.getElementById('app-theme-toggle');
    if (!btn) return;
    const sun = document.getElementById('app-theme-sun');
    const moon = document.getElementById('app-theme-moon');

    function setTheme(isDark) {
      document.documentElement.classList.toggle('dark', isDark);
      if (moon && sun) {
        moon.classList.toggle('hidden', !isDark);
        sun.classList.toggle('hidden', isDark);
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Initial state according to stored preference or media
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved ? saved === 'dark' : prefersDark);

    btn.addEventListener('click', () => {
      const isDark = !document.documentElement.classList.contains('dark');
      setTheme(isDark);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Inject header & footer once
    const header = createHeader();
    document.body.insertBefore(header, document.body.firstChild);

    const footer = createFooter();
    document.body.appendChild(footer);

    initThemeToggle();
  });
})();


