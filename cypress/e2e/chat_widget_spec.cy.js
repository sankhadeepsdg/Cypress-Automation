describe('Chat Widget Functionality Test', () => {
  it('Should open chat widget and submit the form', () => {
    
    // Step 1: Visit the page
    cy.visit('https://www.virtuousbookkeeping.com/dev/');
    
    // Wait for 5 seconds before checking for grecaptcha initialization
    cy.wait(5000);

    // Step 2: Open the chat widget
    cy.get('.actv_widget__open-button').contains('Text us').click();  // Assuming the button contains "Text us"
  
    // Step 3: Verify that the chat form is visible
    cy.get('.actv_widget__header').should('be.visible');  // Change the selector based on your app's implementation

    // Step 4: Fill out the form
    cy.get('#firstName').type('Yoga');
    cy.get('#lastName').type('Paty');
    cy.get('#email').type('testgwbspprt+1@gmail.com');
    cy.get('#phone').type('8888075009');
    cy.get('#interest').type('I am interested in your bookkeeping services.');

    // Step 5: Submit the form
    cy.get('.actv_widget__send-button').click();

    // Wait for 35 seconds before checking for grecaptcha initialization
    cy.wait(35000);

    // Step 6: Verify the success (you can customize this based on what happens after the form submission)
    cy.get('#widget-notification').should('contain.text', 'Thank you! Submitted successfully.'); // Customize based on your actual success message
  });
});