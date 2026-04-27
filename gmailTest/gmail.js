const { google } = require('googleapis')

// Replace these with your actual values
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

//Setup OAuth
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

  console.log(`Found ${messages.length} matching emails`)

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id
  })

  return message.data
}

// Function: Reply to email in same thread
async function replyToEmail(message, subject) {
  const threadId = message.threadId

  // Extract sender email (so reply goes correctly)
  const headers = message.payload.headers
  const fromHeader = headers.find(h => h.name === 'From')
  const recipient = fromHeader.value

  const rawMessage = [
    `To: ${recipient}`,
    `Subject: Re: ${subject}`,
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

// Function: Retry logic for email search
async function getEmailWithRetry(subject, retries = 10) {
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

//Export functions
module.exports = {
  getEmailWithRetry,
  replyToEmail
}