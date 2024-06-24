import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs/promises'; // Using fs.promises for async file read
import logger from './logger.js';  // Import your Winston logger module
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;
const CREDENTIALS_PATH = './apyhub_credentials.json';

let token = '';
const exchangeRateCache = {};  // In-memory cache for exchange rates

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
      fromCache: true  // Indicate that data is from cache
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
      exchangeRate: data.data  // Use the data field as the exchange rate
    };

    return {
      ...exchangeRateCache[cacheKey],
      fromCache: false  // Indicate that data is from API, not from cache
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

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`An error occurred: ${err.message}`);
  res.status(500).send('Something broke!');
});

// Endpoint to convert currencies with caching
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
      date,
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
