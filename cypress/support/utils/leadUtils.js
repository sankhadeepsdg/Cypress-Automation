//verifyLeadCreated
const token = Cypress.env('token')

export function verifyLeadCreated(lastName, retry = 0) {
  if (retry > 10) {
    throw new Error('Lead not found in system')
  }

  return cy.request({
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
    cy.log('Expected:', lastName)
    const foundLead = leads.find(l =>
      l.lastName &&
      l.lastName.trim().toLowerCase() === lastName.trim().toLowerCase()
    )

    if (!foundLead) {
      cy.wait(5000)
      return verifyLeadCreated(lastName, retry + 1)
    }
    expect(foundLead).to.exist
    expect(foundLead.lastName.toLowerCase()).to.eq(lastName.toLowerCase())
    cy.log('Lead found successfully')

    return cy.wrap(foundLead.leadId)
  })
}