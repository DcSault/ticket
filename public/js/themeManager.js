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
     * Injecte le bouton de basculement de thème moderne avec pictogramme élégant
     */
    injectToggleButton() {
        // Retire l'ancien bouton s'il existe
        const existingButton = document.querySelector('.floating-theme-toggle');
        if (existingButton) {
            existingButton.remove();
        }

        // Crée le nouveau bouton flottant moderne
        const button = document.createElement('div');
        button.className = 'floating-theme-toggle';
        button.setAttribute('data-tooltip', 'Changer de thème');
        button.innerHTML = `
            <div class="theme-icon">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            </div>
        `;

        // Ajoute l'événement click avec feedback tactile
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleModernToggle(button);
        });
        
        // Ajoute des effets de hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });
        
        // Ajoute au body
        document.body.appendChild(button);

        // Met à jour l'icône initiale
        this.updateToggleIcon();
        
        console.log('✨ Bouton de thème flottant moderne injecté');
    }

    /**
     * Gère le clic sur le bouton élégant avec animations
     */
    handleModernToggle(button) {
        // Ajoute l'animation de changement
        const icon = button.querySelector('.theme-icon');
        if (icon) {
            icon.classList.add('changing');
            setTimeout(() => icon.classList.remove('changing'), 600);
        }
        
        // Effet de feedback tactile
        button.style.transform = 'translateY(0) scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'translateY(0) scale(1)';
        }, 150);
        
        // Change le thème
        this.toggleTheme();
        
        // Met à jour l'icône après un délai
        setTimeout(() => {
            this.updateToggleIcon();
        }, 100);
    }

    /**
     * Met à jour l'icône du toggle selon le thème actuel
     */
    updateToggleIcon() {
        const button = document.querySelector('.floating-theme-toggle');
        if (!button) return;
        
        const currentTheme = this.getTheme();
        const tooltip = currentTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
        button.setAttribute('data-tooltip', tooltip);
        
        // Les icônes sont automatiquement gérées par le CSS via data-theme
        console.log(`🎨 Icône mise à jour pour le thème: ${currentTheme}`);
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