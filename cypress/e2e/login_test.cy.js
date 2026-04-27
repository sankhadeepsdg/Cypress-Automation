import Papa from 'papaparse'; //Importing the CSV parsing library

describe('Login Flow with CSV', () => {
    before(() => {
        // Read and parse CSV data before the test
        cy.readFile('cypress/fixtures/data.csv').then((csvData) => {
            Papa.parse(csvData, {
                complete: (result) => {
                    // Wrap the parsed data and store it as an alias
                    cy.wrap(result.data).as('userData');  // 'userData' alias
                }
            });
        });
    });

    it('should log in with valid credentials', function () {
        cy.get('@userData').then((userData) => {
        // Make sure the data is available and not empty
        expect(userData).to.have.length.greaterThan(1);

        // Extract valid and invalid user details (now they are arrays)
        const validUser = userData[1]; // Assuming the second row has valid credentials
        const invalidUser = userData[2]; // Assuming the third row has invalid credentials

        // Ensure username and password are strings
        const validUsername = String(validUser[0]); // validUser[0] is the username
        const validPassword = String(validUser[1]); // validUser[1] is the password

        cy.visit('/login'); //Visit the login page

        // Enter valid credentials
        cy.get('#userName').type(validUsername);
        cy.get('#password').type(validPassword, {log: false}); //Hide the password in logs

        //Submit the form
        cy.get('.space-y-6 > .px-4').click(); 

        // Verify that login is successful by checking for the dashboard or some unique element 
        cy.url().should('include', '/overview');
        cy.contains('Hi Moumita Das , I am Actyvate AI').should('be.visible'); // Replaced with actual text or element

        // Step 2: Log out
        cy.get('.flex-wrap > .ml-2').click();
        cy.get('.py-1 > :nth-child(3)').click(); // Clicking logout option

        // Verify that we are back on the login page after logout
        cy.url().should('include', '/login');

        // Step 3: Attempt login with invalid credentials
        const invalidUsername = String(invalidUser[0]); // invalidUser[0] is the username
        const invalidPassword = String(invalidUser[1]); // invalidUser[1] is the password
        
        cy.get('#userName').type(invalidUsername);
        cy.get('#password').type(invalidPassword, {log: false});

        // Submit the form
        cy.get('.space-y-6 > .px-4').click();

        // Verify error message is displayed
        cy.contains('Invalid Credentials!!').should('be.visible');  // Replace with actual error message
    });
});
});
