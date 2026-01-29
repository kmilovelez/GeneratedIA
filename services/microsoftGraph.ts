import { Tarea, Actividad } from '../types/index';
import { msalInstance } from '../config/auth';

/**
 * CONFIGURACIÓN DE AZURE Y SHAREPOINT (Guía para el desarrollador):
 * 
 * 1. Tenant ID: Identificador único de tu instancia de Azure Active Directory. 
 *    Se obtiene en Azure Portal -> Azure Active Directory -> Overview.
 * 
 * 2. Client ID (App ID): El ID de la aplicación que registraste en Azure Portal.
 *    Se obtiene en Azure Portal -> App Registrations -> Tu App -> Application (client) ID.
 * 
 * 3. List ID: El GUID de la lista de SharePoint.
 *    Se obtiene abriendo la lista en el navegador -> Configuración de la lista -> La URL contendrá algo como List=%7BXXXXX-XXXX-XXXX%7D.
 *    El GUID es el valor entre %7B y %7D.
 * 
 * 4. Site ID: Identificador del sitio de SharePoint.
 *    Se puede obtener vía Graph Explorer: https://graph.microsoft.com/v1.0/sites/root o sites/tu-tenant.sharepoint.com:/sites/nombre-sitio
 */

const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";

/**
 * Obtiene el token de acceso de forma silenciosa o vía popup si es necesario.
 */
async function getAccessToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        throw new Error("No hay una cuenta activa. Por favor, inicia sesión.");
    }

    const request = {
        scopes: ["Sites.Read.All", "Sites.ReadWrite.All"],
        account: account
    };

    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.warn("Silent token acquisition failed, acquiring token via popup");
        const response = await msalInstance.acquireTokenPopup(request);
        return response.accessToken;
    }
}

/**
 * Simula el fetch de tareas desde una lista de SharePoint.
 * En una implementación real, se usaría fetch() con el Bearer Token.
 */
export const getTasksFromSharePoint = async (): Promise<Tarea[]> => {
    try {
        // En un entorno real habilitarías esto:
        // const token = await getAccessToken();
        // const response = await fetch(`${GRAPH_ENDPOINT}/sites/{site-id}/lists/{list-id}/items?expand=fields`, {
        //     headers: { Authorization: `Bearer ${token}` }
        // });
        // const data = await response.json();
        
        console.log("Simulando fetch a SharePoint Lists...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Latencia de red
        
        // Retornamos datos simulados con la estructura de la lista
        return []; 
    } catch (error) {
        console.error("Error al obtener tareas de SharePoint:", error);
        throw error;
    }
};

/**
 * Simula la actualización de una actividad en SharePoint.
 */
export const updateActivityInSharePoint = async (activityId: number, data: Partial<Actividad>) => {
    try {
        // const token = await getAccessToken();
        // await fetch(`${GRAPH_ENDPOINT}/sites/{site-id}/lists/{list-id}/items/${activityId}/fields`, {
        //     method: 'PATCH',
        //     headers: { 
        //         'Authorization': `Bearer ${token}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(data)
        // });
        
        console.log(`Simulando actualización en SharePoint para actividad ${activityId}`, data);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (error) {
        console.error("Error al actualizar en SharePoint:", error);
        return false;
    }
};