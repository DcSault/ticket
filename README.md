# Système de Gestion des Tickets de Support

Un système de gestion de tickets de support permettant de suivre les demandes des utilisateurs, avec support pour les tickets GLPI et les tickets internes.

## 🚀 Déploiement Rapide avec Docker

1. Créez un fichier `docker-compose.yml` :
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
      - DB_PASS=[votre_mot_de_passe]
      - DB_NAME=tickets_db
      - DB_PORT=5432
      - PORT=666
      - SESSION_SECRET=[votre_secret_de_session]
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
      POSTGRES_PASSWORD: [votre_mot_de_passe]
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

2. Démarrez l'application :
```bash
docker-compose up -d
```

L'application sera automatiquement :
- Clonée depuis GitHub
- Installée avec ses dépendances
- Démarrée sur le port 6969

Accédez à l'application sur : `http://localhost:6969`

## 🔐 Configuration de la Sécurité

Avant le déploiement, remplacez les valeurs sensibles dans le docker-compose.yml :
- `[votre_mot_de_passe]` : Mot de passe PostgreSQL
- `[votre_secret_de_session]` : Clé secrète pour les sessions

## 📁 Structure du Projet

```
.
├── models/                 # Modèles de données
│   ├── archive.js         # Modèle d'archive
│   ├── index.js           # Configuration Sequelize
│   ├── message.js         # Modèle de message
│   ├── savedField.js      # Modèle des champs sauvegardés
│   ├── tag.js            # Modèle de tag
│   ├── ticket.js         # Modèle de ticket
│   └── user.js           # Modèle utilisateur
├── public/               # Fichiers statiques
│   ├── js/
│   │   └── stats.js      # Scripts statistiques
├── scripts/             # Scripts utilitaires
│   ├── initDatabase.js   # Initialisation BDD
│   ├── migrate.js        # Migrations
│   ├── resetDatabase.js  # Réinitialisation BDD
│   └── testConnection.js # Test connexion
├── views/               # Templates EJS
│   ├── admin/
│   │   └── create-ticket.ejs # Création de Ticket par ADMIN
│   ├── archives.ejs     # Page des archives
│   ├── edit-ticket.ejs  # Édition de ticket
│   ├── index.ejs        # Page principale
│   ├── login.ejs        # Page de connexion
│   ├── stats.ejs        # Page des statistiques
│   └── ticket.ejs       # Vue détaillée ticket
├── .gitattributes
├── .gitignore
├── package.json         # Dépendances
├── server.js           # Point d'entrée
└── viewsdata.js        # Voir les Données de la BDD
```

## 🌟 Fonctionnalités

### Gestion des Tickets
- Tickets standards avec raison et tags personnalisables
- Support des tickets GLPI
- Archivage automatique après 24h
- Suivi des modifications avec horodatage

### Messagerie
- Messages texte et images
- Horodatage des messages
- Stockage sécurisé des uploads

### Interface
- Design responsive avec Tailwind CSS
- Autocomplétion des champs fréquents
- Interface intuitive pour la gestion des tickets

## 📝 License

MIT License

## 🙏 Remerciements

Merci à tous les contributeurs qui participent à l'amélioration de ce projet !

## 🤝 Contribution

Les contributions sont bienvenues :
1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request