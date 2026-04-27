import { verifyLeadCreated } from "./lead_verify_after_cc.cy"
describe('Actyvate Outbound Campaign Automation', () => {
  it('Create campaign and verify execution', () => {
    // Step 1: Generate dynamic start time
    function getStartTime() {
      const now = new Date()
      now.setMinutes(now.getMinutes() + 2)

      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    const startTime = getStartTime()
    const uniqueLastName = `User_${Date.now()}`
    const token = Cypress.env('token')

    const campaignName = `Summer Outbound Campaign ${Date.now()}`
    const campaign_subject = 'Welcome to our outbound campaign'

    // Step 2: Create campaign via API
    cy.request({
      method: 'POST',
      url: 'https://devapi.actyvate.ai/v1/outbound/createCampaign',
      headers: {
        Authorization: `${token}`
      },
      body: {
        clientId: 13,
        botId: 176,
        campaignName: campaignName,
        campaignChannel: ["email"],
        leadUploadSource: "manual",
        messageStratergy: "manual",
        emailSubject: campaign_subject,
        emailBody: "Hi {{first_name}}, welcome!",
        messageBody: "Hello {{first_name}}!",
        messageContext: "We met all these leads at the RC Trade Show. They visited our booth and showed interest in our accounting and bookkeeping services. The goal is to get them to book a 15-minute intro call. \nRegards\nAutomation.",
        assignUserList: [154],
        startTime: startTime,
        whatsappTemplateId: null,
        timezone: "India Standard Time",
        leadList: [
          {
            firstName: "Mario",
            lastName: uniqueLastName,
            emailId: "testgwbspprt@gmail.com",
            phoneNo: "+918337047513",
            oldLeadId: null,
            message: "Interested in product",
            notes: "Health Insurance Lead"
          }
        ]
      }
    }).then((response) => {

      // Step 3: Validate response
      expect(response.body.meta.status).to.eq(true)

      // Step 4: Poll campaignDashboard API
      function checkCampaignStatus(retry = 0) {

        //safety stop (avoid infinite loop)
        if (retry > 20) {
          throw new Error('Campaign did not complete within expected time')
        }

        cy.request({
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

          // Step 5: Find campaign
          const campaign = campaigns.find(c => c.campaignName === campaignName)

          expect(campaign, 'Campaign should exist').to.exist

          cy.log(`Current Status: ${campaign.status}`)

          // Step 6: Check status
          if (campaign.status !== 'completed') {
            cy.wait(10000)
            checkCampaignStatus(retry + 1)
          } else {
            expect(campaign.status).to.eq('completed')

            cy.then(() => {
              return verifyLeadCreated(uniqueLastName)
            })

            // 6. Wait 1 minute before checking Gmail
            cy.wait(60000)
            // 7. Search campaign email and reply
            cy.task('replyCampaignEmail', {
              subject: campaign_subject
            }).then((msg) => {
              cy.log(msg)
            })

          }

        })

      }

      // Start polling
      checkCampaignStatus()
    })

  })

})