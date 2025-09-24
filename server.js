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
const { Op } = require('sequelize');


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

// Appel de la fonction toutes les 24 heures
setInterval(archiveOldTickets, 24 * 60 * 60 * 1000);

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
        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
        
        const ticket = await Ticket.create({
            caller: req.body.caller,
            reason: req.body.reason || '',
            tags: tags,
            status: 'open',
            isGLPI: req.body.isGLPI === 'true',
            isBlocking: req.body.isBlocking === 'true',
            glpiNumber: req.body.isGLPI === 'true' ? (req.body.glpiNumber || null) : null,
            createdBy: req.session.username
        });

        if (!ticket.isGLPI) {
            await Promise.all([
                SavedField.findOrCreate({ where: { type: 'caller', value: req.body.caller }}),
                req.body.reason && SavedField.findOrCreate({ where: { type: 'reason', value: req.body.reason }}),
                ...tags.map(tag => SavedField.findOrCreate({ where: { type: 'tag', value: tag }}))
            ]);
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
            await Promise.all([
                SavedField.findOrCreate({ where: { type: 'caller', value: req.body.caller }}),
                req.body.reason && SavedField.findOrCreate({ where: { type: 'reason', value: req.body.reason }})
            ]);
        }

        await ticket.update(updatedData);
        return res.redirect('/');
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

        const stats = await processStats(tickets);
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

// Fonction pour calculer automatiquement les dates de changement d'heure en France
function getFrenchDSTDates(year) {
    // Règle européenne: dernier dimanche de mars à 2h00 -> dernier dimanche d'octobre à 3h00
    
    // Trouver le dernier dimanche de mars
    const march31 = new Date(Date.UTC(year, 2, 31)); // 31 mars
    const lastSundayMarch = new Date(march31);
    const daysToSubtract = march31.getUTCDay(); // 0 = dimanche, 1 = lundi, etc.
    lastSundayMarch.setUTCDate(31 - daysToSubtract);
    lastSundayMarch.setUTCHours(2, 0, 0, 0); // 2h00 du matin
    
    // Trouver le dernier dimanche d'octobre
    const october31 = new Date(Date.UTC(year, 9, 31)); // 31 octobre
    const lastSundayOctober = new Date(october31);
    const daysToSubtractOct = october31.getUTCDay();
    lastSundayOctober.setUTCDate(31 - daysToSubtractOct);
    lastSundayOctober.setUTCHours(3, 0, 0, 0); // 3h00 du matin
    
    return {
        startDST: lastSundayMarch,    // Début heure d'été
        endDST: lastSundayOctober     // Fin heure d'été
    };
}

// Fonction pour obtenir l'heure locale française
function getFrenchLocalHour(dateString) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    
    // Obtenir les dates de changement d'heure pour l'année
    const dstDates = getFrenchDSTDates(year);
    
    // Déterminer si on est en heure d'été (DST)
    const isDST = date >= dstDates.startDST && date < dstDates.endDST;
    const offset = isDST ? 2 : 1; // UTC+2 en été, UTC+1 en hiver
    
    // Calculer l'heure locale française
    const utcHour = date.getUTCHours();
    const frenchHour = (utcHour + offset) % 24;
    

    
    return frenchHour;
}

// Fonction pour normaliser une date en heure locale française
function normalizeFrenchDate(dateString) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    
    // Obtenir les dates de changement d'heure pour l'année
    const dstDates = getFrenchDSTDates(year);
    
    // Déterminer si on est en heure d'été (DST)
    const isDST = date >= dstDates.startDST && date < dstDates.endDST;
    const offset = isDST ? 2 : 1; // UTC+2 en été, UTC+1 en hiver
    
    // Créer une nouvelle date avec l'heure locale française
    const frenchDate = new Date(date.getTime() + (offset * 60 * 60 * 1000));
    
    return frenchDate;
}

// Fonction pour générer les statistiques du rapport
async function getReportStats(date) {
    // Statistiques quotidiennes
    const dayStart = new Date(date);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23,59,59,999);

    const tickets = await Ticket.findAll({
        where: {
            createdAt: {
                [Op.between]: [dayStart, dayEnd]
            }
        }
    });

    // Si aucun ticket, retourner des valeurs par défaut
    if (tickets.length === 0) {
        return {
            total: 0,
            glpi: 0,
            blocking: 0,
            hourlyDistribution: Array(24).fill(0),
            morningTickets: 0,
            afternoonTickets: 0,
            morningRatio: 0,
            afternoonRatio: 0,
            topCallers: {},
            topTags: {}
        };
    }

    // Calculer les ratios et tranches horaires
    // Normaliser les dates pour éviter les problèmes de fuseau horaire
    const morningTickets = tickets.filter(t => {
        const localHour = getFrenchLocalHour(t.createdAt);
        return localHour < 12;
    });
    const afternoonTickets = tickets.filter(t => {
        const localHour = getFrenchLocalHour(t.createdAt);
        return localHour >= 12;
    });

    const hourlyDistribution = Array(24).fill(0);
    tickets.forEach(t => {
        const hour = getFrenchLocalHour(t.createdAt);
        hourlyDistribution[hour]++;
    });

    // Calculer les statistiques des appelants et des tags
    const topCallers = {};
    const topTags = {};

    tickets.forEach(ticket => {
        // Comptabiliser les appelants
        topCallers[ticket.caller] = (topCallers[ticket.caller] || 0) + 1;

        // Comptabiliser les tags
        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                topTags[tag] = (topTags[tag] || 0) + 1;
            });
        }
    });

    return {
        total: tickets.length,
        glpi: tickets.filter(t => t.isGLPI).length,
        blocking: tickets.filter(t => t.isBlocking).length,
        morningTickets: morningTickets.length,
        afternoonTickets: afternoonTickets.length,
        morningRatio: tickets.length > 0 ? morningTickets.length / tickets.length : 0,
        afternoonRatio: tickets.length > 0 ? afternoonTickets.length / tickets.length : 0,
        hourlyDistribution,
        topCallers,
        topTags
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

// Fonction pour générer les statistiques
async function processStats(tickets) {
    console.log(`Traitement de ${tickets.length} tickets pour les statistiques`);
    
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const stats = {
        day: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, glpi: 0, blocking: 0 },
        week: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, glpi: 0, blocking: 0 },
        month: { labels: [], data: [], glpiData: [], blockingData: [], total: 0, glpi: 0, blocking: 0 },
        detailedData: [],
        topTags: [],
        topCallers: []
    };

    // Préparer les structures pour les comptages
    const dailyCounts = new Map();
    const dailyGLPICounts = new Map();
    const dailyBlockingCounts = new Map();
    
    const weekCounts = new Map();
    const weekGLPICounts = new Map();
    const weekBlockingCounts = new Map();
    
    const monthCounts = new Map();
    const monthGLPICounts = new Map();
    const monthBlockingCounts = new Map();

    // Initialiser les derniers 30 jours
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toLocaleDateString('fr-FR');
        
        dailyCounts.set(dateStr, 0);
        dailyGLPICounts.set(dateStr, 0);
        dailyBlockingCounts.set(dateStr, 0);
        
        stats.day.labels.push(dateStr);
    }

    // Initialiser les 4 dernières semaines
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1);
    weekStart.setHours(0, 0, 0, 0);

    for (let i = 3; i >= 0; i--) {
        const start = new Date(weekStart);
        start.setDate(start.getDate() - (i * 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        
        const weekLabel = `${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
        stats.week.labels.push(weekLabel);
        
        weekCounts.set(weekLabel, 0);
        weekGLPICounts.set(weekLabel, 0);
        weekBlockingCounts.set(weekLabel, 0);
    }

    // Initialiser les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        stats.month.labels.push(monthLabel);
        
        monthCounts.set(monthLabel, 0);
        monthGLPICounts.set(monthLabel, 0);
        monthBlockingCounts.set(monthLabel, 0);
    }

    // Traiter chaque ticket
    const tagStats = {};
    const callerStats = {};

    tickets.forEach(ticket => {
        // Ajouter ce ticket aux données détaillées
        stats.detailedData.push({
            id: ticket.id,
            date: ticket.createdAt,
            caller: ticket.caller,
            tags: ticket.tags,
            isGLPI: ticket.isGLPI,
            isBlocking: ticket.isBlocking
        });

        // Traitement pour les statistiques quotidiennes
        const ticketDate = normalizeFrenchDate(ticket.createdAt);
        const dateStr = ticketDate.toLocaleDateString('fr-FR');
        
        if (dailyCounts.has(dateStr)) {
            dailyCounts.set(dateStr, dailyCounts.get(dateStr) + 1);
            
            if (ticket.isGLPI) {
                dailyGLPICounts.set(dateStr, dailyGLPICounts.get(dateStr) + 1);
            }
            
            if (ticket.isBlocking) {
                dailyBlockingCounts.set(dateStr, dailyBlockingCounts.get(dateStr) + 1);
            }
        }

        // Traitement pour les statistiques hebdomadaires
        for (const weekLabel of weekCounts.keys()) {
            const [startStr, endStr] = weekLabel.split(' - ');
            const weekStartDate = new Date(startStr.split('/').reverse().join('-'));
            const weekEndDate = new Date(endStr.split('/').reverse().join('-'));
            weekEndDate.setHours(23, 59, 59, 999);
            
            // Utiliser la date normalisée pour la comparaison
            if (ticketDate >= weekStartDate && ticketDate <= weekEndDate) {
                weekCounts.set(weekLabel, weekCounts.get(weekLabel) + 1);
                
                if (ticket.isGLPI) {
                    weekGLPICounts.set(weekLabel, weekGLPICounts.get(weekLabel) + 1);
                }
                
                if (ticket.isBlocking) {
                    weekBlockingCounts.set(weekLabel, weekBlockingCounts.get(weekLabel) + 1);
                }
                
                break; // Un ticket ne peut être que dans une seule semaine
            }
        }

        // Traitement pour les statistiques mensuelles
        for (const monthLabel of monthCounts.keys()) {
            const [month, year] = monthLabel.split(' ');
            const monthIndex = [
                'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
            ].indexOf(month.toLowerCase());
            
            if (monthIndex !== -1) {
                const monthStartDate = new Date(parseInt(year), monthIndex, 1);
                const monthEndDate = new Date(parseInt(year), monthIndex + 1, 0);
                monthEndDate.setHours(23, 59, 59, 999);
                
                // Utiliser la date normalisée pour la comparaison
                if (ticketDate >= monthStartDate && ticketDate <= monthEndDate) {
                    monthCounts.set(monthLabel, monthCounts.get(monthLabel) + 1);
                    
                    if (ticket.isGLPI) {
                        monthGLPICounts.set(monthLabel, monthGLPICounts.get(monthLabel) + 1);
                    }
                    
                    if (ticket.isBlocking) {
                        monthBlockingCounts.set(monthLabel, monthBlockingCounts.get(monthLabel) + 1);
                    }
                    
                    break; // Un ticket ne peut être que dans un seul mois
                }
            }
        }

        // Compter les tags
        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                if (tag) {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                }
            });
        }

        // Compter les appelants
        if (ticket.caller) {
            callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
        }
    });

    // Remplir les tableaux de données
    stats.day.labels.forEach(dateStr => {
        stats.day.data.push(dailyCounts.get(dateStr) || 0);
        stats.day.glpiData.push(dailyGLPICounts.get(dateStr) || 0);
        stats.day.blockingData.push(dailyBlockingCounts.get(dateStr) || 0);
    });

    stats.week.labels.forEach(weekLabel => {
        stats.week.data.push(weekCounts.get(weekLabel) || 0);
        stats.week.glpiData.push(weekGLPICounts.get(weekLabel) || 0);
        stats.week.blockingData.push(weekBlockingCounts.get(weekLabel) || 0);
    });

    stats.month.labels.forEach(monthLabel => {
        stats.month.data.push(monthCounts.get(monthLabel) || 0);
        stats.month.glpiData.push(monthGLPICounts.get(monthLabel) || 0);
        stats.month.blockingData.push(monthBlockingCounts.get(monthLabel) || 0);
    });

    // Calculer les totaux
    ['day', 'week', 'month'].forEach(period => {
        stats[period].total = stats[period].data.reduce((a, b) => a + b, 0);
        stats[period].glpi = stats[period].glpiData.reduce((a, b) => a + b, 0);
        stats[period].blocking = stats[period].blockingData.reduce((a, b) => a + b, 0);
    });

    // Calculer les top tags et appelants
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

// Route pour traiter la création du ticket personnalisé (accessible à tous)
app.post('/admin/create-ticket', async (req, res) => {
    try {
        const { caller, reason, tags, status, isGLPI, createdAt, createdBy } = req.body;

        const ticket = await Ticket.create({
            caller,
            reason: reason || '',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            status: status || 'open',
            isGLPI: isGLPI === 'true',
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            createdBy: createdBy || 'Admin' // Utilise la valeur du formulaire ou une valeur par défaut
        });

        res.redirect('/'); // Redirigez l'utilisateur après la création
    } catch (error) {
        console.error('Erreur lors de la création du ticket:', error);
        res.status(500).send('Erreur serveur');
    }
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