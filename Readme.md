# ReachInbox Backend

ReachInbox is an AI-powered email synchronization and smart reply suggestion system. This backend service fetches emails using IMAP, indexes them in Elasticsearch, and provides AI-generated suggested replies using OpenAI’s GPT models combined with TensorFlow.js for context matching.

---

## Features

- **Email Synchronization**: Connects to email accounts using IMAP, fetches emails, and indexes them for fast search.
- **Contextual Reply Suggestions**: Uses Universal Sentence Encoder embeddings to find relevant context snippets, then generates professional reply suggestions using OpenAI’s GPT-4o-mini model.
- **Flexible Architecture**: Modular code structure to easily extend with new features like folder/account filtering and categorization.

---

## Architecture

Client (Frontend UI)
|
v
ReachInbox Backend (Node.js + Express)
|
v
IMAP Email Fetching -> Elasticsearch Indexing -> SuggestReply Service
| |
| v
| TensorFlow.js for Embedding
| |
| v
| OpenAI GPT for Reply Generation

- **IMAP**: Used for real-time email syncing.
- **Elasticsearch**: For indexing and searching emails.
- **TensorFlow.js**: Loads Universal Sentence Encoder model for embedding email text and context.
- **OpenAI SDK**: Calls GPT models for generating smart replies.

---

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- An OpenAI API key
- Email account credentials with IMAP enabled
- Elasticsearch instance running locally or remotely

### Installation

1. Clone the repository:

```bash
git clone  https://github.com/suyash9140/ReachInBox-Assignment.git
cd reachinbox-backend

Install dependencies:

bash
Copy
Edit
npm install
Create a .env file in the root directory with the following variables:

ini
Copy
Edit
OPENAI_API_KEY=your_openai_api_key_here
EMAIL_USERNAME1=your_email@example.com1
EMAIL_PASSWORD1=your_email_password1
EMAIL_USERNAME2=your_email@example.com2
EMAIL_PASSWORD2=your_email_password2
IMAP_HOST=imap.yourmailprovider.com
IMAP_PORT=993
ELASTICSEARCH_URL=http://localhost:9200
Start the server:

bash
Copy
Edit
node server/index.js
The server will run on http://localhost:5000.

Usage
The backend listens for incoming email sync requests.

It fetches emails via IMAP, indexes them in Elasticsearch.

When prompted, it generates AI-powered suggested replies based on relevant context from predefined agenda snippets.

Project Structure
bash
Copy
Edit
reachinbox-backend/
│
├── server/                # Backend server files
│   ├── index.js           # Entry point
│   ├── utils/             # Helper functions (suggestReply.js, etc.)
│   ├── models/            # Mongoose or data models (if any)
│   └── routes/            # API routes (if any)
│
├── .env                   # Environment variables (gitignored)
├── .gitignore             # Git ignore rules
├── package.json           # npm dependencies
└── README.md              # This file

