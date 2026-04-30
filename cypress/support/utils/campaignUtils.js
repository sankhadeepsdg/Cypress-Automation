const token = Cypress.env('token')

export function createCampaign(payload) {
  return cy.request({
    method: 'POST',
    url: 'https://devapi.actyvate.ai/v1/outbound/createCampaign',
    headers: {
      Authorization: `${token}`
    },
    body: payload
  })
}

export function checkCampaignStatus(campaignName, retry = 0) {
    if (retry > 20) {
        throw new Error('Campaign did not complete within expected time')
    }
    
    return cy.request({
        method: 'POST',
        url: 'https://devapi.actyvate.ai/v1/outbound/campaigndDashboard',
        headers: {
            Authorization: `${token}`
        },
        body: {
            page: 0,
            size: 10,
            searchText: campaignName,
            campaignStatus: null
        }
    }).then((res) => {
        const campaigns = res.body.data.campaignList
        const campaign = campaigns.find(c => c.campaignName === campaignName)

        expect(campaign).to.exist

        if (campaign.status !== 'completed') {
            cy.wait(10000)
            return checkCampaignStatus(campaignName, retry + 1)
        } else {
            return campaign
        }
    })
}