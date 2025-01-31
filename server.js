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
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// Routes d'authentification
app.get('/login', async (req, res) => {
    try {
        const users = await User.findAll();
        res.render('login', { savedUsers: users.map(u => u.username) });
    } catch (error) {
        console.error('Erreur accès login:', error);
        res.render('login', { savedUsers: [] });
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
app.get('/', requireLogin, async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            include: [Message],
            where: { isArchived: false },
            order: [['createdAt', 'DESC']]
        });

        const savedFields = await SavedField.findAll();
        
        res.render('index', {
            tickets,
            savedFields: {
                callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
                reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
                tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
            },
            username: req.session.username
        });
    } catch (error) {
        console.error('Erreur page principale:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Routes des tickets
app.post('/api/tickets', requireLogin, async (req, res) => {
    try {
        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        
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

app.get('/ticket/:id', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [Message]
        });
        
        console.log('Ticket with messages:', ticket); // Vérifiez les messages associés
        
        if (!ticket || ticket.isGLPI) {
            return res.redirect('/');
        }

        res.render('ticket', { ticket, username: req.session.username });
    } catch (error) {
        console.error('Erreur détails ticket:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/ticket/:id/edit', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.redirect('/');
        }

        const savedFields = await SavedField.findAll();

        res.render('edit-ticket', { 
            ticket,
            savedFields: {
                callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
                reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
                tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
            },
            username: req.session.username
        });
    } catch (error) {
        console.error('Erreur page édition:', error);
        res.status(500).send('Erreur serveur');
    }
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
            tags: req.body.isGLPI === 'true' ? [] : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
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
app.post('/api/tickets/:id/messages', requireLogin, upload.single('image'), async (req, res) => {
    try {
        console.log('Request body:', req.body); // Vérifiez le corps de la requête
        console.log('Request file:', req.file); // Vérifiez le fichier uploadé
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket || ticket.isGLPI) {
            return res.status(404).send('Ticket non trouvé ou ticket GLPI');
        }

        const message = await Message.create({
            TicketId: ticket.id,
            content: req.file ? `/uploads/${req.file.filename}` : req.body.content,
            type: req.file ? 'image' : 'text',
            author: req.session.username
        });

        console.log('Message created:', message); // Vérifiez le message créé
        
        res.redirect(`/ticket/${req.params.id}`);
    } catch (error) {
        console.error('Erreur création message:', error);
        res.status(500).send('Erreur ajout message');
    }
});

// Archives
app.get('/archives', requireLogin, async (req, res) => {
    try {
        let whereClause = { isArchived: true };
        const { search, filter, value, startDate, endDate } = req.query;

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                whereClause.createdAt[Op.lte] = endDateTime;
            }
        }

        if (search) {
            whereClause[Op.or] = [
                { caller: { [Op.iLike]: `%${search}%` }},
                { reason: { [Op.iLike]: `%${search}%` }},
                { tags: { [Op.overlap]: [search] }}
            ];
        }

        const archives = await Ticket.findAll({
            where: whereClause,
            include: [Message],
            order: [['createdAt', 'DESC']]
        });

        const savedFields = await SavedField.findAll();

        res.render('archives', {
            archives,
            savedFields: {
                callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
                reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
                tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
            },
            search,
            filter,
            value,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Erreur archives:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/api/archives/:id/details', requireLogin, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            where: { 
                id: req.params.id,
                isArchived: true
            },
            include: [Message]
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Archive non trouvée' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Erreur détails archive:', error);
        res.status(500).json({ error: 'Erreur serveur' });
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
      topTags: getTopTags(tickets),
      charts: generateChartsSVG(tickets)
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

    // Create maps for daily counts
    const dailyCounts = new Map();
    const dailyGLPICounts = new Map();
    const dailyBlockingCounts = new Map();

    // Initialize last 30 days
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

    // Process each ticket
    const tagStats = {};
    const callerStats = {};

    tickets.forEach(ticket => {
        const ticketDate = new Date(ticket.createdAt);
        ticketDate.setHours(0, 0, 0, 0);
        const dateStr = ticketDate.toLocaleDateString('fr-FR');

        stats.detailedData.push({
            id: ticket.id,
            date: ticket.createdAt,
            caller: ticket.caller,
            tags: ticket.tags,
            isGLPI: ticket.isGLPI,
            isBlocking: ticket.isBlocking
        });

        if (dailyCounts.has(dateStr)) {
            dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
            if (ticket.isGLPI) {
                dailyGLPICounts.set(dateStr, (dailyGLPICounts.get(dateStr) || 0) + 1);
            }
            if (ticket.isBlocking) {
                dailyBlockingCounts.set(dateStr, (dailyBlockingCounts.get(dateStr) || 0) + 1);
            }
        }

        // Count tags
        if (ticket.tags && Array.isArray(ticket.tags)) {
            ticket.tags.forEach(tag => {
                tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        }

        // Count callers
        if (ticket.caller) {
            callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
        }
    });

    // Fill day data arrays
    stats.day.labels.forEach(dateStr => {
        stats.day.data.push(dailyCounts.get(dateStr) || 0);
        stats.day.glpiData.push(dailyGLPICounts.get(dateStr) || 0);
        stats.day.blockingData.push(dailyBlockingCounts.get(dateStr) || 0);
    });

    // Calculate weekly statistics
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
        
        const weekTickets = tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= start && ticketDate <= end;
        });
        
        stats.week.data.push(weekTickets.length);
        stats.week.glpiData.push(weekTickets.filter(t => t.isGLPI).length);
        stats.week.blockingData.push(weekTickets.filter(t => t.isBlocking).length);
    }

    // Calculate monthly statistics
    for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthLabel = monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        stats.month.labels.push(monthLabel);
        
        const monthTickets = tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= monthStart && ticketDate <= monthEnd;
        });
        
        stats.month.data.push(monthTickets.length);
        stats.month.glpiData.push(monthTickets.filter(t => t.isGLPI).length);
        stats.month.blockingData.push(monthTickets.filter(t => t.isBlocking).length);
    }

    // Calculate totals
    ['day', 'week', 'month'].forEach(period => {
        stats[period].total = stats[period].data.reduce((a, b) => a + b, 0);
        stats[period].glpi = stats[period].glpiData.reduce((a, b) => a + b, 0);
        stats[period].blocking = stats[period].blockingData.reduce((a, b) => a + b, 0);
    });

    // Calculate top tags and callers
    stats.topTags = Object.entries(tagStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    stats.topCallers = Object.entries(callerStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return stats;
}

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
        topTags: getTopTags(tickets),
        charts: generateChartsSVG(tickets)
    };
}

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

        const VERSION = '1.0.4';
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