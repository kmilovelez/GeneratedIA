
import { Tarea, Actividad } from '../types/index';
import { msalInstance } from '../config/auth';

/**
 * CONFIGURACIÓN CENTRALIZADA DE MICROSOFT GRAPH
 * Los valores se leen de las variables de entorno (.env)
 */
const GRAPH_CONFIG = {
    endpoint: "https://graph.microsoft.com/v1.0",
    siteId: process.env.SHAREPOINT_SITE_ID,
    lists: {
        projects: process.env.SHAREPOINT_LIST_ID_PROJECTS,
        tasks: process.env.SHAREPOINT_LIST_ID_TASKS,
        activities: process.env.SHAREPOINT_LIST_ID_ACTIVITIES
    }
};

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
 * Utiliza los IDs configurados en el .env.
 */
export const getTasksFromSharePoint = async (): Promise<Tarea[]> => {
    try {
        console.log(`Conectando a SharePoint Site: ${GRAPH_CONFIG.siteId}`);
        console.log(`Leyendo Lista de Tareas: ${GRAPH_CONFIG.lists.tasks}`);

        // En un entorno real habilitarías esto:
        /*
        if (!GRAPH_CONFIG.siteId || !GRAPH_CONFIG.lists.tasks) {
            throw new Error("Configuración de SharePoint incompleta en .env");
        }
        const token = await getAccessToken();
        const response = await fetch(`${GRAPH_CONFIG.endpoint}/sites/${GRAPH_CONFIG.siteId}/lists/${GRAPH_CONFIG.lists.tasks}/items?expand=fields`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        // Aquí iría el mapeo de data.value a Tarea[]
        */
        
        console.log("Simulando fetch a SharePoint Lists...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Latencia de red
        
        // Retornamos datos vacíos por defecto en simulación
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
        /*
        if (!GRAPH_CONFIG.siteId || !GRAPH_CONFIG.lists.activities) return false;
        const token = await getAccessToken();
        await fetch(`${GRAPH_CONFIG.endpoint}/sites/${GRAPH_CONFIG.siteId}/lists/${GRAPH_CONFIG.lists.activities}/items/${activityId}/fields`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        */
        
        console.log(`Simulando actualización en SharePoint (Lista: ${GRAPH_CONFIG.lists.activities}) para actividad ${activityId}`, data);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (error) {
        console.error("Error al actualizar en SharePoint:", error);
        return false;
    }
};
