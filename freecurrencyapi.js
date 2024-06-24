import fetch from 'node-fetch';

class Freecurrencyapi {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.freecurrencyapi.com/v1/';
  }

  async latest({ base_currency, currencies }) {
    const url = `${this.baseUrl}latest?apikey=${this.apiKey}&base_currency=${base_currency}&currencies=${currencies}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }
}

export default Freecurrencyapi;
