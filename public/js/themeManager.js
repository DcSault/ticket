// public/js/themeManager.js

class ThemeManager {
    constructor() {
        // S'assurer que l'initialisation est faite après le chargement du DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // Ajouter le bouton de thème au DOM
        this.addThemeToggleButton();
        
        // Initialiser le thème
        this.initTheme();
        
        // Ajouter les écouteurs d'événements
        this.setupEventListeners();
    }

    addThemeToggleButton() {
        // Vérifier si le bouton existe déjà
        if (!document.getElementById('theme-toggle')) {
            const button = document.createElement('div');
            button.id = 'theme-toggle';
            button.className = 'fixed bottom-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-shadow z-50';
            button.innerHTML = `
                <svg id="theme-toggle-dark-icon" class="w-6 h-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
                <svg id="theme-toggle-light-icon" class="w-6 h-6 hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                </svg>
            `;
            document.body.appendChild(button);
        }
    }

    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('color-theme', theme); // Utiliser une clé plus spécifique
        this.updateIcons();
    }

    updateIcons() {
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        const isDark = document.documentElement.classList.contains('dark');
        
        if (darkIcon && lightIcon) {
            darkIcon.classList.toggle('hidden', isDark);
            lightIcon.classList.toggle('hidden', !isDark);
        }
    }

    initTheme() {
        let theme;
        // Vérifier le localStorage
        if (localStorage.getItem('color-theme')) {
            theme = localStorage.getItem('color-theme');
        }
        // Vérifier la préférence système si pas de préférence stockée
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = 'dark';
        }
        // Défaut light
        else {
            theme = 'light';
        }
        
        this.setTheme(theme);
    }

    setupEventListeners() {
        // Écouteur pour le bouton de thème
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.contains('dark');
                this.setTheme(isDark ? 'light' : 'dark');
            });
        }

        // Écouteur pour les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('color-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Création d'une instance globale
window.themeManager = new ThemeManager();