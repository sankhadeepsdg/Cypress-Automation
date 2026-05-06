const token = Cypress.env('token');

export function reallocateLead(leadId, userId) {
  return cy.request({
    method: 'POST',
    url: 'https://devapi.actyvate.ai/v1/leads/reallocateLead',
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