/**
 * UltraThemeManager - Gestionnaire de thème ultra-moderne
 * Animations fluides, physique de ressort, micro-interactions délicieuses
 * Basé sur les meilleures pratiques UX Motion Design 2025
 */

class UltraThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.isTransitioning = false;
        this.buttonElement = null;
        this.iconContainer = null;
        this.particlesContainer = null;
        this.themes = ['light', 'dark'];
        
        // Configuration des animations avec courbes de Bézier optimisées
        this.animationConfig = {
            // Durées optimisées selon les standards UX (150-300ms)
            transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            iconRotation: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            particleFloat: 'sparkle-float 1.5s ease-out',
            // Courbes de Bézier pour différents effets
            spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Ressort élégant
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Rebond dramatique
            smooth: 'cubic-bezier(0.25, 0.8, 0.25, 1)', // Transition fluide
            sharp: 'cubic-bezier(0.4, 0, 0.2, 1)' // Transition nette
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Charger theme-change en CDN avec fallback
            await this.loadThemeLibrary();
            
            // Initialiser le thème depuis localStorage ou système
            this.initializeTheme();
            
            // Créer le bouton ultra-moderne
            this.createUltraButton();
            
            // Observer les changements de thème
            this.observeThemeChanges();
            
            console.log('✨ UltraThemeManager initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation UltraThemeManager:', error);
            this.fallbackMode();
        }
    }
    
    async loadThemeLibrary() {
        // Vérifier si theme-change est déjà chargé
        if (window.themeChange) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/theme-change@2.5.0/index.min.js';
            script.onload = () => {
                console.log('📦 Theme-change library loaded');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ CDN failed, using fallback mode');
                resolve(); // Continue en mode fallback
            };
            document.head.appendChild(script);
            
            // Timeout de 3 secondes
            setTimeout(() => resolve(), 3000);
        });
    }
    
    initializeTheme() {
        // Récupérer le thème sauvegardé ou détection système
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        
        this.currentTheme = savedTheme || systemTheme;
        
        // Appliquer le thème immédiatement
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.body.className = `theme-${this.currentTheme}`;
        
        console.log(`🎨 Thème initial: ${this.currentTheme}`);
    }
    
    createUltraButton() {
        // Supprimer l'ancien bouton s'il existe
        const oldButton = document.getElementById('ultra-theme-toggle');
        if (oldButton) {
            oldButton.remove();
        }
        
        // Créer le conteneur principal
        this.buttonElement = document.createElement('button');
        this.buttonElement.id = 'ultra-theme-toggle';
        this.buttonElement.className = 'ultra-theme-button';
        this.buttonElement.setAttribute('aria-label', 'Changer le thème');
        this.buttonElement.setAttribute('role', 'switch');
        this.buttonElement.setAttribute('aria-checked', this.currentTheme === 'dark');
        
        // Conteneur des icônes avec rotation fluide
        this.iconContainer = document.createElement('div');
        this.iconContainer.className = 'ultra-icon-container';
        
        // Icône soleil
        const sunIcon = document.createElement('div');
        sunIcon.className = `theme-icon sun-icon ${this.currentTheme === 'light' ? 'active' : 'inactive'}`;
        
        // Icône lune
        const moonIcon = document.createElement('div');
        moonIcon.className = `theme-icon moon-icon ${this.currentTheme === 'dark' ? 'active' : 'inactive'}`;
        
        // Conteneur des particules magiques
        this.particlesContainer = document.createElement('div');
        this.particlesContainer.className = 'magic-particles';
        
        // Créer 4 particules
        for (let i = 0; i < 4; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            this.particlesContainer.appendChild(particle);
        }
        
        // Assembler le bouton
        this.iconContainer.appendChild(sunIcon);
        this.iconContainer.appendChild(moonIcon);
        this.buttonElement.appendChild(this.iconContainer);
        this.buttonElement.appendChild(this.particlesContainer);
        
        // Événements avec debounce pour éviter les clics multiples
        this.buttonElement.addEventListener('click', this.debounce(this.handleUltraToggle.bind(this), 300));
        
        // Événements de survol pour micro-interactions
        this.buttonElement.addEventListener('mouseenter', this.handleHover.bind(this));
        this.buttonElement.addEventListener('mouseleave', this.handleHoverEnd.bind(this));
        
        // Injecter dans le DOM
        document.body.appendChild(this.buttonElement);
        
        // Animation d'entrée après un court délai
        setTimeout(() => {
            this.buttonElement.classList.add('loaded');
        }, 100);
        
        console.log('🚀 Bouton ultra-moderne créé');
    }
    
    async handleUltraToggle() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.buttonElement.classList.add('theme-switching');
        
        try {
            // Animation des particules
            this.triggerParticleEffect();
            
            // Changer le thème avec animation fluide
            await this.animateThemeTransition();
            
            // Mettre à jour les icônes
            this.updateIconsWithAnimation();
            
            // Feedback haptique sur mobile
            this.triggerHapticFeedback();
            
            console.log(`✨ Thème changé vers: ${this.currentTheme}`);
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de thème:', error);
        } finally {
            setTimeout(() => {
                this.isTransitioning = false;
                this.buttonElement.classList.remove('theme-switching');
            }, 600);
        }
    }
    
    async animateThemeTransition() {
        // Calculer le nouveau thème
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Phase 1: Pré-animation
        this.buttonElement.style.transform = 'scale(0.9) rotate(-15deg)';
        
        await this.wait(100);
        
        // Phase 2: Changement de thème
        this.currentTheme = newTheme;
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.body.className = `theme-${this.currentTheme}`;
        localStorage.setItem('theme', this.currentTheme);
        
        // Mettre à jour l'attribut ARIA
        this.buttonElement.setAttribute('aria-checked', this.currentTheme === 'dark');
        
        await this.wait(200);
        
        // Phase 3: Animation de retour
        this.buttonElement.style.transform = 'scale(1.05) rotate(15deg)';
        
        await this.wait(150);
        
        // Phase 4: État final
        this.buttonElement.style.transform = 'scale(1) rotate(0deg)';
    }
    
    updateIconsWithAnimation() {
        const sunIcon = this.buttonElement.querySelector('.sun-icon');
        const moonIcon = this.buttonElement.querySelector('.moon-icon');
        
        if (this.currentTheme === 'light') {
            // Activer soleil, désactiver lune
            sunIcon.classList.remove('inactive');
            sunIcon.classList.add('active');
            moonIcon.classList.remove('active');
            moonIcon.classList.add('inactive');
        } else {
            // Activer lune, désactiver soleil
            moonIcon.classList.remove('inactive');
            moonIcon.classList.add('active');
            sunIcon.classList.remove('active');
            sunIcon.classList.add('inactive');
        }
    }
    
    triggerParticleEffect() {
        this.particlesContainer.classList.add('active');
        
        // Désactiver après l'animation
        setTimeout(() => {
            this.particlesContainer.classList.remove('active');
        }, 1500);
    }
    
    triggerHapticFeedback() {
        // Vibration légère sur les appareils compatibles
        if (navigator.vibrate) {
            navigator.vibrate([10, 5, 10]);
        }
    }
    
    handleHover() {
        if (this.isTransitioning) return;
        
        // Micro-interaction au survol
        this.buttonElement.style.transform = 'scale(1.08) rotate(5deg)';
        
        // Animation subtile des particules
        this.particlesContainer.style.opacity = '0.3';
    }
    
    handleHoverEnd() {
        if (this.isTransitioning) return;
        
        // Retour à l'état normal
        this.buttonElement.style.transform = 'scale(1) rotate(0deg)';
        this.particlesContainer.style.opacity = '0';
    }
    
    observeThemeChanges() {
        // Observer les changements système
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const systemTheme = e.matches ? 'dark' : 'light';
                if (systemTheme !== this.currentTheme) {
                    this.currentTheme = systemTheme;
                    this.animateThemeTransition();
                    this.updateIconsWithAnimation();
                }
            }
        });
        
        // Observer les changements manuels du DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme');
                    if (newTheme && newTheme !== this.currentTheme) {
                        this.currentTheme = newTheme;
                        this.updateIconsWithAnimation();
                    }
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    // Méthodes utilitaires
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    fallbackMode() {
        console.log('🔧 Mode fallback activé');
        // Mode dégradé gracieux sans les animations avancées
        this.createSimpleButton();
    }
    
    createSimpleButton() {
        const button = document.createElement('button');
        button.id = 'fallback-theme-toggle';
        button.innerHTML = '🌓';
        button.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: rgba(0,0,0,0.1);
            cursor: pointer;
            font-size: 24px;
            z-index: 10000;
        `;
        
        button.addEventListener('click', () => {
            const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.currentTheme = newTheme;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        document.body.appendChild(button);
    }
    
    // API publique pour contrôle externe
    setTheme(theme) {
        if (this.themes.includes(theme) && theme !== this.currentTheme) {
            this.currentTheme = theme;
            this.animateThemeTransition();
            this.updateIconsWithAnimation();
        }
    }
    
    getTheme() {
        return this.currentTheme;
    }
    
    toggleAttention() {
        this.buttonElement.classList.add('attention');
        setTimeout(() => {
            this.buttonElement.classList.remove('attention');
        }, 6000);
    }
}

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ultraThemeManager = new UltraThemeManager();
    });
} else {
    window.ultraThemeManager = new UltraThemeManager();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraThemeManager;
}
