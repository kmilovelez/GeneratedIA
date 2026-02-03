import { PublicClientApplication } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID ?? 'common';
const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID ?? '';

export const isMicrosoftConfigured = Boolean(clientId);

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
});

export const microsoftLoginRequest = {
  scopes: ['openid', 'profile', 'email'],
};
