const esClient = require('./utils/esClient');

async function createIndex() {
  const exists = await esClient.indices.exists({ index: 'emails' });

  if (!exists.body) {
    await esClient.indices.create({
      index: 'emails',
      body: {
        mappings: {
          properties: {
            from: { type: 'text' },
            subject: { type: 'text' },
            date: { type: 'date' },
            body: { type: 'text' },
            messageId: { type: 'keyword' }
          }
        }
      }
    });
    console.log('✅ Created index: emails');
  } else {
    console.log('ℹ️ Index already exists');
  }
}

createIndex().catch(console.error);
