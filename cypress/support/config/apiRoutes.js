export const API_BASE_URL = Cypress.env('apiUrl');
export const API_ROUTES = {

  // Lead APIs
  GET_LEAD_DETAILS: '/leads/getLeadDetails',
  UPDATE_LEAD_STATUS: '/leads/updateLeadStatus',
  REALLOCATE_LEAD: '/leads/reallocateLead',
  GET_TIMELINE: '/leads/getTimeline',

  // User APIs
  GET_USERS_UNDER_CLIENT: '/admin/getUserListUnderClient',

  // Campaign APIs
  CREATE_CAMPAIGN: '/outbound/createCampaign',
  CAMPAIGN_DASHBOARD: '/outbound/campaigndDashboard',

  // Lead APIs
  GET_LEADS: '/leads/getLeads'
};