

const use = require('@tensorflow-models/universal-sentence-encoder');
const tf = require('@tensorflow/tfjs');

// Dummy agenda knowledge base
const agendaSnippets = [
  "I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example",
  "Our product is an AI-powered CRM that helps with email automation and lead scoring.",
  "If the person wants a demo, share the demo calendar link: https://cal.com/demo-link"
];

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


let encoderModel = null;

async function loadEncoder() {
  if (!encoderModel) encoderModel = await use.load();
}

async function getRelevantContext(query) {
  await loadEncoder();

  // Embed the query + agenda snippets together
  const embeddings = await encoderModel.embed([query, ...agendaSnippets]);

  // embeddings shape: [1 + agendaSnippets.length, embeddingDim]
  // Slice query embedding: shape [1, embeddingDim]
  const queryEmbedding = tf.slice(embeddings, [0, 0], [1, embeddings.shape[1]]);

  // Slice agenda embeddings: shape [agendaSnippets.length, embeddingDim]
  const agendaEmbeddings = tf.slice(
    embeddings,
    [1, 0],
    [agendaSnippets.length, embeddings.shape[1]]
  );

  // Expand queryEmbedding to match agendaEmbeddings shape
  const queryExpanded = queryEmbedding.tile([agendaSnippets.length, 1]);

  // Compute cosine distances between each agenda embedding and the query
  // tf.losses.cosineDistance returns a 1D tensor of distances
  const distances = tf.losses.cosineDistance(agendaEmbeddings, queryExpanded, 1);

  // Get the index of the minimum distance (best match)
  const distancesData = await distances.data();
  let minIndex = 0;
  let minDistance = distancesData[0];
  for (let i = 1; i < distancesData.length; i++) {
    if (distancesData[i] < minDistance) {
      minDistance = distancesData[i];
      minIndex = i;
    }
  }

  // Cleanup tensors
  tf.dispose([embeddings, queryEmbedding, agendaEmbeddings, queryExpanded, distances]);

  // Return the text of the best matching agenda snippet
  return agendaSnippets[minIndex];
}


async function suggestReply(emailText) {
  const context = await getRelevantContext(emailText);
  const prompt = `Context: ${context}\nEmail: ${emailText}\n\nSuggest a professional and helpful reply:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",  // or your preferred model
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }  // use prompt here
    ],
  });

  // Return the generated reply text
  return completion.choices[0].message.content.trim();
}
module.exports = { suggestReply };
