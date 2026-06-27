import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';
const token = Cypress.env('token')

export function getTagsUnderClient(clientId) {
    return cy.request({
        method: 'POST',
        url: `${API_BASE_URL}${API_ROUTES.GET_TAGS_UNDER_CLIENT}`,
        headers: {
            Authorization: token
        },
        body: {
            clientId
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.meta.status).to.eq(true);
        return res.body.data;
    });
}

export function updateLeadTags(leadId, leadTags) {
    return cy.request({
        method: 'POST',
        url: `${API_BASE_URL}${API_ROUTES.UPDATE_LEAD_TAGS}`,
        headers: {
            Authorization: token
        },
        body: {
            leadId,
            leadTags
        }
    }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.meta.status).to.eq(true);
        return res.body.data;
    });
}