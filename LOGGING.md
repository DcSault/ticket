# 📋 Système de Logs Persistants

Ce système de logs permet de tracer toutes les opérations importantes de l'application, particulièrement les modifications de tickets.

## 📁 Structure des logs

```
logs/
├── app.log           # Tous les logs de l'application
├── TICKET_EDIT.log   # Logs spécifiques aux modifications de tickets
├── STARTUP.log       # Logs de démarrage/arrêt du serveur
└── ERROR.log         # Logs d'erreurs uniquement
```

## 🔍 Consultation des logs

### Via les scripts npm :
```bash
# Lister les catégories disponibles
npm run logs

# Voir les logs de modification de tickets
npm run logs:ticket

# Voir uniquement les erreurs
npm run logs:error

# Voir tous les logs
npm run logs:all
```

### Via le script direct :
```bash
# Afficher les 20 derniers logs de tickets
node scripts/view-logs.js ticket 20

# Afficher les 100 derniers logs d'erreurs  
node scripts/view-logs.js error 100
```

## 📊 Types de logs pour l'édition de tickets

### 🟢 TICKET_EDIT_START
Logged quand une modification de ticket commence :
```json
{
  "timestamp": "2024-01-15 14:30:25",
  "level": "INFO", 
  "category": "TICKET_EDIT",
  "message": "Starting edit for ticket 123 by user admin",
  "data": {
    "caller": "John Doe",
    "reason": "Problème résolu",
    "creationDate": "2024-01-15",
    "creationTime": "14:30"
  }
}
```

### 🔵 TICKET_EDIT_DATA
Comparaison des données avant/après :
```json
{
  "timestamp": "2024-01-15 14:30:25",
  "level": "DEBUG",
  "category": "TICKET_EDIT", 
  "message": "Data comparison for ticket 123",
  "data": {
    "original": { "caller": "Jane", "createdAt": "2024-01-15T10:00:00Z" },
    "new": { "caller": "John Doe", "createdAt": "2024-01-15T14:30:00Z" }
  }
}
```

### ✅ TICKET_EDIT_SUCCESS
Confirmation de la mise à jour :
```json
{
  "timestamp": "2024-01-15 14:30:26",
  "level": "SUCCESS",
  "category": "TICKET_EDIT",
  "message": "Successfully updated ticket 123",
  "data": {
    "id": 123,
    "caller": "John Doe", 
    "createdAt": "2024-01-15T14:30:00Z",
    "lastModifiedAt": "2024-01-15T14:30:26Z"
  }
}
```

### ❌ TICKET_EDIT_ERROR
Erreurs lors de la modification :
```json
{
  "timestamp": "2024-01-15 14:30:25",
  "level": "ERROR",
  "category": "TICKET_EDIT",
  "message": "Failed to update ticket 123",
  "data": {
    "error": "Validation error: caller is required",
    "stack": "Error: Validation error..."
  }
}
```

## 🔧 Debug des problèmes de dates

Pour diagnostiquer les problèmes de modification de dates/heures, consultez les logs TICKET_EDIT :

```bash
npm run logs:ticket
```

Recherchez les entrées contenant :
- `Processing date/time update` - Construction de la nouvelle date
- `Constructed date` - Validation de la date construite  
- `Date updated` - Confirmation du changement
- `Invalid date constructed` - Erreur de construction de date

## 🧹 Maintenance

Les logs sont automatiquement nettoyés après 30 jours. Pour nettoyer manuellement :

```javascript
const logger = require('./utils/logger');
logger.cleanOldLogs(7); // Garder 7 jours seulement
```

## 🎨 Couleurs dans la console

- 🔴 **ERROR** : Rouge
- 🟡 **WARN** : Jaune  
- 🔵 **INFO** : Cyan
- ⚪ **DEBUG** : Blanc
- 🟢 **SUCCESS** : Vert