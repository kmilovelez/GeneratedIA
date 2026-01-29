
import { PublicClientApplication, EventType, LogLevel } from "@azure/msal-browser";

// Configuración de autenticación para Azure AD / Microsoft Entra ID
export const msalConfig = {
    auth: {
        // Intenta leer de process.env o usa el valor hardcoded como fallback
        clientId: process.env.AZURE_CLIENT_ID || "004400b9-4b4d-4735-a577-5745254a9988",
        // 'common' para multi-tenant, o el GUID del Tenant específico para single-tenant
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || "common"}`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }
            },
            logLevel: LogLevel.Error
        },
        windowHashTimeout: 15000,
        iframeHashTimeout: 10000,
        loadFrameTimeout: 15000,
        allowNativeBroker: false
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const msalInitPromise = msalInstance.initialize().then(() => {
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
});
