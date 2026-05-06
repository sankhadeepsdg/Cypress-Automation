require('dotenv').config()
const { defineConfig } = require("cypress");
const { getEmailWithRetry, replyToEmail } = require('./gmailTest/gmail');
const { waitForAIReply } = require('./gmailTest/aiReply')

module.exports = defineConfig({
  e2e: {
    taskTimeout: 180000, // 3 minutes
    setupNodeEvents(on, config) {
      config.env.token = process.env.TOKEN

      on('task', {

        async replyAndCheckAI({ subject }) {
          try {
            console.log('Fetching email from Gmail...')
            console.log('Searching email subject:', subject)

            // Step 1: Get campaign email
            const email = await getEmailWithRetry(subject)
            console.log('Email found. Sending reply...')

            // Step 2: Reply
            await replyToEmail(email, subject)
            console.log('Reply sent successfully.')

            // Step 3: Get threadId
            const threadId = email.threadId
            console.log('Waiting for AI reply...')

            // Step 4: Wait + fetch AI reply
            const aiReply = await waitForAIReply(threadId)
            console.log('AI Reply received:')
            console.log(aiReply)

            // Step 5: Return AI reply to Cypress
            return aiReply

          } catch (error) {
            console.error('Error in Gmail task:', error)
            throw error
          }
        }

      })
      return config
    },
    specPattern: "cypress/e2e/**/*.cy.js", // Supports subfolders & .js files
    viewportHeight: 1080,
    viewportWidth: 1920,
    baseUrl: "https://dev.actyvate.ai",  // Updated base URL
    screenshotOnRunFailure: true,
    retries: { runMode: 2, openMode: 0 },
  },
  env: {
    apiUrl: 'https://devapi.actyvate.ai/v1'
  }
});
