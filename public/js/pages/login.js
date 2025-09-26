// Classe d'autocomplétion améliorée compatible avec ThemeManager
class Autocomplete {
    constructor(input, items) {
        this.input = input;
        this.items = items;
        this.currentFocus = -1;
        this.setup();
    }

    setup() {
        // Création de la liste d'autocomplétion
        this.list = document.createElement('div');
        this.list.classList.add('autocomplete-list');
        this.input.parentNode.appendChild(this.list);

        // Ajout des écouteurs d'événements
        this.input.addEventListener('input', () => this.updateList());
        this.input.addEventListener('focus', () => this.updateList());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Fermer la liste quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.list.contains(e.target)) {
                this.list.classList.remove('show');
            }
        });
    }

    updateList() {
        const value = this.input.value.toLowerCase();
        this.currentFocus = -1;
        this.list.innerHTML = '';

        // Afficher toutes les suggestions si le champ est vide
        if (!value) {
            // Optionnel : afficher toutes les options ou masquer la liste
            if (this.items.length > 0) {
                this.list.classList.add('show');
                this.items.forEach(item => this.addItemToList(item));
            } else {
                this.list.classList.remove('show');
            }
            return;
        }

        // Filtrer les éléments correspondants
        const matchingItems = this.items.filter(item =>
            item.toLowerCase().includes(value)
        );

        // Afficher les éléments filtrés
        if (matchingItems.length) {
            this.list.classList.add('show');
            matchingItems.forEach(item => this.addItemToList(item));
        } else {
            this.list.classList.remove('show');
        }
    }

    addItemToList(item) {
        const div = document.createElement('div');
        div.classList.add('autocomplete-item');
        
        // Mettre en surbrillance la partie correspondante
        const value = this.input.value.toLowerCase();
        if (value && item.toLowerCase().includes(value)) {
            const index = item.toLowerCase().indexOf(value);
            const before = item.substring(0, index);
            const match = item.substring(index, index + value.length);
            const after = item.substring(index + value.length);
            
            div.innerHTML = before + 
                           '<strong>' + match + '</strong>' + 
                           after;
        } else {
            div.textContent = item;
        }
        
        div.addEventListener('click', () => {
            this.input.value = item;
            this.list.classList.remove('show');
            
            // Vérification pour redirection admin
            if (item.toLowerCase() === 'admin') {
                window.location.href = '/admin/create-ticket';
            }
        });
        
        this.list.appendChild(div);
        
        // Appliquer les styles basés sur le thème actuel
        if (document.documentElement.classList.contains('dark')) {
            div.style.color = '#f3f4f6';
        }
    }

    handleKeydown(e) {
        const items = this.list.getElementsByTagName('div');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            this.currentFocus++;
            if (this.currentFocus >= items.length) this.currentFocus = 0;
            this.setActive(items);
            e.preventDefault(); // Empêcher le défilement de la page
        } else if (e.key === 'ArrowUp') {
            this.currentFocus--;
            if (this.currentFocus < 0) this.currentFocus = items.length - 1;
            this.setActive(items);
            e.preventDefault(); // Empêcher le défilement de la page
        } else if (e.key === 'Enter' && this.currentFocus > -1) {
            e.preventDefault();
            items[this.currentFocus].click();
        } else if (e.key === 'Escape') {
            this.list.classList.remove('show');
            e.preventDefault();
        }
    }

    setActive(items) {
        Array.from(items).forEach(item => item.classList.remove('selected'));
        if (this.currentFocus > -1) {
            items[this.currentFocus].classList.add('selected');
            
            // Assurer que l'élément sélectionné est visible dans la liste déroulante
            items[this.currentFocus].scrollIntoView({
                behavior: 'smooth', 
                block: 'nearest'
            });
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialiser les styles de formulaire
        if (typeof initFormStyles === 'function') {
            initFormStyles();
        }
        
        // Charger les données utilisateur
        const response = await fetch('/api/users');
        const userData = await response.json();
        
        // Configurer l'autocomplétion pour le champ username
        const usernameInput = document.querySelector('input[name="username"]');
        new Autocomplete(usernameInput, userData);
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
    }
}); 