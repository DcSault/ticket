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
                },
                {
                    label: 'Tickets Bloquants',
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
    const data = filteredStats[currentPeriod];
    if (!data) return;
    
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

    filteredStats = {
        ...stats,
        [currentPeriod]: {
            labels: [],
            data: [],
            glpiData: [],
            blockingData: []
        },
        detailedData: stats.detailedData.filter(ticket => {
            const ticketDate = new Date(ticket.date);
            return ticketDate >= startDate && ticketDate <= endDate;
        })
    };

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
            filteredStats[currentPeriod].blockingData.push(stats[currentPeriod].blockingData[index]);
        }
    });

    filteredStats[currentPeriod].total = filteredStats[currentPeriod].data.reduce((a, b) => a + b, 0);
    filteredStats[currentPeriod].glpi = filteredStats[currentPeriod].glpiData.reduce((a, b) => a + b, 0);
    filteredStats[currentPeriod].blocking = filteredStats[currentPeriod].blockingData.reduce((a, b) => a + b, 0);

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
    const includeBlocking = document.getElementById('includeBlocking').checked;

    if (!period || (!includeGLPI && !includeTags && !includeCallers && !includeBlocking)) {
        alert("Veuillez sélectionner au moins une option d'export.");
        return;
    }

    const queryParams = new URLSearchParams({
        period,
        includeGLPI,
        includeTags,
        includeCallers,
        includeBlocking,
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

function initializeStats(data) {
    if (!data) {
        console.error("Aucune donnée statistique fournie.");
        return;
    }

    // Ajout des données de tickets bloquants aux statistiques existantes
    stats = {
        ...data,
        day: {
            ...data.day,
            blockingData: data.detailedData
                .filter(ticket => ticket.isBlocking)
                .reduce((acc, ticket) => {
                    const date = new Date(ticket.date).toLocaleDateString('fr-FR');
                    const index = data.day.labels.indexOf(date);
                    if (index !== -1) {
                        acc[index] = (acc[index] || 0) + 1;
                    }
                    return acc;
                }, Array(data.day.labels.length).fill(0))
        },
        week: {
            ...data.week,
            blockingData: Array(data.week.labels.length).fill(0)  // À implémenter selon la logique hebdomadaire
        },
        month: {
            ...data.month,
            blockingData: Array(data.month.labels.length).fill(0)  // À implémenter selon la logique mensuelle
        }
    };

    filteredStats = { ...stats };
    updateAllCharts();
    updatePeriod('day');
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