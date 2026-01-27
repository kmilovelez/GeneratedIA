
import { Proyecto } from '../../../types/index';
import { INITIAL_LINEAS } from '../../../lib/utils';

export const getProjectStatusData = (proyectos: Proyecto[], filters: { linea: string }) => {
  return proyectos
    .filter(p => filters.linea === 'all' || p.id_linea_negocio === parseInt(filters.linea))
    .map(p => ({
      'ID': `PRJ-${p.id.toString().substring(0, 4)}`,
      'Nombre del Proyecto': p.nombre,
      'Línea de Negocio': INITIAL_LINEAS.find(l => l.id === p.id_linea_negocio)?.nombre,
      'Estado': p.estado.toUpperCase()
    }));
};
