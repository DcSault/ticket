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
    
    // Calculer la moyenne en fonction de la période sélectionnée
    let moyenne = 0;
    console.log(`Calcul de la moyenne pour la période: ${currentPeriod}`);
    
    if (data.data && data.data.length > 0) {
        // Précalculer les tickets réellement présents dans la période
        const ticketsInPeriod = data.data.reduce((sum, count) => sum + count, 0);
        
        if (currentPeriod === 'day') {
            // Pour la vue quotidienne: moyenne = tickets dans les jours affichés / nombre de jours ouvrables
            // Le nombre de jours est déjà filtré pour exclure les weekends dans data.labels
            const daysWithData = data.labels.length || 1;
            
            // Si le comptage réel par jour est différent du total filtré, utiliser le comptage réel
            if (ticketsInPeriod !== totalTickets && ticketsInPeriod > 0) {
                moyenne = ticketsInPeriod / daysWithData;
                console.log(`Moyenne quotidienne (comptage par jours ouvrables): ${ticketsInPeriod} tickets / ${daysWithData} jours = ${moyenne.toFixed(1)}`);
            } else {
                // Sinon utiliser le total filtré
                moyenne = totalTickets / daysWithData;
                console.log(`Moyenne quotidienne (total/jours ouvrables): ${totalTickets} tickets / ${daysWithData} jours = ${moyenne.toFixed(1)}`);
            }
        } 
        else if (currentPeriod === 'week') {
            // Pour la vue hebdomadaire: moyenne = tickets dans les semaines / nombre de semaines
            const weeksCount = data.labels.length || 1;
            
            // Si le comptage réel par semaine est différent du total filtré, utiliser le comptage réel
            if (ticketsInPeriod !== totalTickets && ticketsInPeriod > 0) {
                moyenne = ticketsInPeriod / weeksCount;
                console.log(`Moyenne hebdomadaire (comptage par semaine): ${ticketsInPeriod} tickets / ${weeksCount} semaines = ${moyenne.toFixed(1)}`);
            } else {
                // Sinon utiliser le total filtré
                moyenne = totalTickets / weeksCount;
                console.log(`Moyenne hebdomadaire (total): ${totalTickets} tickets / ${weeksCount} semaines = ${moyenne.toFixed(1)}`);
            }
        } 
        else if (currentPeriod === 'month') {
            // Pour la vue mensuelle: moyenne = tickets dans les mois / nombre de mois
            const monthsCount = data.labels.length || 1;
            
            // Si le comptage réel par mois est différent du total filtré, utiliser le comptage réel
            if (ticketsInPeriod !== totalTickets && ticketsInPeriod > 0) {
                moyenne = ticketsInPeriod / monthsCount;
                console.log(`Moyenne mensuelle (comptage par mois): ${ticketsInPeriod} tickets / ${monthsCount} mois = ${moyenne.toFixed(1)}`);
            } else {
                // Sinon utiliser le total filtré
                moyenne = totalTickets / monthsCount;
                console.log(`Moyenne mensuelle (total): ${totalTickets} tickets / ${monthsCount} mois = ${moyenne.toFixed(1)}`);
            }
        }
    } else {
        moyenne = 0;
        console.log(`Aucune donnée pour calculer la moyenne`);
    }
    
    // Mettre à jour l'affichage
    document.getElementById('avgTicketsPerDay').textContent = moyenne.toFixed(1);
    
    // Ajouter les détails de la période actuelle
    const periodDetails = document.querySelector('.period-details');
    if (periodDetails) {
        const periodLabels = {
            day: 'par jour ouvrable',
            week: 'par semaine',
            month: 'par mois'
        };
        
        periodDetails.innerHTML = `
            <div class="text-sm text-gray-600 mt-2">
                <p>Période sélectionnée: <span class="font-medium">${periodLabels[currentPeriod] || ''}</span></p>
                <p>Total des tickets dans la période: <span class="font-medium">${totalTickets}</span></p>
                <p>Tickets GLPI: <span class="font-medium">${totalGLPI}</span> (${Math.round(totalGLPI/totalTickets*100) || 0}%)</p>
                <p>Tickets bloquants: <span class="font-medium">${totalBlocking}</span> (${Math.round(totalBlocking/totalTickets*100) || 0}%)</p>
                <p>Moyenne: <span class="font-medium">${moyenne.toFixed(1)}</span> tickets ${periodLabels[currentPeriod] || ''}</p>
            </div>
        `;
    }
    
    // Afficher des logs pour le débogage
    console.log(`Statistiques mises à jour: ${totalTickets} tickets au total (${totalGLPI} GLPI, ${totalBlocking} bloquants)`);
}

function updateAllCharts() {
    // Afficher la période actuelle pour débogage
    console.log(`Mise à jour des graphiques pour la période: ${currentPeriod}`);
    
    // Vérifier que nous avons bien des données pour la période actuelle
    const filteredData = filteredStats[currentPeriod];
    if (!filteredData) {
        console.error(`Pas de données pour la période ${currentPeriod}`);
        document.getElementById('avgTicketsPerDay').textContent = '0';
        return;
    }
    
    console.log(`Données filtrées utilisées pour les statistiques:`, filteredData);
    
    // Si la période n'a pas de données, n'afficher aucun ticket
    if (filteredData.labels.length === 0) {
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
        
        updateBlockingChart(filteredData);
        
        // Effacer les graphiques de top callers et tags
        const emptyData = [];
        updateCallersChart(emptyData);
        updateTagsChart(emptyData);
        
        // Afficher un message indiquant l'absence de données
        console.log("Aucune donnée à afficher pour la période sélectionnée");
        
        return;
    }
    
    // Créer un dataset combiné pour le graphique principal:
    // - Utiliser toutes les étiquettes (labels) de la période (stats[currentPeriod])
    // - Mais afficher uniquement les données filtrées pour ces étiquettes
    
    // Obtenir les dates de début et fin sélectionnées pour le filtrage
    const startDate = normalizeDate(document.getElementById('startDate').value);
    const endDate = normalizeDate(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59, 999);
    
    // Créer un objet pour le graphique principal avec les étiquettes (en excluant les weekends pour la vue quotidienne)
    const mainChartData = {
        labels: [],
        data: [],
        glpiData: [],
        blockingData: []
    };
    
    // Pour la vue quotidienne, exclure les weekends des étiquettes
    if (currentPeriod === 'day') {
        stats[currentPeriod].labels.forEach((label, index) => {
            const dateFromLabel = normalizeDate(label.split('/').reverse().join('-'));
            if (!isWeekend(dateFromLabel)) {
                mainChartData.labels.push(label);
            }
        });
    } else {
        // Pour les vues hebdomadaire et mensuelle, garder toutes les étiquettes
        mainChartData.labels = stats[currentPeriod].labels;
    }
    
    // Pour chaque étiquette, calculer les données correspondantes
    mainChartData.labels.forEach((label, index) => {
        let periodStartDate, periodEndDate;
        
        // Convertir les labels en dates selon leur format
        if (currentPeriod === 'day') {
            // Format: JJ/MM/AAAA
            periodStartDate = normalizeDate(label.split('/').reverse().join('-'));
            periodEndDate = new Date(periodStartDate);
            periodEndDate.setHours(23, 59, 59, 999);
        } 
        else if (currentPeriod === 'week' && label.includes(' - ')) {
            // Format: JJ/MM/AAAA - JJ/MM/AAAA
            const [startStr, endStr] = label.split(' - ');
            periodStartDate = normalizeDate(startStr.split('/').reverse().join('-'));
            periodEndDate = normalizeDate(endStr.split('/').reverse().join('-'));
            periodEndDate.setHours(23, 59, 59, 999);
        } 
        else if (currentPeriod === 'month') {
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
        
        // Comptage des tickets pour cette période dans la plage filtrée
        if (periodStartDate && periodEndDate) {
            // Vérifier si cette période chevauche la plage de dates sélectionnée
            const isInRange = (periodStartDate <= endDate && periodEndDate >= startDate);
            
            if (isInRange) {
                // Si la période est dans la plage, utiliser les données filtrées
                const filteredLabelIndex = filteredData.labels.indexOf(label);
                if (filteredLabelIndex !== -1) {
                    mainChartData.data.push(filteredData.data[filteredLabelIndex]);
                    mainChartData.glpiData.push(filteredData.glpiData[filteredLabelIndex]);
                    mainChartData.blockingData.push(filteredData.blockingData[filteredLabelIndex]);
                } else {
                    mainChartData.data.push(0);
                    mainChartData.glpiData.push(0);
                    mainChartData.blockingData.push(0);
                }
            } else {
                // Si la période n'est pas dans la plage, mettre à zéro
                mainChartData.data.push(0);
                mainChartData.glpiData.push(0);
                mainChartData.blockingData.push(0);
            }
        } else {
            // Si pas de dates valides, mettre à zéro
            mainChartData.data.push(0);
            mainChartData.glpiData.push(0);
            mainChartData.blockingData.push(0);
        }
    });
    
    console.log('Données complètes pour le graphique principal:', mainChartData);
    
    // Mettre à jour le graphique principal avec toutes les étiquettes mais les données filtrées
    updateMainChart(mainChartData);
    
    // Mettre à jour les autres graphiques avec les données filtrées
    updateGLPIChart(filteredData);
    updateBlockingChart(filteredData);
    updateTopCharts();
    
    // Mise à jour des statistiques et de la moyenne
    console.log("Mise à jour des statistiques et de la moyenne...");
    updateStats(filteredData);
}

/**
 * Vérifie si une date est un jour de weekend (samedi ou dimanche)
 * @param {Date} date - La date à vérifier
 * @returns {boolean} Vrai si c'est un weekend, faux sinon
 */
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
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
    // et exclure les weekends
    const filteredDetailedData = stats.detailedData.filter(ticket => {
        const ticketDate = normalizeDate(ticket.date);
        return ticketDate >= startDate && ticketDate <= endDate && !isWeekend(ticketDate);
    });
    
    console.log(`Tickets dans la plage (hors weekends): ${filteredDetailedData.length}`);

    // Afficher un message d'information sur la plage de dates
    updateDateRangeInfo(startDate, endDate, filteredDetailedData.length);

    // 2. Créer un nouvel objet de statistiques filtrées
    filteredStats = {
        detailedData: filteredDetailedData,
        day: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, totalInLabels: 0 },
        week: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, totalInLabels: 0 },
        month: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, totalInLabels: 0 }
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
                
                // Sauter les weekends pour la vue quotidienne
                if (isWeekend(periodStartDate)) {
                    return; // Continue to next iteration
                }
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
                    // En excluant les weekends pour toutes les périodes
                    const ticketsInPeriod = filteredDetailedData.filter(ticket => {
                        const ticketDate = normalizeDate(ticket.date);
                        return ticketDate >= periodStartDate && ticketDate <= periodEndDate;
                    });
                    
                    // Ajouter les comptages pour cette période
                    filteredStats[period].data.push(ticketsInPeriod.length);
                    filteredStats[period].glpiData.push(ticketsInPeriod.filter(t => t.isGLPI).length);
                    filteredStats[period].blockingData.push(ticketsInPeriod.filter(t => t.isBlocking).length);
                    
                    // Incrémenter le compteur de tickets totaux dans les périodes affichées
                    filteredStats[period].totalInLabels += ticketsInPeriod.length;
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
        
        // Vérifier si le total des étiquettes correspond au total réel et logger la différence
        if (filteredStats[period].totalInLabels !== filteredDetailedData.length) {
            console.log(`Différence dans les totaux ${period}: 
                Total réel: ${filteredDetailedData.length} tickets,
                Total dans les labels: ${filteredStats[period].totalInLabels} tickets,
                Différence: ${filteredDetailedData.length - filteredStats[period].totalInLabels} tickets`);
        }
    });

    // 5. Journal de débogage
    console.log('Statistiques filtrées:', filteredStats);
    console.log(`Total réel: ${filteredDetailedData.length} tickets`);
    
    // Mettre à jour les graphiques
    updateAllCharts();
}

function updatePeriod(period) {
    console.log(`⭐ Mise à jour de la période vers: ${period}`);
    
    // Mettre à jour le bouton actif pour les éléments avec la classe .period-btn
    document.querySelectorAll('.period-btn').forEach(btn => {
        const btnPeriod = btn.getAttribute('data-period');
        console.log(`Bouton période trouvé:`, btnPeriod);
        if (btnPeriod === period) {
            btn.classList.add('active-period', 'bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-300', 'border-blue-600', 'dark:border-blue-500');
            btn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600');
        } else {
            btn.classList.remove('active-period', 'bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-300', 'border-blue-600', 'dark:border-blue-500');
            btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300', 'border-gray-300', 'dark:border-gray-600');
        }
    });
    
    // Mettre également à jour les boutons avec les IDs btnDay, btnWeek, btnMonth
    ['day', 'week', 'month'].forEach(p => {
        const btn = document.getElementById(`btn${p.charAt(0).toUpperCase() + p.slice(1)}`);
        if (btn) {
            console.log(`Bouton ID trouvé: btn${p.charAt(0).toUpperCase() + p.slice(1)}`, btn);
            if (p === period) {
                btn.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:hover:bg-gray-600');
                btn.classList.add('bg-blue-500', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
            } else {
            btn.classList.remove('bg-blue-500', 'text-white', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
                btn.classList.add('bg-gray-200', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:hover:bg-gray-600', 'text-gray-900', 'dark:text-white');
            }
        } else {
            console.warn(`Bouton avec ID btn${p.charAt(0).toUpperCase() + p.slice(1)} non trouvé`);
        }
    });
    
    // Mettre à jour le libellé de la moyenne en fonction de la période
    const averageLabel = document.getElementById('averageLabel');
    if (averageLabel) {
        switch (period) {
            case 'day':
                averageLabel.textContent = 'par jour ouvrable';
                break;
            case 'week':
                averageLabel.textContent = 'par semaine';
                break;
            case 'month':
                averageLabel.textContent = 'par mois';
                break;
        }
        console.log(`Libellé de moyenne mis à jour: ${averageLabel.textContent}`);
    }
    
    // Mettre à jour la période active avant de filtrer les données
    currentPeriod = period;
    console.log(`✅ Période active mise à jour: ${currentPeriod}`);
    
    // Effacer temporairement l'affichage de la moyenne pour éviter les valeurs incohérentes pendant le chargement
    document.getElementById('avgTicketsPerDay').textContent = '...';
    
    // Filtrer les données avec la période actuelle et les dates sélectionnées
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
    
    // Log des données de statistiques pour débogage
    console.log("Statistiques chargées:");
    console.log("- Données quotidiennes:", stats.day);
    console.log("- Données hebdomadaires:", stats.week);
    console.log("- Données mensuelles:", stats.month);

    // Initialiser également les statistiques filtrées
    filteredStats = JSON.parse(JSON.stringify(stats));
    
    // Déterminer la plage de dates complète
    const { firstDate, lastDate } = getMinMaxDates();
    
    // Mettre à jour les champs de date pour afficher toutes les données
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.valueAsDate = firstDate;
        endDateInput.valueAsDate = lastDate;
    }
    
    // Par défaut, afficher les statistiques quotidiennes
    currentPeriod = 'day';
    console.log(`Période initiale définie: ${currentPeriod}`);
    
    // Mettre à jour l'état visuel des boutons de période
    updatePeriod(currentPeriod);
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

// Fonction pour initialiser la page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        document.getElementById('loading').classList.remove('hidden');
        
        // Récupérer les statistiques depuis l'API
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }
        
        stats = await response.json();
        
        // Initialiser les statistiques
        initializeStats(stats);
        
        document.getElementById('loading').classList.add('hidden');
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('loading').classList.add('hidden');
        alert('Erreur lors du chargement des statistiques: ' + error.message);
    }
});

/**
 * Réinitialise la plage de dates pour afficher tous les tickets
 */
function resetToAllData() {
    try {
        // Vérifier si les statistiques sont disponibles
        if (!stats || !stats.detailedData || stats.detailedData.length === 0) {
            console.error('Aucune donnée disponible pour réinitialiser la plage de dates');
            return;
        }

        // Trouver les dates min et max
        const { firstDate, lastDate } = getMinMaxDates(stats);
        
        if (!firstDate || !lastDate) {
            console.error('Impossible de déterminer les dates limites');
            return;
        }

        // Mettre à jour les champs de date
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        startDateInput.valueAsDate = firstDate;
        endDateInput.valueAsDate = lastDate;
        
        console.log(`Plage réinitialisée du ${firstDate.toLocaleDateString()} au ${lastDate.toLocaleDateString()}`);
        
        // Mettre à jour les statistiques
        filterDataByDate();
        
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la plage de dates:', error);
    }
}

/**
 * Obtient la date la plus ancienne et la plus récente des tickets
 * @returns {Object} Un objet contenant firstDate et lastDate
 */
function getMinMaxDates() {
    if (!stats || !stats.detailedData || stats.detailedData.length === 0) {
        console.error("Pas de données disponibles pour déterminer les dates");
        return { 
            firstDate: new Date(), 
            lastDate: new Date() 
        };
    }
    
    try {
        // Convertir toutes les dates en objets Date et filtrer les dates invalides
        const dates = stats.detailedData
            .map(ticket => new Date(ticket.date))
            .filter(date => !isNaN(date.getTime()));
        
        if (dates.length === 0) {
            console.error("Aucune date valide trouvée");
            return { 
                firstDate: new Date(), 
                lastDate: new Date() 
            };
        }
        
        // Trier les dates et prendre la première et la dernière
        dates.sort((a, b) => a - b);
        const firstDate = dates[0];
        
        // Utiliser la date actuelle comme date de fin pour inclure les tickets récents
        const lastDate = new Date();
        
        console.log(`Plage de dates détectée: du ${firstDate.toLocaleDateString()} au ${lastDate.toLocaleDateString()}`);
        
        return { firstDate, lastDate };
    } catch (error) {
        console.error("Erreur lors de la détermination des dates:", error);
        return { 
            firstDate: new Date(), 
            lastDate: new Date() 
        };
    }
}

/**
 * Affiche un message d'information sur la plage de dates
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @param {number} ticketCount - Nombre de tickets dans la plage
 */
function updateDateRangeInfo(startDate, endDate, ticketCount) {
    const dateRangeInfo = document.querySelector('.date-range-info');
    if (!dateRangeInfo) {
        // Créer un élément pour afficher l'information
        const dateControlsContainer = document.querySelector('.date-controls')?.parentNode;
        if (dateControlsContainer) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'date-range-info mt-2 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-sm';
            dateControlsContainer.appendChild(infoDiv);
            
            // Mettre à jour le message
            updateDateRangeMessage(infoDiv, startDate, endDate, ticketCount);
        }
    } else {
        // Mettre à jour le message existant
        updateDateRangeMessage(dateRangeInfo, startDate, endDate, ticketCount);
    }
}

/**
 * Met à jour le message d'information sur la plage de dates
 * @param {HTMLElement} element - Élément HTML où afficher le message
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @param {number} ticketCount - Nombre de tickets dans la plage
 */
function updateDateRangeMessage(element, startDate, endDate, ticketCount) {
    // Formater les dates pour le message
    const startStr = startDate.toLocaleDateString('fr-FR');
    const endStr = endDate.toLocaleDateString('fr-FR');
    
    // Calculer la durée de la plage en jours
    const oneDay = 24 * 60 * 60 * 1000; // millisecondes dans une journée
    const durationDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
    
    // Calculer le nombre de jours ouvrables (en excluant les weekends)
    let workingDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (!isWeekend(currentDate)) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Créer le message
    element.innerHTML = `
        <span class="font-semibold">Plage affichée:</span> ${startStr} à ${endStr} (${durationDays} jours dont ${workingDays} jours ouvrables)
        <span class="font-semibold ml-4">Tickets:</span> ${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'}
        <span class="text-blue-600 ml-2">(Les weekends sont exclus des statistiques)</span>
        ${ticketCount === 0 ? '<span class="text-red-500 ml-2">(Aucun ticket dans cette plage)</span>' : ''}
    `;
}