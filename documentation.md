# Documentation Complète du Système de Gestion des Appels de Support

## Table des matières
1. [Introduction](#introduction)
2. [Architecture technique](#architecture-technique)
3. [Technologies utilisées](#technologies-utilisées)
4. [Structure du projet](#structure-du-projet)
5. [Modèles de données](#modèles-de-données)
6. [Fonctionnalités principales](#fonctionnalités-principales)
7. [Interface utilisateur](#interface-utilisateur)
8. [API et endpoints](#api-et-endpoints)
9. [Guides d'utilisation](#guides-dutilisation)
10. [Sécurité](#sécurité)
11. [Déploiement](#déploiement)
12. [Maintenance et évolution](#maintenance-et-évolution)
13. [Annexes](#annexes)

## Introduction

Le Système de Gestion des Appels de Support (CallFix) est une application web dédiée au suivi et à la gestion des demandes d'assistance des utilisateurs. Il permet de centraliser les tickets de support, qu'ils soient internes ou issus de GLPI, et offre une interface intuitive pour les gérer efficacement.

### Objectifs du système
- Centraliser les demandes d'assistance
- Faciliter le suivi des tickets
- Améliorer la communication entre les utilisateurs et le support
- Fournir des statistiques et rapports d'activité
- Archiver automatiquement les tickets inactifs

### Public cible
- Équipes de support technique
- Gestionnaires de services informatiques
- Utilisateurs finaux ayant besoin d'assistance

### Versions du système
- Version actuelle: **2.0.0** (indiquée dans server.js)
- Dernière mise à jour: Restructuration des fichiers CSS et JavaScript

## Architecture technique

### Vue d'ensemble

L'application suit une architecture MVC (Modèle-Vue-Contrôleur) et est construite sur une stack JavaScript full-stack:

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│    Frontend    │<─────│    Backend     │<─────│  Base de       │
│    (Client)    │      │    (Serveur)   │      │  données       │
│                │      │                │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
     HTML/EJS               Express.js             PostgreSQL
   JavaScript/CSS           Node.js                Sequelize ORM
```

### Architecture du Frontend

L'interface utilisateur est construite avec un modèle hybride:

1. **Templates EJS** (approche serveur):
   - Utilisés principalement pour les pages d'administration
   - Génération dynamique de statistiques et rapports
   - Inclut `report.ejs` et `stats.ejs`

2. **Pages HTML statiques** (approche client):
   - Principales interfaces utilisateur
   - JavaScript côté client pour les interactions dynamiques
   - Stockées dans `/public/html/`

3. **Module JavaScript Front-end**:
   - Organisation modulaire avec namespace (ex: `IndexPage`, `CallFix`)
   - Chaque page a son propre fichier JavaScript dédié
   - Utilisation de l'API fetch pour les communications asynchrones

### Architecture du Backend

Le backend est structuré autour d'Express.js avec les composants suivants:

1. **Serveur principal** (`server.js`):
   - Point d'entrée de l'application
   - Configuration des middlewares
   - Définition des routes API
   - Gestion des sessions
   - Traitement des requêtes

2. **Modèles Sequelize**:
   - Définitions des tables de base de données
   - Relations entre les entités
   - Hooks pour le traitement automatique des données

3. **Middlewares**:
   - Authentification (`requireLogin`)
   - Gestion des fichiers uploadés (`multer`)
   - Validation des requêtes

4. **Tâches planifiées**:
   - Archivage automatique des tickets inactifs (toutes les 24h)

### Flux de données

1. Le client envoie une requête HTTP au serveur
2. Express.js route la requête vers le gestionnaire approprié
3. Le gestionnaire interagit avec les modèles Sequelize
4. Sequelize traduit les opérations en requêtes SQL
5. PostgreSQL exécute les requêtes et renvoie les résultats
6. Les données sont formatées et renvoyées au client
7. Le client met à jour l'interface utilisateur (JS côté client ou rendu EJS)

## Technologies utilisées

### Backend
- **Node.js** (v18+) : Environnement d'exécution JavaScript côté serveur
- **Express.js** (v4.21.2) : Framework web pour Node.js, gère les routes et les requêtes
- **Sequelize** (v6.37.5) : ORM (Object-Relational Mapping) pour la gestion de la base de données
- **Express-session** (v1.18.1) : Gestion des sessions utilisateur
- **Multer** (v1.4.5-lts.1) : Middleware pour la gestion des uploads de fichiers
- **Dotenv** (v16.4.7) : Chargement des variables d'environnement
- **Moment-timezone** (v0.5.47) : Gestion des dates et des fuseaux horaires
- **Body-parser** (v1.20.3) : Parsing des requêtes HTTP

### Frontend
- **EJS** (v3.1.10) : Moteur de templates pour le rendu HTML côté serveur
- **HTML5/CSS3** : Structure et style des pages
- **JavaScript (ES6+)** : Scripts côté client
- **Chart.js** (v4.4.7) : Bibliothèque pour la création de graphiques et visualisations
- **Tailwind CSS** : Framework CSS utilisé dans certaines vues (stats.ejs)

### Base de données
- **PostgreSQL** (v15+) : SGBDR principal pour la production
- **SQLite** (v5.1.7) : Base de données légère pour le développement
- **pg-hstore** (v2.3.4) : Sérialisation/désérialisation des données pour PostgreSQL

### Déploiement
- **Docker** : Conteneurisation de l'application
- **Docker Compose** : Orchestration des conteneurs

### Outils de développement
- **Sequelize-CLI** (v6.6.2) : Outils en ligne de commande pour Sequelize
- **Scripts personnalisés** : Initialisation et réinitialisation de la base de données

## Structure du projet

```
ticket/
├── public/               # Ressources statiques
│   ├── css/              # Feuilles de style
│   │   ├── common.css    # Styles partagés
│   │   └── index.css     # Styles spécifiques par page
│   ├── js/               # Scripts JavaScript
│   │   ├── common.js     # Fonctions utilitaires partagées
│   │   ├── apiClient.js  # Interface avec l'API
│   │   └── pages/        # Scripts spécifiques aux pages
│   │       ├── index.js  # Logique de la page d'accueil
│   │       └── ticket.js # Logique de la page de ticket
│   ├── img/              # Images et logos
│   └── html/             # Pages HTML statiques
│       ├── index.html    # Page d'accueil
│       ├── login.html    # Page de connexion
│       ├── ticket.html   # Détail d'un ticket
│       ├── edit-ticket.html # Édition d'un ticket
│       └── archives.html # Liste des archives
├── views/                # Templates EJS
│   ├── report.ejs        # Page de rapports
│   ├── stats.ejs         # Page de statistiques
│   └── admin/            # Templates d'administration
├── models/               # Modèles Sequelize
│   ├── index.js          # Configuration Sequelize et relations
│   ├── user.js           # Modèle utilisateur
│   ├── ticket.js         # Modèle ticket
│   ├── message.js        # Modèle message
│   ├── savedField.js     # Modèle champs sauvegardés
│   └── archive.js        # Modèle archives
├── scripts/              # Scripts utilitaires
│   ├── resetDatabase.js  # Réinitialisation de la base de données
│   ├── initDatabase.js   # Initialisation de la base de données
│   ├── migrate.js        # Migration de données
│   └── testConnection.js # Test de connexion à la DB
├── uploads/              # Stockage des fichiers uploadés
├── server.js             # Point d'entrée de l'application
├── viewsdata.js          # Données partagées pour les vues
├── .env                  # Variables d'environnement
├── package.json          # Dépendances et scripts
└── README.md             # Documentation principale
```

## Modèles de données

### Relations entre les entités

```
┌────────────┐       ┌────────────┐       ┌────────────┐
│            │       │            │       │            │
│    User    │       │   Ticket   │       │   Message  │
│            │       │            │       │            │
└────────────┘       └────────────┘       └────────────┘
                          │  ▲
                          │  │
                          ▼  │
┌────────────┐       ┌────────────┐
│            │       │            │
│ SavedField │       │  Archive   │
│            │       │            │
└────────────┘       └────────────┘
```

### Description détaillée des modèles

#### User
```javascript
// Extrait de models/index.js
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: dateHooks,
    tableName: 'users'
});
```

#### Ticket
```javascript
// Extrait de models/ticket.js
const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    caller: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        defaultValue: 'open'
    },
    isGLPI: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBlocking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastModifiedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastModifiedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    archivedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'tickets'
});
```

#### Message
```javascript
// Extrait de models/index.js
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('text', 'image'),
        defaultValue: 'text'
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: dateHooks,
    tableName: 'messages'
});
```

#### SavedField
```javascript
// Extrait de models/index.js
const SavedField = sequelize.define('SavedField', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('caller', 'reason', 'tag'),
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: dateHooks,
    tableName: 'saved_fields',
    indexes: [
        {
            unique: true,
            fields: ['type', 'value']
        }
    ]
});
```

### Hooks et utils

Le système utilise des hooks Sequelize pour gérer automatiquement les dates:

```javascript
// Extrait de models/index.js
const dateHooks = {
    beforeCreate: (record) => {
        const fields = ['createdAt', 'updatedAt', 'lastLogin', 'lastModifiedAt', 'archivedAt'];
        fields.forEach(field => {
            if (record.dataValues[field]) {
                record.dataValues[field] = new Date(
                    new Date(record.dataValues[field]).toLocaleString('en-US', {
                        timeZone: 'Europe/Paris'
                    })
                );
            }
        });
    },
    // ... plus de code
};
```

## Fonctionnalités principales

### 1. Gestion des tickets

#### Création de tickets
Le système permet de créer deux types de tickets:

```javascript
// Extrait de server.js - Création de ticket
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

        // Sauvegarde des champs fréquemment utilisés pour l'autocomplétion
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
```

#### Archivage automatique
Le système archive automatiquement les tickets inactifs après 24 heures:

```javascript
// Extrait de server.js - Archivage automatique
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
```

### 2. Messagerie intégrée

Le système permet d'ajouter des messages texte ou des images à un ticket:

```javascript
// Extrait de server.js - Ajout de message
app.post('/api/tickets/:id/messages', requireLogin, upload.single('image'), async (req, res) => {
    try {
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
        
        res.redirect(`/ticket/${req.params.id}`);
    } catch (error) {
        console.error('Erreur création message:', error);
        res.status(500).send('Erreur ajout message');
    }
});
```

### 3. Statistiques et reporting

Le système offre des fonctionnalités avancées de statistiques:

```javascript
// Extrait de server.js - Statistiques
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
```

## Interface utilisateur

### Structure des pages HTML

L'interface utilisateur est organisée selon un modèle commun:

```html
<!-- Extrait de public/html/index.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CallFix - Gestion des tickets</title>
    
    <!-- Styles CSS -->
    <link rel="stylesheet" href="/css/common.css">
    <link rel="stylesheet" href="/css/index.css">
    
    <!-- Favicon -->
    <link rel="icon" href="/img/favicon.ico" type="image/x-icon">
    
    <!-- Scripts JavaScript avec attribut defer -->
    <script src="/js/common.js" defer></script>
    <script src="/js/apiClient.js" defer></script>
    <script src="/js/pages/index.js" defer></script>
</head>
<body>
    <!-- En-tête de l'application -->
    <header>
        <div class="header-container">
            <div class="logo-container">
                <img src="/img/logo.png" alt="CallFix Logo" class="logo">
                <h1>CallFix</h1>
            </div>
            <nav>
                <!-- Navigation principale -->
            </nav>
        </div>
    </header>

    <!-- Contenu principal -->
    <main>
        <!-- Contenu spécifique à la page -->
    </main>
</body>
</html>
```

### Architecture JavaScript côté client

Le code JavaScript côté client est organisé en modules avec des namespaces distincts:

```javascript
// Extrait de public/js/pages/index.js
const IndexPage = {
    // Configuration
    config: {
        ticketsContainer: document.getElementById('tickets-container'),
        searchInput: document.getElementById('search-input'),
        sortSelect: document.getElementById('sort-select'),
        filterSelect: document.getElementById('filter-select'),
        noTicketsMessage: document.getElementById('no-tickets-message'),
        loadingIndicator: document.getElementById('loading-indicator')
    },
    
    // État de la page
    state: {
        tickets: [],
        filteredTickets: [],
        currentFilter: 'all',
        currentSort: 'date-desc',
        searchTerm: ''
    },
    
    /**
     * Initialise la page d'accueil
     */
    init: function() {
        // Initialiser les composants communs
        if (window.CallFix && CallFix.init) {
            CallFix.init();
        }
        
        this.loadTickets();
        this.setupEventListeners();
    },
    
    // Méthodes du module...
};

// Initialiser la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    IndexPage.init();
});
```

### Visualisation des données

Les statistiques sont visualisées à l'aide de Chart.js:

```html
<!-- Extrait de views/stats.ejs -->
<div class="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Récapitulatif</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
        <!-- Total Tickets -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <!-- Contenu des statistiques -->
        </div>
    </div>
</div>

<script>
    // Code JavaScript pour initialiser les graphiques Chart.js
</script>
```

## API et endpoints

### Structure des API

L'application expose plusieurs endpoints API RESTful:

### Endpoints de tickets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets` | Récupère tous les tickets actifs |
| GET | `/api/tickets/:id` | Récupère les détails d'un ticket |
| POST | `/api/tickets` | Crée un nouveau ticket |
| POST | `/api/tickets/:id/edit` | Modifie un ticket existant |
| POST | `/api/tickets/:id/delete` | Supprime un ticket |
| POST | `/api/tickets/:id/archive` | Archive un ticket |

### Endpoints de messages

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/tickets/:id/messages` | Ajoute un message à un ticket |

### Endpoints de statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Récupère les statistiques générales |
| GET | `/api/report` | Génère un rapport pour une date donnée |

### Endpoints d'autocomplétion

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/saved-fields` | Récupère les champs sauvegardés pour l'autocomplétion |
| POST | `/api/saved-fields/delete` | Supprime un champ sauvegardé |

## Guides d'utilisation

### Pour le support technique

#### Création d'un ticket
1. Accédez à la page d'accueil après connexion
2. Cliquez sur "Nouveau ticket"
3. Remplissez les champs requis (appelant, motif)
4. Ajoutez des tags pertinents
5. Indiquez s'il s'agit d'un ticket GLPI
6. Précisez si le problème est bloquant
7. Validez la création

#### Traitement d'un ticket
1. Accédez à la liste des tickets
2. Sélectionnez le ticket à traiter
3. Ajoutez des messages ou des images pour documenter l'intervention
4. Mettez à jour le statut si nécessaire
5. Fermez le ticket une fois résolu

### Pour les administrateurs

#### Consultation des statistiques
1. Accédez à la section "Statistiques"
2. Sélectionnez la période souhaitée
3. Consultez les graphiques et données

#### Génération de rapports
1. Accédez à la section "Rapports"
2. Définissez les critères du rapport
3. Générez et téléchargez le rapport

## Sécurité

### Authentification
- Système de session pour authentifier les utilisateurs
- Protection des routes sensibles par middleware d'authentification
- Session expirante pour limiter les risques

### Gestion des uploads
- Validation des types de fichiers (images uniquement)
- Limitation de la taille des fichiers
- Renommage des fichiers pour éviter les conflits

### Protection des données
- Utilisation de variables d'environnement pour les informations sensibles
- Validation des entrées utilisateur
- Protection contre les injections SQL via Sequelize

### Recommandations
- Stockage sécurisé du fichier .env (non versionné)
- Utilisation de mots de passe forts pour la base de données
- Mise à jour régulière des dépendances

## Déploiement

### Déploiement avec Docker

#### Option 1: Configuration directe
```yaml
version: '3.8'
services:
  app:
    image: node:18-alpine
    container_name: ticket-app
    command: |
      sh -c '
        apk add --no-cache git &&
        mkdir -p /tmp/app &&
        git clone https://github.com/DcSault/ticket.git /tmp/app &&
        cp -R /tmp/app/* /app/ &&
        rm -rf /tmp/app &&
        cd /app &&
        npm install &&
        node server.js
      '
    ports:
      - "6969:666"
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASS=your_db_password
      - DB_NAME=tickets_db
      - DB_PORT=5432
      - PORT=666
      - SESSION_SECRET=your_session_secret
      - UPLOAD_DIR=uploads
    volumes:
      - uploads:/app/uploads
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: ticket-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_db_password
      POSTGRES_DB: tickets_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
    name: ticket-db-data
  uploads:
    name: ticket-uploads

networks:
  app-network:
    name: ticket-network
    driver: bridge
```

#### Option 2: Utilisation d'un fichier .env
Créez un fichier `.env` avec les variables nécessaires et utilisez un `docker-compose.yml` qui référence ces variables.

### Déploiement manuel
1. Clonez le dépôt: `git clone https://github.com/DcSault/ticket.git`
2. Installez les dépendances: `npm install`
3. Configurez le fichier `.env`
4. Démarrez l'application: `npm start`

## Maintenance et évolution

### Maintenance régulière
- Vérification des logs serveur
- Sauvegarde de la base de données
- Mise à jour des dépendances npm

### Améliorations suggérées
1. **Refactorisation du code**:
   - Séparer le server.js en modules plus petits
   - Créer des fichiers de routes distincts
   - Implémenter des contrôleurs séparés

2. **Améliorations de sécurité**:
   - Ajouter Helmet.js pour les en-têtes de sécurité
   - Implémenter un stockage de session en base de données
   - Ajouter un middleware de limitation de débit

3. **Améliorations fonctionnelles**:
   - Système de notification par email
   - Authentification plus robuste (JWT)
   - Interface administrateur plus complète

4. **Améliorations techniques**:
   - Ajout de tests automatisés
   - Mise en place d'un système de migration de base de données
   - Documentation de l'API avec Swagger

## Annexes

### Structure de la base de données

#### Table Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### Table Tickets
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller VARCHAR(255) NOT NULL,
  reason TEXT,
  tags VARCHAR(255)[],
  status VARCHAR(10) CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  is_glpi BOOLEAN DEFAULT FALSE,
  is_blocking BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(255) NOT NULL,
  last_modified_by VARCHAR(255),
  last_modified_at TIMESTAMP,
  archived_by VARCHAR(255),
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### Table Messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  type VARCHAR(10) CHECK (type IN ('text', 'image')) DEFAULT 'text',
  author VARCHAR(255) NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### Table Saved Fields
```sql
CREATE TABLE saved_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) CHECK (type IN ('caller', 'reason', 'tag')) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(type, value)
);
```

### Variables d'environnement

| Variable | Description | Valeur par défaut | Obligatoire |
|----------|-------------|-------------------|-------------|
| POSTGRES_USER | Utilisateur PostgreSQL | postgres | Oui |
| POSTGRES_PASSWORD | Mot de passe PostgreSQL | - | Oui |
| POSTGRES_DB | Nom de la base de données | tickets_db | Oui |
| DB_HOST | Hôte de la base de données | db | Oui |
| DB_PORT | Port de la base de données | 5432 | Oui |
| PORT | Port interne de l'application | 666 | Oui |
| APP_PORT | Port externe de l'application | 6969 | Non |
| SESSION_SECRET | Secret pour les sessions | - | Oui |
| UPLOAD_DIR | Dossier pour les uploads | uploads | Non |

### Commandes utiles

#### Démarrage de l'application
```bash
npm start
```

#### Démarrage avec Docker
```bash
docker-compose up -d
```

#### Arrêt avec Docker
```bash
docker-compose down
```

#### Sauvegarde de la base de données
```bash
docker exec ticket-db pg_dump -U postgres tickets_db > backup.sql
```

#### Restauration de la base de données
```bash
cat backup.sql | docker exec -i ticket-db psql -U postgres tickets_db
```

---

Document préparé par Victor ROSIQUE
Date: 03/03/2025
Version: 1.0 