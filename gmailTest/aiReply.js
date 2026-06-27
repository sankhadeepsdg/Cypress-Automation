const { google } = require('googleapis')

// Replace these with your actual values
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

const gmail = google.gmail({ version: 'v1', auth })

//Get latest message from thread
async function getLatestReplyFromThread(threadId) {
  const res = await gmail.users.threads.get({
    userId: 'me',
    id: threadId
  })

  const messages = res.data.messages
  return messages[messages.length - 1]
}

//Extract readable body
function extractEmailBody(message) {
  const parts = message.payload.parts

  if (!parts) {
    return Buffer.from(message.payload.body.data || '', 'base64').toString('utf-8')
  }

  const part = parts.find(p => p.mimeType === 'text/plain')

  if (part && part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf-8')
  }

  return 'No readable content'
}

//Wait for AI reply
async function waitForAIReply(threadId, retries = 10) {

  for (let i = 0; i < retries; i++) {
    console.log(`Checking AI reply (Attempt ${i + 1})...`)

    const message = await getLatestReplyFromThread(threadId)
    const body = extractEmailBody(message)

    //Customize this condition if needed
    if (body && body.includes('Hi')) {
      return body
    }

    console.log('AI reply not found, retrying...')
    await new Promise(r => setTimeout(r, 20000))
  }

  throw new Error('AI reply not received')
}

module.exports = {
  waitForAIReply
}