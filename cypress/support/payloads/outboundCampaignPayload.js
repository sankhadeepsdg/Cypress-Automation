import { CAMPAIGN_SUBJECT } from '../config/constants.js'

export function buildOutboundCampaignPayload({
  startTime,
  campaignName,
  uniqueLastName,
}) {
  return {
    clientId: 13,
    botId: 176,
    campaignName,
    campaignChannel: ['email'],
    leadUploadSource: 'manual',
    messageStratergy: 'manual',
    emailSubject: CAMPAIGN_SUBJECT,
    emailBody: 'Hi {{first_name}}, welcome!',
    messageBody: 'Hello {{first_name}}!',
    messageContext:
      'We met all these leads at the RC Trade Show. They visited our booth and showed interest in our accounting and bookkeeping services. The goal is to get them to book a 15-minute intro call. \nRegards\nAutomation.',
    assignUserList: [154],
    startTime,
    whatsappTemplateId: null,
    timezone: 'India Standard Time',
    leadList: [
      {
        firstName: 'Mario',
        lastName: uniqueLastName,
        emailId: 'testgwbspprt@gmail.com',
        phoneNo: '+918337047513',
        oldLeadId: null,
        message: 'This is a test lead for outbound campaign',
        notes: 'Car Insurance Lead'
      }
    ]
  }
}