
# Currency Exchange Service

This service allows you to convert currencies using the APYHub API, with caching for improved performance.

## Setup Instructions

### Prerequisites

- Node.js (v20 or later)
- Docker (if running with Docker)
- Postman or cURL for API testing

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd currency-exchange
   ```

2. **Install dependencies:**

   If running locally:
   ```bash
   npm install
   ```

   If using Docker:
   ```bash
   docker-compose up --build
   ```

3. **Set up API key:**

   Create a file named `apyhub_credentials.json` in the root directory with your APYHub API token:
   ```json
   {
     "token": "APY0MstoLkyvz5AYnEl1rHzFrZYPjes0AkSCmdGuRB7ZG3yBohRB0OX8XIQNzqu7I5rczSL9S",
     "type": "Token"
   }
   ```

## Running the Application

### Locally

```bash
npm start
```

The application will start on `http://localhost:3000`.

### Using Docker

```bash
docker-compose up
```

The application will be accessible in Docker at `http://localhost:3000`.

## API Documentation

The API is documented using Swagger. You can access the API documentation at:

- **Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Using the API

### Convert Currency

- **Endpoint:** `/convert`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "source": "USD",
    "target": "EUR",
    "date": "YYYY-MM-DD"
  }
  ```

### Example using cURL

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"source": "USD", "target": "EUR", "date": "2024-06-25"}'
```

### Example using Postman

1. Open Postman.
2. Set the request type to POST and enter the endpoint URL (`http://localhost:3000/convert`).
3. Add a JSON body with the required parameters (`source`, `target`, `date`).

### API Key

Include your APYHub API key in the `apyhub_credentials.json` file as shown above.

---
