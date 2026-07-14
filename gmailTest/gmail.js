const { google } = require('googleapis')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const auth = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000'
)

auth.setCredentials({
  refresh_token: REFRESH_TOKEN
})

const gmail = google.gmail({
  version: 'v1',
  auth
})

async function getCampaignEmail(subject) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `subject:"${subject}"`,
    maxResults: 5
  })

  const messages = res.data.messages

  if (!messages || messages.length === 0) {
    throw new Error(`No campaign email found for subject: ${subject}`)
  }

  console.log(`Found ${messages.length} matching email(s)`)

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id
  })

  return message.data
}

async function getEmailWithRetry(
  subject,
  retries = 12,
  interval = 5000
) {
  let lastError

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Attempt ${attempt}/${retries}: Searching for campaign email...`
      )

      return await getCampaignEmail(subject)
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        console.log(
          `Email not found. Retrying in ${interval / 1000} seconds...`
        )

        await new Promise(resolve =>
          setTimeout(resolve, interval)
        )
      }
    }
  }

  throw new Error(
    `Email not found after ${retries} attempts. ${lastError?.message || ''}`
  )
}

async function replyToEmail(message, subject) {
  const headers = message.payload?.headers || []

  const fromHeader = headers.find(
    header => header.name.toLowerCase() === 'from'
  )

  if (!fromHeader?.value) {
    throw new Error('Sender email was not found in the message headers')
  }

  const rawMessage = [
    `To: ${fromHeader.value}`,
    `Subject: Re: ${subject}`,
    '',
    'Yes, I am interested. Please share more details.'
  ].join('\r\n')

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId: message.threadId
    }
  })

  return response.data
}

module.exports = {
  getCampaignEmail,
  getEmailWithRetry,
  replyToEmail
}