describe('Verify Leads Submitted Through Chat Widget', () => {
  it('checks if the lead is stored in the system', () => {
    cy.loginToActyvate(Cypress.env('username'), Cypress.env('password'));
    cy.visit('/allconversations');
    cy.get(':nth-child(2) > .p-2').click();
    cy.get('[name="searchText"]').type('Yoga');
    // Wait for 5 seconds before checking for grecaptcha initialization
    cy.wait(5000);

    cy.get('[style="width: 150px;"] > .flex').click();

    // Wait for 5 seconds before checking for grecaptcha initialization
    cy.wait(5000);
    cy.get('.text-center > .bg-gray-300').should('contain.text', 'Today');
    //cy.scrollTo('top');
  });
});