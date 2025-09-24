/**
 * Gestion de la page des statistiques.
 * Ce script récupère les données pré-traitées du serveur et les affiche.
 * Toute la logique de calcul et de filtrage est côté serveur.
 */

// Variables globales pour les graphiques et les données
let mainChart, glpiChart, callersChart, tagsChart, blockingChart;
let currentPeriod = 'day'; // Période par défaut
let currentStats = {}; // Stocke les dernières statistiques reçues du serveur

/**
 * Met à jour le graphique principal (Total, GLPI, Bloquants).
 * @param {object} data - Les données pour la période actuelle (ex: currentStats.day).
 */
function updateMainChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;
    if (mainChart) mainChart.destroy();

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: [
                {
                    label: 'Total Appels',
                    data: data.data || [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Tickets GLPI',
                    data: data.glpiData || [],
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Appels Bloquants',
                    data: data.blockingData || [],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

/**
 * Met à jour le graphique en anneau pour la proportion de tickets GLPI.
 * @param {object} data - Les données pour la période actuelle.
 */
function updateDonutCharts(data) {
    const totalTickets = data.total || 0;
    const totalGLPI = data.glpi || 0;
    const totalBlocking = data.blocking || 0;

    // GLPI Chart
    const glpiCtx = document.getElementById('glpiChart');
    if (glpiCtx) {
        if (glpiChart) glpiChart.destroy();
        glpiChart = new Chart(glpiCtx, {
            type: 'doughnut',
            data: {
                labels: ['GLPI', 'Non-GLPI'],
                datasets: [{
                    data: [totalGLPI, totalTickets - totalGLPI],
                    backgroundColor: ['rgba(139, 92, 246, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                    borderColor: ['rgba(139, 92, 246, 1)', 'rgba(59, 130, 246, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Blocking Chart
    const blockingCtx = document.getElementById('blockingChart');
    if (blockingCtx) {
        if (blockingChart) blockingChart.destroy();
        blockingChart = new Chart(blockingCtx, {
            type: 'doughnut',
            data: {
                labels: ['Bloquant', 'Non-Bloquant'],
                datasets: [{
                    data: [totalBlocking, totalTickets - totalBlocking],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                    borderColor: ['rgba(239, 68, 68, 1)', 'rgba(34, 197, 94, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

/**
 * Met à jour les graphiques des tops (appelants et tags).
 * @param {object} stats - L'objet de statistiques complet.
 */
function updateTopCharts(stats) {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Top Callers
    const callersCtx = document.getElementById('callersChart');
    if (callersCtx) {
        if (callersChart) callersChart.destroy();
        callersChart = new Chart(callersCtx, {
            type: 'bar',
            data: {
                labels: stats.topCallers.map(c => c.name),
                datasets: [{
                    data: stats.topCallers.map(c => c.count),
                    backgroundColor: stats.topCallers.map((_, index) => COLORS[index % COLORS.length])
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    // Top Tags
    const tagsCtx = document.getElementById('tagsChart');
    if (tagsCtx) {
        if (tagsChart) tagsChart.destroy();
        tagsChart = new Chart(tagsCtx, {
            type: 'bar',
            data: {
                labels: stats.topTags.map(t => t.name),
                datasets: [{
                    data: stats.topTags.map(t => t.count),
                    backgroundColor: stats.topTags.map((_, index) => COLORS.slice().reverse()[index % COLORS.length])
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

/**
 * Met à jour les indicateurs (KPIs) comme les totaux et la moyenne.
 * @param {object} data - Les données pour la période actuelle.
 */
function updateStatsCounters(data) {
    const totalTickets = data.total || 0;
    const totalGLPI = data.glpi || 0;
    const totalBlocking = data.blocking || 0;
    const numberOfEntries = data.labels?.length || 1;
    const average = numberOfEntries > 0 ? totalTickets / numberOfEntries : 0;

    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('totalGLPI').textContent = totalGLPI;
    document.getElementById('totalBlocking').textContent = totalBlocking;
    document.getElementById('avgTicketsPerDay').textContent = average.toFixed(1);
}

/**
 * Met à jour tous les éléments visuels de la page.
 */
function updateAllVisuals() {
    if (!currentStats || !currentStats[currentPeriod]) {
        console.error(`Aucune donnée disponible pour la période: ${currentPeriod}`);
        return;
    }
    const periodData = currentStats[currentPeriod];
    
    updateMainChart(periodData);
    updateDonutCharts(periodData);
    updateTopCharts(currentStats);
    updateStatsCounters(periodData);
}

/**
 * Change la période d'affichage (jour, semaine, mois) et met à jour les graphiques.
 * @param {string} period - La nouvelle période ('day', 'week', 'month').
 */
function updatePeriod(period) {
    currentPeriod = period;

    // Mettre à jour le style des boutons de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.getAttribute('data-period') === period) {
            btn.classList.add('bg-blue-500', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-900');
        } else {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-900');
        }
    });
    
    // Mettre à jour le libellé de la moyenne
    const averageLabel = document.getElementById('averageLabel');
    if (averageLabel) {
        const labels = { day: 'par jour', week: 'par semaine', month: 'par mois' };
        averageLabel.textContent = labels[period] || '';
    }

    // Redessiner les graphiques avec les données existantes pour la nouvelle période
    updateAllVisuals();
}

/**
 * Récupère les statistiques du serveur pour une plage de dates donnée et met à jour la page.
 * @param {string} from - Date de début au format YYYY-MM-DD.
 * @param {string} to - Date de fin au format YYYY-MM-DD.
 */
async function fetchAndLoadStats(from, to) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.classList.remove('hidden');

    try {
        const response = await fetch(`/api/stats?from=${from}&to=${to}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        currentStats = await response.json();
        
        // Mettre à jour tous les graphiques et compteurs
        updateAllVisuals();

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        alert('Impossible de charger les statistiques. Veuillez réessayer.');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Initialise la page : configure les écouteurs d'événements et charge les données initiales.
 */
document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Définit la plage de dates par défaut (ex: le dernier mois)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    startDateInput.value = lastMonth.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    // Ajoute les écouteurs d'événements pour les changements de date
    const handleDateChange = () => {
        fetchAndLoadStats(startDateInput.value, endDateInput.value);
    };
    startDateInput.addEventListener('change', handleDateChange);
    endDateInput.addEventListener('change', handleDateChange);

    // Ajoute les écouteurs pour les boutons de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updatePeriod(btn.getAttribute('data-period'));
        });
    });
    
    // Ajoute les écouteurs pour les raccourcis de date
    document.getElementById('btnToday').addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        startDateInput.value = todayStr;
        endDateInput.value = todayStr;
        handleDateChange();
    });

    document.getElementById('btnLast7Days').addEventListener('click', () => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
        handleDateChange();
    });

    document.getElementById('btnLast30Days').addEventListener('click', () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);
        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
        handleDateChange();
    });

    // Charge les données initiales
    fetchAndLoadStats(startDateInput.value, endDateInput.value);
});