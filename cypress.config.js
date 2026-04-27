require('dotenv').config()
const { defineConfig } = require("cypress");
const { getEmailWithRetry, replyToEmail } = require('./gmailTest/gmail');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      config.env.token = process.env.TOKEN

      on('task', {

        async replyCampaignEmail({ subject }) {
          console.log('Fetching email from Gmail...')
          console.log('Searching email subject:', subject)

          const email = await getEmailWithRetry(subject)

          console.log('Email found. Sending reply...')
          await replyToEmail(email, subject)

          console.log('Reply sent successfully.')

          return 'Reply sent successfully'
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
  }
});
