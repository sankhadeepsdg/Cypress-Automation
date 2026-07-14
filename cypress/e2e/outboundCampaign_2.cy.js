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
import { CAMPAIGN_SUBJECT, NOTE_CONTENT } from '../support/config/constants.js';
import { buildOutboundCampaignPayload } from '../support/payloads/outboundCampaignPayload.js'

describe('Actyvate Outbound Campaign Automation', () => {

    it('End-to-End Flow', () => {

        let leadId
        let clientId
        let currentLeadStatus
        let currentLeadTags = []

        // Store the Phase 2 updated values for Phase 3 validation
        let updatedRepresentativeId
        let updatedLeadStatus
        let updatedLeadTag
        let deletedNoteId

        const startTime = getStartTime(2) // Get start time 2 minutes from now
        const uniqueLastName = `User_${Date.now()}`
        const campaignName = `Summer Outbound Campaign ${Date.now()}`
        const campaignSubject = CAMPAIGN_SUBJECT
        const noteContent = NOTE_CONTENT.FIRST_UPDATE

        //Payload for campaign creation
        const payload = buildOutboundCampaignPayload({
            startTime,
            campaignName,
            uniqueLastName,
        })

        // =========================
        // Phase 1
        // Campaign and AI Validation
        // =========================

        // Step 1: Create Campaign
        createCampaign(payload)

            .then((response) => {
                cy.log(`Campaign Response: ${JSON.stringify(response.body)}`)

                expect(response.body).to.have.property('meta')

                expect(
                    response.body.meta.status,
                    response.body.meta.message || 'Campaign creation failed'
                ).to.eq(true)
            })

            //Step 2: Wait until campaign completes
            .then(() => checkCampaignStatus(campaignName))

            // Step 3: Verify lead creation and capture leadId
            .then(() => verifyLeadCreated(uniqueLastName))

            // Step 4: Reply to campaign email and wait for AI response
            .then((createdLeadId) => {
                leadId = createdLeadId

                expect(leadId).to.exist
                // Store leadId for later use
                cy.log(`Created Lead ID: ${leadId}`)

                // wait for email to be delivered
                cy.wait(20000)

                return cy.task('replyAndCheckAI', {
                    subject: campaignSubject,
                })
            })
            //Step 5: Validate AI reply
            .then((reply) => {
                cy.log(`AI Response: ${reply}`)

                expect(reply).to.be.a('string')
                expect(reply).to.include('Hi Mario')

                return getLeadTimeline(leadId)
            })
            // Step 6: Validate initial timeline
            .then((timeline) => {
                expect(timeline).to.have.property('timelineList')
                expect(timeline.timelineList).to.be.an('array')
                expect(timeline.timelineList.length).to.be.greaterThan(0)

                timeline.timelineList.forEach(item => {
                    cy.log(`Type: ${item.type}`)
                    cy.log(`Lead Log: ${JSON.stringify(item.leadLog)}`)
                })

                const timelineTypes = timeline.timelineList.map(item => item.type)
                expect(timelineTypes).to.include('leadReceivedBySystem')
                expect(timelineTypes).to.include('automaticAllocation')
                expect(timelineTypes).to.include('leadStartedEngaging')

                cy.log('Phase 1 completed successfully')

                return getLeadDetails(leadId)
            })

            // =========================
            // Phase 2
            // Lead Update Operations
            // =========================

            // Step 7: Capture current lead details
            .then((lead) => {
                expect(lead.leadId).to.eq(leadId)
                expect(lead).to.have.property('clientId')
                expect(lead).to.have.property('assignedUserId')
                expect(lead).to.have.property('leadStatus')
                expect(lead).to.have.property('leadTags')
                expect(lead).to.have.property('timelineList')

                clientId = lead.clientId;
                currentLeadStatus = lead.leadStatus

                currentLeadTags = Array.isArray(lead.leadTags) ? lead.leadTags : []
                const currentRepresentativeId = lead.assignedUserId

                cy.log(`Current Representative ID: ${currentRepresentativeId}`)
                cy.log(`Current Lead Status: ${currentLeadStatus}`)
                cy.log(`Current Lead Tags: ${currentLeadTags.join(', ')}`)

                // Step 8: Get Random Representative
                return getRandomRepresentative(clientId, currentRepresentativeId);
            })
            // Step 9: Reallocate representative
            .then((newUserId) => {
                // Optional validation
                expect(newUserId).to.exist

                // Store the selected representative for Phase 3
                updatedRepresentativeId = newUserId;
                cy.log(`New Representative: ${updatedRepresentativeId}`)

                // Assign new representative (dynamic)
                return reallocateLead(leadId, updatedRepresentativeId)
            })
            // Step 10: Update lead status
            .then(() => {
                updatedLeadStatus = getRandomLeadStatus(currentLeadStatus)
                expect(updatedLeadStatus).to.not.eq(currentLeadStatus)
                cy.log(`Selected Lead Status: ${updatedLeadStatus}`)
                return updateLeadStatus(leadId, updatedLeadStatus)
            })
            // Step 11: Fetch client tags
            .then(() => {
                return getTagsUnderClient(clientId)
            })
            // Step 12: Select and update a different tag
            .then((tagsData) => {
                expect(tagsData).to.have.property('leadTags')
                expect(tagsData.leadTags).to.be.an('array')
                expect(tagsData.leadTags.length).to.be.greaterThan(0)

                cy.log(`Available Tags: ${JSON.stringify(tagsData.leadTags)}`)

                const availableNewTags = tagsData.leadTags.filter(
                    tag => !currentLeadTags.includes(tag)
                )
                expect(availableNewTags.length, 'At least one tag different from the current tags should exist').to.be.greaterThan(0)
                updatedLeadTag = availableNewTags[0]
                cy.log(`Selected Lead Tag: ${updatedLeadTag}`)
                return updateLeadTags(leadId, [updatedLeadTag])
            })
            // Step 13: Add note
            .then(() => {
                cy.log('Lead tags updated successfully');
                return addLeadNotes(leadId, noteContent)
            })
            // Step 14: Retrieve notes
            .then(() => {
                cy.log('Lead notes added successfully');
                return getLeadNotes(leadId);
            })
            // Step 15: Validate latest note and delete it
            .then((notesData) => {
                cy.log(`Lead Notes: ${JSON.stringify(notesData.notesList)}`)

                const notesList = notesData.notesList
                expect(notesList).to.be.an('array')
                expect(notesList.length).to.be.greaterThan(0)

                const latestNote = notesList[notesList.length - 1]
                expect(latestNote.notes).to.eq(noteContent)
                deletedNoteId = latestNote.notesId

                cy.log(`Deleting Note ID: ${deletedNoteId}`)
                return deleteLeadNotes(deletedNoteId)
            })
            // Step 16: Retrieve notes after deletion
            .then(() => {
                cy.log('Lead notes deleted successfully')
                return getLeadNotes(leadId)

                // Step 17: Confirm deleted note no longer exists
            }).then((notesData) => {
                expect(notesData.notesList).to.be.an('array')
                const deletedNoteStillExists = notesData.notesList.some(note => note.notesId === deletedNoteId)

                expect(deletedNoteStillExists).to.be.false;

                // Values now available for Phase 3 validation
                cy.log(`Expected Representative ID: ${updatedRepresentativeId}`)
                cy.log(`Expected Lead Status: ${updatedLeadStatus}`)
                cy.log(`Expected Lead Tag: ${updatedLeadTag}`)
                cy.log(`Deleted Note ID: ${deletedNoteId}`)
                cy.log('Phase 2 completed successfully')

                return getLeadDetails(leadId);
            })

            // =========================
            // Phase 3
            // Final Persisted Data Validation
            // =========================

            // Step 18: Validate final lead details
            .then((updatedLead) => {
                expect(updatedLead).to.have.property('assignedUserId')
                expect(updatedLead).to.have.property('leadStatus')
                expect(updatedLead).to.have.property('leadTags')
                expect(updatedLead).to.have.property('timelineList')

                // Phase 3 - Step 2: Validate updated representative
                expect(updatedLead.assignedUserId).to.eq(updatedRepresentativeId);

                cy.log(`Validated Representative ID: ${updatedLead.assignedUserId}`)

                // Phase 3 - Step 3: Validate updated lead status
                expect(updatedLead.leadStatus).to.eq(updatedLeadStatus);

                cy.log(`Validated Lead Status: ${updatedLead.leadStatus}`)

                // Phase 3 - Step 4: Validate updated lead tags
                expect(updatedLead.leadTags).to.be.an('array')
                expect(updatedLead.leadTags).to.include(updatedLeadTag);

                cy.log(`Lead tag verified: ${updatedLeadTag}`)

                //Phase 3 - Step 5: Validate lead timeline
                expect(updatedLead.timelineList).to.be.an('array')
                expect(updatedLead.timelineList.length).to.be.greaterThan(0)

                const timelineTypes = updatedLead.timelineList.map(item => item.type);

                expect(timelineTypes).to.include('leadReceivedBySystem')
                expect(timelineTypes).to.include('automaticAllocation')
                expect(timelineTypes).to.include('leadStartedEngaging')



                cy.log(`Timeline Events: ${timelineTypes.join(', ')}`)
                cy.log('Phase 3 completed successfully')
                cy.log('End-to-End automation completed successfully')

            });

    });

});
