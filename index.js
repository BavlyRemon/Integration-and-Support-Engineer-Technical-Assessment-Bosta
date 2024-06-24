import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs'; // Node.js built-in module for file system operations

const app = express();
const PORT = process.env.PORT || 3000;
const CREDENTIALS_PATH = './apyhub_credentials.json'; // Path to your credentials file
let token = ''; // Variable to store token

// Function to read token from credentials file
const readCredentials = () => {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    token = credentials.token;
  } catch (error) {
    console.error('Error reading credentials:', error.message);
    process.exit(1); // Exit the process if credentials cannot be read
  }
};

// Read credentials when the server starts
readCredentials();

const API_URL = 'https://api.apyhub.com/data/convert/currency';

// Middleware to parse JSON request body
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Endpoint to convert currencies
app.post('/convert', async (req, res) => {
    const { source, target, date } = req.body;
  
    if (!source || !target) {
      return res.status(400).json({ error: 'source and target currencies are required in the request body' });
    }
  
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apy-token': token // Use apy-token header for token authentication
        },
        body: JSON.stringify({
          source,
          target,
          date
        })
      };
  
      console.log('Sending request to APYHub API:', requestOptions);
  
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();
  
      console.log('Received response from APYHub API:', data);
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert currency');
      }
  
      res.json({
        source,
        target,
        date: data.date,
        exchangeRate: data.exchange_rate,
        convertedAmount: data.converted_amount
      });
    } catch (error) {
      console.error('Error converting currency:', error.message);
      res.status(500).json({ error: 'Failed to convert currency' });
    }
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
