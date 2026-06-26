import { getStartTime } from '../support/utils/timeUtils.js'
import { createCampaign, checkCampaignStatus } from '../support/utils/campaignUtils.js'
import { verifyLeadCreated } from '../support/utils/leadUtils.js'
import { getLeadTimeline } from '../support/utils/timelineUtils.js'
import { getLeadDetails } from '../support/utils/leadDetailsUtils.js';
import { getRandomRepresentative } from '../support/utils/userUtils.js';
import { getRandomLeadStatus, updateLeadStatus } from '../support/utils/leadStatusUpdateUtils.js';
import { reallocateLead } from '../support/utils/assignRepresentative.js';
import { getTagsUnderClient, updateLeadTags } from '../support/utils/tagUtils.js';
import { addLeadNotes, getLeadNotes, deleteLeadNotes } from '../support/utils/noteUtils.js';
import { LEAD_STATUS } from '../support/config/constants.js';

describe('Actyvate Outbound Campaign Automation', () => {

    it('End-to-End Flow', () => {

        let leadId
        let clientId
        let currentLeadStatus

        const startTime = getStartTime(2) // Get start time 2 minutes from now
        const uniqueLastName = `User_${Date.now()}`
        const campaignName = `Summer Outbound Campaign ${Date.now()}`
        const campaign_subject = 'Welcome to our outbound campaign'
        const noteContent = 'The lead has been modified manually.';

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
                    oldLeadId: null,
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
            .then((createdLeadId) => {
                leadId = createdLeadId

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
            .then((createdLeadId) => {
                return getLeadTimeline(createdLeadId)
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

                return cy.get('@leadId')
            })
            // Phase 2 - Step 1: Get Lead Details
            .then((createdLeadId) => {

                // Step 8: Get Lead Details
                return getLeadDetails(createdLeadId)
            })
            .then((lead) => {

                //Basic validation
                expect(lead).to.have.property('leadId')
                expect(lead).to.have.property('clientId')
                expect(lead).to.have.property('assignedUserId')

                cy.log(`Lead ID: ${lead.leadId}`)
                cy.log(`Current Rep: ${lead.assignedUserId}`)

                clientId = lead.clientId;
                currentLeadStatus = lead.leadStatus

                const currentUserId = lead.assignedUserId

                // Step 9: Get Random Representative
                return getRandomRepresentative(clientId, currentUserId);

            })
            .then((newUserId) => {
                cy.log(`New Representative: ${newUserId}`);
                
                // Optional validation
                expect(newUserId).to.not.be.null

                // Assign new representative (dynamic)
                return reallocateLead(leadId, newUserId)
            })
            .then(() => {
                cy.log('Representative reassigned'); // Assign representative API call here
                
                // Step 10: Update Lead Status
                const randomStatus = getRandomLeadStatus(currentLeadStatus)

                return updateLeadStatus(leadId, randomStatus)
            })
            .then(() => {
                cy.log('Lead status updated successfully');
                
                // Step 11: Get Tags under Client
                return getTagsUnderClient(clientId)
            })
            .then((tags) => {

                cy.log(`Available Tags: ${JSON.stringify(tags)}`);

                // Example: pick first tag
                const selectedTag = tags.leadTags[0]
                cy.log(`Selected Tag: ${selectedTag}`);

                // Step 12: Update Lead Tags
                return updateLeadTags(leadId, [selectedTag])
            })
            .then(() => {

                cy.log('Lead tags updated successfully');

                // Step 13: Add Lead Notes
                return addLeadNotes(leadId, noteContent)
            })
            .then(() => {
                cy.log('Lead notes added successfully');
                
                // Step 14: Get Lead Notes
                return getLeadNotes(leadId)
            })
            .then((notesData) => {
                const notesList = notesData.notesList
                const latestNote = notesList[notesList.length - 1] // Get the last note added

                expect(latestNote.notes).to.eq(noteContent)
                
                // Step 15: Delete Lead Notes
                return deleteLeadNotes(latestNote.notesId)
            })
            .then(() => {
                cy.log('Lead notes deleted successfully')

                //Step 16: Phase 2 completed successfully 
                cy.log('Phase 2 completed successfully')
            });

    });

});
