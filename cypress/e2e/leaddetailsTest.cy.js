import { getLeadDetails } from '../support/utils/leadDetailsUtils.js';
import { getRandomRepresentative } from '../support/utils/userUtils.js';
import { updateLeadStatus } from '../support/utils/leadStatusUpdateUtils.js';
import { Lead_Status } from '../support/config/constants.js';
import { reallocateLead } from '../support/utils/assignRepresentative.js';

describe('Lead Flow - Assign Random Representative', () => {
    it('should fetch lead and assign new representative', () => {

        const leadId = 4840; // Example lead ID

        // Step 1: Get Lead Details
        getLeadDetails(leadId).then((lead) => {

            //Basic validation
            expect(lead).to.have.property('leadId');
            expect(lead).to.have.property('clientId');
            expect(lead).to.have.property('assignedUserId');

            cy.log(`Lead ID: ${lead.leadId}`);
            cy.log(`Current Rep: ${lead.assignedUserId}`);

            const clientId = lead.clientId;
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
            return updateLeadStatus(leadId, Lead_Status.SPAM);

        }).then((res) => {

            cy.log('Lead status updated successfully');

        });

    });

});