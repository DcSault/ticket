# Technologies Utilisées - Système de Gestion des Appels

## Backend

### Node.js & Express
- **Rôle** : Framework serveur
- **Pourquoi** : Performance élevée, écosystème riche, facilité d'utilisation
- **Usage** : Gestion des routes, middlewares, API REST

### PostgreSQL
- **Rôle** : Base de données relationnelle
- **Pourquoi** : Robuste, supporte JSONB et arrays, excellente intégrité des données
- **Usage** : Stockage des tickets, utilisateurs, messages

### Sequelize
- **Rôle** : ORM (Object-Relational Mapping)
- **Pourquoi** : Abstraction de la base de données, migrations faciles
- **Usage** : Modèles, relations, requêtes

## Frontend

### EJS (Embedded JavaScript)
- **Rôle** : Moteur de templates
- **Pourquoi** : Intégration JavaScript native, simplicité
- **Usage** : Rendu côté serveur des vues

### Tailwind CSS
- **Rôle** : Framework CSS
- **Pourquoi** : Utilitaire first, hautement personnalisable, pas de CSS superflu
- **Usage** : Styles, responsive design, thème sombre

### Chart.js
- **Rôle** : Bibliothèque de graphiques
- **Pourquoi** : API simple, responsive, personnalisable
- **Usage** : Visualisations statistiques

## Outils et Utilitaires

### Multer
- **Rôle** : Middleware de gestion des fichiers
- **Pourquoi** : Intégration Express native, configuration flexible
- **Usage** : Upload d'images pour les messages

### ExcelJS
- **Rôle** : Manipulation de fichiers Excel
- **Pourquoi** : API complète, support moderne
- **Usage** : Export des statistiques

### Docker
- **Rôle** : Conteneurisation
- **Pourquoi** : Déploiement cohérent, isolation
- **Usage** : Packaging application et base de données

## Sécurité et Session

### Express-session
- **Rôle** : Gestion des sessions
- **Pourquoi** : Intégration Express native, sécurisé
- **Usage** : Authentification utilisateurs

### UUID
- **Rôle** : Génération d'identifiants uniques
- **Pourquoi** : Sécurité, unicité garantie
- **Usage** : IDs des tickets, messages, utilisateurs

## Features Techniques

### Archivage Automatique
- Système d'archivage après 24h inactif
- Utilisation de jobs programmés

### Autocomplétion
- Implémentation custom pour les champs fréquents
- Stockage des valeurs fréquentes en base

### Thème Sombre/Clair
- Détection préférences système
- Persistance du choix utilisateur
- Transition fluide entre thèmes