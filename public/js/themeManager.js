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
        button.style.cssText = 'position: fixed; bottom: 1rem; right: 1rem; padding: 0.5rem; background: white; border-radius: 9999px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 50;';
        button.innerHTML = `
            <svg id="theme-toggle-light-icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
            </svg>
            <svg id="theme-toggle-dark-icon" class="w-6 h-6 hidden" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
        `;

        button.addEventListener('mouseenter', () => {
            button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            button.style.transform = 'scale(1.1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            button.style.transform = 'scale(1)';
        });

        button.style.transition = 'all 0.3s ease';
        document.body.appendChild(button);
    }

    loadTheme() {
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        this.setTheme(isDark);
    }

    setTheme(isDark) {
        const darkIcon = document.getElementById('theme-toggle-dark-icon');
        const lightIcon = document.getElementById('theme-toggle-light-icon');
        const themeToggle = document.getElementById('theme-toggle');
        
        document.documentElement.classList.toggle('dark', isDark);
        darkIcon.classList.toggle('hidden', !isDark);
        lightIcon.classList.toggle('hidden', isDark);

        // Sélectionneurs pour la page de statistiques
        const mainCard = document.querySelectorAll('.bg-white');
        const inputs = document.querySelectorAll('input, select');
        const statsLink = document.querySelector('a[href="/"]');
        const titles = document.querySelectorAll('h1, h2, h3, label');
        const buttons = document.querySelectorAll('button');
        const statBoxes = document.querySelectorAll('.bg-gray-50');
        const loadingIndicator = document.querySelector('#loading .bg-white');

        if (isDark) {
            // Mode sombre
            document.body.style.backgroundColor = '#1f2937';
            mainCard.forEach(card => {
                card.style.backgroundColor = '#374151';
            });
            themeToggle.style.backgroundColor = '#374151';
            themeToggle.style.color = 'white';
            
            // Styles des textes
            titles.forEach(el => {
                el.style.color = 'white';
            });
            
            // Styles des inputs
            inputs.forEach(input => {
                input.style.backgroundColor = '#1f2937';
                input.style.borderColor = '#4b5563';
                input.style.color = 'white';
            });
            
            // Style du lien retour
            if (statsLink) {
                statsLink.style.color = '#93c5fd';
            }

            // Style des boîtes de statistiques
            statBoxes.forEach(box => {
                box.style.backgroundColor = '#4b5563';
            });

            // Mise à jour des couleurs des graphiques si ils existent
            this.updateChartsTheme(true);

            if (loadingIndicator) {
                loadingIndicator.style.backgroundColor = '#374151';
                loadingIndicator.style.color = 'white';
            }

        } else {
            // Mode clair
            document.body.style.backgroundColor = '#f3f4f6';
            mainCard.forEach(card => {
                card.style.backgroundColor = 'white';
            });
            themeToggle.style.backgroundColor = 'white';
            themeToggle.style.color = 'black';
            
            // Styles des textes
            titles.forEach(el => {
                el.style.color = '#1f2937';
            });
            
            // Styles des inputs
            inputs.forEach(input => {
                input.style.backgroundColor = 'white';
                input.style.borderColor = '#e5e7eb';
                input.style.color = '#1f2937';
            });
            
            // Style du lien retour
            if (statsLink) {
                statsLink.style.color = '#3b82f6';
            }

            // Style des boîtes de statistiques
            statBoxes.forEach(box => {
                box.style.backgroundColor = '#f9fafb';
            });

            // Mise à jour des couleurs des graphiques
            this.updateChartsTheme(false);

            if (loadingIndicator) {
                loadingIndicator.style.backgroundColor = 'white';
                loadingIndicator.style.color = '#1f2937';
            }
        }

        // Transitions
        document.body.style.transition = 'background-color 0.3s ease';
        mainCard.forEach(card => {
            card.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
        });
        document.querySelectorAll('h1, h2, h3, label, input, button, a').forEach(el => {
            el.style.transition = 'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease';
        });
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    updateChartsTheme(isDark) {
        // Si Chart.js est disponible et qu'il y a des graphiques
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

            // Mettre à jour tous les graphiques existants
            Chart.helpers.each(Chart.instances, (chart) => {
                chart.options.plugins.legend.labels.color = chartColors.text;
                chart.options.scales.y.grid.color = chartColors.grid;
                chart.options.scales.x.grid.color = chartColors.grid;
                chart.options.scales.y.ticks.color = chartColors.text;
                chart.options.scales.x.ticks.color = chartColors.text;
                
                // Mise à jour des couleurs des datasets
                chart.data.datasets.forEach(dataset => {
                    if (dataset.type === 'line') {
                        dataset.borderColor = chartColors.lineColor;
                    } else if (dataset.type === 'bar') {
                        dataset.backgroundColor = chartColors.barColor;
                    }
                });
                
                chart.update();
            });
        }
    }

    addListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.setTheme(!document.documentElement.classList.contains('dark'));
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches);
            }
        });
    }
}

new ThemeManager();