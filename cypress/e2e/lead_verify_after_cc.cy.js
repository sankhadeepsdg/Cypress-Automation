const token = Cypress.env('token')
export function verifyLeadCreated(lastName, retry = 0) {
  if (retry > 10) {
    throw new Error('Lead not found in system')
  }
  cy.request({
    method: 'POST',
    url: 'https://devapi.actyvate.ai/v1/leads/getLeads',
    headers: {
      Authorization: `${token}`
    },
    body: {
      page: 0,
      size: 10,
      searchText: lastName
    }
  }).then((res) => {
    const leads = res.body.data.leadList

    //adjust if structure is different (sometimes it's data.list)
    const foundLead = leads.find(l => l.lastName === lastName)

    if (!foundLead) {
      cy.wait(5000)
      verifyLeadCreated(lastName, retry + 1)
    } else {
      expect(foundLead.lastName).to.eq(lastName)
      cy.log('Lead found successfully')
    }

  })
}