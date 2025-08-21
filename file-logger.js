const fs = require('fs');
const path = require('path');

function logToFile(message, uniqueTimestamp, logFileName = 'log.txt', writeToConsole = false) {
    try {
        // Handle case where message is null, undefined, or not a string/object
        if (message === null || message === undefined) {
            message = '[null or undefined value]';
        }

        // Handle basic console logging case with no timestamp
        if((uniqueTimestamp === undefined || uniqueTimestamp === null || uniqueTimestamp === "") && writeToConsole){
            if (typeof message === 'object') {
                console.log('', message);
            } else {
                console.log(message);
            }
            return;
        }

        if(logFileName === null) {
            logFileName = 'log.txt';
        }

        if(writeToConsole){
            if (typeof message === 'object') {
                console.log('', message);
            } else {
                console.log(message);
            }
        }

        const logDir = path.join(__dirname, 'logs');
        const timestampDir = path.join(logDir, uniqueTimestamp);

        // Create directories if they do not exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Check if the directory with the unique timestamp exists, if not, create it
        if (!fs.existsSync(timestampDir)) {
            fs.mkdirSync(timestampDir, { recursive: true });
        }

        const logFile = path.join(timestampDir, logFileName);

        // Handle different types of messages safely
        if (message === null || message === undefined) {
            fs.appendFileSync(logFile, "[null or undefined value]\n", 'utf8');
        } else if (typeof message === 'object') {
            try {
                fs.appendFileSync(logFile, `\n${JSON.stringify(message, null, 2)}\n`, 'utf8');
            } catch (jsonError) {
                fs.appendFileSync(logFile, `[Error: Could not stringify object: ${jsonError.message}]\n`, 'utf8');
            }
        } else if (typeof message === 'string') {
            try {
                const formattedMessage = message.replace(/\\n/g, '\n');
                fs.appendFileSync(logFile, `${formattedMessage}\n`, 'utf8');
            } catch (replaceError) {
                fs.appendFileSync(logFile, `${String(message)}\n`, 'utf8');
            }
        } else {
            // Handle any other types by converting to string
            fs.appendFileSync(logFile, `${String(message)}\n`, 'utf8');
        }
    } catch (error) {
        console.error('Error logging:', error);
    }
}

module.exports = { logToFile };
