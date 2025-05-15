function categorizeEmail(subject, body) {
  const content = (subject + ' ' + body).toLowerCase();

  if (content.includes('book a meeting') || content.includes('schedule') || content.includes('calendar')) {
    return 'Meeting Booked';
  }
  if (content.includes('interested') || content.includes('let\'s talk') || content.includes('sounds good')) {
    return 'Interested';
  }
  if (content.includes('not interested') || content.includes('no thanks')) {
    return 'Not Interested';
  }
  if (content.includes('out of office') || content.includes('ooo') || content.includes('vacation')) {
    return 'Out of Office';
  }
  if (content.includes('unsubscribe') || content.includes('you won') || content.includes('click here')) {
    return 'Spam';
  }

  return 'Uncategorized';
}

module.exports = categorizeEmail;
