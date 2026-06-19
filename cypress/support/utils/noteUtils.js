import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';
const token = Cypress.env('token')

const noteContent = 'The lead has been modified manually.';

export function addLeadNotes(leadId, noteContent) {
    return cy.request({
        method: 'POST',
        url: `${API_BASE_URL}${API_ROUTES.ADD_LEAD_NOTES}`,
        headers: {
            Authorization: token
        },
        body: {
            leadId,
            notes: noteContent
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.meta.status).to.eq(true);
        return res.body.data;
    });

}

export function getLeadNotes(leadId) {
    return cy.request({
        method: 'POST',
        url: `${API_BASE_URL}${API_ROUTES.GET_LEAD_NOTES}`,
        headers: {
            Authorization: token
        },
        body: {
            leadId
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.meta.status).to.eq(true);
        return res.body.data;
    });
    
}

export function deleteLeadNotes(noteId) {
    return cy.request({
        method: 'POST',
        url: `${API_BASE_URL}${API_ROUTES.DELETE_LEAD_NOTES}`,
        headers: {
            Authorization: token
        },
        body: {
            noteId
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.meta.status).to.eq(true);
        return res.body.data;
    });
    
}