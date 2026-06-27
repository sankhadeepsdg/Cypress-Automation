import { API_BASE_URL, API_ROUTES } from '../config/apiRoutes';

export function getRandomRepresentative(clientId, currentAssignedUserId) {
  const token = Cypress.env('token');

  return cy.request({
    method: 'POST',
    url: `${API_BASE_URL}${API_ROUTES.GET_USERS_UNDER_CLIENT}`,
    headers: {
      Authorization: token
    },
    body: {
      clientId
    }
  }).then((res) => {

    const users = res.body.data.userList;

    const representatives = users.filter(
      user => user.userType === 'representative' && user.status === 1
    );

    const filtered = representatives.filter(
      user => user.userId !== currentAssignedUserId
    );

    const randomIndex = Math.floor(Math.random() * filtered.length);
    const selectedUser = filtered[randomIndex];

    return cy.wrap(selectedUser.userId);
  });
}