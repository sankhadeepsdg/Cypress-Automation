import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';
const token = Cypress.env('token');

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
