
import { Alerta } from '../../../types/index';
import { formatDate } from '../../../lib/utils';

export const getAlertsData = (alertas: Alerta[]) => {
  return alertas.map(a => ({
    'Fecha Generación': formatDate(new Date().toISOString()),
    'Mensaje': a.mensaje,
    'Estado': a.activa ? 'ACTIVA' : 'RESUELTA'
  }));
};
