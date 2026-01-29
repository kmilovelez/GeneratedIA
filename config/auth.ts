
import { PublicClientApplication, EventType, LogLevel } from "@azure/msal-browser";

// Configuración de autenticación para Azure AD / Microsoft Entra ID
export const msalConfig = {
    auth: {
        // Intenta leer de process.env (si el bundler lo soporta) o usa el valor hardcoded como fallback seguro
        clientId: process.env.AZURE_CLIENT_ID || "004400b9-4b4d-4735-a577-5745254a9988",
        authority: "https://login.microsoftonline.com/common", // O tu Tenant ID específico
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
        // Aumentamos los timeouts para prevenir errores en redes lentas o equipos con bajo rendimiento
        windowHashTimeout: 15000, // Tiempo de espera para procesar el hash de la URL
        iframeHashTimeout: 10000,
        loadFrameTimeout: 15000, // Tiempo de espera para cargar frames de auth
        allowNativeBroker: false // Deshabilitar broker nativo puede mejorar la compatibilidad en algunos navegadores
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Exportamos la promesa de inicialización para que App.tsx pueda esperarla
export const msalInitPromise = msalInstance.initialize().then(() => {
    // Solo después de inicializar podemos llamar a otros métodos
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
