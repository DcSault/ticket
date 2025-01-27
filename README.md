# Système de Gestion des Appels de Support

Un système de gestion de Appels de Support permettant de suivre les demandes des utilisateurs, avec support pour les tickets GLPI et les tickets internes.

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
- Système d'archivage et recherche avancée

## 🚀 Déploiement avec Docker

### Option 1 : Configuration directe

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

2. Démarrez l'application :
```bash
docker-compose up -d
```

### Option 2 : Configuration avec .env

1. Créez un fichier `.env` :
```env
# Configuration Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=db_password
POSTGRES_DB=tickets_db

# Configuration Application
DB_HOST=db
DB_USER=postgres
DB_PASS=db_password
DB_NAME=tickets_db
DB_PORT=5432
PORT=666
SESSION_SECRET=session_secret
UPLOAD_DIR=uploads

# Configuration Ports
APP_PORT=6969
INTERNAL_PORT=666
```

2. Créez un fichier `docker-compose.yml` :
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
      - "${APP_PORT}:${INTERNAL_PORT}"
    depends_on:
      - db
    environment:
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME=${DB_NAME}
      - DB_PORT=${DB_PORT}
      - PORT=${INTERNAL_PORT}
      - SESSION_SECRET=${SESSION_SECRET}
      - UPLOAD_DIR=${UPLOAD_DIR}
    volumes:
      - uploads:/app/uploads
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: ticket-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
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

3. Démarrez l'application :
```bash
docker-compose up -d
```

L'application sera accessible sur : `http://localhost:6969`

## 🔐 Sécurité et Configuration

Pour une installation sécurisée :

1. Ne jamais commiter le fichier `.env` dans Git
2. Ajoutez `.env` à votre `.gitignore`
3. Utilisez des mots de passe forts pour :
   - La base de données PostgreSQL (minimum 16 caractères avec majuscules, minuscules, chiffres et caractères spéciaux)
   - Le secret de session (minimum 32 caractères)
4. Changez les ports par défaut si nécessaire

## 📋 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| POSTGRES_USER | Utilisateur PostgreSQL | postgres |
| POSTGRES_PASSWORD | Mot de passe PostgreSQL | votre_mot_de_passe |
| POSTGRES_DB | Nom de la base de données | tickets_db |
| DB_HOST | Hôte de la base de données | db |
| DB_PORT | Port de la base de données | 5432 |
| PORT | Port interne de l'application | 666 |
| APP_PORT | Port externe de l'application | 6969 |
| SESSION_SECRET | Secret pour les sessions | votre_secret |
| UPLOAD_DIR | Dossier pour les uploads | uploads |

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