/**
 * Script pour la page moderne de détails du ticket
 * Inclut les fonctionnalités avancées :
 * - Éditeur de texte enrichi (Quill)
 * - Drag & Drop pour réorganiser les messages
 * - Support du collage direct d'images
 * - Upload de fichiers avec système drag & drop
 */

// Récupérer l'ID du ticket depuis l'URL
const ticketId = window.location.pathname.split('/').pop();

// Configuration de l'éditeur Quill
let quill;

// Gestion des fichiers à uploader
let filesToUpload = [];

// État de l'affichage des messages
let messageDisplayState = {
    layout: 'timeline', // 'timeline' ou 'grid'
    sort: 'newest'      // 'newest' ou 'oldest'
};

/**
 * Initialisation de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    initQuillEditor();
    loadTicketData();
    setupEventListeners();
    initEmojiPicker();
    initClipboardPaste();
});

/**
 * Initialise l'éditeur de texte enrichi Quill
 */
function initQuillEditor() {
    // Options de l'éditeur Quill
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean']
    ];

    // Initialiser Quill
    quill = new Quill('#editor-container', {
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Composez votre message...',
        theme: 'snow'
    });
}

/**
 * Configure tous les écouteurs d'événements
 */
function setupEventListeners() {
    // Envoyer un message
    document.getElementById('sendMessageBtn').addEventListener('click', handleSendMessage);
    
    // Basculer l'affichage des messages
    document.getElementById('toggleLayout').addEventListener('click', toggleMessagesLayout);
    
    // Trier les messages
    document.getElementById('sortMessages').addEventListener('click', toggleMessagesSort);
    
    // Bouton pour afficher la zone d'upload
    document.getElementById('fileUploadBtn').addEventListener('click', toggleUploadArea);
    
    // Bouton pour télécharger une image
    document.getElementById('imageUploadBtn').addEventListener('click', () => {
        const input = document.getElementById('fileInput');
        input.setAttribute('accept', 'image/*');
        input.click();
    });
    
    // Bouton pour parcourir les fichiers
    document.getElementById('browseFilesBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // Gestion des fichiers sélectionnés
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Emoji picker toggle
    document.getElementById('emojiBtn').addEventListener('click', toggleEmojiPicker);
    
    // Copy link button
    document.getElementById('copyLinkButton').addEventListener('click', copyTicketLink);
    
    // Toggle dark mode
    document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
    
    // Setup drag and drop pour la zone d'upload
    setupFileDragAndDrop();
}

/**
 * Initialise le sélecteur d'emoji
 */
function initEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    
    // Liste basique d'emoji
    const commonEmojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '😍', '🥰', '😘', '😗', '😚', '😙', '😋',
        '😛', '😜', '😝', '🤑', '🤗', '🤔', '🤐', '😐', '😑', '😶',
        '👍', '👎', '👏', '🙌', '🤝', '💪', '🤦', '🤷', '💯', '✅',
        '❓', '❗', '💬', '💭', '🔄', '⏳', '🔍', '🔒', '🚫', '⚠️'
    ];
    
    // Créer les éléments emoji
    commonEmojis.forEach(emoji => {
        const emojiSpan = document.createElement('div');
        emojiSpan.classList.add('emoji-item');
        emojiSpan.textContent = emoji;
        emojiSpan.addEventListener('click', () => insertEmoji(emoji));
        emojiPicker.appendChild(emojiSpan);
    });
}

/**
 * Insère un emoji dans l'éditeur Quill
 */
function insertEmoji(emoji) {
    const range = quill.getSelection(true);
    quill.insertText(range.index, emoji);
    document.getElementById('emojiPicker').classList.add('hidden');
}

/**
 * Charge les données du ticket et met à jour l'interface
 */
async function loadTicketData() {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        const data = await response.json();
        
        if (data.ticket && data.messages) {
            renderTicketDetails(data.ticket);
            renderMessages(data.messages);
            initMessageSorting();
            updateTitle(data.ticket);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Met à jour le titre de la page et de l'en-tête
 */
function updateTitle(ticket) {
    const title = `Ticket de ${ticket.caller}`;
    document.title = title;
    document.getElementById('ticketTitle').textContent = title;
    
    // Mettre à jour la date de dernière modification
    if (ticket.lastModifiedAt) {
        const date = new Date(ticket.lastModifiedAt).toLocaleString('fr-FR');
        document.getElementById('lastUpdated').textContent = `Dernière modification: ${date}`;
    }
}

/**
 * Affiche les détails du ticket
 */
function renderTicketDetails(ticket) {
    const container = document.getElementById('ticketDetails');
    
    // Formater les dates
    const createdDate = new Date(ticket.createdAt).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construire le HTML des tags
    let tagsHtml = '';
    if (ticket.tags && ticket.tags.length > 0) {
        tagsHtml = `
            <div class="flex flex-wrap gap-2 mt-2">
                ${ticket.tags.map(tag => `
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        ${tag}
                    </span>
                `).join('')}
            </div>
        `;
    }
    
    // Statuts
    const statusHtml = `
        <div class="flex items-center flex-wrap gap-2 mb-2">
            ${ticket.isGLPI ? `
                <div class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    GLPI
                </div>
            ` : ''}
            
            ${ticket.isBlocking ? `
                <div class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Bloquant
                </div>
            ` : ''}
        </div>
    `;
    
    // Informations sur la modification
    let modifiedHtml = '';
    if (ticket.lastModifiedBy) {
        const modifiedDate = new Date(ticket.lastModifiedAt).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        modifiedHtml = `
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Modifié le ${modifiedDate} par ${ticket.lastModifiedBy}
            </div>
        `;
    }
    
    // Générer le HTML
    container.innerHTML = `
        <div>
            <div class="flex justify-between items-start flex-wrap gap-2">
                <div>
                    <h1 class="text-xl md:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                        Ticket de ${ticket.caller}
                    </h1>
                    ${statusHtml}
                    <p class="text-gray-700 dark:text-gray-300 mb-2">${ticket.reason || 'Ticket GLPI'}</p>
                    ${tagsHtml}
                </div>
            </div>
            
            <div class="mt-3 text-sm text-gray-500 dark:text-gray-400 border-t pt-2 dark:border-gray-700">
                <div>
                    Créé le ${createdDate} par ${ticket.createdBy}
                </div>
                ${modifiedHtml}
            </div>
        </div>
    `;
}

/**
 * Affiche les messages du ticket
 */
function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="far fa-comment-dots text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500 dark:text-gray-400">Aucun message pour ce ticket.</p>
            </div>
        `;
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Afficher chaque message
    messages.forEach((message, index) => {
        const messageElem = createMessageElement(message, index);
        container.appendChild(messageElem);
    });
}

/**
 * Crée un élément de message
 */
function createMessageElement(message, index) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bg-white', 'dark:bg-gray-800', 'p-4', 'animate-fade-in');
    messageDiv.dataset.id = message.id;
    messageDiv.dataset.index = index;
    
    // Formater la date
    const messageDate = new Date(message.createdAt).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construire le HTML du contenu selon le type
    let contentHtml = '';
    if (message.type === 'text') {
        contentHtml = `<div class="message-content whitespace-pre-wrap text-gray-700 dark:text-gray-300">${message.content}</div>`;
    } else if (message.type === 'image') {
        contentHtml = `
            <div class="message-content mt-2">
                <img src="${message.content}" alt="Image" class="rounded shadow message-image">
            </div>
        `;
    } else if (message.type === 'file') {
        // Pour les futurs types de fichiers
        contentHtml = `
            <div class="message-content mt-2">
                <div class="file-attachment">
                    <i class="far fa-file mr-2 text-gray-500"></i>
                    <a href="${message.content}" target="_blank" class="text-blue-500 hover:underline">${message.fileName || 'Fichier joint'}</a>
                </div>
            </div>
        `;
    }
    
    // Générer le HTML
    messageDiv.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="message-handle text-gray-400">
                <i class="fas fa-grip-vertical"></i>
            </div>
            
            <div class="flex-grow">
                <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <div class="flex items-center">
                        <span class="font-medium text-gray-900 dark:text-white">${message.author}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ${messageDate}
                        </span>
                    </div>
                    
                    <div class="text-xs text-gray-400">
                        #${index + 1}
                    </div>
                </div>
                
                ${contentHtml}
            </div>
        </div>
    `;
    
    return messageDiv;
}

/**
 * Initialise le tri par glisser-déposer des messages
 */
function initMessageSorting() {
    const container = document.getElementById('messagesContainer');
    
    new Sortable(container, {
        animation: 150,
        handle: '.message-handle',
        ghostClass: 'bg-gray-100 dark:bg-gray-700',
        onEnd: function(evt) {
            saveMessagesOrder(getMessagesOrder());
        }
    });
}

/**
 * Récupère l'ordre actuel des messages
 */
function getMessagesOrder() {
    const messages = document.querySelectorAll('.message');
    const order = [];
    
    messages.forEach(message => {
        order.push({
            id: message.dataset.id,
            index: parseInt(message.dataset.index)
        });
    });
    
    return order;
}

/**
 * Sauvegarde l'ordre des messages
 */
function saveMessagesOrder(order) {
    // À implémenter: API pour sauvegarder l'ordre des messages
    console.log('Nouvel ordre des messages:', order);
    
    showNotification('Ordre des messages mis à jour', 'success');
}

/**
 * Gère l'envoi d'un nouveau message
 */
async function handleSendMessage() {
    // Récupérer le contenu de l'éditeur
    const content = quill.root.innerHTML.trim();
    
    if (!content && filesToUpload.length === 0) {
        showNotification('Veuillez saisir un message ou ajouter un fichier', 'warning');
        return;
    }
    
    try {
        if (content) {
            await sendTextMessage(content);
        }
        
        if (filesToUpload.length > 0) {
            await uploadFiles();
        }
        
        // Réinitialiser l'éditeur et la liste des fichiers
        quill.setText('');
        filesToUpload = [];
        document.getElementById('previewArea').innerHTML = '';
        document.getElementById('uploadArea').classList.add('hidden');
        
        // Recharger les données
        loadTicketData();
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showNotification('Erreur lors de l\'envoi du message', 'error');
    }
}

/**
 * Envoie un message texte
 */
async function sendTextMessage(htmlContent) {
    const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: htmlContent, type: 'html' })
    });
    
    if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
    }
    
    return true;
}

/**
 * Télécharge les fichiers sélectionnés
 */
async function uploadFiles() {
    for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`/api/tickets/${ticketId}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de l'envoi du fichier ${file.name}`);
        }
    }
    
    return true;
}

/**
 * Gère la sélection de fichiers via l'input file
 */
function handleFileSelect(event) {
    const files = event.target.files;
    
    if (files.length > 0) {
        for (const file of files) {
            addFileToUploadList(file);
        }
        
        // Afficher la zone de prévisualisation
        document.getElementById('uploadArea').classList.remove('hidden');
    }
    
    // Réinitialiser l'input pour permettre la sélection du même fichier
    event.target.value = '';
}

/**
 * Ajoute un fichier à la liste des fichiers à télécharger
 */
function addFileToUploadList(file) {
    // Vérifier si le fichier est déjà dans la liste
    if (filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
        return;
    }
    
    // Ajouter le fichier à la liste
    filesToUpload.push(file);
    
    // Créer la prévisualisation
    const previewElem = document.createElement('div');
    previewElem.classList.add('file-preview', 'animate-scale-in');
    
    // Vérifier si c'est une image
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewElem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button class="file-remove" data-filename="${file.name}" title="Supprimer">
                    <i class="fas fa-times"></i>
                </button>
            `;
        };
        
        reader.readAsDataURL(file);
    } else {
        // Pour les autres types de fichiers
        previewElem.innerHTML = `
            <div class="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <i class="far fa-file text-3xl text-gray-500"></i>
            </div>
            <button class="file-remove" data-filename="${file.name}" title="Supprimer">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    // Ajouter l'événement pour supprimer le fichier
    previewElem.querySelector('.file-remove').addEventListener('click', function() {
        removeFileFromUploadList(file.name);
        previewElem.remove();
    });
    
    // Ajouter la prévisualisation à la zone
    document.getElementById('previewArea').appendChild(previewElem);
}

/**
 * Retire un fichier de la liste des fichiers à télécharger
 */
function removeFileFromUploadList(filename) {
    filesToUpload = filesToUpload.filter(file => file.name !== filename);
    
    // Masquer la zone si plus aucun fichier
    if (filesToUpload.length === 0) {
        document.getElementById('uploadArea').classList.add('hidden');
    }
}

/**
 * Configure le glisser-déposer des fichiers
 */
function setupFileDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    // Empêcher le comportement par défaut (ouvrir le fichier)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Mettre en surbrillance la zone lors du survol
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    // Réinitialiser la zone après le survol/dépose
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Gérer le dépose des fichiers
    uploadArea.addEventListener('drop', handleDrop, false);
    
    // Dépose sur toute la page
    document.body.addEventListener('drop', function(e) {
        // Éviter l'ouverture du fichier dans le navigateur
        preventDefaults(e);
        
        // Afficher la zone de dépose
        uploadArea.classList.remove('hidden');
        
        // Traiter les fichiers
        handleDrop(e);
    }, false);
}

/**
 * Empêche le comportement par défaut des événements
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Met en surbrillance la zone de dépose
 */
function highlight() {
    document.getElementById('uploadArea').classList.add('drag-over');
}

/**
 * Retire la surbrillance de la zone de dépose
 */
function unhighlight() {
    document.getElementById('uploadArea').classList.remove('drag-over');
}

/**
 * Gère la dépose des fichiers
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        for (const file of files) {
            addFileToUploadList(file);
        }
    }
}

/**
 * Bascule l'affichage de la zone d'upload
 */
function toggleUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.toggle('hidden');
}

/**
 * Bascule l'affichage du sélecteur d'emoji
 */
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    emojiPicker.classList.toggle('hidden');
}

/**
 * Bascule le mode d'affichage des messages
 */
function toggleMessagesLayout() {
    const container = document.getElementById('messagesContainer');
    const messages = container.querySelectorAll('.message');
    const layoutButton = document.getElementById('toggleLayout');
    
    // Basculer entre timeline et grid
    if (messageDisplayState.layout === 'timeline') {
        container.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4');
        container.classList.remove('space-y-4');
        layoutButton.innerHTML = '<i class="fas fa-list text-gray-600 dark:text-gray-400"></i>';
        messageDisplayState.layout = 'grid';
    } else {
        container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4');
        container.classList.add('space-y-4');
        layoutButton.innerHTML = '<i class="fas fa-th-list text-gray-600 dark:text-gray-400"></i>';
        messageDisplayState.layout = 'timeline';
    }
}

/**
 * Bascule l'ordre de tri des messages
 */
function toggleMessagesSort() {
    const container = document.getElementById('messagesContainer');
    const messages = Array.from(container.querySelectorAll('.message'));
    const sortButton = document.getElementById('sortMessages');
    
    // Inverser les messages
    messageDisplayState.sort = messageDisplayState.sort === 'newest' ? 'oldest' : 'newest';
    
    // Mettre à jour l'icône
    if (messageDisplayState.sort === 'newest') {
        sortButton.innerHTML = '<i class="fas fa-sort-amount-down text-gray-600 dark:text-gray-400"></i>';
    } else {
        sortButton.innerHTML = '<i class="fas fa-sort-amount-up text-gray-600 dark:text-gray-400"></i>';
    }
    
    // Trier et réinsérer les messages
    messages.sort((a, b) => {
        const indexA = parseInt(a.dataset.index);
        const indexB = parseInt(b.dataset.index);
        
        return messageDisplayState.sort === 'newest' 
            ? indexB - indexA  // Plus récent d'abord
            : indexA - indexB; // Plus ancien d'abord
    });
    
    // Vider et reconstruire le conteneur
    container.innerHTML = '';
    messages.forEach(message => {
        container.appendChild(message);
    });
}

/**
 * Copie le lien du ticket dans le presse-papier
 */
function copyTicketLink() {
    const url = window.location.href;
    
    // Utiliser l'API moderne si disponible, sinon fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => showNotification('Lien copié dans le presse-papier', 'success'))
            .catch(err => {
                console.error('Erreur lors de la copie du lien:', err);
                fallbackCopyTextToClipboard(url);
            });
    } else {
        fallbackCopyTextToClipboard(url);
    }
}

/**
 * Méthode alternative pour copier du texte
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Rendre l'élément invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Lien copié dans le presse-papier', 'success');
        } else {
            showNotification('Impossible de copier le lien', 'error');
        }
    } catch (err) {
        console.error('Erreur lors de la copie du lien:', err);
        showNotification('Impossible de copier le lien', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Bascule le mode sombre
 */
function toggleDarkMode() {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Mettre à jour l'icône
    const icon = document.querySelector('.dark-mode-toggle');
    if (isDarkMode) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

/**
 * Initialise la détection de collage d'images depuis le presse-papier
 */
function initClipboardPaste() {
    // Écouter les événements de collage sur tout le document
    document.addEventListener('paste', function(e) {
        // Vérifier si l'éditeur est actif
        if (!quill.hasFocus()) return;
        
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const file = item.getAsFile();
                e.preventDefault();
                
                // Ajouter le fichier à la liste et afficher la prévisualisation
                addFileToUploadList(file);
                document.getElementById('uploadArea').classList.remove('hidden');
                
                showNotification('Image ajoutée depuis le presse-papier', 'success');
                break;
            }
        }
    });
} 