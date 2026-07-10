import { getLeadDetails } from '../support/utils/leadDetailsUtils.js';
import { getRandomRepresentative } from '../support/utils/userUtils.js';
import { getRandomLeadStatus, updateLeadStatus } from '../support/utils/leadStatusUpdateUtils.js';
import { reallocateLead } from '../support/utils/assignRepresentative.js';
import { getTagsUnderClient, updateLeadTags } from '../support/utils/tagUtils.js';
import { addLeadNotes, getLeadNotes, deleteLeadNotes } from '../support/utils/noteUtils.js';

import { LEAD_STATUS } from '../support/config/constants.js';

describe('Lead Flow - Assign Random Representative', () => {
    it('should fetch lead and assign new representative', () => {

        const leadId = 4840; // Example lead ID
        const noteContent = 'The lead has been modified manually.';
        let clientId; // Declare clientId to be used across promises
        let currentLeadStatus;

        // Store the Phase 2 updated values for Phase 3 validation
        let updatedRepresentativeId
        let updatedLeadStatus
        let updatedLeadTag
        let deletedNoteId

        // Step 1: Get Lead Details
        getLeadDetails(leadId).then((lead) => {

            //Basic validation
            expect(lead).to.have.property('leadId');
            expect(lead).to.have.property('clientId');
            expect(lead).to.have.property('assignedUserId');

            cy.log(`Lead ID: ${lead.leadId}`);
            cy.log(`Current Rep: ${lead.assignedUserId}`);

            clientId = lead.clientId;
            currentLeadStatus = lead.leadStatus;

            const currentUserId = lead.assignedUserId;

            // Step 2: Get Random Representative
            return getRandomRepresentative(clientId, currentUserId);

        }).then((newUserId) => {

            cy.log(`New Representative: ${newUserId}`);

            // Optional validation
            expect(newUserId).to.not.be.null;
            expect(newUserId).to.not.be.undefined;

            // Store the selected representative for Phase 3
            updatedRepresentativeId = newUserId;

            cy.log(`New Representative: ${updatedRepresentativeId}`)

            // Assign new representative (dynamic)
            return reallocateLead(leadId, updatedRepresentativeId)

        }).then(() => {

            // Assign representative API call here
            cy.log('Representative reassigned successfully');


            // Step 3: Select a different random lead status
            const randomStatus = getRandomLeadStatus(currentLeadStatus);

            // Store the selected status for Phase 3
            updatedLeadStatus = randomStatus;

            cy.log(`New Lead Status: ${updatedLeadStatus}`)

            return updateLeadStatus(leadId, updatedLeadStatus);

        }).then(() => {

            cy.log('Lead status updated successfully');

            // Step 4: Get tags available under the client
            return getTagsUnderClient(clientId);

        }).then((tags) => {

            cy.log(`Available Tags: ${JSON.stringify(tags.leadTags)}`);

            expect(tags).to.have.property('leadTags')
            expect(tags.leadTags).to.be.an('array')
            expect(tags.leadTags.length).to.be.greaterThan(0)

            // Example: pick first tag
            const selectedTag = tags.leadTags[0];

            // Store the selected tag for Phase 3
            updatedLeadTag = selectedTag

            cy.log(`Selected Tag: ${updatedLeadTag}`);

            // Step 5: Update Lead Tags
            return updateLeadTags(leadId, [updatedLeadTag]);

        }).then(() => {

            cy.log('Lead tags updated successfully');

            // Step 6: Add Lead Notes
            return addLeadNotes(leadId, noteContent);

        }).then(() => {

            cy.log('Lead notes added successfully');
            return getLeadNotes(leadId);

        }).then((notesData) => {
            cy.log(`Lead Notes: ${JSON.stringify(notesData)}`)

            const notesList = notesData.notesList
            const latestNote = notesList[notesList.length - 1]

            expect(latestNote.notes).to.eq(noteContent)

            deletedNoteId = latestNote.notesId;

            // Step 7: Delete Lead Note
            return deleteLeadNotes(deletedNoteId);

        }).then(() => {
            cy.log('Lead notes deleted successfully');

            // Step 8: Verify note deletion
            return getLeadNotes(leadId)

        }).then((notesData) => {
            const notesList = notesData.notesList
            const deletedNoteStillExists = notesList.some(note => note.notesId === deletedNoteId)

            expect(deletedNoteStillExists).to.be.false;

            // Values now available for Phase 3 validation
            cy.log(`Expected Representative ID: ${updatedRepresentativeId}`)
            cy.log(`Expected Lead Status: ${updatedLeadStatus}`)
            cy.log(`Expected Lead Tag: ${updatedLeadTag}`)
            cy.log(`Deleted Note ID: ${deletedNoteId}`)
            cy.log('Phase 2 completed successfully')

            // Phase 3 - Step 1: Fetch latest lead details
            return getLeadDetails(leadId);

        }).then((updatedLead) => {

            // Phase 3 - Step 2: Validate updated representative
            expect(updatedLead.assignedUserId).to.eq(updatedRepresentativeId);

            cy.log(`Validated Representative ID: ${updatedLead.assignedUserId}`)

            // Phase 3 - Step 3: Validate updated lead status
            expect(updatedLead.leadStatus).to.eq(updatedLeadStatus);

            cy.log(`Validated Lead Status: ${updatedLead.leadStatus}`)

            // Phase 3 - Step 4: Validate updated lead tags
            expect(updatedLead.leadTags).to.include(updatedLeadTag);

            cy.log(`Lead tag verified: ${updatedLeadTag}`)

            //Phase 3 - Step 5: Validate lead timeline
            const timelineTypes = updatedLead.timelineList.map(item => item.type);

            expect(timelineTypes).to.include('manualAllocation')
            expect(timelineTypes).to.include('leadStatusChange')

            cy.log(`Timeline Events: ${timelineTypes.join(', ')}`)
            cy.log('Phase 3 completed successfully')

        });

    });
}); 






