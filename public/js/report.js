// Configuration globale des graphiques
let charts = {
    evolutionChart: null,
    glpiChart: null,
    blockingChart: null,
    hourlyChart: null,
    callersChart: null,
    tagsChart: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    document.getElementById('reportDate').valueAsDate = today;
    updateReport();
});

// Navigation entre les jours
function previousDay() {
    const dateInput = document.getElementById('reportDate');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    dateInput.valueAsDate = currentDate;
    updateReport();
}

// Mise à jour du rapport
async function updateReport() {
    const date = document.getElementById('reportDate').value;
    console.log('Date sélectionnée:', date);
    
    try {
        const url = `/api/report-data?date=${date}`;
        console.log('URL de la requête:', url);
        
        const response = await fetch(url);
        console.log('Réponse reçue:', response);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        
        updateCharts(data);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rapport:', error);
    }
}

// Mise à jour de tous les graphiques et statistiques
function updateCharts(data) {
    console.log('Mise à jour des graphiques avec:', data);

    // Mise à jour des statistiques de base
    document.getElementById('totalTickets').textContent = data.total;
    document.getElementById('morningRatio').textContent = 
        data.total > 0 ? Math.round((data.morningTickets / data.total) * 100) + '%' : '0%';
    document.getElementById('afternoonRatio').textContent = 
        data.total > 0 ? Math.round((data.afternoonTickets / data.total) * 100) + '%' : '0%';

    // Trouver l'heure de pointe
    const maxTickets = Math.max(...data.hourlyDistribution);
    const peakHour = data.hourlyDistribution.indexOf(maxTickets);
    document.getElementById('peakHour').textContent = 
        maxTickets > 0 ? `${String(peakHour).padStart(2, '0')}:00` : '--:00';

    // Mise à jour des graphiques individuels
    try {
        updateEvolutionChart(data);
        updateGLPIChart(data);
        updateBlockingChart(data);
        updateHourlyChart(data);
        updateCallersChart(data.topCallers);
        updateTagsChart(data.topTags);
    } catch (error) {
        console.error('Erreur lors de la mise à jour des graphiques:', error);
    }
}

// Mise à jour du graphique d'évolution
function updateEvolutionChart(data) {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;

    if (charts.evolutionChart) {
        charts.evolutionChart.destroy();
    }

    charts.evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
            datasets: [{
                label: 'Appels',
                data: data.hourlyDistribution,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Mise à jour du graphique GLPI
function updateGLPIChart(data) {
    const ctx = document.getElementById('glpiChart');
    if (!ctx) return;

    if (charts.glpiChart) {
        charts.glpiChart.destroy();
    }

    charts.glpiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['GLPI', 'Non-GLPI'],
            datasets: [{
                data: [data.glpi, data.total - data.glpi],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
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

// Mise à jour du graphique des Appels bloquants
function updateBlockingChart(data) {
    const ctx = document.getElementById('blockingChart');
    if (!ctx) return;

    if (charts.blockingChart) {
        charts.blockingChart.destroy();
    }

    charts.blockingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bloquant', 'Non-Bloquant'],
            datasets: [{
                data: [data.blocking, data.total - data.blocking],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
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

// Mise à jour du graphique de distribution horaire
function updateHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    if (charts.hourlyChart) {
        charts.hourlyChart.destroy();
    }

    charts.hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
            datasets: [{
                label: 'Appels par heure',
                data: data.hourlyDistribution,
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Mise à jour du graphique des appelants
function updateCallersChart(topCallers) {
    const ctx = document.getElementById('callersChart');
    if (!ctx) return;

    if (charts.callersChart) {
        charts.callersChart.destroy();
    }

    const callerData = Object.entries(topCallers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    charts.callersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: callerData.map(([name]) => name),
            datasets: [{
                label: 'Appels',
                data: callerData.map(([, count]) => count),
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
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
            }
        }
    });
}

// Mise à jour du graphique des tags
function updateTagsChart(topTags) {
    const ctx = document.getElementById('tagsChart');
    if (!ctx) return;

    if (charts.tagsChart) {
        charts.tagsChart.destroy();
    }

    const tagData = Object.entries(topTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    charts.tagsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tagData.map(([name]) => name),
            datasets: [{
                label: 'Occurrences',
                data: tagData.map(([, count]) => count),
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
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
            }
        }
    });
}

// Génération du rapport PDF
async function generateReport() {
    try {
        const date = document.getElementById('reportDate').value;
        const { jsPDF } = window.jspdf;
        
        // Création du PDF en format paysage
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Styles
        const styles = {
            title: { fontSize: 24, color: [0, 0, 0] },
            subtitle: { fontSize: 14, color: [51, 51, 51] },
            text: { fontSize: 12, color: [68, 68, 68] }
        };

        // Dimensions de la page
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Entête
        doc.setFontSize(styles.title.fontSize);
        doc.setTextColor(...styles.title.color);
        doc.text(`Rapport des Appels - ${new Date(date).toLocaleDateString('fr-FR')}`, 15, 20);

        // Cartes de statistiques
        const statsStartY = 35;
        const cardWidth = 65;
        const cardHeight = 30;
        const margin = 10;

        // Fonction pour dessiner une carte de statistique
        function drawStatsCard(title, value, x, y, color) {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
            
            doc.setFontSize(12);
            doc.setTextColor(...styles.text.color);
            doc.text(title, x + 5, y + 10);
            
            doc.setFontSize(20);
            doc.setTextColor(...color);
            doc.text(value, x + 5, y + 25);
        }

        // Dessiner les cartes de statistiques
        const stats = [
            {
                title: 'Total Appels',
                value: document.getElementById('totalTickets').textContent,
                color: [59, 130, 246]
            },
            {
                title: 'Ratio Matin',
                value: document.getElementById('morningRatio').textContent,
                color: [34, 197, 94]
            },
            {
                title: 'Ratio Après-midi',
                value: document.getElementById('afternoonRatio').textContent,
                color: [234, 179, 8]
            },
            {
                title: 'Heure de pointe',
                value: document.getElementById('peakHour').textContent,
                color: [147, 51, 234]
            }
        ];

        stats.forEach((stat, index) => {
            const x = 15 + (cardWidth + margin) * index;
            drawStatsCard(stat.title, stat.value, x, statsStartY, stat.color);
        });

        // Configuration des graphiques
        const chartsStartY = statsStartY + cardHeight + 15;
        
        const charts = [
            {
                id: 'evolutionChart',
                title: 'Évolution des Appels',
                width: 270,
                height: 60,
                x: 15,
                y: chartsStartY
            },
            {
                id: 'hourlyChart',
                title: 'Distribution horaire',
                width: 270,
                height: 50,
                x: 15,
                y: chartsStartY + 160
            },
            {
                id: 'callersChart',
                title: 'Top des appelants',
                width: 100, // Réduire la largeur
                height: 40, // Réduire la hauteur
                x: 15,
                y: chartsStartY + 70
            },
            {
                id: 'tagsChart',
                title: 'Tags les plus utilisés',
                width: 100, // Réduire la largeur
                height: 40, // Réduire la hauteur
                x: 155,
                y: chartsStartY + 70
            }
        ];

        // Fonction pour ajouter un graphique
        async function addChart(chart) {
            doc.setFontSize(styles.subtitle.fontSize);
            doc.setTextColor(...styles.subtitle.color);
            doc.text(chart.title, chart.x, chart.y - 5);

            const canvas = document.getElementById(chart.id);
            if (canvas) {
                const imgData = canvas.toDataURL('image/png', 1.0);
                doc.addImage(imgData, 'PNG', chart.x, chart.y, chart.width, chart.height);
            }
        }

        // Ajouter tous les graphiques de la première page
        for (const chart of charts) {
            await addChart(chart);
        }

        // Ajouter une nouvelle page pour les graphiques GLPI et Bloquant
        doc.addPage();

        // Réinitialiser la position Y pour la nouvelle page
        const newPageStartY = 20;

        // Ajouter les graphiques GLPI et Bloquant sur la nouvelle page
        const glpiChart = {
            id: 'glpiChart',
            title: 'Répartition GLPI',
            width: 120,
            height: 120,
            x: 15,
            y: newPageStartY
        };

        const blockingChart = {
            id: 'blockingChart',
            title: 'Répartition Bloquant',
            width: 120,
            height: 120,
            x: 150,
            y: newPageStartY
        };

        await addChart(glpiChart);
        await addChart(blockingChart);

        // Sauvegarde du PDF
        const formattedDate = new Date(date).toLocaleDateString('fr-FR').replace(/\//g, '-');
        doc.save(`rapport_Appels_${formattedDate}.pdf`);

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour créer un titre dans le PDF
function drawPDFTitle(doc, text, x, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(text, x, y);
    doc.setFont('helvetica', 'normal');
}

// Fonction pour créer une section dans le PDF
function drawPDFSection(doc, title, data, x, y, width) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    let currentY = y + 10;
    Object.entries(data).forEach(([key, value]) => {
        const text = `${key}: ${value}`;
        doc.text(text, x, currentY);
        currentY += 7;
    });
    return currentY;
}

// Fonction pour dessiner un graphique dans le PDF
async function drawPDFChart(doc, canvasId, title, x, y, width, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return y;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, x, y);
    
    const imageData = canvas.toDataURL('image/png', 1.0);
    doc.addImage(imageData, 'PNG', x, y + 5, width, height);
    
    return y + height + 20;
}

// Fonction pour convertir le format de date
function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Fonction pour formater les nombres
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

// Fonction pour obtenir une couleur basée sur une valeur
function getColorForValue(value, max) {
    const ratio = value / max;
    const hue = (1 - ratio) * 120; // 120 pour vert, 0 pour rouge
    return `hsl(${hue}, 70%, 50%)`;
}

// Fonction pour générer le markdown du rapport
async function generateMarkdownReport(data) {
    const date = document.getElementById('reportDate').value;
    const formattedDate = formatDate(date);
    
    let markdown = `# Rapport des Appels - ${formattedDate}

## Résumé

- **Total des Appels**: ${formatNumber(data.total)}
- **Appels GLPI**: ${formatNumber(data.glpi)} (${Math.round(data.glpi/data.total*100 || 0)}%)
- **Appels bloquants**: ${formatNumber(data.blocking)} (${Math.round(data.blocking/data.total*100 || 0)}%)
- **Ratio Matin/Après-midi**: ${formatNumber(data.morningTickets)}/${formatNumber(data.afternoonTickets)}

## Distribution Horaire

\`\`\`
${generateHourlyDistributionAscii(data.hourlyDistribution)}
\`\`\`

## Top Appelants

${Object.entries(data.topCallers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((caller, index) => `${index + 1}. ${caller[0]}: ${formatNumber(caller[1])} ticket(s)`)
    .join('\n')}

## Tags les Plus Utilisés

${Object.entries(data.topTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((tag, index) => `${index + 1}. ${tag[0]}: ${formatNumber(tag[1])} utilisation(s)`)
    .join('\n')}
`;

    return markdown;
}

// Fonction pour générer une représentation ASCII de la distribution horaire
function generateHourlyDistributionAscii(distribution) {
    const maxValue = Math.max(...distribution);
    const height = 5;
    let ascii = '';

    for (let row = height; row >= 0; row--) {
        for (let hour = 0; hour < 24; hour++) {
            const value = distribution[hour];
            const threshold = (maxValue / height) * row;
            ascii += value >= threshold ? '█' : ' ';
        }
        ascii += '\n';
    }

    // Ajouter l'axe des heures
    ascii += '0----6----12---18---23\n';

    return ascii;
}

// Fonction pour exporter les données au format CSV
function exportToCSV(data) {
    const rows = [
        ['Heure', 'Nombre de Appels'],
        ...data.hourlyDistribution.map((value, index) => [
            `${String(index).padStart(2, '0')}:00`,
            value
        ])
    ];

    const csvContent = rows
        .map(row => row.join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'distribution_horaire.csv';
    link.click();
}

// Fonction pour initialiser les tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseover', e => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
            tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
        });

        element.addEventListener('mouseout', () => {
            document.querySelectorAll('.tooltip').forEach(t => t.remove());
        });
    });
}

// Initialisation des écouteurs d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    
    // Réinitialiser les filtres
    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.getElementById('reportDate').valueAsDate = new Date();
        updateReport();
    });
    
    // Gérer l'exportation
    document.getElementById('exportCSV')?.addEventListener('click', () => {
        const date = document.getElementById('reportDate').value;
        fetch(`/api/report-data?date=${date}`)
            .then(response => response.json())
            .then(data => exportToCSV(data))
            .catch(error => console.error('Erreur lors de l\'exportation:', error));
    });
});