require('dotenv').config()

const {
  getEmailWithRetry,
  replyToEmail
} = require('./gmail')

const campaignSubject = 'Welcome to our outbound campaign'

async function main() {
  try {
    console.log('Starting Gmail automation...')

    const email = await getEmailWithRetry(campaignSubject)

    console.log('Email found')
    console.log('Snippet:', email.snippet)

    console.log('Sending reply...')

    await replyToEmail(email, campaignSubject)

    console.log('Reply sent successfully')
  } catch (error) {
    console.error('Gmail automation failed:', error.message)
    process.exitCode = 1
  }
}
//Run the main function
main()