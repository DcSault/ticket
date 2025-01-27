// public/js/themeManager.js
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        this.addButton();
        this.loadTheme();
        this.addListeners();
    }

    addButton() {
        const button = document.createElement('div');
        button.id = 'theme-toggle';
        button.style.cssText = 'position: fixed; bottom: 1rem; right: 1rem; padding: 0.5rem; background: white; border-radius: 9999px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
        button.innerHTML = `
            <svg id="theme-toggle-dark-icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
            <svg id="theme-toggle-light-icon" class="w-6 h-6 hidden" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
            </svg>
        `;
        document.body.appendChild(button);
    }

    loadTheme() {
        this.setTheme(localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }

    setTheme(isDark) {
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        document.documentElement.classList.toggle('dark', isDark);
        darkIcon.classList.toggle('hidden', isDark);
        lightIcon.classList.toggle('hidden', !isDark);
        
        if (isDark) {
            document.body.style.backgroundColor = '#1f2937';
            document.body.style.color = '#f3f4f6';
        } else {
            document.body.style.backgroundColor = '#f3f4f6';
            document.body.style.color = '#1f2937';
        }
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    addListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.setTheme(!document.documentElement.classList.contains('dark'));
        });
    }
}

// Créer l'instance
new ThemeManager();