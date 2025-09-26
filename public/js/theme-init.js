/**
 * Initialisation globale du système de thème
 * Ce fichier doit être inclus dans toutes les pages
 */

(function() {
    'use strict';

    // Configuration globale
    const THEME_CONFIG = {
        storageKey: 'theme',
        defaultTheme: 'light',
        themes: ['light', 'dark'],
        syncAcrossPages: true
    };

    /**
     * Détecte le thème initial
     */
    function detectInitialTheme() {
        // 1. Vérifier le localStorage
        const stored = localStorage.getItem(THEME_CONFIG.storageKey);
        if (stored && THEME_CONFIG.themes.includes(stored)) {
            return stored;
        }

        // 2. Vérifier la préférence système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // 3. Thème par défaut
        return THEME_CONFIG.defaultTheme;
    }

    /**
     * Apply le thème immédiatement (avant le chargement complet)
     */
    function applyThemeInstantly(theme) {
        const html = document.documentElement;
        
        // Appliquer data-theme pour theme-change
        html.setAttribute('data-theme', theme);
        
        // Appliquer class dark pour compatibilité
        html.classList.toggle('dark', theme === 'dark');
        
        // Sauvegarder
        localStorage.setItem(THEME_CONFIG.storageKey, theme);
        
        console.log(`Thème appliqué instantanément: ${theme}`);
    }

    /**
     * Créer le bouton de thème moderne
     */
    function createThemeButton() {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('global-theme-toggle')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'global-theme-toggle';
        button.className = 'ultra-modern-theme-toggle';
        button.setAttribute('aria-label', 'Changer le thème');
        button.setAttribute('title', 'Basculer entre mode clair et sombre');
        button.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            z-index: 9999 !important;
            width: 56px !important;
            height: 56px !important;
            border-radius: 50% !important;
            border: none !important;
            cursor: pointer !important;
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 24px !important;
        `;
        
        // Contenu avec pictogrammes et animations sophistiquées
        function updateButtonContent() {
            const currentTheme = getCurrentTheme();
            const isDark = currentTheme === 'dark';
            
            // Supprimer les classes d'animation précédentes
            button.classList.remove('morphing-sun', 'morphing-moon', 'color-wave-dark', 'color-wave-light', 'energy-pulse', 'energy-pulse-dark');
            
            // Le soleil s'affiche en mode sombre (pour basculer vers mode clair)
            // La lune s'affiche en mode clair (pour basculer vers mode sombre)
            button.innerHTML = isDark ? '☀️' : '🌙';
            
            // Forcer les styles avec !important pour surcharger le CSS
            if (isDark) {
                button.style.cssText += `
                    background: rgba(30, 41, 59, 0.9) !important;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
                    color: #f59e0b !important;
                `;
                // Ajouter l'animation de pulsation énergique pour mode sombre
                setTimeout(() => button.classList.add('energy-pulse-dark'), 100);
            } else {
                button.style.cssText += `
                    background: rgba(255, 255, 255, 0.9) !important;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
                    color: #60a5fa !important;
                `;
                // Ajouter l'animation de pulsation énergique pour mode clair
                setTimeout(() => button.classList.add('energy-pulse'), 100);
            }
            
            console.log(`Bouton mis à jour: ${isDark ? 'fond sombre + animations' : 'fond clair + animations'}`);
        }

        // Fonction pour déclencher les animations de transition
        function triggerTransitionAnimations(newTheme) {
            const isDarkToLight = newTheme === 'light';
            
            // Animation de morphing des icônes
            if (isDarkToLight) {
                button.classList.add('morphing-sun');
                button.classList.add('color-wave-light');
            } else {
                button.classList.add('morphing-moon');
                button.classList.add('color-wave-dark');
            }
            
            // Animation d'élasticité au clic
            button.classList.add('elastic-bounce');
            
            // Animation de vague de couleur sur la page
            document.body.classList.add('color-transition', 'wave-effect');
            
            // Nettoyer les animations après leur fin
            setTimeout(() => {
                button.classList.remove('morphing-sun', 'morphing-moon', 'color-wave-dark', 'color-wave-light', 'elastic-bounce');
                document.body.classList.remove('wave-effect');
            }, 1200);
            
            setTimeout(() => {
                document.body.classList.remove('color-transition');
            }, 1800);
        }

        // Événement de clic avec animations
        button.addEventListener('click', function() {
            console.log('Bouton de thème cliqué - Animation déclenchée');
            
            const currentTheme = getCurrentTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Déclencher les animations de transition AVANT le changement
            triggerTransitionAnimations(newTheme);
            
            // Attendre un peu pour que l'animation commence puis changer le thème
            setTimeout(() => {
                toggleTheme();
                setTimeout(updateButtonContent, 100); // Mettre à jour après le changement
            }, 200);
        });

        // Mise à jour initiale
        updateButtonContent();

        // Écouter les changements de thème
        window.addEventListener('themeChanged', updateButtonContent);

        // Ajouter au body
        document.body.appendChild(button);
        
        console.log('Bouton de thème global créé avec pictogrammes visibles');
    }

    /**
     * Basculer le thème
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`Changement de thème: ${currentTheme} → ${newTheme}`);
        
        // Appliquer le nouveau thème
        applyThemeInstantly(newTheme);
        
        // Utiliser theme-change si disponible
        if (window.themeChange && window.themeChange.theme) {
            window.themeChange.theme(newTheme);
        }
        
        // Déclencher événement personnalisé
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { 
                theme: newTheme,
                previousTheme: currentTheme 
            }
        }));
        
        // Synchroniser avec les autres onglets
        if (THEME_CONFIG.syncAcrossPages) {
            localStorage.setItem(THEME_CONFIG.storageKey, newTheme);
            
            // Déclencher storage event pour synchroniser les autres onglets
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: THEME_CONFIG.storageKey,
                    newValue: newTheme,
                    oldValue: currentTheme,
                    url: window.location.href
                }));
            } catch (e) {
                console.log('Synchronisation inter-onglets limitée');
            }
        }
    }

    /**
     * Obtenir le thème actuel
     */
    function getCurrentTheme() {
        const html = document.documentElement;
        return html.getAttribute('data-theme') || 
               (html.classList.contains('dark') ? 'dark' : 'light');
    }

    /**
     * Surveiller les changements dans les autres onglets
     */
    function setupCrossTabSync() {
        if (!THEME_CONFIG.syncAcrossPages) return;
        
        window.addEventListener('storage', function(e) {
            if (e.key === THEME_CONFIG.storageKey && e.newValue && e.newValue !== getCurrentTheme()) {
                const newTheme = e.newValue;
                console.log('Synchronisation inter-onglets:', newTheme);
                applyThemeInstantly(newTheme);
                
                // Utiliser theme-change si disponible
                if (window.themeChange && window.themeChange.theme) {
                    window.themeChange.theme(newTheme);
                }
                
                // Déclencher événement local
                window.dispatchEvent(new CustomEvent('themeChanged', {
                    detail: { 
                        theme: newTheme,
                        source: 'cross-tab-sync'
                    }
                }));
            }
        });
    }

    /**
     * Surveiller les changements de préférence système
     */
    function setupSystemThemeSync() {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', function(e) {
            // Seulement si aucun thème n'est défini manuellement
            if (!localStorage.getItem(THEME_CONFIG.storageKey)) {
                const systemTheme = e.matches ? 'dark' : 'light';
                applyThemeInstantly(systemTheme);
            }
        });
    }

    /**
     * Charger theme-change si pas déjà présent
     */
    function loadThemeChangeLibrary() {
        if (window.themeChange) {
            console.log('Theme-change déjà chargé');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/theme-change@2.5.0/index.js';
            script.async = true;
            
            script.onload = () => {
                console.log('Theme-change chargé depuis CDN');
                resolve();
            };
            
            script.onerror = () => {
                console.warn('Impossible de charger theme-change, utilisation du fallback');
                resolve(); // Continuer sans erreur
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Initialisation complète
     */
    async function init() {
        // Appliquer le thème immédiatement
        const initialTheme = detectInitialTheme();
        applyThemeInstantly(initialTheme);
        
        // Configuration de la synchronisation
        setupCrossTabSync();
        setupSystemThemeSync();
        
        // Charger theme-change
        await loadThemeChangeLibrary();
        
        // Créer le bouton quand le DOM est prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createThemeButton);
        } else {
            setTimeout(createThemeButton, 100); // Petit délai pour s'assurer que le CSS est chargé
        }
        
        console.log('✅ Système de thème global initialisé avec synchronisation');
    }

    // Exposer les fonctions globalement
    window.globalTheme = {
        toggle: toggleTheme,
        set: applyThemeInstantly,
        get: getCurrentTheme,
        init: init,
        createButton: createThemeButton
    };

    // Auto-initialisation
    init();
})();
