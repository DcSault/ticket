/**
 * Gestionnaire de thème ultra-moderne utilisant la bibliothèque theme-change
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
     * Injecte le bouton de basculement de thème ultra-moderne
     */
    injectToggleButton() {
        // Supprime tous les anciens boutons s'ils existent
        const oldButtons = document.querySelectorAll('#theme-toggle, #modern-theme-toggle, #ultra-theme-button, .floating-theme-toggle');
        oldButtons.forEach(btn => btn.remove());

        if (document.getElementById('ultra-theme-button')) return;
        
        const button = document.createElement('button');
        button.id = 'ultra-theme-button';
        button.type = 'button';
        button.className = 'ultra-smooth-theme-button';
        button.setAttribute('aria-label', 'Basculer entre thème sombre et clair');
        button.setAttribute('title', 'Changer le thème');

        button.innerHTML = `
            <div class="theme-icon-container">
                <!-- Icône soleil (visible en mode clair) -->
                <svg class="theme-icon sun-icon" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                </svg>
                
                <!-- Icône lune (visible en mode sombre) -->
                <svg class="theme-icon moon-icon" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                    <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
                </svg>
            </div>
        `;

        document.body.appendChild(button);
        
        // Ajouter l'écouteur d'événement
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleModernToggle();
        });
        
        // Initialiser l'état visuel
        this.updateToggleIcon();
        
        console.log('✅ Ultra-modern theme button created and attached');
    }

    /**
     * Gère le clic sur le bouton avec animations fluides
     */
    handleModernToggle() {
        const button = document.getElementById('ultra-theme-button');
        if (!button) return;

        // Animation de clic
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 200);
        
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
        const button = document.getElementById('ultra-theme-button');
        if (!button) return;
        
        const currentTheme = this.getTheme();
        const isDark = currentTheme === 'dark';
        
        // Met à jour le titre du bouton
        button.setAttribute('title', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
        
        // Met à jour les classes pour l'affichage des icônes
        button.setAttribute('data-theme', currentTheme);
        
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