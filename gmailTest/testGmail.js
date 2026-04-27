const { getEmailWithRetry, replyToEmail } = require('./gmail')

//Update this based on your campaign
const campaign_subject = 'Welcome to our outbound campaign'

async function testGmailFlow() {
  try {
    console.log('Starting Gmail Automation...')

    // Step 1: Get email
    const email = await getEmailWithRetry(campaign_subject)

    console.log('Email found!')
    console.log('Snippet:', email.snippet)

    // Step 2: Reply
    console.log('Sending reply...')
    await replyToEmail(email, campaign_subject)

    console.log('Reply sent successfully!')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Run the script
testGmailFlow()