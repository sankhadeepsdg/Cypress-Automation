import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';
const token = Cypress.env('token');

export function getLeadTimeline(leadId) {
  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}${API_ROUTES.GET_TIMELINE}`,
    headers: {
      Authorization: token
    },
    body: {
      leadId
    }
  }).then((res) => {

    // Basic validation
    expect(res.status).to.eq(200)
    expect(res.body.meta.status).to.eq(true)
    expect(res.body).to.have.property('data')

    return res.body.data
  })
}