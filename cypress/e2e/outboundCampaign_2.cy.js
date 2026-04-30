import { getStartTime } from '../support/utils/timeUtils.js'
import { createCampaign, checkCampaignStatus } from '../support/utils/campaignUtils.js'
import { verifyLeadCreated } from '../support/utils/leadUtils.js'
import { getLeadTimeline } from '../support/utils/timelineUtils.js'

describe('Actyvate Outbound Campaign Automation', () => {

    it('End-to-End Flow', () => {

        const startTime = getStartTime(2) // Get start time 2 minutes from now
        const uniqueLastName = `User_${Date.now()}`
        const campaignName = `Summer Outbound Campaign ${Date.now()}`
        const campaign_subject = 'Welcome to our outbound campaign'
        const token = Cypress.env('token')

        //Payload for campaign creation
        const payload = {
            clientId: 13,
            botId: 176,
            campaignName: campaignName,
            campaignChannel: ["email"],
            leadUploadSource: "manual",
            messageStratergy: "manual",
            emailSubject: campaign_subject,
            emailBody: "Hi {{first_name}}, welcome!",
            messageBody: "Hello {{first_name}}!",
            messageContext: "We met all these leads at the RC Trade Show. They visited our booth and showed interest in our accounting and bookkeeping services. The goal is to get them to book a 15-minute intro call. \nRegards\nAutomation.",
            assignUserList: [154],
            startTime: startTime,
            whatsappTemplateId: null,
            timezone: "India Standard Time",
            leadList: [
                {
                    firstName: "Mario",
                    lastName: uniqueLastName,
                    emailId: "testgwbspprt@gmail.com",
                    phoneNo: "+918337047513",
                    oldLeadId: "null",
                    message: "This is a test lead for outbound campaign",
                    notes: "Car Insurance Lead"
                }
            ]
        }
        // Step 1: Create Campaign
        createCampaign(payload)
            .then((response) => {

                cy.log('Full Response:')
                cy.log(JSON.stringify(response.body))

                if (response.body.meta.status !== true) {
                    throw new Error(`API Failed: ${response.body.meta.message}`)
                }

                expect(response.body.meta.status).to.eq(true)
            })

            //Step 2: Wait until campaign completes
            .then(() => checkCampaignStatus(campaignName))

            // Step 3: Verify Lead + get leadId
            .then(() => verifyLeadCreated(uniqueLastName))

            // Step 4: Reply Email + AI response
            .then((leadId) => {

                // Implementation for replying to email and getting AI response
                cy.wrap(leadId).as('leadId') // Store leadId for later use

                // wait for email to be delivered
                cy.wait(20000)

                return cy.task('replyAndCheckAI', {
                    subject: campaign_subject,
                })
            })
            //Step 5: Validate AI reply
            .then((reply) => {
                cy.log('AI Response:')
                cy.log(reply)

                expect(reply).to.include('Hi Mario')

                return cy.get('@leadId')
            })
            // Step 6: Call Timeline API
            .then((leadId) => {
                return getLeadTimeline(leadId)
            })
            // Step 7: DEBUG Timeline (temporary)
            .then((timeline) => {
                const timelineList = timeline.timelineList
                expect(timelineList.length).to.be.greaterThan(0)
                timelineList.forEach(item => {
                    cy.log(`Type: ${item.type}`)
                    cy.log(`Lead Log: ${item.leadLog}`)
                })
                const types = timelineList.map(t => t.type)

                expect(types).to.include('leadReceivedBySystem')
                expect(types).to.include('automaticAllocation')
                expect(types).to.include('leadStartedEngaging')

            })

    })

})
