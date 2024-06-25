import { createLogger, transports, format } from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath from 'url'

// Get current file directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create logs directory if it doesn't exist
const logsDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

// Define log file name and path
const logFilePath = path.join(logsDirectory, 'app.log');

// Create a logger instance
const logger = createLogger({
  level: 'info',  // Set default logging level
  format: format.combine(
    format.timestamp(),  // Add timestamp to logs
    format.simple()      // Simple format: `${timestamp} ${level}: ${message}`
  ),
  transports: [
    // Log to console
    new transports.Console(),
    // Log to a file
    new transports.File({ filename: logFilePath })
  ]
});

export default logger;  
