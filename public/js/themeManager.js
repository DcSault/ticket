/**
 * Gestionnaire de thème moderne utilisant la bibliothèque theme-change
 * Compatible avec Tailwind CSS et les data attributes
 * Support: system preference, persistance localStorage, Chart.js
 */

class ModernThemeManager {
    constructor() {
        this.themes = {
            light: 'light',
            dark: 'dark'
        };
        this.isReady = false;
        
        // Attendre que theme-change soit prêt
        if (window.themeChangeReady) {
            this.init();
        } else {
            window.addEventListener('themeChangeReady', () => this.init());
        }
    }

    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        this.isReady = true;
        this.injectToggleButton();
        this.setupThemeWatcher();
        this.updateToggleIcon();
        console.log('✅ Modern Theme Manager initialized');
    }

    /**
     * Injecte le bouton de basculement de thème moderne
     */
    injectToggleButton() {
        // Supprime l'ancien bouton s'il existe
        const oldToggle = document.getElementById('theme-toggle');
        if (oldToggle) oldToggle.remove();

        if (document.getElementById('modern-theme-toggle')) return;
        
        const toggle = document.createElement('button');
        toggle.id = 'modern-theme-toggle';
        toggle.type = 'button';
        toggle.setAttribute('data-toggle-theme', 'dark,light');
        toggle.setAttribute('data-act-class', 'theme-active');
        toggle.setAttribute('aria-label', 'Basculer entre thème sombre et clair');
        toggle.className = `
            fixed bottom-4 right-4 z-50 
            inline-flex items-center justify-center 
            w-12 h-12 rounded-full 
            bg-white dark:bg-gray-700 
            border border-gray-200 dark:border-gray-600
            text-gray-800 dark:text-gray-100
            shadow-lg hover:shadow-xl 
            transition-all duration-300 ease-in-out
            hover:scale-110 active:scale-95
            focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
            focus:outline-none
            group theme-transition
        `.replace(/\s+/g, ' ').trim();

        toggle.innerHTML = `
            <div class="relative w-6 h-6">
                <!-- Icône soleil (visible en mode sombre) -->
                <svg class="sun-icon absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-500 transform origin-center" 
                     fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z" 
                          clip-rule="evenodd"/>
                </svg>
                
                <!-- Icône lune (visible en mode clair) -->
                <svg class="moon-icon absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-500 transform origin-center" 
                     fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
            </div>
        `;

        document.body.appendChild(toggle);
        
        // Ajouter les écouteurs d'événements personnalisés
        toggle.addEventListener('click', (e) => {
            this.addClickEffect(e.currentTarget);
        });
    }

    /**
     * Ajoute un effet visuel au clic
     */
    addClickEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    /**
     * Met à jour l'icône du toggle selon le thème actuel
     */
    updateToggleIcon() {
        const toggle = document.getElementById('modern-theme-toggle');
        if (!toggle) return;

        const sunIcon = toggle.querySelector('.sun-icon');
        const moonIcon = toggle.querySelector('.moon-icon');
        const isDark = this.getCurrentTheme() === 'dark';

        if (isDark) {
            // Mode sombre : montrer l'icône soleil
            sunIcon?.style.setProperty('transform', 'scale(1) rotate(0deg)');
            sunIcon?.style.setProperty('opacity', '1');
            moonIcon?.style.setProperty('transform', 'scale(0) rotate(-180deg)');
            moonIcon?.style.setProperty('opacity', '0');
        } else {
            // Mode clair : montrer l'icône lune
            sunIcon?.style.setProperty('transform', 'scale(0) rotate(180deg)');
            sunIcon?.style.setProperty('opacity', '0');
            moonIcon?.style.setProperty('transform', 'scale(1) rotate(0deg)');
            moonIcon?.style.setProperty('opacity', '1');
        }
    }

    /**
     * Obtient le thème actuel
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 
               (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }

    /**
     * Surveille les changements de thème
     */
    setupThemeWatcher() {
        // Observer pour les changements d'attributs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'data-theme' || 
                     mutation.attributeName === 'class')) {
                    this.updateToggleIcon();
                    this.updateChartsTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });

        // Écouter les événements de changement de thème
        window.addEventListener('themeChanged', (e) => {
            this.updateToggleIcon();
            this.updateChartsTheme();
        });

        // Écouter les changements de préférence système
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            }
        });
    }

    /**
     * Met à jour le thème des graphiques Chart.js
     */
    updateChartsTheme() {
        if (!window.Chart || !document.querySelector('canvas')) return;

        const isDark = this.getCurrentTheme() === 'dark';
        const chartColors = isDark ? {
            text: '#f3f4f6',
            grid: '#4b5563',
            borderColor: '#6b7280'
        } : {
            text: '#1f2937',
            grid: '#e5e7eb', 
            borderColor: '#d1d5db'
        };

        document.querySelectorAll('canvas').forEach((canvas) => {
            const chart = Chart.getChart(canvas);
            if (!chart) return;

            // Met à jour les options globales
            if (chart.options?.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = chartColors.text;
            }

            // Met à jour les axes
            ['x', 'y'].forEach(axis => {
                if (chart.options?.scales?.[axis]) {
                    if (chart.options.scales[axis].grid) {
                        chart.options.scales[axis].grid.color = chartColors.grid;
                    }
                    if (chart.options.scales[axis].ticks) {
                        chart.options.scales[axis].ticks.color = chartColors.text;
                    }
                }
            });

            chart.update('none');
        });
    }

    /**
     * API publique pour changer de thème programmatiquement
     */
    toggleTheme() {
        if (!this.isReady) return;
        
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme, isDark: newTheme === 'dark' }
        }));
    }

    /**
     * API publique pour obtenir le thème actuel
     */
    getTheme() {
        return this.getCurrentTheme();
    }

    /**
     * API publique pour définir un thème spécifique
     */
    setTheme(theme) {
        if (!['light', 'dark'].includes(theme) || !this.isReady) return;
        
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
        
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, isDark: theme === 'dark' }
        }));
    }
}

// Variables globales
window.ModernThemeManager = ModernThemeManager;

// Initialisation conditionnelle
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ModernThemeManager();
    });
} else {
    window.themeManager = new ModernThemeManager();
}