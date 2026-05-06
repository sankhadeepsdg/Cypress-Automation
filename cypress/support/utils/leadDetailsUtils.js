const token = Cypress.env('token')

export function getLeadDetails(leadId) {
    return cy.request({
        method: 'POST',
        url: 'https://devapi.actyvate.ai/v1/leads/getLeadDetails',
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