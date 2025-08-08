class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        this.injectToggleButton();
        this.applyInitialTheme();
        this.addListeners();
    }

    injectToggleButton() {
        if (document.getElementById('theme-toggle')) return;
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.type = 'button';
        button.setAttribute('aria-label', 'Basculer le thème');
        button.className = 'fixed bottom-4 right-4 z-50 inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-white text-gray-800 shadow-md hover:shadow-lg hover:bg-gray-50 transition dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600';
        button.innerHTML = `
            <svg id="theme-toggle-light-icon" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z"></path>
            </svg>
            <svg id="theme-toggle-dark-icon" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
        `;
        document.body.appendChild(button);
    }

    applyInitialTheme() {
        // Supporter ancienne clé 'color-theme' et migrer vers 'theme'
        const legacy = localStorage.getItem('color-theme');
        if (legacy && !localStorage.getItem('theme')) {
            localStorage.setItem('theme', legacy);
        }
        // Surcharge via URL (?theme=light|dark) pour debug/forçage
        try {
            const params = new URLSearchParams(window.location.search);
            const forced = params.get('theme');
            if (forced === 'light' || forced === 'dark') {
                localStorage.setItem('theme', forced);
                localStorage.setItem('color-theme', forced);
                // Nettoyer l'URL sans recharger
                params.delete('theme');
                const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
                window.history.replaceState({}, '', newUrl);
            }
        } catch (_) {}

        const saved = localStorage.getItem('theme');
        // Par défaut: clair si aucun choix utilisateur
        const isDark = saved ? saved === 'dark' : false;
        // Appliquer sans persister tant que l'utilisateur n'a pas choisi
        const root = document.documentElement;
        root.classList.toggle('dark', isDark);
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        try { root.style.colorScheme = isDark ? 'dark' : 'light'; } catch(_) {}
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        if (darkIcon && lightIcon) {
            darkIcon.classList.toggle('hidden', !isDark);
            lightIcon.classList.toggle('hidden', isDark);
        }
    }

    setTheme(isDark) {
        const root = document.documentElement;
        root.classList.toggle('dark', isDark);
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        try { root.style.colorScheme = isDark ? 'dark' : 'light'; } catch(_) {}
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        if (darkIcon && lightIcon) {
            darkIcon.classList.toggle('hidden', !isDark);
            lightIcon.classList.toggle('hidden', isDark);
        }
        const value = isDark ? 'dark' : 'light';
        // Ecrire sur les deux clés pour compatibilité
        localStorage.setItem('theme', value);
        localStorage.setItem('color-theme', value);
        this.updateChartsTheme(isDark);
    }

    updateChartsTheme(isDark) {
        // Si Chart.js est disponible et qu'il y a des graphiques (Chart.js v4 compatible)
        if (window.Chart && document.querySelector('canvas')) {
            const chartColors = isDark ? {
                text: '#ffffff',
                grid: '#4b5563',
                lineColor: '#60a5fa',
                barColor: '#818cf8',
                backgroundColor: '#374151'
            } : {
                text: '#1f2937',
                grid: '#e5e7eb',
                lineColor: '#3b82f6',
                barColor: '#6366f1',
                backgroundColor: 'white'
            };

            // Mettre à jour tous les graphiques présents dans la page
            document.querySelectorAll('canvas').forEach((canvas) => {
                const chart = Chart.getChart(canvas);
                if (!chart) return;
                if (chart.options?.plugins?.legend?.labels) {
                    chart.options.plugins.legend.labels.color = chartColors.text;
                }
                if (chart.options?.scales?.y) {
                    if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = chartColors.grid;
                    if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = chartColors.text;
                }
                if (chart.options?.scales?.x) {
                    if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = chartColors.grid;
                    if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = chartColors.text;
                }
                // Mise à jour des couleurs des datasets
                if (chart.data?.datasets) {
                    chart.data.datasets.forEach(dataset => {
                        const type = dataset.type || chart.config.type;
                        if (type === 'line') {
                            dataset.borderColor = chartColors.lineColor;
                        } else if (type === 'bar' || type === 'doughnut') {
                            dataset.backgroundColor = dataset.backgroundColor || chartColors.barColor;
                        }
                    });
                }
                chart.update();
            });
        }
    }

    addListeners() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const next = !document.documentElement.classList.contains('dark');
                this.setTheme(next);
            });
        }
        // Suivre le thème système si aucun thème n'est forcé
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        media.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches);
            }
        });
    }
}

new ThemeManager();