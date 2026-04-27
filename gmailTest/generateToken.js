const { google } = require('googleapis')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3000'

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
)

//Paste your code here
const code = process.env.CODE

async function getToken() {
  try {
    const { tokens } = await oauth2Client.getToken(code)
    console.log('TOKENS:', tokens)
  } catch (err) {
    console.error('Error getting token:', err)
  }
}

getToken()

// const { google } = require('googleapis')
// const open = require('open').default

// const CLIENT_ID = process.env.CLIENT_ID
// const CLIENT_SECRET = process.env.CLIENT_SECRET
// const REDIRECT_URI = 'http://localhost:3000'

// const oauth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// )

// const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

// const url = oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   scope: SCOPES
// })

// console.log('Authorize this app by visiting this URL:', url)

// open(url)

// // After login, paste code here
// async function getToken(code=process.env.CODE) {
//   const { tokens } = await oauth2Client.getToken(code)
//   console.log(tokens)
// }
// // 👉 Paste your code manually here after login