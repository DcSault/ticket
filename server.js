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

// Création des dates en UTC
const createUTCDate = (date) => {
    const d = new Date(date);
    return new Date(Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ));
};

// Format date en UTC strict
const formatDateUTC = (date) => {
    const d = createUTCDate(date);
    const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    const day = days[d.getUTCDay()];
    
    return `${day} ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
};

// Bornes de journée en UTC
const getUTCDayBounds = (date) => {
    const d = createUTCDate(date);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
};

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
        const now = createUTCDate(new Date());
        now.setUTCDate(now.getUTCDate() - 1); // 24h avant
        
        const tickets = await Ticket.findAll({
            where: {
                isArchived: false,
                createdAt: {
                    [Op.lt]: now
                }
            }
        });

        for (const ticket of tickets) {
            await ticket.update({ 
                isArchived: true, 
                archivedAt: createUTCDate(new Date()), 
                archivedBy: 'system' 
            });
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
            tickets: tickets.map(ticket => ({
                ...ticket.toJSON(),
                createdAt: formatDateUTC(ticket.createdAt),
                updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null
            })),
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
        const now = createUTCDate(new Date());
        
        const ticket = await Ticket.create({
            caller: req.body.caller,
            reason: req.body.reason || '',
            tags: tags,
            status: 'open',
            isGLPI: req.body.isGLPI === 'true',
            isBlocking: req.body.isBlocking === 'true',
            createdBy: req.session.username,
            createdAt: now
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
        
        if (!ticket || ticket.isGLPI) {
            return res.redirect('/');
        }

        const ticketData = {
            ...ticket.toJSON(),
            createdAt: formatDateUTC(ticket.createdAt),
            updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null,
            Messages: ticket.Messages.map(msg => ({
                ...msg.toJSON(),
                createdAt: formatDateUTC(msg.createdAt)
            }))
        };

        res.render('ticket', { ticket: ticketData, username: req.session.username });
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
        const ticketData = {
            ...ticket.toJSON(),
            createdAt: formatDateUTC(ticket.createdAt),
            updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null
        };

        res.render('edit-ticket', { 
            ticket: ticketData,
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

        const now = createUTCDate(new Date());
        const updatedData = {
            caller: req.body.caller,
            reason: req.body.isGLPI === 'true' ? '' : (req.body.reason || ''),
            tags: req.body.isGLPI === 'true' ? [] : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
            isGLPI: req.body.isGLPI === 'true',
            isBlocking: req.body.isBlocking === 'true',
            lastModifiedBy: req.session.username,
            lastModifiedAt: now
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

        const now = createUTCDate(new Date());
        await ticket.update({ 
            isArchived: true, 
            archivedAt: now, 
            archivedBy: req.session.username 
        });
        
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        res.status(500).send('Erreur lors de l\'archivage');
    }
});

// Messages
app.post('/api/tickets/:id/messages', requireLogin, upload.single('image'), async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket || ticket.isGLPI) {
            return res.status(404).send('Ticket non trouvé ou ticket GLPI');
        }

        const now = createUTCDate(new Date());
        const message = await Message.create({
            TicketId: ticket.id,
            content: req.file ? `/uploads/${req.file.filename}` : req.body.content,
            type: req.file ? 'image' : 'text',
            author: req.session.username,
            createdAt: now
        });
        
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
            if (startDate) whereClause.createdAt[Op.gte] = createUTCDate(new Date(startDate));
            if (endDate) {
                const endDateTime = createUTCDate(new Date(endDate));
                endDateTime.setUTCHours(23, 59, 59, 999);
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

        const archivesData = archives.map(archive => ({
            ...archive.toJSON(),
            createdAt: formatDateUTC(archive.createdAt),
            updatedAt: archive.updatedAt ? formatDateUTC(archive.updatedAt) : null,
            archivedAt: archive.archivedAt ? formatDateUTC(archive.archivedAt) : null
        }));

        res.render('archives', {
            archives: archivesData,
            savedFields: {
                callers: savedFields.filter(f => f.type === 'caller').map(f => f.value),
                reasons: savedFields.filter(f => f.type === 'reason').map(f => f.value),
                tags: savedFields.filter(f => f.type === 'tag').map(f => f.value)
            },
            search,
            filter,
            value,
            startDate: startDate ? formatDateUTC(new Date(startDate)) : null,
            endDate: endDate ? formatDateUTC(new Date(endDate)) : null
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

        const ticketData = {
            ...ticket.toJSON(),
            createdAt: formatDateUTC(ticket.createdAt),
            updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null,
            archivedAt: ticket.archivedAt ? formatDateUTC(ticket.archivedAt) : null
        };

        res.json(ticketData);
    } catch (error) {
        console.error('Erreur détails archive:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Stats et rapports
app.get('/stats', requireLogin, async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            order: [['createdAt', 'DESC']]
        });

        const ticketsWithUTC = tickets.map(ticket => ({
            ...ticket.toJSON(),
            createdAt: formatDateUTC(ticket.createdAt),
            updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null
        }));

        const stats = await processStats(ticketsWithUTC);
        res.render('stats', { stats });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/report', async (req, res) => {
    try {
        const defaultDate = createUTCDate(new Date());
        const { start, end } = getUTCDayBounds(defaultDate);
        
        const tickets = await Ticket.findAll({
            include: [Message],
            where: {
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            },
            order: [['createdAt', 'DESC']]
        });

        const ticketsData = tickets.map(ticket => ({
            ...ticket.toJSON(),
            createdAt: formatDateUTC(ticket.createdAt),
            updatedAt: ticket.updatedAt ? formatDateUTC(ticket.updatedAt) : null,
            Messages: ticket.Messages.map(msg => ({
                ...msg.toJSON(),
                createdAt: formatDateUTC(msg.createdAt)
            }))
        }));

        res.render('report', { 
            tickets: ticketsData,
            username: req.session.username,
            currentDate: formatDateUTC(defaultDate)
        });
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        res.status(500).send('Erreur serveur');
    }
});

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

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).send('Erreur serveur interne');
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