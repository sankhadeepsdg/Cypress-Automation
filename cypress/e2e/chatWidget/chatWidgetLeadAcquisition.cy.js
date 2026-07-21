describe('Chat Widget Lead Acquisition', () => {
    const websiteUrl = Cypress.env('vbkUrl')

    const selectors = {
        widgetLauncher: '.actv_widget__open-button',
        widgetHeader: '.actv_widget__header',
        firstNameInput: '#firstName',
        lastNameInput: '#lastName',
        emailInput: '#email',
        countryCodeButton: '.iti__selected-flag',
        selectedDialCode: '.iti__selected-dial-code',
        countryList: '.iti__country-list',
        countryOption: '.iti__country',
        phoneInput: '#phone',
        interestInput: '#interest',
        sendButton: '.actv_widget__send-button',
        notificationMessage: '#widget-notification'
    }

    const createLeadData = () => {
        const uniqueId = Date.now()

        return {
            firstName: 'Automation',
            lastName: `Widget${uniqueId}`,
            email: Cypress.env('tlEmail'),
            countryIsoCode: 'in',
            countryCode: '+91',
            phone: Cypress.env('tlPhone'),
            interest:
                `I need monthly bookkeeping support for my small business. Reference: ${uniqueId}`
        }
    }

    before(() => {
        expect(websiteUrl, 'VBK URL should be configured').to.be.a('string').and.not.be.empty

        expect(Cypress.env('tlEmail'), 'Test lead email should be configured').to.be.a('string').and.not.be.empty

        expect(Cypress.env('tlPhone'),'Test lead phone should be configured').to.be.a('string').and.not.be.empty
    })

    beforeEach(() => {
        cy.visit(websiteUrl, {
            failOnStatusCode: true
        })

        cy.location('hostname').should('eq', new URL(websiteUrl).hostname)
        cy.get(selectors.widgetLauncher, { timeout: 30000 }).should('be.visible').click()
        cy.get(selectors.widgetHeader, { timeout: 15000 }).should('be.visible')
    })

    it('should submit valid lead information from the verified domain', () => {
        const leadData = createLeadData()

        cy.log(`Submitting lead: ${leadData.firstName} ${leadData.lastName}`)
        cy.get(selectors.firstNameInput).should('be.visible').clear().type(leadData.firstName)
        cy.get(selectors.lastNameInput).should('be.visible').clear().type(leadData.lastName)
        cy.get(selectors.emailInput).should('be.visible').clear().type(leadData.email)

        // Open country-code dropdown
        cy.get(selectors.countryCodeButton).should('be.visible').click()

        // Verify country list is open
        cy.get(selectors.countryList).should('exist').and('not.have.class', 'iti_hide')

        // Select India using the unique ISO country code
        cy.get(`${selectors.countryOption}[data-country-code="${leadData.countryIsoCode}"]`)
            .should('exist')
            .scrollIntoView()
            .click({ force: true })

        // Verify that +91 is selected
        cy.get(selectors.selectedDialCode).should('be.visible').and('have.text', leadData.countryCode)

        // Enter phone number
        cy.get(selectors.phoneInput).should('be.visible').clear().type(leadData.phone)

        // Enter Interested In message
        cy.get(selectors.interestInput).should('be.visible').clear().type(leadData.interest)

        // Validate the entered form data before submission
        cy.get(selectors.firstNameInput).should('have.value', leadData.firstName)
        cy.get(selectors.lastNameInput).should('have.value', leadData.lastName)
        cy.get(selectors.emailInput).should('have.value', leadData.email)
        cy.get(selectors.selectedDialCode).should('contain.text', leadData.countryCode)
        cy.get(selectors.phoneInput).should('have.value', leadData.phone)
        cy.get(selectors.interestInput).should('have.value', leadData.interest)

        // Submit the form
        cy.get(selectors.sendButton).should('be.visible').and('not.be.disabled').click()

        // Temporary frontend submission validation
        cy.get(selectors.notificationMessage, { timeout: 45000 }).should('exist').and('be.visible').and('contain.text', 'Thank you! Submitted successfully.')
    })
})