import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';
import { LEAD_STATUS } from '../config/constants';

const token = Cypress.env('token');

export function getRandomLeadStatus(currentStatus) {

  const allStatuses = Object.values(LEAD_STATUS);

  //Remove current status
  const filteredStatuses = allStatuses.filter(status => status !== currentStatus);

  // Pick random
  const randomIndex = Math.floor(Math.random() * filteredStatuses.length);
  return filteredStatuses[randomIndex];
}

export function updateLeadStatus(leadId, leadStatus) {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}${API_ROUTES.UPDATE_LEAD_STATUS}`,
    headers: {
      Authorization: token
    },
    body: {
      leadId,
      leadStatus
    }
  }).then((res) => {

    // Basic validation
    expect(res.status).to.eq(200);
    expect(res.body.meta.status).to.eq(true);

    return res.body;
  });
}
