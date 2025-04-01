/**
 * Gestion des commandes spéciales pour l'application
 */

// Liste des commandes disponibles
const COMMANDS = {
  'removetime1': {
    description: 'Décale tous les tickets de la journée en cours de -1 heure',
    handler: () => adjustTicketTimes(-1),
    shortcut: 'Alt+1'
  },
  'removetime2': {
    description: 'Décale tous les tickets de la journée en cours de -2 heures',
    handler: () => adjustTicketTimes(-2),
    shortcut: 'Alt+2'
  },
  'help': {
    description: 'Affiche la liste des commandes disponibles',
    handler: showCommandsHelp,
    shortcut: 'Alt+H'
  },
  'directremove1': {
    description: 'Décale directement tous les tickets de la journée en cours de -1 heure (sans confirmation)',
    handler: () => {
      showNotification("Exécution directe...", "info");
      adjustTicketTimes(-1);
    },
    shortcut: 'Shift+Alt+1'
  },
  'directremove2': {
    description: 'Décale directement tous les tickets de la journée en cours de -2 heures (sans confirmation)',
    handler: () => {
      showNotification("Exécution directe...", "info");
      adjustTicketTimes(-2);
    },
    shortcut: 'Shift+Alt+2'
  }
};

/**
 * Initialise le gestionnaire de commandes
 */
function initCommandHandler() {
  // Écouter l'événement 'keydown' pour détecter les commandes
  document.addEventListener('keydown', (event) => {
    // Vérifier si la touche Control est pressée pour ouvrir l'invite de commande
    if (event.ctrlKey && event.key === ' ') {
      event.preventDefault();
      showCommandPrompt();
      return;
    }
    
    // Raccourcis clavier pour les commandes
    if (event.altKey) {
      // Parcourir les commandes pour trouver celles qui ont un raccourci correspondant
      for (const [cmdName, cmdInfo] of Object.entries(COMMANDS)) {
        if (cmdInfo.shortcut && isShortcutMatch(cmdInfo.shortcut, event)) {
          event.preventDefault();
          
          // Si la commande commence par "direct", exécuter directement sans confirmation
          if (cmdName.startsWith('direct')) {
            executeCommand(cmdName);
          } else {
            confirmCommand(cmdName);
          }
          return;
        }
      }
    }
  });
  
  console.log('✅ Gestionnaire de commandes initialisé');
}

/**
 * Vérifie si un événement clavier correspond à un raccourci
 * @param {string} shortcut - Le raccourci à vérifier (ex: "Alt+1")
 * @param {KeyboardEvent} event - L'événement clavier
 * @returns {boolean} - True si l'événement correspond au raccourci
 */
function isShortcutMatch(shortcut, event) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop();
  
  const modifiers = {
    alt: parts.includes('alt'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command')
  };
  
  // Vérifier si les modificateurs correspondent
  if (modifiers.alt !== event.altKey) return false;
  if (modifiers.ctrl !== event.ctrlKey) return false;
  if (modifiers.shift !== event.shiftKey) return false;
  if (modifiers.meta !== event.metaKey) return false;
  
  // Vérifier si la touche correspond
  if (key === event.key.toLowerCase() || 
      key === event.code.toLowerCase() || 
      key === event.keyCode.toString()) {
    return true;
  }
  
  return false;
}

/**
 * Affiche l'aide des commandes disponibles
 */
function showCommandsHelp() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'helpModal';
  
  let commandsList = '';
  for (const [cmdName, cmdInfo] of Object.entries(COMMANDS)) {
    commandsList += `
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <td class="py-2 px-4 text-left font-mono text-blue-600 dark:text-blue-400">${cmdName}</td>
        <td class="py-2 px-4 text-left">${cmdInfo.description}</td>
        <td class="py-2 px-4 text-left font-mono text-gray-600 dark:text-gray-400">${cmdInfo.shortcut || '-'}</td>
      </tr>
    `;
  }
  
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-[600px] max-w-full">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Commandes disponibles</h2>
        <button id="closeHelp" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      
      <div class="border dark:border-gray-700 rounded-lg overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commande</th>
              <th class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
              <th class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Raccourci</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800">
            ${commandsList}
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Pour ouvrir l'invite de commande, appuyez sur <kbd class="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">Ctrl + Espace</kbd></p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fermer l'aide avec le bouton ou Escape
  document.getElementById('closeHelp').addEventListener('click', () => {
    modal.remove();
  });
  
  document.addEventListener('keydown', function closeHelpOnEscape(event) {
    if (event.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeHelpOnEscape);
    }
  });
}

/**
 * Affiche l'invite de commande
 */
function showCommandPrompt() {
  // Créer la fenêtre modale pour l'invite de commande
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'commandPrompt';
  
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-96">
      <h2 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Commande</h2>
      <input type="text" id="commandInput" 
        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        placeholder="Entrez une commande...">
      <div class="flex justify-end mt-4">
        <button id="cancelCommand" 
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-2">
          Annuler
        </button>
        <button id="executeCommand" 
          class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded">
          Exécuter
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus sur l'input
  const input = document.getElementById('commandInput');
  input.focus();
  
  // Gérer la soumission
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      processCommand(input.value);
    } else if (event.key === 'Escape') {
      closeCommandPrompt();
    }
  });
  
  // Gérer les boutons
  document.getElementById('cancelCommand').addEventListener('click', closeCommandPrompt);
  document.getElementById('executeCommand').addEventListener('click', () => {
    processCommand(input.value);
  });
}

/**
 * Ferme l'invite de commande
 */
function closeCommandPrompt() {
  const modal = document.getElementById('commandPrompt');
  if (modal) {
    modal.remove();
  }
}

/**
 * Traite la commande entrée
 * @param {string} command - La commande entrée par l'utilisateur
 */
function processCommand(command) {
  command = command.trim().toLowerCase();
  
  if (COMMANDS[command]) {
    closeCommandPrompt();
    confirmCommand(command);
  } else {
    showNotification(`Commande inconnue: ${command}`, 'error');
    closeCommandPrompt();
  }
}

/**
 * Demande une confirmation avant d'exécuter une commande
 * @param {string} command - La commande à exécuter
 */
function confirmCommand(command) {
  const commandInfo = COMMANDS[command];
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'confirmModal';
  
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-96">
      <h2 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Confirmation</h2>
      <p class="mb-4 text-gray-700 dark:text-gray-300">
        Êtes-vous sûr de vouloir exécuter la commande "${command}" ?
        <br><br>
        <span class="font-medium">${commandInfo.description}</span>
      </p>
      <div class="flex justify-end">
        <button id="cancelConfirm" 
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-2">
          Annuler
        </button>
        <button id="confirmExecute" 
          class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded">
          Exécuter
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Gérer les boutons
  document.getElementById('cancelConfirm').addEventListener('click', () => {
    document.getElementById('confirmModal').remove();
  });
  
  document.getElementById('confirmExecute').addEventListener('click', () => {
    document.getElementById('confirmModal').remove();
    executeCommand(command);
  });
}

/**
 * Exécute la commande
 * @param {string} command - La commande à exécuter
 */
function executeCommand(command) {
  if (COMMANDS[command]) {
    COMMANDS[command].handler();
  }
}

/**
 * Ajuste l'heure des tickets de la journée en cours
 * @param {number} hours - Le nombre d'heures à ajouter (négatif pour soustraire)
 */
async function adjustTicketTimes(hours) {
  try {
    // Afficher un indicateur de chargement
    showNotification(`Ajustement des heures en cours...`, 'info');
    
    // Créer la date de début de journée (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Créer la date de fin de journée (23:59:59)
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Appeler l'API pour ajuster les heures
    const response = await fetch('/api/admin/adjust-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: today.toISOString(),
        endDate: endOfDay.toISOString(),
        hoursToAdjust: hours
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showNotification(`${result.count} tickets ont été ajustés de ${hours} heure(s)`, 'success');
      // Recharger la page pour voir les changements
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      throw new Error(result.message || 'Erreur lors de l\'ajustement des heures');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajustement des heures:', error);
    showNotification(`Erreur: ${error.message}`, 'error');
  }
}

// Initialiser le gestionnaire de commandes au chargement de la page
document.addEventListener('DOMContentLoaded', initCommandHandler); 