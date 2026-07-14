require('dotenv').config()

const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')

const reportPath = path.join(
  __dirname,
  'cypress',
  'reports',
  'final',
  'mochawesome.html'
)

const markdownReportPath = path.join(
  __dirname,
  'cypress',
  'reports',
  'final',
  'execution-summary.md'
)

async function sendReportMail() {
  try {
    if (!fs.existsSync(reportPath)) {
      throw new Error(`HTML report file not found at: ${reportPath}`)
    }

    if (!fs.existsSync(markdownReportPath)) {
      throw new Error(`Markdown report file not found at: ${markdownReportPath}`)
    }

    if (!process.env.REPORT_EMAIL_USER) {
      throw new Error('REPORT_EMAIL_USER is missing in .env')
    }

    if (!process.env.REPORT_EMAIL_PASS) {
      throw new Error('REPORT_EMAIL_PASS is missing in .env')
    }

    if (!process.env.REPORT_EMAIL_TO) {
      throw new Error('REPORT_EMAIL_TO is missing in .env')
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.REPORT_EMAIL_USER,
        pass: process.env.REPORT_EMAIL_PASS
      }
    })

    const mailOptions = {
      from: `"Cypress Automation Report" <${process.env.REPORT_EMAIL_USER}>`,
      to: process.env.REPORT_EMAIL_TO,
      subject: 'Cypress Automation Test Report - Actyvate Outbound Campaign',
      html: `
        <p>Hi Team,</p>

        <p>The Cypress automation test execution has been completed.</p>

        <p><b>Project:</b> Actyvate AI</p>
        <p><b>Module:</b> Outbound Campaign Automation</p>
        <p><b>Test Case:</b> End-to-End Flow</p>

        <p>Please find the attached reports:</p>
        <ul>
          <li>Mochawesome HTML Report</li>
          <li>Markdown Execution Summary</li>
        </ul>

        <p>Thanks,<br>Cypress Automation</p>
      `,
      attachments: [
        {
          filename: 'mochawesome.html',
          path: reportPath
        },
        {
          filename: 'execution-summary.md',
          path: markdownReportPath
        }
      ]
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Report email sent successfully.')
    console.log('Message ID:', info.messageId)
  } catch (error) {
    console.error('Failed to send report email.')
    console.error(error.message)
    process.exit(1)
  }
}

sendReportMail()