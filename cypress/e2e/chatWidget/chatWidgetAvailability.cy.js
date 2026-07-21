describe('Chat Widget Availability', () => {
  const websiteUrl = Cypress.env('vbkUrl')

  const selectors = {
    widgetLauncher: '.actv_widget__open-button',
    widgetHeader: '.actv_widget__header',
    firstNameInput: '#firstName',
    lastNameInput: '#lastName',
    emailInput: '#email',
    phoneInput: '#phone',
    interestInput: '#interest',
    sendButton: '.actv_widget__send-button',
    notificationMessage: '#widget-notification'
  }

  before(() => {
    expect(
      websiteUrl,
      'VBK URL should be defined'
    ).to.be.a('string').and.not.be.empty
  })

  beforeEach(() => {
    cy.visit(websiteUrl, {
      failOnStatusCode: true
    })

    cy.wait(10000)
  })

  it('should display the Chat Widget lead form on the verified domain', () => {
    cy.location('hostname')
      .should('eq', new URL(websiteUrl).hostname)

    cy.get('body')
      .should('be.visible')

    cy.get(selectors.widgetLauncher, { timeout: 30000 })
      .should('exist')
      .and('be.visible')
      .and('not.be.disabled')

    cy.get(selectors.widgetLauncher)
      .click()

    cy.get(selectors.widgetHeader, { timeout: 15000 })
      .should('exist')
      .and('be.visible')

    cy.get(selectors.firstNameInput)
      .should('exist')
      .and('be.visible')

    cy.get(selectors.lastNameInput)
      .should('exist')
      .and('be.visible')

    cy.get(selectors.emailInput)
      .should('exist')
      .and('be.visible')

    cy.get(selectors.phoneInput)
      .should('exist')
      .and('be.visible')

    cy.get(selectors.interestInput)
      .should('exist')
      .and('be.visible')

    cy.get(selectors.sendButton)
      .should('exist')
      .and('be.visible')
  })
})