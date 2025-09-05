/**
 * Initialisation du système de thème moderne
 * Ce fichier doit être chargé AVANT le themeManager.js
 */

// Chargement de theme-change via CDN
(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/theme-change@2.5.0/index.js';
    script.async = true;
    
    script.onload = function() {
        console.log('✅ Theme-change library loaded');
        
        // Dispatch un événement quand theme-change est prêt
        window.dispatchEvent(new CustomEvent('themeChangeReady'));
    };
    
    script.onerror = function() {
        console.warn('❌ Failed to load theme-change library from CDN');
        
        // Fallback : créer une version simplifiée
        createFallbackThemeChange();
    };
    
    document.head.appendChild(script);
})();

/**
 * Fallback si theme-change ne peut pas être chargé
 */
function createFallbackThemeChange() {
    window.themeChange = {
        init: function() {
            // Écouter les clics sur les éléments avec data-toggle-theme
            document.addEventListener('click', function(e) {
                const toggleElement = e.target.closest('[data-toggle-theme]');
                if (!toggleElement) return;
                
                const themes = toggleElement.getAttribute('data-toggle-theme').split(',');
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const currentIndex = themes.indexOf(currentTheme);
                const nextIndex = (currentIndex + 1) % themes.length;
                const nextTheme = themes[nextIndex];
                
                // Applique le nouveau thème
                document.documentElement.setAttribute('data-theme', nextTheme);
                document.documentElement.classList.toggle('dark', nextTheme === 'dark');
                localStorage.setItem('theme', nextTheme);
                
                // Ajoute la classe active
                const activeClass = toggleElement.getAttribute('data-act-class');
                if (activeClass) {
                    toggleElement.classList.add(activeClass);
                    setTimeout(() => toggleElement.classList.remove(activeClass), 200);
                }
                
                // Dispatch un événement
                window.dispatchEvent(new CustomEvent('themeChanged', {
                    detail: { theme: nextTheme, isDark: nextTheme === 'dark' }
                }));
            });
            
            console.log('✅ Fallback theme system initialized');
            window.dispatchEvent(new CustomEvent('themeChangeReady'));
        }
    };
    
    // Initialise le fallback
    window.themeChange.init();
}

// Applique le thème initial immédiatement pour éviter le flash
(function() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
})();
