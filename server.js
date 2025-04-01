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
app.use('/uploads', express.static(process.env.UPLOAD_DIR));

// Configuration améliorée des fichiers statiques
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ajouter cette ligne pour servir les fichiers HTML
app.use('/html', express.static(path.join(__dirname, 'public/html')));

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

// Vérifier si on utilise HTML ou EJS
const useHTML = process.env.USE_HTML === 'true';

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
            createdBy: req.session.username
        });

        if (!ticket.isGLPI) {
            await Promise.all([
                SavedField.findOrCreate({ where: { type: 'caller', value: req.body.caller }}),
                req.body.reason && SavedField.findOrCreate({ where: { type: 'reason', value: req.body.reason }}),
                ...tags.map(tag => SavedField.findOrCreate({ where: { type: 'tag', value: tag }}))
            ]);
        }

        res.redirect('/');
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
            lastModifiedBy: req.session.username,
            lastModifiedAt: new Date()
        };

        if (!updatedData.isGLPI) {
            await Promise.all([
                SavedField.findOrCreate({ where: { type: 'caller', value: req.body.caller }}),
                req.body.reason && SavedField.findOrCreate({ where: { type: 'reason', value: req.body.reason }})
            ]);
        }

        await ticket.update(updatedData);
        res.redirect('/');
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
                    const imagePath = path.join(__dirname, message.content);
                    try {
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

// Messages
app.post('/api/tickets/:id/messages', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }
        
        // Déterminer le type de message
        const messageType = req.body.type === 'html' ? 'html' : 'text';
        
        // Créer le message
        const message = await Message.create({
            content: req.body.content,
            type: messageType,
            author: req.session.username,
            TicketId: ticket.id
        });
        
        res.status(201).json(message);
    } catch (error) {
        console.error('Erreur ajout message:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du message' });
    }
});

// Route pour l'upload de fichier (autre que l'image actuelle)
app.post('/api/tickets/:id/upload', requireLogin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }
        
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }
        
        // Déterminer le type basé sur le mimetype
        let messageType = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }
        
        // Créer le message
        const message = await Message.create({
            content: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            type: messageType,
            author: req.session.username,
            TicketId: ticket.id
        });
        
        res.status(201).json(message);
    } catch (error) {
        console.error('Erreur upload fichier:', error);
        res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
    }
});

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
app.get('/stats', async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            order: [['createdAt', 'DESC']]
        });

        const stats = await processStats(tickets);
        res.render('stats', { stats });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour afficher la page de rapport
app.get('/report', async (req, res) => {
    try {
        const defaultDate = new Date();
        const tickets = await Ticket.findAll({
            include: [Message],
            where: {
                createdAt: {
                    [Op.gte]: new Date(defaultDate.setHours(0, 0, 0, 0)),
                    [Op.lte]: new Date(defaultDate.setHours(23, 59, 59, 999))
                }
            },
            order: [['createdAt', 'DESC']]
        });

        res.render('report', { 
            tickets, 
            username: 'Visiteur', // Valeur par défaut pour les visiteurs
            currentDate: defaultDate
        });
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Route API pour générer les données du rapport
app.get('/api/report-data', async (req, res) => {
    try {
        const requestDate = req.query.date ? new Date(req.query.date) : new Date();
        const startDate = new Date(requestDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(requestDate);
        endDate.setHours(23, 59, 59, 999);

        const tickets = await Ticket.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (tickets.length === 0) {
            return res.json({
                total: 0,
                glpi: 0,
                blocking: 0,
                hourlyDistribution: Array(24).fill(0),
                morningTickets: 0,
                afternoonTickets: 0,
                topCallers: {},
                topTags: {}
            });
        }

        const stats = {
            total: tickets.length,
            glpi: tickets.filter(t => t.isGLPI).length,
            blocking: tickets.filter(t => t.isBlocking).length,
            hourlyDistribution: Array(24).fill(0),
            morningTickets: 0,
            afternoonTickets: 0,
            topCallers: {},
            topTags: {}
        };

        tickets.forEach(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            const hour = ticketDate.getHours();

            stats.hourlyDistribution[hour]++;

            if (hour < 12) stats.morningTickets++;
            else stats.afternoonTickets++;

            stats.topCallers[ticket.caller] = (stats.topCallers[ticket.caller] || 0) + 1;

            if (ticket.tags && Array.isArray(ticket.tags)) {
                ticket.tags.forEach(tag => {
                    stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
                });
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Erreur complète:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: error.message,
            stack: error.stack
        });
    }
});

app.get('/api/report', async (req, res) => {
    const date = new Date(req.query.date);
    const stats = await getReportStats(date);
    res.json(stats);
  });
  
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

    // Calculer les ratios et tranches horaires
    const morningTickets = tickets.filter(t => new Date(t.createdAt).getHours() < 12);
    const afternoonTickets = tickets.filter(t => new Date(t.createdAt).getHours() >= 12);

    const hourlyDistribution = Array(24).fill(0);
    tickets.forEach(t => {
        const hour = new Date(t.createdAt).getHours();
        hourlyDistribution[hour]++;
    });

    return {
        total: tickets.length,
        glpi: tickets.filter(t => t.isGLPI).length,
        blocking: tickets.filter(t => t.isBlocking).length,
        morningRatio: morningTickets.length / tickets.length,
        afternoonRatio: afternoonTickets.length / tickets.length,
        hourlyDistribution,
        topCallers: getTopCallers(tickets),
        topTags: getTopTags(tickets)
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
        const ticketDate = new Date(ticket.createdAt);
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

// Fonction pour obtenir les top callers
function getTopCallers(tickets) {
  const callerStats = {};
  
  tickets.forEach(ticket => {
    if (ticket.caller) {
      callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
    }
  });
  
  return callerStats;
}

// Fonction pour obtenir les top tags
function getTopTags(tickets) {
  const tagStats = {};
  
  tickets.forEach(ticket => {
    if (ticket.tags && Array.isArray(ticket.tags)) {
      ticket.tags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    }
  });
  
  return tagStats;
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
app.get('/admin/create-ticket', async (req, res) => {
    try {
        const savedFields = await SavedField.findAll();
        res.render('admin/create-ticket', {
            savedFields: {
                callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
                reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
                tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
            },
            username: 'Admin' // Vous pouvez définir un nom d'utilisateur par défaut
        });
    } catch (error) {
        console.error('Erreur lors de l\'affichage du formulaire admin:', error);
        res.status(500).send('Erreur serveur');
    }
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