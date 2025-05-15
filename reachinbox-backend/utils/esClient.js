const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: 'http://localhost:9200', // Adjust if using different port or auth
});

module.exports = esClient;
