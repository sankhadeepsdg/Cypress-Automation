const { google } = require('googleapis')

// Replace these with your actual values
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

// Update this subject based on your campaign
const campaign_subject = 'Welcome to our outbound campaign'

// Setup OAuth
const auth = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000'
)

auth.setCredentials({
  refresh_token: REFRESH_TOKEN
})

const gmail = google.gmail({ version: 'v1', auth })

// Function: Get campaign email by subject
async function getCampaignEmail(subject) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `subject:"${subject}"`,
    maxResults: 5
  })

  const messages = res.data.messages

  if (!messages || messages.length === 0) {
    throw new Error('No campaign emails found')
  }

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id
  })

  return message.data
}

// Function: Reply to email in same thread
async function replyToEmail(message) {
  const threadId = message.threadId

  const rawMessage = [
    'To: testgwbspprt@gmail.com', // your test email
    'Subject: Re: ${campaign_subject}',
    '',
    'Yes, I am interested. Please share more details.'
  ].join('\n')

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId: threadId
    }
  })
}

// Retry Logic (important for email delay)
async function getEmailWithRetry(subject, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Searching email...`)

      const email = await getCampaignEmail(subject)
      return email

    } catch (err) {
      console.log('Email not found, retrying in 5 seconds...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  throw new Error('Email not found after multiple retries')
}

// Main Execution
async function main() {
  try {
    console.log('Starting Gmail Automation...')

    // Step 1: Get email (with retry)
    const email = await getEmailWithRetry(campaign_subject)

    console.log('Email found!')
    console.log('Snippet:', email.snippet)

    // Step 2: Reply
    console.log('Sending reply...')
    await replyToEmail(email)

    console.log('Reply sent successfully!')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Run script
main()