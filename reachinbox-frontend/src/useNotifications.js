import { useCallback } from 'react';

export function useNotifications() {
  // Slack webhook URL and external webhook URL from env variables
  const slackWebhookUrl = process.env.REACT_APP_SLACK_WEBHOOK_URL;
  const externalWebhookUrl = process.env.REACT_APP_EXTERNAL_WEBHOOK_URL;

  const sendSlackNotification = useCallback(async (message) => {
    if (!slackWebhookUrl) {
      console.warn('Slack webhook URL is not defined');
      return;
    }
    try {
      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      console.error('Error sending Slack notification:', err);
    }
  }, [slackWebhookUrl]);

  const sendWebhookNotification = useCallback(async (payload) => {
    if (!externalWebhookUrl) {
      console.warn('External webhook URL is not defined');
      return;
    }
    try {
      await fetch(externalWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Error sending webhook notification:', err);
    }
  }, [externalWebhookUrl]);

  return { sendSlackNotification, sendWebhookNotification };
}
