// Variables globales
let mainChart, glpiChart, callersChart, tagsChart;
let currentPeriod = 'day';
let stats;
let filteredStats;

// Mise à jour du graphique principal
function updateMainChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx || !data) return;

    if (mainChart) mainChart.destroy();

    const chartData = data.labels.map((label, i) => ({
        name: label,
        total: data.data[i] || 0,
        glpi: data.glpiData[i] || 0
    }));

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.name),
            datasets: [
                {
                    label: 'Total Tickets',
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

// Mise à jour du graphique GLPI
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

// Mise à jour du graphique des appelants
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

// Mise à jour du graphique des tags
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

// Calcul des tops basé sur les données filtrées
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

// Mise à jour des statistiques affichées
function updateStats(data) {
    document.getElementById('totalTickets').textContent = data.data.reduce((a, b) => a + b, 0);
    document.getElementById('totalGLPI').textContent = data.glpiData.reduce((a, b) => a + b, 0);
    const total = data.data.reduce((a, b) => a + b, 0);
    const days = data.data.filter(x => x > 0).length || 1;
    document.getElementById('avgTicketsPerDay').textContent = (total / days).toFixed(1);
}

// Mise à jour de tous les graphiques
function updateAllCharts() {
    const data = filteredStats[currentPeriod];
    if (!data) return;
    
    updateMainChart(data);
    updateGLPIChart(data);
    updateTopCharts();
    updateStats(data);
}

// Filtrage des données par date
function filterDataByDate() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Dates invalides');
        return;
    }

    // Filtrer les données détaillées
    filteredStats = {
        ...stats,
        [currentPeriod]: {
            labels: [],
            data: [],
            glpiData: []
        },
        detailedData: stats.detailedData.filter(ticket => {
            const ticketDate = new Date(ticket.date);
            return ticketDate >= startDate && ticketDate <= endDate;
        })
    };

    // Filtrer les données de la période
    stats[currentPeriod].labels.forEach((label, index) => {
        let date;
        let isInRange = false;

        if (currentPeriod === 'week' && label.includes(' - ')) {
            const [startStr] = label.split(' - ');
            date = new Date(startStr.split('/').reverse().join('-'));
        } else if (currentPeriod === 'month') {
            const [month, year] = label.split(' ');
            date = new Date(Date.parse(`${month} 1, ${year}`));
        } else {
            date = new Date(label.split('/').reverse().join('-'));
        }

        if (date >= startDate && date <= endDate) {
            isInRange = true;
        }

        if (isInRange) {
            filteredStats[currentPeriod].labels.push(label);
            filteredStats[currentPeriod].data.push(stats[currentPeriod].data[index]);
            filteredStats[currentPeriod].glpiData.push(stats[currentPeriod].glpiData[index]);
        }
    });

    // Calculer les totaux
    filteredStats[currentPeriod].total = filteredStats[currentPeriod].data.reduce((a, b) => a + b, 0);
    filteredStats[currentPeriod].glpi = filteredStats[currentPeriod].glpiData.reduce((a, b) => a + b, 0);

    updateAllCharts();
}

// Mise à jour de la période sélectionnée
function updatePeriod(period) {
    currentPeriod = period;
    const now = new Date();

    // Mettre à jour les boutons
    ['day', 'week', 'month'].forEach(p => {
        const btn = document.getElementById(`btn${p.charAt(0).toUpperCase() + p.slice(1)}`);
        if (btn) {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'hover:bg-gray-300');
        }
    });

    const selectedBtn = document.getElementById(`btn${period.charAt(0).toUpperCase() + period.slice(1)}`);
    if (selectedBtn) {
        selectedBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
        selectedBtn.classList.add('bg-blue-500', 'text-white');
    }

    // Calculer les dates par défaut pour la période
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

// Gestion des exports
function openExportModal() {
    document.getElementById('exportModal').classList.remove('hidden');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.add('hidden');
}

function handleExport(event) {
    event.preventDefault();
    
    const period = document.getElementById('exportPeriod').value;
    const includeGLPI = document.getElementById('includeGLPI').checked;
    const includeTags = document.getElementById('includeTags').checked;
    const includeCallers = document.getElementById('includeCallers').checked;

    if (!period || (!includeGLPI && !includeTags && !includeCallers)) {
        alert("Veuillez sélectionner au moins une option d'export.");
        return;
    }

    const queryParams = new URLSearchParams({
        period,
        includeGLPI,
        includeTags,
        includeCallers,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    });

    document.getElementById('loading').classList.remove('hidden');
    window.location.href = `/api/stats/export?${queryParams}`;

    setTimeout(() => {
        closeExportModal();
        document.getElementById('loading').classList.add('hidden');
    }, 1000);
}

// Initialisation des statistiques
function initializeStats(data) {
    if (!data) {
        console.error("Aucune donnée statistique fournie.");
        return;
    }
    stats = data;
    filteredStats = { ...stats };
    updateAllCharts();
    updatePeriod('day');
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    if (window.initialStats) {
        initializeStats(window.initialStats);
    }
});