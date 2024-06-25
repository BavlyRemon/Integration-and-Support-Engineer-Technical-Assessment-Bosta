import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import logger from './logger.js';
import rateLimit from 'express-rate-limit';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT || 3000;
const CREDENTIALS_PATH = './apyhub_credentials.json';

let token = '';
const exchangeRateCache = {};

// Function to read token from credentials file
const readCredentials = async () => {
  try {
    const credentials = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const { token: credentialsToken } = JSON.parse(credentials);
    token = credentialsToken;
    logger.info('Successfully read credentials');
  } catch (error) {
    logger.error(`Error reading credentials: ${error.message}`);
    process.exit(1);
  }
};

// Read credentials when the server starts
readCredentials();

const API_URL = 'https://api.apyhub.com/data/convert/currency';

// Function to fetch exchange rate from API or cache
const fetchExchangeRate = async (source, target, date) => {
  const cacheKey = `${source}_${target}_${date}`;

  // Check if the data exists in cache
  if (exchangeRateCache[cacheKey]) {
    logger.info(`Retrieved exchange rate from cache for ${cacheKey}`);
    return {
      ...exchangeRateCache[cacheKey],
      fromCache: true
    };
  }

  // Fetch data from API if not found in cache
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apy-token': token
    },
    body: JSON.stringify({ source, target, date })
  };

  logger.info(`Sending request to APYHub API for ${cacheKey}: ${JSON.stringify(requestOptions)}`);

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();

    logger.info(`Received response from APYHub API for ${cacheKey}: ${JSON.stringify(data)}`);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to convert currency');
    }

    // Cache the fetched data
    exchangeRateCache[cacheKey] = {
      date: data.date,
      exchangeRate: data.data
    };

    return {
      ...exchangeRateCache[cacheKey],
      fromCache: false
    };
  } catch (error) {
    logger.error(`Error fetching exchange rate from API: ${error.message}`);
    throw error;
  }
};

// Rate limiting middleware setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // Max 100 requests per windowMs
});

// Apply rate limiter to all requests
app.use(limiter);

// Middleware to parse JSON request body
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Currency Exchange API',
      version: '1.0.0',
      description: 'API for converting currencies with caching',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./index.js'], // Pointing to the current file
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`An error occurred: ${err.message}`);
  res.status(500).send('Something broke!');
});

// Endpoint to convert currencies with caching
/**
 * @swagger
 * /convert:
 *   post:
 *     summary: Convert currency
 *     description: Convert currency from source to target on a specific date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *               target:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *             required:
 *               - source
 *               - target
 *     responses:
 *       200:
 *         description: Successfully converted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                 target:
 *                   type: string
 *                 date:
 *                   type: string
 *                 exchangeRate:
 *                   type: number
 *                 fromCache:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
app.post('/convert', async (req, res) => {
  const { source, target, date } = req.body;

  if (!source || !target) {
    logger.error('source and target currencies are required in the request body');
    return res.status(400).json({ error: 'source and target currencies are required in the request body' });
  }

  try {
    const exchangeData = await fetchExchangeRate(source, target, date);

    res.json({
      source,
      target,
      date: exchangeData.date,
      exchangeRate: exchangeData.exchangeRate,
      fromCache: exchangeData.fromCache
    });
  } catch (error) {
    logger.error(`Error converting currency: ${error.message}`);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
