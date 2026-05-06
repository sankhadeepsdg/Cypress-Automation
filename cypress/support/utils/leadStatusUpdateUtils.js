const token = Cypress.env('token');

export function updateLeadStatus(leadId, leadStatus) {
  return cy.request({
    method: 'POST',
    url: 'https://devapi.actyvate.ai/v1/leads/updateLeadStatus',
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
