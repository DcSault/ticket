/**
 * Serveur principal de l'application de gestion de tickets
 * Version: 1.1.0
 * Dernière mise à jour: Restructuration des fichiers CSS et JavaScript
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const bodyParser = require('body-parser');
const session = require('express-session');
const cron = require('node-cron');
const { Op } = require('sequelize');
const { toZonedTime, format } = require('date-fns-tz');
const { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, endOfDay, endOfWeek, endOfMonth } = require('date-fns');

// Import des modèles
const { sequelize, User, Ticket, Message, SavedField } = require('./models');

const app = express();
const UPLOADS_DIR = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');

// Middleware Configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Fichiers statiques
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Les fichiers HTML sont servis via sendFile sur des routes dédiées

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Images only'));
    }
});

// Authentication Middleware
const requireLogin = (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    next();
};

// Fonction pour archiver les tickets anciens
async function archiveOldTickets() {
    try {
        const tickets = await Ticket.findAll({
            where: {
                isArchived: false,
                createdAt: {
                    [Op.lt]: new Date(new Date() - 24 * 60 * 60 * 1000) // Tickets de plus de 24 heures
                }
            }
        });

        for (const ticket of tickets) {
            await ticket.update({ isArchived: true, archivedAt: new Date(), archivedBy: 'system' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'archivage des tickets:', error);
    }
}

// Tâche cron pour archiver les vieux tickets tous les jours à 1h du matin
cron.schedule('0 1 * * *', () => {
    console.log('Exécution de la tâche d\'archivage des anciens tickets...');
    archiveOldTickets();
}, {
    scheduled: true,
    timezone: "Europe/Paris"
});

// Configuration pour utiliser uniquement les fichiers HTML

// Routes d'authentification
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

// Route API pour récupérer la liste des utilisateurs (pour l'autocomplétion)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username'],
            order: [['username', 'ASC']]
        });
        res.json(users.map(user => user.username));
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/login', async (req, res) => {
    const { username } = req.body;
    if (username?.trim()) {
        try {
            await User.findOrCreate({
                where: { username: username.trim() }
            });
            req.session.username = username.trim();
            res.redirect('/');
        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Routes principales
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// Routes des tickets
app.post('/api/tickets', requireLogin, async (req, res) => {
    try {
        const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : String(req.body.tags).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)) : [];

        // Données par défaut pour un nouveau ticket
        const ticketPayload = {
            caller: req.body.caller,
            reason: req.body.reason || '',
            tags: tags,
            status: req.body.status || 'open',
            isGLPI: req.body.isGLPI === 'true' || req.body.isGLPI === true,
            isBlocking: req.body.isBlocking === 'true' || req.body.isBlocking === true,
            glpiNumber: (req.body.isGLPI === 'true' || req.body.isGLPI === true) ? (req.body.glpiNumber || null) : null,
            createdBy: req.body.createdBy || req.session.username, // Priorité au corps de la requête
            createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date() // Priorité au corps de la requête
        };

        const ticket = await Ticket.create(ticketPayload);

        if (!ticket.isGLPI) {
            const fieldsToSave = [
                { type: 'caller', value: req.body.caller },
                { type: 'reason', value: req.body.reason }
            ];
            tags.forEach(tag => fieldsToSave.push({ type: 'tag', value: tag }));
            await saveFields(fieldsToSave);
        }

        // Par défaut on redirige (soumissions de formulaires). Si requête JSON, retourner JSON
        if (req.is('application/json')) {
            return res.status(201).json(ticket);
        }
        return res.redirect('/');
    } catch (error) {
        console.error('Erreur création ticket:', error);
        res.status(500).send('Erreur lors de la création du ticket');
    }
});

app.get('/ticket/:id', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/ticket.html'));
});

app.get('/ticket/:id/edit', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/edit-ticket.html'));
});

app.post('/api/tickets/:id/edit', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.redirect('/');
        }

        const updatedData = {
            caller: req.body.caller,
            reason: req.body.isGLPI === 'true' ? '' : (req.body.reason || ''),
            tags: req.body.isGLPI === 'true' ? [] : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []),
            isGLPI: req.body.isGLPI === 'true',
            isBlocking: req.body.isBlocking === 'true',
            glpiNumber: req.body.isGLPI === 'true' ? (req.body.glpiNumber || null) : null,
            lastModifiedBy: req.session.username,
            lastModifiedAt: new Date()
        };

        // Mise à jour de la date de création si spécifiée
        if (req.body.creationDate && req.body.creationTime) {
            const dateStr = `${req.body.creationDate}T${req.body.creationTime}:00`;
            const newCreatedAt = new Date(dateStr);
            
            // Vérifier que la date est valide
            if (!isNaN(newCreatedAt.getTime())) {
                updatedData.createdAt = newCreatedAt;
            }
        }

        if (!updatedData.isGLPI) {
            const fieldsToSave = [
                { type: 'caller', value: req.body.caller },
                { type: 'reason', value: req.body.reason }
            ];
            await saveFields(fieldsToSave);
        }

        await ticket.update(updatedData);
        return res.json({ success: true, message: 'Ticket mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur modification ticket:', error);
        res.status(500).send('Erreur lors de la modification du ticket');
    }
});

app.post('/api/tickets/:id/delete', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [Message]
        });

        if (ticket) {
            // Supprimer les fichiers images associés
            for (const message of ticket.Messages) {
                if (message.type === 'image' && message.content.startsWith('/uploads/')) {
                    try {
                        const fileName = path.basename(message.content);
                        const imagePath = path.join(UPLOADS_DIR, fileName);
                        await fsPromises.unlink(imagePath);
                    } catch (err) {
                        console.error('Erreur suppression image:', err);
                    }
                }
            }
            await ticket.destroy();
        }
        res.redirect('/');
    } catch (error) {
        console.error('Erreur suppression ticket:', error);
        res.status(500).send('Erreur lors de la suppression du ticket');
    }
});

app.post('/api/tickets/:id/archive', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).send('Ticket non trouvé');
        }

        await ticket.update({ isArchived: true, archivedAt: new Date(), archivedBy: req.session.username });
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        res.status(500).send('Erreur lors de l\'archivage');
    }
});

// Messages: accepte texte (JSON) ou image (multipart avec champ 'image')
app.post('/api/tickets/:id/messages', requireLogin, upload.single('image'), async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        // Si un fichier image est fourni (multipart)
        if (req.file) {
            const message = await Message.create({
                content: `/uploads/${req.file.filename}`,
                type: 'image',
                author: req.session.username,
                TicketId: ticket.id
            });
            return res.status(201).json(message);
        }

        // Sinon, traiter comme message texte (JSON/application/x-www-form-urlencoded)
        const content = (req.body && req.body.content) ? String(req.body.content) : '';
        if (!content.trim()) {
            return res.status(400).json({ error: 'Contenu du message requis' });
        }
        const message = await Message.create({
            content,
            type: 'text',
            author: req.session.username,
            TicketId: ticket.id
        });
        return res.status(201).json(message);
    } catch (error) {
        console.error('Erreur ajout message:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du message' });
    }
});

// (Route upload dédiée supprimée au profit de /api/tickets/:id/messages)

// Archives
app.get('/archives', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/archives.html'));
});

app.get('/api/archives', requireLogin, async (req, res) => {
    try {
        // Récupérer les filtres depuis la requête
        const { search, startDate, endDate, filter, value } = req.query;
        
        // Construire la requête de base
        let whereClause = {
            isArchived: true
        };
        
        // Ajouter les filtres si présents
        if (search) {
            whereClause[Op.or] = [
                { caller: { [Op.iLike]: `%${search}%` } },
                { reason: { [Op.iLike]: `%${search}%` } }
            ];
        }
        
        if (startDate) {
            whereClause.createdAt = whereClause.createdAt || {};
            whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        
        if (endDate) {
            whereClause.createdAt = whereClause.createdAt || {};
            whereClause.createdAt[Op.lte] = new Date(endDate);
        }
        
        if (filter && value) {
            if (filter === 'tag') {
                whereClause.tags = { [Op.contains]: [value] };
            } else {
                whereClause[filter] = { [Op.iLike]: `%${value}%` };
            }
        }
        
        // Récupérer les tickets archivés
        const archives = await Ticket.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });
        
        res.json(archives);
    } catch (error) {
        console.error('Erreur lors de la récupération des archives:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des archives' });
    }
});

app.get('/api/archives/:id/details', requireLogin, async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        // Récupérer le ticket avec ses messages
        const ticket = await Ticket.findByPk(ticketId, {
            include: [Message]
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }
        
        res.json(ticket);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du ticket:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails du ticket' });
    }
});

// Stats
app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/stats.html'));
});

// Route pour afficher la page de rapport
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/report.html'));
});

// Route temporaire pour tester le nouveau système de thème
app.get('/theme-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/theme-test.html'));
});

// API pour les statistiques
app.get('/api/stats', async (req, res) => {
    try {
        // Filtres optionnels par date (from/to en ISO yyyy-mm-dd)
        const { from, to } = req.query;
        const where = {};
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt[Op.gte] = new Date(from);
            if (to) {
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                where.createdAt[Op.lte] = end;
            }
        }

        const tickets = await Ticket.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        const stats = await processStats(tickets, from ? new Date(from) : null, to ? new Date(to) : null);
        res.json(stats);
    } catch (error) {
        console.error('Erreur stats API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour les données de rapport
app.get('/api/report-data', async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const reportData = await getReportStats(date);
        res.json(reportData);
    } catch (error) {
        console.error('Erreur API rapport:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Fonction pour obtenir l'heure locale française
function getFrenchLocalHour(dateString) {
    const date = new Date(dateString);
    const zonedDate = toZonedTime(date, 'Europe/Paris');
    return zonedDate.getHours();
}

// Fonction pour normaliser une date en heure locale française
function normalizeFrenchDate(dateString) {
    const date = new Date(dateString);
    return toZonedTime(date, 'Europe/Paris');
}

// Fonction pour générer les statistiques du rapport
async function getReportStats(date) {
    const timeZone = 'Europe/Paris';
    const dayStart = startOfDay(toZonedTime(date, timeZone));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const tickets = await Ticket.findAll({
        where: {
            createdAt: {
                [Op.between]: [dayStart, dayEnd]
            }
        }
    });

    if (tickets.length === 0) {
        return {
            total: 0, glpi: 0, blocking: 0,
            hourlyDistribution: Array(24).fill(0),
            morningTickets: 0, afternoonTickets: 0,
            morningRatio: 0, afternoonRatio: 0,
            topCallers: {}, topTags: {}
        };
    }

    let morningTickets = 0;
    const hourlyDistribution = Array(24).fill(0);
    const topCallers = {};
    const topTags = {};

    tickets.forEach(ticket => {
        const ticketDate = toZonedTime(ticket.createdAt, timeZone);
        const hour = ticketDate.getHours();
        
        hourlyDistribution[hour]++;
        if (hour < 12) {
            morningTickets++;
        }

        if (ticket.caller) {
            topCallers[ticket.caller] = (topCallers[ticket.caller] || 0) + 1;
        }

        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                if (tag) {
                    topTags[tag] = (topTags[tag] || 0) + 1;
                }
            });
        }
    });

    const total = tickets.length;
    const afternoonTickets = total - morningTickets;

    // Trier et formater les top appelants et tags
    const topCallersList = Object.entries(topCallers)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const topTagsList = Object.entries(topTags)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        total,
        glpi: tickets.filter(t => t.isGLPI).length,
        blocking: tickets.filter(t => t.isBlocking).length,
        morningTickets,
        afternoonTickets,
        morningRatio: total > 0 ? morningTickets / total : 0,
        afternoonRatio: total > 0 ? afternoonTickets / total : 0,
        hourlyDistribution,
        topCallers: topCallersList, // Renvoyer une liste triée
        topTags: topTagsList // Renvoyer une liste triée
    };
}

// Delete saved field
app.post('/api/saved-fields/delete', requireLogin, async (req, res) => {
    try {
        const { field, value } = req.body;
        await SavedField.destroy({
            where: { 
                type: field,
                value: value
            }
        });
        res.redirect('/');
    } catch (error) {
        console.error('Erreur suppression champ:', error);
        res.status(500).send('Erreur lors de la suppression');
    }
});

// Helper pour sauvegarder les champs
async function saveFields(fields) {
    const promises = fields.map(field => {
        if (field.value) {
            return SavedField.findOrCreate({ where: { type: field.type, value: field.value } });
        }
        return Promise.resolve();
    });
    await Promise.all(promises);
}

// Fonction pour générer les statistiques
async function processStats(tickets, startDate, endDate) {
    console.log(`Traitement de ${tickets.length} tickets pour les statistiques`);

    const timeZone = 'Europe/Paris';

    // 1. Déterminer la plage de dates si non fournie
    if (!startDate || !endDate) {
        if (tickets.length === 0) {
            startDate = new Date();
            endDate = new Date();
        } else {
            const dates = tickets.map(t => t.createdAt);
            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));
        }
    }

    const zonedStart = toZonedTime(startDate, timeZone);
    const zonedEnd = toZonedTime(endDate, timeZone);

    const stats = {
        day: { labels: [], data: [], glpiData: [], blockingData: [] },
        week: { labels: [], data: [], glpiData: [], blockingData: [] },
        month: { labels: [], data: [], glpiData: [], blockingData: [] },
        detailedData: [],
        topTags: [],
        topCallers: []
    };

    // 2. Initialiser les labels et les structures de comptage dynamiquement
    const dailyCounts = new Map();
    eachDayOfInterval({ start: zonedStart, end: zonedEnd }).forEach(day => {
        const label = format(day, 'dd/MM/yyyy', { timeZone });
        stats.day.labels.push(label);
        dailyCounts.set(label, { total: 0, glpi: 0, blocking: 0 });
    });

    const weeklyCounts = new Map();
    eachWeekOfInterval({ start: zonedStart, end: zonedEnd }, { weekStartsOn: 1 }).forEach(week => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
        const label = `${format(weekStart, 'dd/MM/yyyy', { timeZone })} - ${format(weekEnd, 'dd/MM/yyyy', { timeZone })}`;
        stats.week.labels.push(label);
        weeklyCounts.set(format(weekStart, 'yyyy-MM-dd'), { label, total: 0, glpi: 0, blocking: 0 });
    });

    const monthlyCounts = new Map();
    eachMonthOfInterval({ start: zonedStart, end: zonedEnd }).forEach(month => {
        const monthStart = startOfMonth(month);
        const label = format(monthStart, 'MMMM yyyy', { timeZone, locale: require('date-fns/locale/fr') });
        stats.month.labels.push(label);
        monthlyCounts.set(format(monthStart, 'yyyy-MM'), { label, total: 0, glpi: 0, blocking: 0 });
    });

    // 3. Traiter chaque ticket
    const tagStats = {};
    const callerStats = {};

    tickets.forEach(ticket => {
        const ticketDate = toZonedTime(ticket.createdAt, timeZone);

        // Statistiques détaillées
        stats.detailedData.push({
            id: ticket.id,
            date: ticket.createdAt,
            caller: ticket.caller,
            tags: ticket.tags,
            isGLPI: ticket.isGLPI,
            isBlocking: ticket.isBlocking
        });

        // Comptage quotidien
        const dayLabel = format(ticketDate, 'dd/MM/yyyy', { timeZone });
        if (dailyCounts.has(dayLabel)) {
            dailyCounts.get(dayLabel).total++;
            if (ticket.isGLPI) dailyCounts.get(dayLabel).glpi++;
            if (ticket.isBlocking) dailyCounts.get(dayLabel).blocking++;
        }

        // Comptage hebdomadaire
        const weekKey = format(startOfWeek(ticketDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        if (weeklyCounts.has(weekKey)) {
            weeklyCounts.get(weekKey).total++;
            if (ticket.isGLPI) weeklyCounts.get(weekKey).glpi++;
            if (ticket.isBlocking) weeklyCounts.get(weekKey).blocking++;
        }

        // Comptage mensuel
        const monthKey = format(startOfMonth(ticketDate), 'yyyy-MM');
        if (monthlyCounts.has(monthKey)) {
            monthlyCounts.get(monthKey).total++;
            if (ticket.isGLPI) monthlyCounts.get(monthKey).glpi++;
            if (ticket.isBlocking) monthlyCounts.get(monthKey).blocking++;
        }

        // Compter les tags et appelants
        if (ticket.caller) {
            callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
        }
        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                if (tag) tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        }
    });

    // 4. Remplir les tableaux de données pour les graphiques
    stats.day.labels.forEach(label => {
        const counts = dailyCounts.get(label) || { total: 0, glpi: 0, blocking: 0 };
        stats.day.data.push(counts.total);
        stats.day.glpiData.push(counts.glpi);
        stats.day.blockingData.push(counts.blocking);
    });

    const weekKeys = Array.from(weeklyCounts.keys());
    weekKeys.forEach(key => {
        const counts = weeklyCounts.get(key);
        stats.week.data.push(counts.total);
        stats.week.glpiData.push(counts.glpi);
        stats.week.blockingData.push(counts.blocking);
    });

    const monthKeys = Array.from(monthlyCounts.keys());
    monthKeys.forEach(key => {
        const counts = monthlyCounts.get(key);
        stats.month.data.push(counts.total);
        stats.month.glpiData.push(counts.glpi);
        stats.month.blockingData.push(counts.blocking);
    });


    // 5. Calculer les totaux et les tops
    ['day', 'week', 'month'].forEach(period => {
        stats[period].total = stats[period].data.reduce((a, b) => a + b, 0);
        stats[period].glpi = stats[period].glpiData.reduce((a, b) => a + b, 0);
        stats[period].blocking = stats[period].blockingData.reduce((a, b) => a + b, 0);
    });

    stats.topTags = Object.entries(tagStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    stats.topCallers = Object.entries(callerStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    console.log(`Statistiques générées: ${stats.detailedData.length} tickets traités`);
    return stats;
}

// Routes API pour les données
app.get('/api/user', requireLogin, (req, res) => {
    res.json({ username: req.session.username });
});

app.get('/api/tickets', requireLogin, async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            include: [Message],
            where: { isArchived: false },
            order: [['createdAt', 'DESC']]
        });
        res.json(tickets);
    } catch (error) {
        console.error('Erreur lors de la récupération des tickets:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des tickets' });
    }
});

app.get('/api/tickets/:id', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [Message]
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }
        
        res.json(ticket);
    } catch (error) {
        console.error('Erreur lors de la récupération du ticket:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du ticket' });
    }
});

app.get('/api/saved-fields', requireLogin, async (req, res) => {
    try {
        const savedFields = await SavedField.findAll();
        
        res.json({
            callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
            reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
            tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des champs mémorisés:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des champs mémorisés' });
    }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).send('Erreur serveur interne');
});

// Route pour afficher le formulaire de création de ticket personnalisé (accessible à tous)
app.get('/admin/create-ticket', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/create-ticket.html'));
});

// Démarrage du serveur
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');

        await sequelize.sync({ alter: true });
        console.log('✅ Modèles synchronisés');

        await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('✅ Dossier uploads vérifié');

        // Vérifier l'existence des dossiers pour les fichiers statiques
        await fsPromises.mkdir(path.join(__dirname, 'public/css'), { recursive: true });
        await fsPromises.mkdir(path.join(__dirname, 'public/js/pages'), { recursive: true });
        await fsPromises.mkdir(path.join(__dirname, 'public/img'), { recursive: true });
        console.log('✅ Dossiers pour fichiers statiques vérifiés');

        const VERSION = '2.0.6';
        console.log(`🚀 Version du serveur : ${VERSION}`);
        // Lancer un archivage initial au démarrage
        archiveOldTickets().catch(err => console.error('Archivage initial échoué:', err));
        app.listen(process.env.PORT, () => {
            console.log(`✨ Serveur démarré sur http://localhost:${process.env.PORT}`);
        });
    } catch (error) {
        console.error('❌ Erreur de démarrage:', error);
        process.exit(1);
    }
}

// Démarrer le serveur
startServer();

module.exports = app;