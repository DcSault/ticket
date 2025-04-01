let mainChart, glpiChart, callersChart, tagsChart, blockingChart;
let currentPeriod = 'day';
let stats;
let filteredStats;

function updateMainChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx || !data) return;

    if (mainChart) mainChart.destroy();

    const chartData = data.labels.map((label, i) => ({
        name: label,
        total: data.data[i] || 0,
        glpi: data.glpiData[i] || 0,
        blocking: data.blockingData[i] || 0
    }));

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.name),
            datasets: [
                {
                    label: 'Total Appels',
                    data: chartData.map(d => d.total),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2
                },
                {
                    label: 'Tickets GLPI',
                    data: chartData.map(d => d.glpi),
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2
                },
                {
                    label: 'Appels Bloquants',
                    data: chartData.map(d => d.blocking),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function updateGLPIChart(data) {
    const ctx = document.getElementById('glpiChart');
    if (!ctx || !data) return;

    if (glpiChart) glpiChart.destroy();

    const totalGLPI = data.glpiData.reduce((a, b) => a + b, 0);
    const totalNonGLPI = data.data.reduce((a, b) => a + b, 0) - totalGLPI;

    glpiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['GLPI', 'Non-GLPI'],
            datasets: [{
                data: [totalGLPI, totalNonGLPI],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateBlockingChart(data) {
    const ctx = document.getElementById('blockingChart');
    if (!ctx || !data) return;

    if (blockingChart) blockingChart.destroy();

    const totalBlocking = data.blockingData.reduce((a, b) => a + b, 0);
    const totalNonBlocking = data.data.reduce((a, b) => a + b, 0) - totalBlocking;

    blockingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bloquant', 'Non-Bloquant'],
            datasets: [{
                data: [totalBlocking, totalNonBlocking],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCallersChart(topCallers) {
    const ctx = document.getElementById('callersChart');
    if (!ctx) return;

    if (callersChart) callersChart.destroy();

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    callersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topCallers.map(c => c.name),
            datasets: [{
                data: topCallers.map(c => c.count),
                backgroundColor: topCallers.map((_, index) => COLORS[index % COLORS.length])
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateTagsChart(topTags) {
    const ctx = document.getElementById('tagsChart');
    if (!ctx) return;

    if (tagsChart) tagsChart.destroy();

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'].reverse();

    tagsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTags.map(t => t.name),
            datasets: [{
                data: topTags.map(t => t.count),
                backgroundColor: topTags.map((_, index) => COLORS[index % COLORS.length])
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateTopCharts() {
    const callerStats = {};
    const tagStats = {};

    filteredStats.detailedData.forEach(ticket => {
        if (ticket.caller) {
            callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
        }
        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                if (tag) {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                }
            });
        }
    });

    const topCallers = Object.entries(callerStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topTags = Object.entries(tagStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    updateCallersChart(topCallers);
    updateTagsChart(topTags);
}

function updateStats(data) {
    // Calculer les totaux à partir de l'ensemble des données filtrées
    const totalTickets = filteredStats.detailedData.length;
    
    // Compter manuellement les tickets GLPI et bloquants à partir des données détaillées filtrées
    const totalGLPI = filteredStats.detailedData.filter(ticket => ticket.isGLPI).length;
    const totalBlocking = filteredStats.detailedData.filter(ticket => ticket.isBlocking).length;
    
    // Mettre à jour les compteurs affichés
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('totalGLPI').textContent = totalGLPI;
    document.getElementById('totalBlocking').textContent = totalBlocking;
    
    // Mettre à jour le compteur global dans le titre
    const globalTotal = document.getElementById('globalTotal');
    if (globalTotal) {
        globalTotal.textContent = `(${totalTickets} tickets au total)`;
    }
    
    // Calculer la moyenne par jour actif
    if (data.data && data.data.length > 0) {
        const daysWithData = data.data.filter(x => x > 0).length || 1;
        document.getElementById('avgTicketsPerDay').textContent = (totalTickets / daysWithData).toFixed(1);
    } else {
        document.getElementById('avgTicketsPerDay').textContent = '0';
    }
    
    // Ajouter les détails de la période actuelle
    const periodDetails = document.querySelector('.period-details');
    if (periodDetails) {
        const periodLabels = {
            day: 'par jour',
            week: 'par semaine',
            month: 'par mois'
        };
        
        periodDetails.innerHTML = `
            <div class="text-sm text-gray-600 mt-2">
                <p>Période sélectionnée: <span class="font-medium">${periodLabels[currentPeriod] || ''}</span></p>
                <p>Total des tickets dans la période: <span class="font-medium">${totalTickets}</span></p>
                <p>Tickets GLPI: <span class="font-medium">${totalGLPI}</span> (${Math.round(totalGLPI/totalTickets*100) || 0}%)</p>
                <p>Tickets bloquants: <span class="font-medium">${totalBlocking}</span> (${Math.round(totalBlocking/totalTickets*100) || 0}%)</p>
            </div>
        `;
    }
    
    // Afficher des logs pour le débogage
    console.log(`Statistiques mises à jour: ${totalTickets} tickets au total (${totalGLPI} GLPI, ${totalBlocking} bloquants)`);
}

function updateAllCharts() {
    // Vérifier que nous avons bien des données pour la période actuelle
    const data = filteredStats[currentPeriod];
    if (!data) {
        console.error(`Pas de données pour la période ${currentPeriod}`);
        return;
    }
    
    console.log(`Mise à jour des graphiques pour la période ${currentPeriod}`);
    console.log(`Données utilisées pour les graphiques:`, data);
    
    // Si la période n'a pas de données, n'afficher aucun ticket
    if (data.labels.length === 0) {
        document.getElementById('totalTickets').textContent = '0';
        document.getElementById('totalGLPI').textContent = '0';
        document.getElementById('totalBlocking').textContent = '0';
        document.getElementById('avgTicketsPerDay').textContent = '0';
        
        // Reset les graphiques avec des données vides
        updateMainChart({
            labels: [],
            data: [],
            glpiData: [],
            blockingData: []
        });
        
        updateGLPIChart({
            glpiData: [0],
            data: [0]
        });
        
        updateBlockingChart(data);
        
        // Effacer les graphiques de top callers et tags
        const emptyData = [];
        updateCallersChart(emptyData);
        updateTagsChart(emptyData);
        
        return;
    }
    
    // Mettre à jour les graphiques avec les données filtrées
    updateMainChart(data);
    updateGLPIChart(data);
    updateBlockingChart(data);
    updateTopCharts();
    updateStats(data);
}

function filterDataByDate() {
    // Récupérer et normaliser les dates de début et de fin
    const startDate = normalizeDate(document.getElementById('startDate').value);
    const endDate = normalizeDate(document.getElementById('endDate').value);
    // Mettre la fin à 23:59:59 pour inclure toute la journée
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Dates invalides');
        return;
    }

    console.log(`Filtrage des données du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`);

    // 1. Filtrer les données détaillées pour obtenir uniquement les tickets dans la plage
    const filteredDetailedData = stats.detailedData.filter(ticket => {
        const ticketDate = normalizeDate(ticket.date);
        return ticketDate >= startDate && ticketDate <= endDate;
    });
    
    console.log(`Tickets dans la plage: ${filteredDetailedData.length}`);

    // 2. Créer un nouvel objet de statistiques filtrées
    filteredStats = {
        detailedData: filteredDetailedData,
        day: { labels: [], data: [], glpiData: [], blockingData: [], total: 0 },
        week: { labels: [], data: [], glpiData: [], blockingData: [], total: 0 },
        month: { labels: [], data: [], glpiData: [], blockingData: [], total: 0 }
    };

    // 3. Recalculer toutes les statistiques par période
    ['day', 'week', 'month'].forEach(period => {
        stats[period].labels.forEach((label, index) => {
            let periodStartDate, periodEndDate;

            // Convertir les labels en dates selon leur format
            if (period === 'day') {
                // Format: JJ/MM/AAAA
                periodStartDate = normalizeDate(label.split('/').reverse().join('-'));
                periodEndDate = new Date(periodStartDate);
                periodEndDate.setHours(23, 59, 59, 999);
            } 
            else if (period === 'week' && label.includes(' - ')) {
                // Format: JJ/MM/AAAA - JJ/MM/AAAA
                const [startStr, endStr] = label.split(' - ');
                periodStartDate = normalizeDate(startStr.split('/').reverse().join('-'));
                periodEndDate = normalizeDate(endStr.split('/').reverse().join('-'));
                periodEndDate.setHours(23, 59, 59, 999);
            } 
            else if (period === 'month') {
                // Format: mois AAAA
                const [month, year] = label.split(' ');
                const monthIndex = [
                    'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
                ].indexOf(month.toLowerCase());
                
                if (monthIndex !== -1) {
                    periodStartDate = new Date(Date.UTC(parseInt(year), monthIndex, 1));
                    periodEndDate = new Date(Date.UTC(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999));
                }
            }

            // Vérifier si cette période chevauche la plage de dates sélectionnée
            if (periodStartDate && periodEndDate) {
                const isInRange = (periodStartDate <= endDate && periodEndDate >= startDate);
                
                if (isInRange) {
                    filteredStats[period].labels.push(label);
                    
                    // Compter manuellement les tickets pour cette période spécifique
                    const ticketsInPeriod = filteredDetailedData.filter(ticket => {
                        const ticketDate = normalizeDate(ticket.date);
                        return ticketDate >= periodStartDate && ticketDate <= periodEndDate;
                    });
                    
                    // Ajouter les comptages pour cette période
                    filteredStats[period].data.push(ticketsInPeriod.length);
                    filteredStats[period].glpiData.push(ticketsInPeriod.filter(t => t.isGLPI).length);
                    filteredStats[period].blockingData.push(ticketsInPeriod.filter(t => t.isBlocking).length);
                }
            }
        });
    });

    // 4. Calculer les totaux pour chaque période (jour, semaine, mois)
    ['day', 'week', 'month'].forEach(period => {
        // Le total réel est le nombre de tickets dans la plage
        filteredStats[period].total = filteredDetailedData.length;
        
        // Les totaux GLPI et blocage sont aussi calculés à partir des données détaillées
        filteredStats[period].glpi = filteredDetailedData.filter(t => t.isGLPI).length;
        filteredStats[period].blocking = filteredDetailedData.filter(t => t.isBlocking).length;
    });

    // 5. Journal de débogage
    console.log('Statistiques filtrées:', filteredStats);
    console.log(`Total réel: ${filteredDetailedData.length} tickets`);
    
    // Mettre à jour les graphiques
    updateAllCharts();
}

function updatePeriod(period) {
    currentPeriod = period;
    const now = new Date();

    ['day', 'week', 'month'].forEach(p => {
        const btn = document.getElementById(`btn${p.charAt(0).toUpperCase() + p.slice(1)}`);
        if (btn) {
            btn.classList.remove('bg-blue-500', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
            btn.classList.add('bg-gray-200', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:hover:bg-gray-600');
        }
    });

    const selectedBtn = document.getElementById(`btn${period.charAt(0).toUpperCase() + period.slice(1)}`);
    if (selectedBtn) {
        selectedBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:hover:bg-gray-600');
        selectedBtn.classList.add('bg-blue-500', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
    }

    let startDate = new Date(now);
    const endDate = new Date(now);

    switch (period) {
        case 'day':
            startDate.setDate(now.getDate() - 29);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 28);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 11);
            break;
    }

    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;

    filterDataByDate();
}

function initializeStats(data) {
    if (!data) {
        console.error("Aucune donnée statistique fournie.");
        return;
    }

    console.log("Initialisation des statistiques avec les données reçues:", data);

    // S'assurer que les données sont complètes
    if (!data.detailedData) {
        console.error("Les données détaillées sont manquantes.");
        return;
    }

    // Calcul des données de blocage pour chaque période
    stats = { 
        ...data,
        day: {
            ...data.day,
            blockingData: calculateBlockingData(data.detailedData, data.day.labels, 'day')
        },
        week: {
            ...data.week,
            blockingData: calculateBlockingData(data.detailedData, data.week.labels, 'week')
        },
        month: {
            ...data.month,
            blockingData: calculateBlockingData(data.detailedData, data.month.labels, 'month')
        }
    };

    // Initialiser également les statistiques filtrées
    filteredStats = JSON.parse(JSON.stringify(stats));
    
    // Mettre à jour tous les graphiques
    updateAllCharts();
    
    // Par défaut, afficher les statistiques quotidiennes
    updatePeriod('day');
}

// Fonction pour calculer les données de blocage pour une période
function calculateBlockingData(detailedData, labels, periodType) {
    // Initialiser un tableau avec des zéros pour chaque label
    const blockingData = Array(labels.length).fill(0);
    
    if (!detailedData || detailedData.length === 0) {
        return blockingData;
    }
    
    // Filtrer seulement les tickets bloquants
    const blockingTickets = detailedData.filter(ticket => ticket.isBlocking);
    
    if (blockingTickets.length === 0) {
        return blockingData;
    }
    
    // Pour chaque label de période, compter les tickets bloquants correspondants
    labels.forEach((label, index) => {
        if (periodType === 'day') {
            // Compter les tickets bloquants pour ce jour
            const dayCount = blockingTickets.filter(ticket => {
                const ticketDate = new Date(ticket.date);
                return ticketDate.toLocaleDateString('fr-FR') === label;
            }).length;
            
            blockingData[index] = dayCount;
        } 
        else if (periodType === 'week' && label.includes(' - ')) {
            // Compter les tickets bloquants pour cette semaine
            const [startStr, endStr] = label.split(' - ');
            const weekStart = new Date(startStr.split('/').reverse().join('-'));
            const weekEnd = new Date(endStr.split('/').reverse().join('-'));
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekCount = blockingTickets.filter(ticket => {
                const ticketDate = new Date(ticket.date);
                return ticketDate >= weekStart && ticketDate <= weekEnd;
            }).length;
            
            blockingData[index] = weekCount;
        } 
        else if (periodType === 'month') {
            // Compter les tickets bloquants pour ce mois
            const [month, year] = label.split(' ');
            const monthIndex = [
                'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
            ].indexOf(month.toLowerCase());
            
            if (monthIndex !== -1) {
                const monthStart = new Date(parseInt(year), monthIndex, 1);
                const monthEnd = new Date(parseInt(year), monthIndex + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                const monthCount = blockingTickets.filter(ticket => {
                    const ticketDate = new Date(ticket.date);
                    return ticketDate >= monthStart && ticketDate <= monthEnd;
                }).length;
                
                blockingData[index] = monthCount;
            }
        }
    });
    
    return blockingData;
}

/**
 * Normalise une date en UTC pour éviter les problèmes de fuseau horaire
 * @param {Date|string} date - La date à normaliser
 * @returns {Date} La date normalisée
 */
function normalizeDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    // Créer une nouvelle date en UTC avec seulement la date (pas l'heure)
    return new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ));
}

// Chargement des statistiques au démarrage
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter un écouteur d'événements pour le changement de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const period = e.target.dataset.period;
            if (period) {
                updatePeriod(period);
            }
        });
    });

    // Afficher le titre de la section des statistiques pour inclure le total global
    const statsHeader = document.querySelector('.stats-header h2');
    if (statsHeader) {
        statsHeader.innerHTML = 'Statistiques <span id="globalTotal" class="text-blue-600 font-bold"></span>';
    }

    if (window.initialStats) {
        initializeStats(window.initialStats);
    }

    // Gestion du thème sombre pour les graphiques
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
        Chart.defaults.color = '#ffffff';
        Chart.defaults.borderColor = '#374151';
    }
});