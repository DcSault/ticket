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
    createModernFloatingToggle() {
        // Supprimer l'ancien bouton s'il existe
        const existingButton = document.getElementById('floating-theme-toggle');
        if (existingButton) {
            existingButton.remove();
        }

        // Créer le nouveau bouton
        const button = document.createElement('button');
        button.id = 'floating-theme-toggle';
        button.className = 'ultra-modern-theme-toggle';
        button.setAttribute('aria-label', 'Changer le thème');
        button.setAttribute('title', 'Basculer entre mode clair et sombre');
        
        // Conteneur des icônes avec pictogrammes Unicode modernes
        button.innerHTML = `
            <div class="theme-icon-container">
                <span class="theme-icon sun-icon">☀️</span>
                <span class="theme-icon moon-icon">🌙</span>
            </div>
        `;

        // Ajouter l'événement
        button.addEventListener('click', () => this.handleModernToggle());

        // Ajouter au body
        document.body.appendChild(button);
        
        console.log('Bouton de thème ultra-moderne créé avec icônes SVG');
    }

    /**
     * Gère le clic sur le bouton de thème moderne
     */
    handleModernToggle() {
        console.log('Bouton de thème cliqué');
        
        // Utiliser la fonction themeChange pour basculer
        if (window.themeChange) {
            const currentTheme = this.getCurrentTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            console.log(`Changement de thème: ${currentTheme} → ${newTheme}`);
            
            // Utiliser themeChange pour changer le thème
            window.themeChange.theme(newTheme);
            
            // Sauvegarder dans localStorage
            localStorage.setItem('theme', newTheme);
            
            // Déclencher l'événement personnalisé
            document.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: newTheme }
            }));
            
            console.log(`Thème changé vers: ${newTheme}`);
        } else {
            console.error('Library theme-change non disponible');
            
            // Fallback manuel
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            console.log(`Thème changé manuellement vers: ${newTheme}`);
        }
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