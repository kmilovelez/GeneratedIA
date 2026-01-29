
import { PublicClientApplication, EventType } from "@azure/msal-browser";

// IMPORTANTE: Reemplaza 'ENTER_YOUR_CLIENT_ID' con el ID de tu App Registration en Azure Portal
export const msalConfig = {
    auth: {
        clientId: "ENTER_YOUR_CLIENT_ID", // Ejemplo: "a1b2c3d4-e5f6-..."
        authority: "https://login.microsoftonline.com/common", // O tu Tenant ID específico
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL logic
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        // @ts-ignore
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
    }
});
