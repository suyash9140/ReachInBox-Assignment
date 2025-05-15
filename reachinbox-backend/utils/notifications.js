const axios = require('axios');

const sendSlackNotification = async (email) => {
  try {
    await axios.post('https://hooks.slack.com/services/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', {
      text: `📬 *New Interested Email*\n*From:* ${email.from}\n*Subject:* ${email.subject}\n*Account:* ${email.account}\n*Date:* ${email.date}`
    });
    console.log('✅ Slack notification sent.');
  } catch (error) {
    console.error('❌ Slack error:', error.message);
  }
};

const triggerWebhook = async (email) => {
  try {
    await axios.post('https://webhook.site/9c28f11b-1072-4ecb-a83b-00026adb7427', {
      from: email.from,
      subject: email.subject,
      category: email.category,
      account: email.account,
      date: email.date
    });
    console.log('✅ Webhook triggered.');
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
  }
};

module.exports = {
  sendSlackNotification,
  triggerWebhook
};
