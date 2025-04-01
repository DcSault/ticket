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
    document.getElementById('totalTickets').textContent = data.data.reduce((a, b) => a + b, 0);
    document.getElementById('totalGLPI').textContent = data.glpiData.reduce((a, b) => a + b, 0);
    document.getElementById('totalBlocking').textContent = data.blockingData.reduce((a, b) => a + b, 0);
    const total = data.data.reduce((a, b) => a + b, 0);
    const days = data.data.filter(x => x > 0).length || 1;
    document.getElementById('avgTicketsPerDay').textContent = (total / days).toFixed(1);
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
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Dates invalides');
        return;
    }

    console.log(`Filtrage des données du ${startDate.toLocaleDateString()} au ${endDate.toLocaleDateString()}`);

    // Filtrer d'abord les données détaillées
    filteredStats = {
        ...stats,
        detailedData: stats.detailedData.filter(ticket => {
            const ticketDate = new Date(ticket.date);
            return ticketDate >= startDate && ticketDate <= endDate;
        })
    };

    // Traiter chaque période (jour, semaine, mois)
    ['day', 'week', 'month'].forEach(period => {
        filteredStats[period] = {
            labels: [],
            data: [],
            glpiData: [],
            blockingData: []
        };

        stats[period].labels.forEach((label, index) => {
            let date;
            let isInRange = false;

            // Convertir l'étiquette en date en fonction du format de la période
            if (period === 'day') {
                // Format: JJ/MM/AAAA
                date = new Date(label.split('/').reverse().join('-'));
                isInRange = date >= startDate && date <= endDate;
            } 
            else if (period === 'week' && label.includes(' - ')) {
                // Format: JJ/MM/AAAA - JJ/MM/AAAA
                const [startStr, endStr] = label.split(' - ');
                const weekStartDate = new Date(startStr.split('/').reverse().join('-'));
                const weekEndDate = new Date(endStr.split('/').reverse().join('-'));
                
                // Une semaine est dans la plage si elle chevauche la plage de dates sélectionnée
                isInRange = (weekStartDate <= endDate && weekEndDate >= startDate);
            } 
            else if (period === 'month') {
                // Format: mois AAAA (ex: janvier 2025)
                const [month, year] = label.split(' ');
                const monthIndex = [
                    'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
                ].indexOf(month.toLowerCase());
                
                if (monthIndex !== -1) {
                    // Premier jour du mois
                    const monthStartDate = new Date(parseInt(year), monthIndex, 1);
                    // Dernier jour du mois
                    const monthEndDate = new Date(parseInt(year), monthIndex + 1, 0);
                    
                    // Un mois est dans la plage s'il chevauche la plage de dates sélectionnée
                    isInRange = (monthStartDate <= endDate && monthEndDate >= startDate);
                }
            }

            if (isInRange) {
                filteredStats[period].labels.push(label);
                filteredStats[period].data.push(stats[period].data[index]);
                filteredStats[period].glpiData.push(stats[period].glpiData[index]);
                filteredStats[period].blockingData.push(stats[period].blockingData[index]);
            }
        });

        // Calculer les totaux pour chaque période
        filteredStats[period].total = filteredStats[period].data.reduce((a, b) => a + b, 0);
        filteredStats[period].glpi = filteredStats[period].glpiData.reduce((a, b) => a + b, 0);
        filteredStats[period].blocking = filteredStats[period].blockingData.reduce((a, b) => a + b, 0);
    });

    console.log('Données filtrées:', filteredStats);
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

// Chargement des statistiques au démarrage
document.addEventListener('DOMContentLoaded', function() {
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