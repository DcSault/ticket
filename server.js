const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const Excel = require('exceljs');

const app = express();
const port = 666;
const DATA_FILE = path.join(__dirname, 'data', 'tickets.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
app.use(session({
    secret: 'support-ticket-secret',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuration de Multer
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
        cb(new Error('Seules les images sont autorisées'));
    }
});

// Middleware d'authentification
const requireLogin = (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    next();
};

// Structure initiale des données
const initialData = {
    tickets: [],
    tags: [],
    savedFields: {
        callers: [],
        reasons: []
    }
};

// Fonctions utilitaires
async function initializeApp() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        await fs.mkdir(UPLOADS_DIR, { recursive: true });

        try {
            await fs.access(DATA_FILE);
        } catch {
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        }

        const data = await readData();
        if (!data.savedFields) {
            data.savedFields = initialData.savedFields;
            await writeData(data);
        }

        console.log('Initialisation terminée');
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        process.exit(1);
    }
}

async function readData() {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Fonction Stats
function processStats(tickets) {
    const now = new Date();
    const stats = {
        day: { labels: [], data: [], glpiData: [], total: 0, glpi: 0 },
        week: { labels: [], data: [], glpiData: [], total: 0, glpi: 0 },
        month: { labels: [], data: [], glpiData: [], total: 0, glpi: 0 },
        glpiTotal: 0,
        nonGlpiTotal: 0,
        topCallers: [],
        topTags: []
    };

    // Préparation des périodes
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        stats.day.labels.push(date.toLocaleDateString());
        stats.day.data.push(0);
        stats.day.glpiData.push(0);
    }

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now - (i * 7 + 6) * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
        stats.week.labels.push(`${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
        stats.week.data.push(0);
        stats.week.glpiData.push(0);
    }

    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        stats.month.labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
        stats.month.data.push(0);
        stats.month.glpiData.push(0);
    }

    // Analyse des tickets
    const callerStats = {};
    const tagStats = {};
    
    tickets.forEach(ticket => {
        const date = new Date(ticket.createdAt);
        const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const monthDiff = (now.getMonth() - date.getMonth()) + (now.getFullYear() - date.getFullYear()) * 12;

        if (dayDiff < 30) {
            stats.day.data[29 - dayDiff]++;
            if (ticket.isGLPI) stats.day.glpiData[29 - dayDiff]++;
        }

        if (dayDiff < 28) {
            const weekIndex = Math.floor(dayDiff / 7);
            if (weekIndex < 4) {
                stats.week.data[3 - weekIndex]++;
                if (ticket.isGLPI) stats.week.glpiData[3 - weekIndex]++;
            }
        }

        if (monthDiff < 12) {
            stats.month.data[11 - monthDiff]++;
            if (ticket.isGLPI) stats.month.glpiData[11 - monthDiff]++;
        }

        if (ticket.isGLPI) {
            stats.glpiTotal++;
        } else {
            stats.nonGlpiTotal++;
            if (ticket.tags) {
                ticket.tags.forEach(tag => {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                });
            }
        }

        callerStats[ticket.caller] = (callerStats[ticket.caller] || 0) + 1;
    });

    stats.topCallers = Object.entries(callerStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    stats.topTags = Object.entries(tagStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    ['day', 'week', 'month'].forEach(period => {
        stats[period].total = stats[period].data.reduce((a, b) => a + b, 0);
        stats[period].glpi = stats[period].glpiData.reduce((a, b) => a + b, 0);
    });

    return stats;
}
// Routes d'authentification
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    if (username && username.trim()) {
        req.session.username = username.trim();
        res.redirect('/');
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
        const data = await readData();
        res.render('index', {
            tickets: data.tickets,
            tags: data.tags,
            savedFields: data.savedFields,
            username: req.session.username
        });
    } catch (error) {
        console.error('Erreur page d\'accueil:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Routes des statistiques
app.get('/stats', async (req, res) => {
    try {
        const data = await readData();
        const stats = processStats(data.tickets);
        res.render('stats', { stats });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/api/stats/export', async (req, res) => {
    try {
        const data = await readData();
        const stats = processStats(data.tickets);
        const workbook = new Excel.Workbook();
        
        const period = req.query.period || 'day';
        const periodData = stats[period];

        // Feuille principale
        const sheet = workbook.addWorksheet('Statistiques');
        
        sheet.addRow(['Période', 'Total tickets', 'Tickets GLPI']);
        periodData.labels.forEach((label, index) => {
            sheet.addRow([
                label,
                periodData.data[index],
                periodData.glpiData[index]
            ]);
        });

        // Tags
        const tagsSheet = workbook.addWorksheet('Tags');
        tagsSheet.addRow(['Tag', 'Utilisations']);
        stats.topTags.forEach(tag => {
            tagsSheet.addRow([tag.name, tag.count]);
        });

        // Appelants
        const callersSheet = workbook.addWorksheet('Appelants');
        callersSheet.addRow(['Appelant', 'Tickets']);
        stats.topCallers.forEach(caller => {
            callersSheet.addRow([caller.name, caller.count]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=stats-tickets-${period}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export:', error);
        res.status(500).send('Erreur export');
    }
});

// Routes des tickets
app.post('/api/tickets', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        
        const newTicket = {
            id: Date.now().toString(),
            caller: req.body.caller,
            reason: req.body.reason || '',
            tags,
            status: 'open',
            messages: [],
            createdAt: new Date().toISOString(),
            createdBy: req.session.username,
            isGLPI: req.body.isGLPI === 'true'
        };
        
        if (!newTicket.isGLPI) {
            if (!data.savedFields.callers.includes(req.body.caller)) {
                data.savedFields.callers.push(req.body.caller);
            }
            if (req.body.reason && !data.savedFields.reasons.includes(req.body.reason)) {
                data.savedFields.reasons.push(req.body.reason);
            }
        }
        
        data.tickets.unshift(newTicket);
        await writeData(data);
        res.redirect('/');
    } catch (error) {
        console.error('Erreur création ticket:', error);
        res.status(500).send('Erreur lors de la création du ticket');
    }
});

app.get('/ticket/:id', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const ticket = data.tickets.find(t => t.id === req.params.id);
        
        if (!ticket || ticket.isGLPI) {
            return res.redirect('/');
        }

        res.render('ticket', { 
            ticket,
            username: req.session.username
        });
    } catch (error) {
        console.error('Erreur page ticket:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/ticket/:id/edit', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const ticket = data.tickets.find(t => t.id === req.params.id);
        
        if (!ticket) {
            return res.redirect('/');
        }

        res.render('edit-ticket', { 
            ticket,
            savedFields: data.savedFields,
            username: req.session.username
        });
    } catch (error) {
        console.error('Erreur page édition:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.post('/api/tickets/:id/edit', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const ticketIndex = data.tickets.findIndex(t => t.id === req.params.id);
        
        if (ticketIndex === -1) {
            return res.redirect('/');
        }

        const oldTicket = data.tickets[ticketIndex];
        const updatedTicket = {
            ...oldTicket,
            caller: req.body.caller,
            reason: req.body.isGLPI === 'true' ? '' : (req.body.reason || ''),
            tags: req.body.isGLPI === 'true' ? [] : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
            isGLPI: req.body.isGLPI === 'true',
            lastModifiedBy: req.session.username,
            lastModifiedAt: new Date().toISOString()
        };

        if (!updatedTicket.isGLPI) {
            if (!data.savedFields.callers.includes(req.body.caller)) {
                data.savedFields.callers.push(req.body.caller);
            }
            if (req.body.reason && !data.savedFields.reasons.includes(req.body.reason)) {
                data.savedFields.reasons.push(req.body.reason);
            }
        }

        data.tickets[ticketIndex] = updatedTicket;
        await writeData(data);
        res.redirect('/');
    } catch (error) {
        console.error('Erreur modification ticket:', error);
        res.status(500).send('Erreur lors de la modification du ticket');
    }
});

app.post('/api/tickets/:id/delete', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const ticket = data.tickets.find(t => t.id === req.params.id);

        if (ticket) {
            for (const message of ticket.messages) {
                if (message.type === 'image' && message.content.startsWith('/uploads/')) {
                    const imagePath = path.join(__dirname, message.content);
                    try {
                        await fs.unlink(imagePath);
                    } catch (err) {
                        console.error('Erreur suppression image:', err);
                    }
                }
            }
        }

        data.tickets = data.tickets.filter(t => t.id !== req.params.id);
        await writeData(data);
        res.redirect('/');
    } catch (error) {
        console.error('Erreur suppression ticket:', error);
        res.status(500).send('Erreur lors de la suppression du ticket');
    }
});

app.post('/api/tickets/:id/messages', requireLogin, upload.single('image'), async (req, res) => {
    try {
        const data = await readData();
        const ticket = data.tickets.find(t => t.id === req.params.id);
        
        if (!ticket || ticket.isGLPI) {
            return res.status(404).send('Ticket non trouvé ou ticket GLPI');
        }

        const newMessage = {
            id: Date.now().toString(),
            content: req.file ? `/uploads/${req.file.filename}` : req.body.content,
            type: req.file ? 'image' : 'text',
            timestamp: new Date().toISOString(),
            author: req.session.username
        };

        ticket.messages.push(newMessage);
        await writeData(data);
        
        res.redirect(`/ticket/${req.params.id}`);
    } catch (error) {
        console.error('Erreur ajout message:', error);
        res.status(500).send('Erreur lors de l\'ajout du message');
    }
});

app.post('/api/saved-fields/delete', requireLogin, async (req, res) => {
    try {
        const data = await readData();
        const { field, value } = req.body;
        
        if (field === 'caller') {
            data.savedFields.callers = data.savedFields.callers.filter(c => c !== value);
        } else if (field === 'reason') {
            data.savedFields.reasons = data.savedFields.reasons.filter(r => r !== value);
        }
        
        await writeData(data);
        res.redirect('/');
    } catch (error) {
        console.error('Erreur suppression champ:', error);
        res.status(500).send('Erreur lors de la suppression');
    }
});

// Démarrage du serveur
async function startServer() {
    await initializeApp();
    app.listen(port, () => {
        console.log(`Serveur démarré sur http://localhost:${port}`);
    });
}

startServer().catch(console.error);