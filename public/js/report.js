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

// Mise à jour de tous les graphiques
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
                label: 'Tickets',
                data: data.hourlyDistribution,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top'
                }
            },
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
                label: 'Tickets par heure',
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
                label: 'Tickets',
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
        const doc = new jsPDF();

        // Titre du rapport
        doc.setFontSize(20);
        doc.text(`Rapport des tickets - ${new Date(date).toLocaleDateString('fr-FR')}`, 20, 20);

        // Capture des graphiques
        let yPosition = 40;
        
        // Statistiques générales
        doc.setFontSize(14);
        doc.text('Statistiques Générales:', 20, yPosition);
        doc.setFontSize(12);
        doc.text(`Total des tickets: ${document.getElementById('totalTickets').textContent}`, 20, yPosition + 10);
        doc.text(`Ratio Matin: ${document.getElementById('morningRatio').textContent}`, 20, yPosition + 20);
        doc.text(`Ratio Après-midi: ${document.getElementById('afternoonRatio').textContent}`, 20, yPosition + 30);
        doc.text(`Heure la plus active: ${document.getElementById('peakHour').textContent}`, 20, yPosition + 40);

        yPosition += 60;

        // Capture des graphiques
        const charts = [
            { id: 'evolutionChart', title: 'Évolution des tickets' },
            { id: 'glpiChart', title: 'Répartition GLPI' },
            { id: 'blockingChart', title: 'Répartition Bloquant' },
            { id: 'hourlyChart', title: 'Distribution horaire' },
            { id: 'callersChart', title: 'Top des appelants' },
            { id: 'tagsChart', title: 'Tags les plus utilisés' }
        ];

        for (const chart of charts) {
            const canvas = document.getElementById(chart.id);
            if (canvas) {
                // Nouvelle page si nécessaire
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(14);
                doc.text(chart.title, 20, yPosition);
                
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, yPosition + 10, 170, 80);
                
                yPosition += 100;
            }
        }

        // Sauvegarde du PDF
        doc.save(`rapport_tickets_${date}.pdf`);

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

async function generateMarkdownReport(data) {
    const date = document.getElementById('reportDate').value;
    const formattedDate = new Date(date).toLocaleDateString('fr-FR');

    return `# Rapport des tickets - ${formattedDate}

## Résumé
- Total des tickets: ${data.total}
- Tickets GLPI: ${data.glpi}
- Tickets bloquants: ${data.blocking}
- Ratio matin/après-midi: ${data.morningTickets}/${data.afternoonTickets}

## Distribution horaire
${data.hourlyDistribution.map((count, hour) => 
    `- ${String(hour).padStart(2, '0')}:00 : ${count} ticket(s)`
).join('\n')}

## Top appelants
${Object.entries(data.topCallers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `- ${name}: ${count} ticket(s)`)
    .join('\n')}

## Tags les plus utilisés
${Object.entries(data.topTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `- ${tag}: ${count} utilisation(s)`)
    .join('\n')}`;
}

function downloadPDF(pdfContent, filename) {
    const element = document.createElement('a');
    element.href = pdfContent;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}