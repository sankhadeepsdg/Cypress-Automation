import { getStartTime } from '../support/utils/timeUtils.js'
import { createCampaign, checkCampaignStatus } from '../support/utils/campaignUtils.js'
import { verifyLeadCreated } from '../support/utils/leadUtils.js'
import { getLeadTimeline } from '../support/utils/timelineUtils.js'
import { getLeadDetails } from '../support/utils/leadDetailsUtils.js'
import { getRandomRepresentative } from '../support/utils/userUtils.js'
import { getRandomLeadStatus, updateLeadStatus } from '../support/utils/leadStatusUpdateUtils.js'
import { reallocateLead } from '../support/utils/assignRepresentative.js'
import { getTagsUnderClient, updateLeadTags } from '../support/utils/tagUtils.js'
import { addLeadNotes, getLeadNotes, deleteLeadNotes } from '../support/utils/noteUtils.js'

describe('Actyvate Outbound Campaign Automation', () => {

    it('End-to-End Flow', () => {

        let leadId
        let clientId
        let currentLeadStatus
        let newRepresentativeId
        let selectedLeadStatus
        let selectedTag
        let latestNoteId

        const logFolder = 'cypress/reports/logs'
        const testStartedAt = new Date().toISOString()

        const startTime = getStartTime(2) // Get start time 2 minutes from now
        const uniqueLastName = `User_${Date.now()}`
        const campaignName = `Summer Outbound Campaign ${Date.now()}`
        const campaign_subject = 'Welcome to our outbound campaign'
        const noteContent = 'The lead has been modified manually.'

        // Payload for campaign creation
        const payload = {
            clientId: 13,
            botId: 176,
            campaignName: campaignName,
            campaignChannel: ['email'],
            leadUploadSource: 'manual',
            messageStratergy: 'manual',
            emailSubject: campaign_subject,
            emailBody: 'Hi {{first_name}}, welcome!',
            messageBody: 'Hello {{first_name}}!',
            messageContext: 'We met all these leads at the RC Trade Show. They visited our booth and showed interest in our accounting and bookkeeping services. The goal is to get them to book a 15-minute intro call. \nRegards\nAutomation.',
            assignUserList: [154],
            startTime: startTime,
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

        // Step 0: Write test metadata log
        cy.writeFile(`${logFolder}/00-test-metadata.json`, {
            project: 'Actyvate AI',
            module: 'Outbound Campaign Automation',
            testSuite: 'Actyvate Outbound Campaign Automation',
            testCase: 'End-to-End Flow',
            environment: 'Dev',
            apiBaseUrl: Cypress.env('apiUrl'),
            testStartedAt: testStartedAt,
            campaignName: campaignName,
            emailSubject: campaign_subject,
            leadName: `Mario ${uniqueLastName}`
        })

        // Step 1: Create Campaign
        createCampaign(payload)
            .then((response) => {

                cy.log('Full Response:')
                cy.log(JSON.stringify(response.body))

                cy.writeFile(`${logFolder}/01-campaign-create-response.json`, {
                    step: 'Campaign Creation',
                    expectedResult: 'Campaign should be created successfully',
                    requestPayload: payload,
                    response: response.body,
                    status: response.body.meta.status === true ? 'Passed' : 'Failed'
                })

                if (response.body.meta.status !== true) {
                    throw new Error(`API Failed: ${response.body.meta.message}`)
                }

                expect(response.body.meta.status).to.eq(true)
            })

            // Step 2: Wait until campaign completes
            .then(() => {
                cy.writeFile(`${logFolder}/02-campaign-dashboard-check-started.json`, {
                    step: 'Campaign Dashboard Verification',
                    expectedResult: 'Campaign should appear in campaign dashboard',
                    campaignName: campaignName,
                    status: 'Started'
                })

                return checkCampaignStatus(campaignName)
            })

            // Step 3: Verify Lead + get leadId
            .then(() => verifyLeadCreated(uniqueLastName))

            // Step 4: Reply Email + AI response
            .then((createdLeadId) => {
                leadId = createdLeadId

                cy.writeFile(`${logFolder}/03-lead-created.json`, {
                    step: 'Lead Creation Verification',
                    expectedResult: 'Lead should be created from outbound campaign',
                    leadId: leadId,
                    campaignName: campaignName,
                    leadFirstName: 'Mario',
                    leadLastName: uniqueLastName,
                    emailSubject: campaign_subject,
                    status: leadId ? 'Passed' : 'Failed'
                })

                // Store leadId for later use
                cy.wrap(leadId).as('leadId')

                // Wait for email to be delivered
                cy.wait(20000)

                return cy.task('replyAndCheckAI', {
                    subject: campaign_subject
                })
            })

            // Step 5: Validate AI reply
            .then((reply) => {
                cy.log('AI Response:')
                cy.log(reply)

                cy.writeFile(`${logFolder}/04-ai-reply.txt`, reply)

                cy.writeFile(`${logFolder}/05-ai-reply-validation.json`, {
                    step: 'AI Reply Validation',
                    expectedResult: 'AI reply should include lead first name',
                    expectedText: 'Hi Mario',
                    actualReply: reply,
                    status: reply.includes('Hi Mario') ? 'Passed' : 'Failed'
                })

                expect(reply).to.include('Hi Mario')

                return cy.get('@leadId')
            })

            // Step 6: Call Timeline API
            .then((createdLeadId) => {
                return getLeadTimeline(createdLeadId)
            })

            // Step 7: Validate Timeline
            .then((timeline) => {
                const timelineList = timeline.timelineList
                const types = timelineList.map(t => t.type)

                const requiredTimelineEvents = [
                    'leadReceivedBySystem',
                    'automaticAllocation',
                    'leadStartedEngaging'
                ]

                cy.writeFile(`${logFolder}/06-timeline-response.json`, {
                    step: 'Timeline API Response',
                    leadId: leadId,
                    timeline: timeline
                })

                cy.writeFile(`${logFolder}/07-timeline-validation.json`, {
                    step: 'Timeline Event Validation',
                    expectedResult: 'Timeline should include system received, auto allocation, and engagement start events',
                    requiredEvents: requiredTimelineEvents,
                    actualEvents: types,
                    status: requiredTimelineEvents.every(event => types.includes(event)) ? 'Passed' : 'Failed'
                })

                expect(timelineList.length).to.be.greaterThan(0)

                timelineList.forEach(item => {
                    cy.log(`Type: ${item.type}`)
                    cy.log(`Lead Log: ${item.leadLog}`)
                })

                expect(types).to.include('leadReceivedBySystem')
                expect(types).to.include('automaticAllocation')
                expect(types).to.include('leadStartedEngaging')

                return cy.get('@leadId')
            })

            // Step 8: Get Lead Details
            .then((createdLeadId) => {
                return getLeadDetails(createdLeadId)
            })

            // Step 9: Validate Lead Details
            .then((lead) => {

                cy.writeFile(`${logFolder}/08-lead-details-response.json`, {
                    step: 'Lead Details API Response',
                    leadId: leadId,
                    leadDetails: lead
                })

                cy.writeFile(`${logFolder}/09-lead-details-validation.json`, {
                    step: 'Lead Details Validation',
                    expectedResult: 'Lead details should contain leadId, clientId, and assignedUserId',
                    leadIdExists: Object.prototype.hasOwnProperty.call(lead, 'leadId'),
                    clientIdExists: Object.prototype.hasOwnProperty.call(lead, 'clientId'),
                    assignedUserIdExists: Object.prototype.hasOwnProperty.call(lead, 'assignedUserId'),
                    status: lead.leadId && lead.clientId && lead.assignedUserId ? 'Passed' : 'Failed'
                })

                // Basic validation
                expect(lead).to.have.property('leadId')
                expect(lead).to.have.property('clientId')
                expect(lead).to.have.property('assignedUserId')

                cy.log(`Lead ID: ${lead.leadId}`)
                cy.log(`Current Rep: ${lead.assignedUserId}`)

                clientId = lead.clientId
                currentLeadStatus = lead.leadStatus

                const currentUserId = lead.assignedUserId

                // Step 10: Get Random Representative
                return getRandomRepresentative(clientId, currentUserId)
            })

            // Step 11: Reassign Representative
            .then((newUserId) => {
                newRepresentativeId = newUserId

                cy.log(`New Representative: ${newUserId}`)

                cy.writeFile(`${logFolder}/10-representative-selected.json`, {
                    step: 'Representative Selection',
                    expectedResult: 'A different representative should be selected for reassignment',
                    leadId: leadId,
                    clientId: clientId,
                    newRepresentativeId: newRepresentativeId,
                    status: newRepresentativeId ? 'Passed' : 'Failed'
                })

                // Optional validation
                expect(newRepresentativeId).to.not.be.null

                // Assign new representative dynamically
                return reallocateLead(leadId, newRepresentativeId)
            })

            // Step 12: Update Lead Status
            .then(() => {
                cy.log('Representative reassigned')

                cy.writeFile(`${logFolder}/11-representative-reassigned.json`, {
                    step: 'Representative Reassignment',
                    expectedResult: 'Lead should be reassigned successfully',
                    leadId: leadId,
                    newRepresentativeId: newRepresentativeId,
                    status: 'Passed'
                })

                selectedLeadStatus = getRandomLeadStatus(currentLeadStatus)

                cy.writeFile(`${logFolder}/12-selected-lead-status.json`, {
                    step: 'Lead Status Selection',
                    expectedResult: 'A new lead status should be selected',
                    leadId: leadId,
                    previousStatus: currentLeadStatus,
                    selectedStatus: selectedLeadStatus
                })

                return updateLeadStatus(leadId, selectedLeadStatus)
            })

            // Step 13: Get Tags under Client
            .then(() => {
                cy.log('Lead status updated successfully')

                cy.writeFile(`${logFolder}/13-lead-status-updated.json`, {
                    step: 'Lead Status Update',
                    expectedResult: 'Lead status should be updated successfully',
                    leadId: leadId,
                    previousStatus: currentLeadStatus,
                    updatedStatus: selectedLeadStatus,
                    status: 'Passed'
                })

                return getTagsUnderClient(clientId)
            })

            // Step 14: Update Lead Tags
            .then((tags) => {

                cy.log(`Available Tags: ${JSON.stringify(tags)}`)

                selectedTag = tags.leadTags[0]
                cy.log(`Selected Tag: ${selectedTag}`)

                cy.writeFile(`${logFolder}/14-tags-under-client.json`, {
                    step: 'Get Tags Under Client',
                    expectedResult: 'Tags should be available under client',
                    clientId: clientId,
                    availableTags: tags,
                    selectedTag: selectedTag,
                    status: selectedTag ? 'Passed' : 'Failed'
                })

                return updateLeadTags(leadId, [selectedTag])
            })

            // Step 15: Add Lead Notes
            .then(() => {

                cy.log('Lead tags updated successfully')

                cy.writeFile(`${logFolder}/15-lead-tag-updated.json`, {
                    step: 'Lead Tag Update',
                    expectedResult: 'Selected tag should be updated against the lead',
                    leadId: leadId,
                    selectedTag: selectedTag,
                    status: 'Passed'
                })

                return addLeadNotes(leadId, noteContent)
            })

            // Step 16: Get Lead Notes
            .then(() => {
                cy.log('Lead notes added successfully')

                cy.writeFile(`${logFolder}/16-lead-note-added.json`, {
                    step: 'Add Lead Note',
                    expectedResult: 'Lead note should be added successfully',
                    leadId: leadId,
                    noteContent: noteContent,
                    status: 'Passed'
                })

                return getLeadNotes(leadId)
            })

            // Step 17: Validate Lead Notes and Delete Lead Note
            .then((notesData) => {
                const notesList = notesData.notesList
                const latestNote = notesList[notesList.length - 1]
                latestNoteId = latestNote.notesId

                cy.writeFile(`${logFolder}/17-lead-notes-response.json`, {
                    step: 'Get Lead Notes',
                    expectedResult: 'Recently added note should be available in lead notes list',
                    leadId: leadId,
                    notesResponse: notesData,
                    latestNote: latestNote
                })

                cy.writeFile(`${logFolder}/18-lead-note-validation.json`, {
                    step: 'Lead Note Validation',
                    expectedResult: 'Latest note text should match the added note content',
                    expectedNote: noteContent,
                    actualNote: latestNote.notes,
                    notesId: latestNote.notesId,
                    status: latestNote.notes === noteContent ? 'Passed' : 'Failed'
                })

                expect(latestNote.notes).to.eq(noteContent)

                return deleteLeadNotes(latestNote.notesId)
            })

            // Step 18: Final Summary
            .then(() => {
                cy.log('Lead notes deleted successfully')

                cy.writeFile(`${logFolder}/19-lead-note-deleted.json`, {
                    step: 'Delete Lead Note',
                    expectedResult: 'Lead note should be deleted successfully',
                    leadId: leadId,
                    notesId: latestNoteId,
                    status: 'Passed'
                })

                cy.writeFile(`${logFolder}/20-final-summary.json`, {
                    project: 'Actyvate AI',
                    module: 'Outbound Campaign Automation',
                    testSuite: 'Actyvate Outbound Campaign Automation',
                    testCase: 'End-to-End Flow',
                    environment: 'Dev',
                    status: 'Passed',
                    testStartedAt: testStartedAt,
                    testCompletedAt: new Date().toISOString(),
                    campaignName: campaignName,
                    leadId: leadId,
                    clientId: clientId,
                    newRepresentativeId: newRepresentativeId,
                    selectedLeadStatus: selectedLeadStatus,
                    selectedTag: selectedTag,
                    validations: [
                        'Campaign created successfully',
                        'Campaign dashboard verified',
                        'Lead created successfully',
                        'AI reply validated',
                        'Timeline events validated',
                        'Lead details validated',
                        'Representative selected',
                        'Representative reassigned',
                        'Lead status updated',
                        'Client tags fetched',
                        'Lead tag updated',
                        'Lead note added successfully',
                        'Lead note verified successfully',
                        'Lead note deleted successfully'
                    ],
                    evidenceFilesLocation: logFolder
                })

                cy.log('Phase 2 completed successfully')
            })

    })

})