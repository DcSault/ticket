/**
 * Gestion de la page de rapport quotidien.
 * Ce script récupère les données du rapport pour une date donnée,
 * les affiche et permet de générer un PDF.
 */

// Variable globale pour le graphique
let reportChart = null;

/**
 * Affiche les données du rapport sur la page.
 * @param {object} data - Les données du rapport reçues du serveur.
 */
function displayReportData(data) {
    const reportDate = new Date(document.getElementById('datePicker').value);
    // Ajuster la date pour éviter les problèmes de fuseau horaire à l'affichage
    const displayDate = new Date(reportDate.getTime() + reportDate.getTimezoneOffset() * 60000);

    document.getElementById('reportDate').textContent = displayDate.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Affichage des KPIs
    document.getElementById('totalTickets').textContent = data.total;
    document.getElementById('glpiTickets').textContent = data.glpi;
    document.getElementById('blockingTickets').textContent = data.blocking;
    document.getElementById('morningTickets').textContent = `${data.morningTickets} (${(data.morningRatio * 100).toFixed(1)}%)`;
    document.getElementById('afternoonTickets').textContent = `${data.afternoonTickets} (${(data.afternoonRatio * 100).toFixed(1)}%)`;

    // Affichage des listes "Top 5"
    updateTopList('topCallersList', data.topCallers.slice(0, 5));
    updateTopList('topTagsList', data.topTags.slice(0, 5));

    // Mise à jour du graphique de distribution horaire
    updateHourlyChart(data.hourlyDistribution);

    // Activer le bouton PDF et lui attacher les données
    const pdfButton = document.getElementById('downloadPdf');
    pdfButton.disabled = false;
    // Supprimer l'ancien écouteur pour éviter les multiples téléchargements
    pdfButton.replaceWith(pdfButton.cloneNode(true));
    document.getElementById('downloadPdf').addEventListener('click', () => {
        generatePDF(data);
    });
}

/**
 * Met à jour une liste (UL) avec les données d'un top (appelants ou tags).
 * @param {string} listId - L'ID de l'élément UL.
 * @param {Array<object>} items - La liste des éléments à afficher.
 */
function updateTopList(listId, items) {
    const listElement = document.getElementById(listId);
    listElement.innerHTML = ''; // Vider la liste
    if (items.length === 0) {
        listElement.innerHTML = '<li class="text-gray-500">Aucune donnée</li>';
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center py-1';
        li.innerHTML = `
            <span class="text-gray-700 dark:text-gray-300">${item.name}</span>
            <span class="font-semibold text-blue-600 dark:text-blue-400">${item.count}</span>
        `;
        listElement.appendChild(li);
    });
}

/**
 * Met à jour le graphique de distribution horaire.
 * @param {Array<number>} hourlyData - Le tableau des comptages par heure.
 */
function updateHourlyChart(hourlyData) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    if (reportChart) {
        reportChart.destroy();
    }
    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
            datasets: [{
                label: 'Tickets par heure',
                data: hourlyData,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
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
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Récupère les données du rapport pour la date sélectionnée.
 */
async function fetchReportData() {
    const date = document.getElementById('datePicker').value;
    const loadingIndicator = document.getElementById('loading');
    const reportContent = document.getElementById('reportContent');
    const errorMessage = document.getElementById('errorMessage');

    loadingIndicator.classList.remove('hidden');
    reportContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    document.getElementById('downloadPdf').disabled = true;

    try {
        const response = await fetch(`/api/report-data?date=${date}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        const data = await response.json();
        displayReportData(data);
        reportContent.classList.remove('hidden');
    } catch (error) {
        console.error('Erreur lors de la récupération du rapport:', error);
        errorMessage.textContent = 'Impossible de charger les données du rapport. Veuillez réessayer.';
        errorMessage.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Génère le rapport PDF.
 * @param {object} data - Les données complètes du rapport.
 */
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const reportDate = new Date(document.getElementById('datePicker').value);
    const displayDate = new Date(reportDate.getTime() + reportDate.getTimezoneOffset() * 60000);
    const title = `Rapport Journalier - ${displayDate.toLocaleDateString('fr-FR')}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);

    doc.setFontSize(12);
    doc.text('Résumé de la journée', 14, 40);

    const summaryData = [
        ['Total Tickets', data.total],
        ['Tickets GLPI', data.glpi],
        ['Tickets Bloquants', data.blocking],
        ['Tickets (matin)', `${data.morningTickets} (${(data.morningRatio * 100).toFixed(1)}%)`],
        ['Tickets (après-midi)', `${data.afternoonTickets} (${(data.afternoonRatio * 100).toFixed(1)}%)`]
    ];

    doc.autoTable({
        startY: 45,
        head: [['Indicateur', 'Valeur']],
        body: summaryData,
        theme: 'grid'
    });

    let finalY = doc.lastAutoTable.finalY || 100;

    // Colonnes pour les Top 5
    const topCallersData = data.topCallers.slice(0, 5).map(item => [item.name, item.count]);
    const topTagsData = data.topTags.slice(0, 5).map(item => [item.name, item.count]);

    doc.text('Top 5 Appelants', 14, finalY + 15);
    doc.autoTable({
        startY: finalY + 20,
        head: [['Nom', 'Count']],
        body: topCallersData,
        theme: 'striped',
        margin: { right: 107 } // Marge pour laisser de la place à la deuxième table
    });

    doc.text('Top 5 Tags', 110, finalY + 15);
    doc.autoTable({
        startY: finalY + 20,
        head: [['Tag', 'Count']],
        body: topTagsData,
        theme: 'striped',
        margin: { left: 107 }
    });
    
    finalY = doc.lastAutoTable.finalY + 15;

    // Ajouter le graphique
    if (reportChart) {
        try {
            const canvas = document.getElementById('reportChart');
            const chartImage = canvas.toDataURL('image/png', 1.0);
            doc.addPage();
            doc.text('Distribution horaire des tickets', 14, 22);
            doc.addImage(chartImage, 'PNG', 14, 30, 180, 90);
        } catch (e) {
            console.error("Erreur lors de l'ajout du graphique au PDF:", e);
            doc.text("Le graphique n'a pas pu être généré.", 14, 30);
        }
    }

    doc.save(`rapport-${displayDate.toISOString().split('T')[0]}.pdf`);
}


/**
 * Initialisation de la page.
 */
document.addEventListener('DOMContentLoaded', () => {
    const datePicker = document.getElementById('datePicker');
    
    // Mettre la date du jour par défaut
    datePicker.value = new Date().toISOString().split('T')[0];

    // Charger les données pour la date actuelle
    fetchReportData();

    // Ajouter l'écouteur pour le changement de date
    datePicker.addEventListener('change', fetchReportData);
});