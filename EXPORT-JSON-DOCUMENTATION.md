# 📦 Page d'Export JSON - Documentation

**Date:** 17 octobre 2025  
**Version:** CallFix 2.0.7  
**Statut:** ✅ **OPÉRATIONNEL - SANS AUTHENTIFICATION**

---

## 🎯 Objectif

Créer une interface web permettant d'**exporter l'intégralité de la base de données** CallFix au format JSON, **sans nécessiter d'authentification**.

---

## 🚀 Accès

### URL
```
http://10.20.30.140:6969/export
```

### Caractéristiques
- ✅ **Aucune authentification requise**
- ✅ **Interface moderne et responsive**
- ✅ **Support mode sombre**
- ✅ **Exports multiples**

---

## 📊 Fonctionnalités

### 1. Statistiques en Temps Réel

**Affichage:**
- 📋 Nombre de tickets
- 👥 Nombre d'utilisateurs
- 💬 Nombre de messages
- 💾 Nombre de champs mémorisés

**API:** `GET /api/export/stats`

**Réponse:**
```json
{
  "tickets": 150,
  "users": 12,
  "messages": 450,
  "savedfields": 89
}
```

---

### 2. Export Complet

**Description:** Exporte toutes les tables en un seul fichier JSON

**Bouton:** "Télécharger tout (JSON)"

**API:** `GET /api/export/full`

**Nom du fichier:** `callfix-full-export-2025-10-17T14-30-25.json`

**Structure:**
```json
{
  "metadata": {
    "exportDate": "2025-10-17T14:30:25.123Z",
    "version": "2.0.7",
    "tables": ["tickets", "users", "messages", "savedfields"],
    "counts": {
      "tickets": 150,
      "users": 12,
      "messages": 450,
      "savedfields": 89
    }
  },
  "data": {
    "tickets": [...],
    "users": [...],
    "messages": [...],
    "savedfields": [...]
  }
}
```

---

### 3. Export par Table

**Description:** Exporte une table spécifique

**Boutons:**
- 📋 Tickets
- 👥 Utilisateurs
- 💬 Messages
- 💾 Champs mémorisés

**API:** `GET /api/export/table/:tableName`

**Paramètres:**
- `tickets` - Tous les tickets avec leurs messages
- `users` - Tous les utilisateurs
- `messages` - Tous les messages
- `savedfields` - Tous les champs mémorisés

**Exemple:** `GET /api/export/table/tickets`

**Nom du fichier:** `callfix-tickets-2025-10-17T14-30-25.json`

**Structure:**
```json
{
  "metadata": {
    "exportDate": "2025-10-17T14:30:25.123Z",
    "table": "tickets",
    "count": 150,
    "version": "2.0.7"
  },
  "data": [
    {
      "id": 1,
      "caller": "John Doe",
      "reason": "Problème réseau",
      "tags": ["réseau", "urgent"],
      "isBlocking": false,
      "isGLPI": false,
      "isArchived": false,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "createdBy": "admin",
      "messages": [...]
    },
    ...
  ]
}
```

---

### 4. Export Personnalisé

**Description:** Sélectionnez les tables à exporter

**Bouton:** "Choisir les tables"

**Interface:** Modal avec checkboxes pour chaque table

**API:** `POST /api/export/custom`

**Body:**
```json
{
  "tables": ["tickets", "messages"]
}
```

**Nom du fichier:** `callfix-custom-export-2025-10-17T14-30-25.json`

**Structure:**
```json
{
  "metadata": {
    "exportDate": "2025-10-17T14:30:25.123Z",
    "version": "2.0.7",
    "tables": ["tickets", "messages"],
    "counts": {
      "tickets": 150,
      "messages": 450
    }
  },
  "data": {
    "tickets": [...],
    "messages": [...]
  }
}
```

---

## 🛠️ Routes API

### Route 1: Page d'export
```javascript
GET /export
```
**Authentification:** ❌ Non requise  
**Réponse:** Page HTML

---

### Route 2: Statistiques
```javascript
GET /api/export/stats
```
**Authentification:** ❌ Non requise  
**Réponse:** JSON avec compteurs

---

### Route 3: Export complet
```javascript
GET /api/export/full
```
**Authentification:** ❌ Non requise  
**Réponse:** JSON avec toutes les tables  
**Inclus:** Tickets avec messages, Users, Messages, SavedFields

---

### Route 4: Export par table
```javascript
GET /api/export/table/:tableName
```
**Paramètres:**
- `tableName` : `tickets`, `users`, `messages`, `savedfields`

**Authentification:** ❌ Non requise  
**Réponse:** JSON avec données de la table

---

### Route 5: Export personnalisé
```javascript
POST /api/export/custom
```
**Body:**
```json
{
  "tables": ["tickets", "users"]
}
```
**Authentification:** ❌ Non requise  
**Réponse:** JSON avec tables sélectionnées

---

## 📁 Fichiers Créés

### 1. Page HTML
**Fichier:** `public/html/export.html`

**Caractéristiques:**
- Interface responsive avec Tailwind CSS
- Support mode sombre
- Animations et transitions
- Modal de sélection de tables
- Notifications toast
- Spinner de chargement

**Scripts inclus:**
- `/js/theme-init.js` - Initialisation du thème
- `/js/themeManager.js` - Gestion du thème
- Script inline pour les exports

---

### 2. Routes Serveur
**Fichier:** `server.js` (lignes 1022-1169)

**Ajouts:**
```javascript
// Route page d'export
app.get('/export', ...)

// Statistiques
app.get('/api/export/stats', ...)

// Export complet
app.get('/api/export/full', ...)

// Export par table
app.get('/api/export/table/:tableName', ...)

// Export personnalisé
app.post('/api/export/custom', ...)
```

**Total:** ~148 lignes ajoutées

---

## 🔐 Sécurité

### ⚠️ ATTENTION

Cette page **N'A AUCUNE AUTHENTIFICATION**.

**Implications:**
- ❌ Accessible à tous
- ❌ Pas de logs d'accès
- ❌ Pas de limitation de débit spécifique
- ❌ Expose toute la base de données

**Recommandations:**
1. **Utiliser uniquement en environnement sécurisé**
2. **Ajouter une authentification en production:**
   ```javascript
   app.get('/export', requireLogin, (req, res) => {
       res.sendFile(...);
   });
   ```
3. **Ajouter un rate limiter:**
   ```javascript
   const exportLimiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 5 // 5 exports max
   });
   app.get('/api/export/*', exportLimiter, ...);
   ```

---

## 🧪 Tests

### Test 1: Accès à la page
```bash
# Ouvrir http://10.20.30.140:6969/export
# Vérifier:
#   ✅ Page se charge
#   ✅ Statistiques affichées
#   ✅ Tous les boutons visibles
```

### Test 2: Export complet
```bash
# Cliquer sur "Télécharger tout (JSON)"
# Vérifier:
#   ✅ Fichier téléchargé
#   ✅ Nom: callfix-full-export-[timestamp].json
#   ✅ Contient metadata + data
#   ✅ Toutes les tables présentes
```

### Test 3: Export par table
```bash
# Cliquer sur "📋 Tickets"
# Vérifier:
#   ✅ Fichier téléchargé
#   ✅ Nom: callfix-tickets-[timestamp].json
#   ✅ Contient seulement les tickets
#   ✅ Inclut les messages associés
```

### Test 4: Export personnalisé
```bash
# Cliquer sur "Choisir les tables"
# Cocher "Tickets" et "Messages"
# Cliquer "Télécharger la sélection"
# Vérifier:
#   ✅ Fichier téléchargé
#   ✅ Nom: callfix-custom-export-[timestamp].json
#   ✅ Contient seulement tickets et messages
```

### Test 5: API directe
```bash
# Test avec curl
curl http://10.20.30.140:6969/api/export/stats
curl http://10.20.30.140:6969/api/export/full > full.json
curl http://10.20.30.140:6969/api/export/table/tickets > tickets.json
```

---

## 📊 Structure des Données

### Tickets
```json
{
  "id": 1,
  "caller": "John Doe",
  "reason": "Problème réseau",
  "tags": ["réseau", "urgent"],
  "isBlocking": false,
  "isGLPI": false,
  "glpiNumber": null,
  "isArchived": false,
  "archivedAt": null,
  "archivedBy": null,
  "createdAt": "2025-10-15T10:00:00.000Z",
  "createdBy": "admin",
  "lastModifiedAt": null,
  "lastModifiedBy": null,
  "messages": [...]
}
```

### Users
```json
{
  "id": 1,
  "username": "admin",
  "password": "[HASH]",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Messages
```json
{
  "id": 1,
  "ticketId": 1,
  "content": "Message de test",
  "type": "text",
  "author": "admin",
  "createdAt": "2025-10-15T10:05:00.000Z",
  "updatedAt": "2025-10-15T10:05:00.000Z"
}
```

### SavedFields
```json
{
  "id": 1,
  "fieldName": "caller",
  "fieldValue": "John Doe",
  "usageCount": 15,
  "createdAt": "2025-10-01T00:00:00.000Z",
  "updatedAt": "2025-10-17T14:00:00.000Z"
}
```

---

## 🎨 Interface

### Couleurs
- **Tickets:** Violet/Pourpre
- **Users:** Bleu
- **Messages:** Jaune
- **SavedFields:** Vert

### Animations
- Hover sur cards (translateY + shadow)
- Spinner de chargement
- Notifications toast (fade in/out)
- Transitions fluides

### Responsive
- Mobile: 1 colonne
- Tablette: 2 colonnes
- Desktop: 4 colonnes (stats)

---

## 📝 Logs Serveur

### Export complet
```
🔽 Export complet de la base de données demandé
✅ Export complet généré: 150 tickets, 12 users, 450 messages, 89 savedfields
```

### Export par table
```
🔽 Export de la table tickets demandé
✅ Export de tickets généré: 150 enregistrements
```

### Export personnalisé
```
🔽 Export personnalisé demandé: tickets, messages
✅ Export personnalisé généré pour 2 table(s)
```

---

## 🚀 Utilisation

### Backup régulier
```bash
# Cron job pour backup quotidien
0 2 * * * curl http://localhost:6969/api/export/full > /backups/callfix-$(date +\%Y-\%m-\%d).json
```

### Migration
```bash
# Exporter depuis l'ancien serveur
curl http://old-server:6969/api/export/full > backup.json

# Importer sur le nouveau serveur (script séparé nécessaire)
node import-data.js backup.json
```

### Analyse
```bash
# Exporter et analyser avec jq
curl http://localhost:6969/api/export/table/tickets | jq '.data[] | select(.isBlocking == true)'
```

---

## ✅ Checklist

- [x] Page HTML créée (`export.html`)
- [x] 5 routes API créées
- [x] Interface responsive
- [x] Support mode sombre
- [x] Statistiques en temps réel
- [x] Export complet
- [x] Export par table
- [x] Export personnalisé
- [x] Notifications utilisateur
- [x] Spinner de chargement
- [x] Gestion d'erreurs
- [x] Logs serveur
- [x] Documentation complète

---

## ⚠️ Avertissements

1. **Pas d'authentification** - À utiliser avec précaution
2. **Pas de rate limiting** - Peut être spammé
3. **Pas de logs d'accès** - Pas de traçabilité
4. **Exports volumineux** - Peut consommer beaucoup de mémoire
5. **Mots de passe inclus** - Table Users expose les hashs

---

## 🔧 Améliorations Futures

### Phase 1 - Sécurité
- [ ] Ajouter authentification admin
- [ ] Rate limiter sur exports
- [ ] Logs d'accès détaillés
- [ ] Exclure les mots de passe des exports

### Phase 2 - Fonctionnalités
- [ ] Filtres par date
- [ ] Export CSV
- [ ] Compression ZIP
- [ ] Import de données

### Phase 3 - Performance
- [ ] Streaming pour gros exports
- [ ] Pagination des résultats
- [ ] Cache des exports
- [ ] Export incrémental

---

**Fin du document**  
*Page d'export créée le 17 octobre 2025*
