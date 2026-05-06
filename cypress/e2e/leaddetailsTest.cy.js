import { getLeadDetails } from '../support/utils/leadDetailsUtils.js';
import { getRandomRepresentative } from '../support/utils/userUtils.js';
import { getRandomLeadStatus, updateLeadStatus } from '../support/utils/leadStatusUpdateUtils.js';
import { reallocateLead } from '../support/utils/assignRepresentative.js';
import { getTagsUnderClient, updateLeadTags } from '../support/utils/tagUtils.js';

import { LEAD_STATUS } from '../support/config/constants.js';

describe('Lead Flow - Assign Random Representative', () => {
    it('should fetch lead and assign new representative', () => {

        const leadId = 4840; // Example lead ID
        let clientId; // Declare clientId to be used across promises
        let currentLeadStatus;

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

            // Assign new representative (dynamic)
            return reallocateLead(leadId, newUserId);

        }).then(() => {

            cy.log('Representative reassigned');
            // Assign representative API call here

            // Step 3: Update Lead Status
            const randomStatus = getRandomLeadStatus(currentLeadStatus);

            return updateLeadStatus(leadId, randomStatus);

        }).then(() => {

            cy.log('Lead status updated successfully');

            //Step 4: Get Tags under Client
            return getTagsUnderClient(clientId);

        }).then((tags) => {

            cy.log(`Available Tags: ${JSON.stringify(tags)}`);

            // Example: pick first tag
            const selectedTag = tags.leadTags[0];
            cy.log(`Selected Tag: ${selectedTag}`);

            // Step 5: Update Lead Tags
            return updateLeadTags(leadId, [selectedTag]);

        }).then(() => {

            cy.log('Lead tags updated successfully');

        });

    });

});