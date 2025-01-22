const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;
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

// Configuration de Multer pour les uploads
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

// Initialisation
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