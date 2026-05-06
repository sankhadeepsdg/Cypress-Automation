import { API_BASE_URL, API_ROUTES } from "../config/apiRoutes";
const token = Cypress.env('token');

export function reallocateLead(leadId, userId) {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}${API_ROUTES.REALLOCATE_LEAD}`,
    headers: {
      Authorization: token
    },
    body: {
      leadId,
      userId
    }
  }).then((res) => {

    expect(res.status).to.eq(200);
    expect(res.body.meta.status).to.eq(true);

    return res.body;
  });
}