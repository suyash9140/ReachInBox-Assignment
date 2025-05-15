import React, { useEffect, useState } from 'react';
import { useNotifications } from './useNotifications';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  const [accountFilter, setAccountFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const { sendSlackNotification, sendWebhookNotification } = useNotifications();

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      let url = 'http://localhost:5000/api/emails';
      const params = [];

      if (accountFilter) params.push(`account=${encodeURIComponent(accountFilter)}`);
      if (folderFilter) params.push(`folder=${encodeURIComponent(folderFilter)}`);
      if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (sortOrder) params.push(`sort=${encodeURIComponent(sortOrder)}`);

      if (params.length) url += `?${params.join('&')}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        setEmails(data);

        // Notify when new Interested emails arrive
        const interestedEmails = data.filter(email => email.category === 'Interested');
        if (interestedEmails.length > 0) {
          const message = `You have ${interestedEmails.length} new Interested emails!`;
          sendSlackNotification(message);
          sendWebhookNotification({ count: interestedEmails.length, emails: interestedEmails });
        }

      } catch (err) {
        console.error('Error fetching emails:', err);
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [accountFilter, folderFilter, categoryFilter, searchTerm, sortOrder, sendSlackNotification, sendWebhookNotification]);


  // Replace these with your actual accounts/folders/categories
  const accounts = [
    'suyashsingh9140@gmail.com',
    'suyashsingh6141@gmail.com'
  ];
  const folders = ['INBOX', 'Spam', 'Outbox', 'Sent'];
  const categories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office', 'Uncategorized'];

  const markInterested = async (emailId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/emails/${emailId}/mark-interested`, {
        method: 'POST',
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Email marked as Interested and notifications sent!');
        // Refresh the email list to reflect the new category
        // You can call the fetchEmails function here or re-trigger the useEffect
        setEmails((prevEmails) =>
          prevEmails.map((email) =>
            email.id === emailId ? { ...email, category: 'Interested' } : email
          )
        );
      } else {
        alert('Failed to mark as Interested: ' + data.error);
      }
    } catch (error) {
      alert('Error marking email Interested: ' + error.message);
    }
  };

  const handleSuggestReply = async (email) => {
    try {
      const res = await fetch('http://localhost:5000/api/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText: email.text })
      });
  
      const data = await res.json();
      alert("Suggested reply:\n" + data.suggestedReply);
    } catch (err) {
      alert("Failed to fetch suggested reply: " + err.message);
    }
  };
  
  
  

  return (
    <div>
      <h2>📥 Inbox</h2>
      

      <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <label>
          Account:
          <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="">All</option>
            {accounts.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
          </select>
        </label>

        <label>
          Folder:
          <select value={folderFilter} onChange={e => setFolderFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="">All</option>
            {folders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>
        </label>

        <label>
          Category:
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label style={{ flexGrow: 1, minWidth: 200 }}>
          Search:
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search subject, sender, text..."
            style={{ marginLeft: 4, width: '100%' }}
          />
        </label>

        <label>
          Sort by Date:
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ marginLeft: 4 }}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading emails...</p>
      ) : emails.length === 0 ? (
        <p>No emails found for selected filters.</p>
      ) : (
        <ul>
  {emails.map((email) => (
    <li key={email.id} style={{ marginBottom: 16 }}>
      <strong>From:</strong> {email.from} <br />
      <strong>Subject:</strong> {email.subject} <br />
      <strong>Date:</strong> {new Date(email.date).toLocaleString()} <br />
      <strong>Account:</strong> {email.account || 'N/A'} <br />
      <strong>Folder:</strong> {email.folder || 'N/A'} <br />
      <strong>Category:</strong> {email.category || 'Uncategorized'} <br />
      <button onClick={() => markInterested(email.id)}>Mark Interested</button>
      <button onClick={() => handleSuggestReply(email)}>💡 Suggest Reply</button>


      <hr />
    </li>
  ))}
</ul>

      )}
    </div>
  );
};

export default EmailList;
