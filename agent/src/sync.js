const axios = require('axios');

class SyncClient {
  constructor({ serverUrl, apiKey }) {
    this.http = axios.create({
      baseURL: serverUrl,
      timeout: 5000,
      headers: { 'x-agent-key': apiKey },
    });
  }

  async isOnline() {
    try {
      await this.http.get('/health', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async pushBatch(events) {
    const res = await this.http.post('/api/events/ingest/batch', { events });
    return res.data;
  }
}

module.exports = { SyncClient };
