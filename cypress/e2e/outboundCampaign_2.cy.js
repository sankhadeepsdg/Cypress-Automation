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

        const logFolder = 'cypress/reports/logs'
        const testStartedAt = new Date().toISOString()

        const startTime = getStartTime(2) // Get start time 2 minutes from now
        const uniqueLastName = `User_${Date.now()}`
        const campaignName = `Summer Outbound Campaign ${Date.now()}`
        const campaignSubject = CAMPAIGN_SUBJECT
        const noteContent = NOTE_CONTENT.FIRST_UPDATE

        // Payload for campaign creation
        const payload = buildOutboundCampaignPayload({
            startTime,
            campaignName,
            uniqueLastName,
        })

        // Write test metadata for Markdown report
        cy.writeFile(`${logFolder}/00-test-metadata.json`, {
            project: 'Actyvate AI',
            module: 'Outbound Campaign Automation',
            testSuite: 'Actyvate Outbound Campaign Automation',
            testCase: 'End-to-End Flow',
            environment: 'Dev',
            apiBaseUrl: Cypress.env('apiUrl'),
            testStartedAt: testStartedAt,
            campaignName: campaignName,
            emailSubject: campaignSubject,
            leadName: `Mario ${uniqueLastName}`
        })

        // =========================
        // Phase 1
        // Campaign and AI Validation
        // =========================

        // Step 1: Create Campaign
        createCampaign(payload)

            .then((response) => {
                cy.log(`Campaign Response: ${JSON.stringify(response.body)}`)

                cy.writeFile(`${logFolder}/01-campaign-create-response.json`, {
                    step: 'Campaign Creation',
                    expectedResult: 'Campaign should be created successfully',
                    requestPayload: payload,
                    response: response.body,
                    status: response.body?.meta?.status === true ? 'Passed' : 'Failed'
                })

                expect(response.body).to.have.property('meta')

                expect(
                    response.body.meta.status,
                    response.body.meta.message || 'Campaign creation failed'
                ).to.eq(true)
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

            // Step 3: Verify lead creation and capture leadId
            .then(() => verifyLeadCreated(uniqueLastName))

            // Step 4: Reply to campaign email and wait for AI response
            .then((createdLeadId) => {
                leadId = createdLeadId

                expect(leadId).to.exist
                cy.log(`Created Lead ID: ${leadId}`)

                cy.writeFile(`${logFolder}/03-lead-created.json`, {
                    step: 'Lead Creation Verification',
                    expectedResult: 'Lead should be created from outbound campaign',
                    leadId: leadId,
                    campaignName: campaignName,
                    leadFirstName: 'Mario',
                    leadLastName: uniqueLastName,
                    emailSubject: campaignSubject,
                    status: leadId ? 'Passed' : 'Failed'
                })

                // Wait for email to be delivered
                cy.wait(20000)

                return cy.task('replyAndCheckAI', {
                    subject: campaignSubject,
                })
            })

            // Step 5: Validate AI reply
            .then((reply) => {
                cy.log(`AI Response: ${reply}`)

                cy.writeFile(`${logFolder}/04-ai-reply.txt`, reply)

                cy.writeFile(`${logFolder}/05-ai-reply-validation.json`, {
                    step: 'AI Reply Validation',
                    expectedResult: 'AI reply should include lead first name',
                    expectedText: 'Hi Mario',
                    actualReply: reply,
                    status: typeof reply === 'string' && reply.includes('Hi Mario') ? 'Passed' : 'Failed'
                })

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
                    actualEvents: timelineTypes,
                    status: requiredTimelineEvents.every(event => timelineTypes.includes(event)) ? 'Passed' : 'Failed'
                })

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
                cy.writeFile(`${logFolder}/08-lead-details-response.json`, {
                    step: 'Lead Details API Response',
                    leadId: leadId,
                    leadDetails: lead
                })

                cy.writeFile(`${logFolder}/09-lead-details-validation.json`, {
                    step: 'Lead Details Validation',
                    expectedResult: 'Lead details should contain leadId, clientId, assignedUserId, leadStatus, leadTags, and timelineList',
                    leadIdExists: Object.prototype.hasOwnProperty.call(lead, 'leadId'),
                    clientIdExists: Object.prototype.hasOwnProperty.call(lead, 'clientId'),
                    assignedUserIdExists: Object.prototype.hasOwnProperty.call(lead, 'assignedUserId'),
                    leadStatusExists: Object.prototype.hasOwnProperty.call(lead, 'leadStatus'),
                    leadTagsExists: Object.prototype.hasOwnProperty.call(lead, 'leadTags'),
                    timelineListExists: Object.prototype.hasOwnProperty.call(lead, 'timelineList'),
                    status: lead.leadId && lead.clientId && lead.assignedUserId ? 'Passed' : 'Failed'
                })

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
                expect(newUserId).to.exist

                updatedRepresentativeId = newUserId;
                cy.log(`New Representative: ${updatedRepresentativeId}`)

                cy.writeFile(`${logFolder}/10-representative-selected.json`, {
                    step: 'Representative Selection',
                    expectedResult: 'A different representative should be selected for reassignment',
                    leadId: leadId,
                    clientId: clientId,
                    newRepresentativeId: updatedRepresentativeId,
                    status: updatedRepresentativeId ? 'Passed' : 'Failed'
                })

                return reallocateLead(leadId, updatedRepresentativeId)
            })

            // Step 10: Update lead status
            .then(() => {
                cy.writeFile(`${logFolder}/11-representative-reassigned.json`, {
                    step: 'Representative Reassignment',
                    expectedResult: 'Lead should be reassigned successfully',
                    leadId: leadId,
                    newRepresentativeId: updatedRepresentativeId,
                    status: 'Passed'
                })

                updatedLeadStatus = getRandomLeadStatus(currentLeadStatus)
                expect(updatedLeadStatus).to.not.eq(currentLeadStatus)
                cy.log(`Selected Lead Status: ${updatedLeadStatus}`)

                cy.writeFile(`${logFolder}/12-selected-lead-status.json`, {
                    step: 'Lead Status Selection',
                    expectedResult: 'A different lead status should be selected',
                    leadId: leadId,
                    previousStatus: currentLeadStatus,
                    selectedStatus: updatedLeadStatus,
                    status: updatedLeadStatus !== currentLeadStatus ? 'Passed' : 'Failed'
                })

                return updateLeadStatus(leadId, updatedLeadStatus)
            })

            // Step 11: Fetch client tags
            .then(() => {
                cy.writeFile(`${logFolder}/13-lead-status-updated.json`, {
                    step: 'Lead Status Update',
                    expectedResult: 'Lead status should be updated successfully',
                    leadId: leadId,
                    previousStatus: currentLeadStatus,
                    updatedStatus: updatedLeadStatus,
                    status: 'Passed'
                })

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

                expect(
                    availableNewTags.length,
                    'At least one tag different from the current tags should exist'
                ).to.be.greaterThan(0)

                updatedLeadTag = availableNewTags[0]
                cy.log(`Selected Lead Tag: ${updatedLeadTag}`)

                cy.writeFile(`${logFolder}/14-tags-under-client.json`, {
                    step: 'Get Tags Under Client',
                    expectedResult: 'Tags should be available under client and one new tag should be selected',
                    clientId: clientId,
                    availableTags: tagsData,
                    currentLeadTags: currentLeadTags,
                    selectedTag: updatedLeadTag,
                    status: updatedLeadTag ? 'Passed' : 'Failed'
                })

                return updateLeadTags(leadId, [updatedLeadTag])
            })

            // Step 13: Add note
            .then(() => {
                cy.log('Lead tags updated successfully');

                cy.writeFile(`${logFolder}/15-lead-tag-updated.json`, {
                    step: 'Lead Tag Update',
                    expectedResult: 'Selected tag should be updated against the lead',
                    leadId: leadId,
                    selectedTag: updatedLeadTag,
                    status: 'Passed'
                })

                return addLeadNotes(leadId, noteContent)
            })

            // Step 14: Retrieve notes
            .then(() => {
                cy.log('Lead notes added successfully');

                cy.writeFile(`${logFolder}/16-lead-note-added.json`, {
                    step: 'Add Lead Note',
                    expectedResult: 'Lead note should be added successfully',
                    leadId: leadId,
                    noteContent: noteContent,
                    status: 'Passed'
                })

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

                cy.log(`Deleting Note ID: ${deletedNoteId}`)
                return deleteLeadNotes(deletedNoteId)
            })

            // Step 16: Retrieve notes after deletion
            .then(() => {
                cy.log('Lead notes deleted successfully')
                return getLeadNotes(leadId)
            })

            // Step 17: Confirm deleted note no longer exists
            .then((notesData) => {
                expect(notesData.notesList).to.be.an('array')
                const deletedNoteStillExists = notesData.notesList.some(note => note.notesId === deletedNoteId)

                expect(deletedNoteStillExists).to.be.false;

                cy.writeFile(`${logFolder}/19-lead-note-deleted.json`, {
                    step: 'Delete Lead Note',
                    expectedResult: 'Lead note should be deleted successfully and should not exist in latest notes list',
                    leadId: leadId,
                    notesId: deletedNoteId,
                    deletedNoteStillExists: deletedNoteStillExists,
                    status: deletedNoteStillExists === false ? 'Passed' : 'Failed'
                })

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

                expect(updatedLead.assignedUserId).to.eq(updatedRepresentativeId);
                cy.log(`Validated Representative ID: ${updatedLead.assignedUserId}`)

                expect(updatedLead.leadStatus).to.eq(updatedLeadStatus);
                cy.log(`Validated Lead Status: ${updatedLead.leadStatus}`)

                expect(updatedLead.leadTags).to.be.an('array')
                expect(updatedLead.leadTags).to.include(updatedLeadTag);
                cy.log(`Lead tag verified: ${updatedLeadTag}`)

                expect(updatedLead.timelineList).to.be.an('array')
                expect(updatedLead.timelineList.length).to.be.greaterThan(0)

                const timelineTypes = updatedLead.timelineList.map(item => item.type);

                expect(timelineTypes).to.include('leadReceivedBySystem')
                expect(timelineTypes).to.include('automaticAllocation')
                expect(timelineTypes).to.include('leadStartedEngaging')

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
                    newRepresentativeId: updatedRepresentativeId,
                    selectedLeadStatus: updatedLeadStatus,
                    selectedTag: updatedLeadTag,
                    deletedNoteId: deletedNoteId,
                    finalTimelineEvents: timelineTypes,
                    validations: [
                        'Campaign created successfully',
                        'Campaign dashboard verified',
                        'Lead created successfully',
                        'AI reply validated',
                        'Initial timeline events validated',
                        'Lead details captured',
                        'Representative selected',
                        'Representative reassigned',
                        'Lead status updated',
                        'Client tags fetched',
                        'Lead tag updated',
                        'Lead note added successfully',
                        'Lead note verified successfully',
                        'Lead note deleted successfully',
                        'Final representative update validated',
                        'Final lead status update validated',
                        'Final lead tag update validated',
                        'Final timeline events validated'
                    ],
                    evidenceFilesLocation: logFolder
                })

                cy.log(`Timeline Events: ${timelineTypes.join(', ')}`)
                cy.log('Phase 3 completed successfully')
                cy.log('End-to-End automation completed successfully')
            });

    });

});