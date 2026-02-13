import api from './api';

export const dashboardService = {
  // Obtener estadísticas del dashboard
  obtenerEstadisticas: async () => {
    try {
      const [empleadosRes, solicitudesRes, proyectosRes, notificacionesRes] = await Promise.allSettled([
        api.get('/empleados/empleados?page=1&limit=1'), // Solo para contar
        api.get('/solicitudes/mis-solicitudes?estado=pendiente'),
        api.get('/proyectos?page=1&limit=1'), // Solo para contar
        api.get('/notificaciones/resumen')
      ]);

      return {
        totalEmpleados: empleadosRes.status === 'fulfilled' ? empleadosRes.value.data.data?.pagination?.total || 0 : 0,
        solicitudesPendientes: solicitudesRes.status === 'fulfilled' ? solicitudesRes.value.data.data?.length || 0 : 0,
        totalProyectos: proyectosRes.status === 'fulfilled' ? proyectosRes.value.data.data?.pagination?.total || 0 : 0,
        notificacionesSinLeer: notificacionesRes.status === 'fulfilled' ? notificacionesRes.value.data.data?.sinLeer || 3 : 3
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        totalEmpleados: 0,
        solicitudesPendientes: 0,
        totalProyectos: 0,
        notificacionesSinLeer: 3
      };
    }
  },

  // Obtener mis solicitudes recientes
  obtenerMisSolicitudesRecientes: async () => {
    try {
      const response = await api.get('/solicitudes/mis-solicitudes?limit=5');
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      return [];
    }
  },

  // Obtener notificaciones recientes
  obtenerNotificacionesRecientes: async () => {
    try {
      const response = await api.get('/notificaciones/personales?limit=5');
      return response.data.data?.notificaciones || [];
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  },

  // Obtener proyectos activos
  obtenerProyectosActivos: async () => {
    try {
      const response = await api.get('/proyectos?estado=activo&limit=3');
      return response.data.data?.proyectos || [];
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      return [];
    }
  }
};