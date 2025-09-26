const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    formatTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').split('.')[0];
    }

    writeLog(level, category, message, data = null) {
        const timestamp = this.formatTimestamp();
        const logEntry = {
            timestamp,
            level,
            category,
            message,
            data
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        // Log général
        const generalLogFile = path.join(this.logsDir, 'app.log');
        fs.appendFileSync(generalLogFile, logLine);

        // Log spécifique par catégorie
        if (category) {
            const categoryLogFile = path.join(this.logsDir, `${category}.log`);
            fs.appendFileSync(categoryLogFile, logLine);
        }

        // Aussi afficher dans la console avec couleurs
        const colors = {
            ERROR: '\x1b[31m',   // Rouge
            WARN: '\x1b[33m',    // Jaune
            INFO: '\x1b[36m',    // Cyan
            DEBUG: '\x1b[37m',   // Blanc
            SUCCESS: '\x1b[32m'  // Vert
        };
        
        const resetColor = '\x1b[0m';
        const color = colors[level] || colors.INFO;
        
        console.log(`${color}[${timestamp}] ${level} ${category ? `[${category}]` : ''}: ${message}${resetColor}`);
        if (data) {
            console.log(`${color}Data:${resetColor}`, data);
        }
    }

    error(category, message, data = null) {
        this.writeLog('ERROR', category, message, data);
    }

    warn(category, message, data = null) {
        this.writeLog('WARN', category, message, data);
    }

    info(category, message, data = null) {
        this.writeLog('INFO', category, message, data);
    }

    debug(category, message, data = null) {
        this.writeLog('DEBUG', category, message, data);
    }

    success(category, message, data = null) {
        this.writeLog('SUCCESS', category, message, data);
    }

    // Méthodes spécifiques pour l'édition de tickets
    ticketEditStart(ticketId, userId, data) {
        this.info('TICKET_EDIT', `Starting edit for ticket ${ticketId} by user ${userId}`, data);
    }

    ticketEditData(ticketId, originalData, newData) {
        this.debug('TICKET_EDIT', `Data comparison for ticket ${ticketId}`, {
            original: originalData,
            new: newData
        });
    }

    ticketEditSuccess(ticketId, updatedData) {
        this.success('TICKET_EDIT', `Successfully updated ticket ${ticketId}`, updatedData);
    }

    ticketEditError(ticketId, error) {
        this.error('TICKET_EDIT', `Failed to update ticket ${ticketId}`, {
            error: error.message,
            stack: error.stack
        });
    }

    // Nettoyage des logs anciens (optionnel)
    cleanOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const logFiles = fs.readdirSync(this.logsDir).filter(file => file.endsWith('.log'));
        
        logFiles.forEach(file => {
            const filePath = path.join(this.logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old log file: ${file}`);
            }
        });
    }
}

// Export d'une instance singleton
const logger = new Logger();
module.exports = logger;