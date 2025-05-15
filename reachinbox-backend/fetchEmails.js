require('dotenv').config();
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const moment = require('moment');
const { Client } = require('@elastic/elasticsearch');
const fetch = require('node-fetch');

const esClient = new Client({ node: 'http://localhost:9200' });

const accounts = [
  {
    user: process.env.IMAP_USER1,
    password: process.env.IMAP_PASSWORD1,
    host: process.env.IMAP_HOST1,
    port: parseInt(process.env.IMAP_PORT1),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  },
  {
    user: process.env.IMAP_USER2,
    password: process.env.IMAP_PASSWORD2,
    host: process.env.IMAP_HOST2,
    port: parseInt(process.env.IMAP_PORT2),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
];

// Function to call Hugging Face zero-shot classification API
async function categorizeEmail(text) {
  if (!text || text.trim() === '') return 'Not Categorized';

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
  const API_TOKEN = process.env.HF_API_TOKEN;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office']
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Hugging Face API error:', data.error);
      return 'Not Categorized';
    }

    return data.labels[0]; // top predicted label
  } catch (err) {
    console.error('Categorization error:', err);
    return 'Not Categorized';
  }
}

function connectToAccount(config) {
  const imap = new Imap(config);

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function () {
    openInbox(async function (err, box) {
      if (err) throw err;

      const since = moment().subtract(30, 'days').format('DD-MMM-YYYY');

      imap.search([['SINCE', since]], function (err, results) {
        if (err) throw err;

        if (!results || results.length === 0) {
          console.log(`[${config.user}] No emails found from last 30 days.`);
          imap.end();
          return;
        }

        const fetcher = imap.fetch(results, { bodies: '', markSeen: false });

        fetcher.on('message', function (msg, seqno) {
          msg.on('body', function (stream) {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Parse error:', err);
                return;
              }
              console.log(`📧 [${config.user}] Email from:`, parsed.from.text);
              console.log('Subject:', parsed.subject);

              // Categorize email using AI
              const category = await categorizeEmail(parsed.text || parsed.subject || '');

              const emailDoc = {
                from: parsed.from?.text || '',
                to: parsed.to?.text || '',
                subject: parsed.subject || '',
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || '',
                account: config.user,
                folder: 'INBOX',
                category
              };

              try {
                await esClient.index({
                  index: 'emails',
                  document: emailDoc
                });
                console.log(`✅ Indexed email [${category}] from [${config.user}] subject: "${emailDoc.subject}"`);
              } catch (e) {
                console.error('Elasticsearch indexing error:', e);
              }
            });
          });
        });

        fetcher.once('end', function () {
          console.log(`[${config.user}] Finished fetching emails.`);
          // Keep connection open for IDLE (real-time)
        });
      });

      // IDLE to listen for new mail in real-time
      imap.on('mail', function () {
        console.log(`[${config.user}] 📬 New mail arrived! Fetching latest...`);
      
        imap.search(['ALL'], function (err, results) {
          if (err) {
            console.error(`[${config.user}] Search error:`, err);
            return;
          }
      
          const latest = results[results.length - 1]; // get the last UID
      
          const fetcher = imap.fetch(latest, { bodies: '', markSeen: false });
      
          fetcher.on('message', function (msg) {
            msg.on('body', function (stream) {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error(`[${config.user}] Parser error:`, err);
                  return;
                }
      
                console.log(`📥 [${config.user}] Real-time email from:`, parsed.from.text);
                console.log('Subject:', parsed.subject);

                // Categorize real-time email
                const category = await categorizeEmail(parsed.text || parsed.subject || '');

                const emailDoc = {
                  from: parsed.from?.text || '',
                  to: parsed.to?.text || '',
                  subject: parsed.subject || '',
                  date: parsed.date || new Date(),
                  text: parsed.text || '',
                  html: parsed.html || '',
                  account: config.user,
                  folder: 'INBOX',
                  category
                };
      
                try {
                  await esClient.index({
                    index: 'emails',
                    document: emailDoc
                  });
                  console.log(`📌 Indexed real-time email [${category}] from: "${emailDoc.subject}"`);
                } catch (e) {
                  console.error('Elasticsearch indexing error:', e);
                }
              });
            });
          });
      
          fetcher.once('end', function () {
            console.log(`[${config.user}] ✅ Finished indexing new mail.`);
          });
        });
      });
      
    });
  });

  imap.once('error', function (err) {
    console.log(`[${config.user}] ❌ IMAP Error:`, err);
  });

  imap.once('end', function () {
    console.log(`[${config.user}] Connection ended`);
  });

  imap.connect();
}

// Start connection to all accounts
accounts.forEach(config => connectToAccount(config));
