require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { Client } = require('@elastic/elasticsearch');
const { sendSlackNotification, triggerWebhook } = require('../utils/notifications');
const { suggestReply } = require('../utils/suggestReply');


// Elasticsearch client
const esClient = new Client({ node: 'http://localhost:9200' });

const app = express();
app.use(cors());
app.use(express.json());

// ➕ Add this route
app.get('/api/emails', async (req, res) => {
  try {
    const { folder, account, category, search, sort } = req.query;

    const must = [];

    if (folder) must.push({ match: { folder } });
    if (account) must.push({ match: { account } });
    if (category) must.push({ match: { category } });

    // Add search across subject, from, text fields using multi_match
    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ['subject', 'from', 'text']
        }
      });
    }

    const sortOrder = (sort === 'asc') ? 'asc' : 'desc';

    const result = await esClient.search({
      index: 'emails',
      size: 100,
      sort: [{ date: { order: sortOrder} }],
      query: must.length > 0 ? { bool: { must } } : { match_all: {} }
    });

    const emails = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
    
    res.json(emails);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Elasticsearch query failed' });
  }
});

app.patch('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // First, fetch the original email
    const { body } = await esClient.get({
      index: 'emails',
      id
    });

    const email = body._source;
    email.category = category; // update category

    // Update the document in Elasticsearch
    await esClient.index({
      index: 'emails',
      id,
      document: email
    });

    // Trigger notifications only if marked as "Interested"
    if (category === 'Interested') {
      await sendSlackNotification(email);
      await triggerWebhook(email);
    }

    res.json({ success: true, updated: email });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});



app.post('/api/emails/:id/mark-interested', async (req, res) => {
  const emailId = req.params.id;

  try {
    // Update the email category to 'Interested' in Elasticsearch
    await esClient.update({
      index: 'emails',
      id: emailId,
      doc: { category: 'Interested' }
    });

    // Fetch updated email document
    const response = await esClient.get({ index: 'emails', id: emailId });
    const updatedEmail = response._source;


    // Send Slack and Webhook notifications
    await sendSlackNotification(`📧 Email marked as Interested:\nSubject: ${updatedEmail.subject}\nFrom: ${updatedEmail.from}`);
    await triggerWebhook(updatedEmail);


    res.json({ success: true, email: updatedEmail });
  } catch (err) {
    console.error('Error marking email Interested:', err);
    res.status(500).json({ error: 'Failed to mark email as Interested' });
  }
});

app.post('/api/suggest-reply', async (req, res) => {
  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'Missing email text' });
  }

  try {
    const reply = await suggestReply(emailText);
    res.json({ suggestedReply: reply });
  } catch (err) {
    console.error('Error generating reply:', err);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
