import axios from 'axios';

// Cambiar process.env por import.meta.env para Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Interfaces para tipos
export interface UpdateEmpleadoData {
  nombreCompleto?: string;
  celular?: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefonoEmergencia?: string;
  departamentos?: number[];
  jefes?: number[];
  [key: string]: any;
}

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('renova_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('renova_token');
      localStorage.removeItem('renova_user');
      localStorage.removeItem('renova_empleado');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (usuario: string, contrasenia: string) => {
    const response = await api.post('/auth/login', { usuario, contrasenia });
    return response.data;
  },

  register: async (usuario: string, contrasenia: string) => {
    const response = await api.post('/auth/register', { usuario, contrasenia });
    return response.data;
  },

  profile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Cambiar contraseña propia (requiere token)
  changeOwnPassword: async (data: { contraseniaActual: string; nuevaContrasenia: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // Cambiar contraseña de otro usuario (solo admin)
  changeUserPassword: async (userId: number, nuevaContrasenia: string) => {
    const response = await api.put(`/auth/users/${userId}/change-password`, {
      nuevaContrasenia
    });
    return response.data;
  }
};

// Servicios de empleados
export const empleadoService = {
  // Obtener catálogos
  obtenerCatalogos: async () => {
    const response = await api.get('/empleados/catalogos');
    return response.data;
  },

  // Obtener perfil actualizado desde API
  obtenerPerfilActualizado: async (empleadoId: number) => {
    const response = await api.get(`/empleados/empleados/${empleadoId}`);
    return response.data;
  },

  // Actualizar perfil
  actualizarPerfil: async (empleadoId: number, data: UpdateEmpleadoData) => {
    const response = await api.put(`/empleados/empleados/${empleadoId}`, data);
    return response.data;
  },

  // Cambiar contraseña (versión antigua - mantener por compatibilidad)
  cambiarContrasenia: async (empleadoId: number, data: any) => {
    console.warn('cambiarContrasenia está obsoleto, usar authService.changeOwnPassword en su lugar');
    const response = await api.post(`/empleados/${empleadoId}/change-password`, data);
    return response.data;
  }
};

// Servicios de proyectos
export const proyectoService = {
  listarProyectos: async (params?: any) => {
    const response = await api.get('/proyectos', { params });
    return response.data;
  },

  obtenerProyecto: async (id: number) => {
    const response = await api.get(`/proyectos/${id}`);
    return response.data;
  },

  crearProyecto: async (data: any) => {
    const response = await api.post('/proyectos', data);
    return response.data;
  },

  actualizarProyecto: async (id: number, data: any) => {
    const response = await api.put(`/proyectos/${id}`, data);
    return response.data;
  },

  eliminarProyecto: async (id: number) => {
    const response = await api.delete(`/proyectos/${id}`);
    return response.data;
  },

  // Empleados del proyecto
  obtenerEmpleadosProyecto: async (proyectoId: number) => {
    const response = await api.get(`/proyectos/${proyectoId}/empleados`);
    return response.data;
  },

  asignarEmpleado: async (proyectoId: number, empleadoId: number) => {
    const response = await api.post(`/proyectos/${proyectoId}/empleados`, { empleadoId });
    return response.data;
  },

  quitarEmpleado: async (proyectoId: number, empleadoId: number) => {
    const response = await api.delete(`/proyectos/${proyectoId}/empleados/${empleadoId}`);
    return response.data;
  },

  // Empleados disponibles
  obtenerEmpleadosDisponibles: async (proyectoId: number, params?: any) => {
    const response = await api.get(`/proyectos/${proyectoId}/empleados/disponibles`, { params });
    return response.data;
  },

  buscarEmpleadosGenerales: async (proyectoId: number, params?: any) => {
    const response = await api.get(`/proyectos/${proyectoId}/empleados/buscar`, { params });
    return response.data;
  },

  // Historial
  obtenerHistorial: async (proyectoId: number) => {
    const response = await api.get(`/proyectos/${proyectoId}/historial`);
    return response.data;
  }
};

// Servicios de tareas
export const tareaService = {
  listarTareas: async (proyectoId: number, params?: any) => {
    const response = await api.get(`/proyectos/${proyectoId}/tareas`, { params });
    return response.data;
  },

  obtenerTarea: async (proyectoId: number, tareaId: number) => {
    const response = await api.get(`/proyectos/${proyectoId}/tareas/${tareaId}`);
    return response.data;
  },

  crearTarea: async (proyectoId: number, data: any) => {
    const response = await api.post(`/proyectos/${proyectoId}/tareas`, data);
    return response.data;
  },

  actualizarTarea: async (proyectoId: number, tareaId: number, data: any) => {
    const response = await api.put(`/proyectos/${proyectoId}/tareas/${tareaId}`, data);
    return response.data;
  },

  cambiarEstadoTarea: async (proyectoId: number, tareaId: number, estado: string) => {
    const response = await api.patch(`/proyectos/${proyectoId}/tareas/${tareaId}/estado`, { estado });
    return response.data;
  },

  eliminarTarea: async (proyectoId: number, tareaId: number) => {
    const response = await api.delete(`/proyectos/${proyectoId}/tareas/${tareaId}`);
    return response.data;
  },

  // Asignaciones
  asignarEmpleado: async (proyectoId: number, tareaId: number, empleadoId: number) => {
    const response = await api.post(`/proyectos/${proyectoId}/tareas/${tareaId}/asignar`, { empleadoId });
    return response.data;
  },

  reasignarTarea: async (proyectoId: number, tareaId: number, empleadoId: number | null) => {
    const response = await api.patch(`/proyectos/${proyectoId}/tareas/${tareaId}/reasignar`, { empleadoId });
    return response.data;
  },

  desasignarTarea: async (proyectoId: number, tareaId: number) => {
    const response = await api.delete(`/proyectos/${proyectoId}/tareas/${tareaId}/desasignar`);
    return response.data;
  },

  quitarAsignacion: async (proyectoId: number, tareaId: number, asignacionId: number) => {
    const response = await api.delete(`/proyectos/${proyectoId}/tareas/${tareaId}/asignaciones/${asignacionId}`);
    return response.data;
  }
};

// Servicios de notas
export const notaService = {
  listarNotas: async (proyectoId: number, tareaId: number) => {
    const response = await api.get(`/proyectos/${proyectoId}/tareas/${tareaId}/notas`);
    return response.data;
  },

  crearNota: async (proyectoId: number, tareaId: number, data: any) => {
    const response = await api.post(`/proyectos/${proyectoId}/tareas/${tareaId}/notas`, data);
    return response.data;
  },

  actualizarNota: async (proyectoId: number, tareaId: number, notaId: number, data: any) => {
    const response = await api.put(`/proyectos/${proyectoId}/tareas/${tareaId}/notas/${notaId}`, data);
    return response.data;
  },

  eliminarNota: async (proyectoId: number, tareaId: number, notaId: number) => {
    const response = await api.delete(`/proyectos/${proyectoId}/tareas/${tareaId}/notas/${notaId}`);
    return response.data;
  }
};

// Servicios de incidencias
export const incidenciaService = {
  listarIncidencias: async (params?: any) => {
    const response = await api.get('/incidencias', { params });
    return response.data;
  },

  obtenerIncidencia: async (id: number) => {
    const response = await api.get(`/incidencias/${id}`);
    return response.data;
  },

  crearIncidencia: async (data: any) => {
    const response = await api.post('/incidencias', data);
    return response.data;
  },

  actualizarIncidencia: async (id: number, data: any) => {
    const response = await api.put(`/incidencias/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, activo: boolean) => {
    const response = await api.patch(`/incidencias/${id}/estado`, { activo });
    return response.data;
  },

  // Tipos de incidencia
  obtenerTiposIncidencia: async () => {
    const response = await api.get('/incidencias/tipos');
    return response.data;
  },

  obtenerTodosTipos: async () => {
    const response = await api.get('/incidencias/tipos/todos');
    return response.data;
  },

  crearTipoIncidencia: async (data: any) => {
    const response = await api.post('/incidencias/tipos', data);
    return response.data;
  },

  actualizarTipoIncidencia: async (id: number, data: any) => {
    const response = await api.put(`/incidencias/tipos/${id}`, data);
    return response.data;
  },

  cambiarEstadoTipo: async (id: number, activo: boolean) => {
    const response = await api.patch(`/incidencias/tipos/${id}/estado`, { activo });
    return response.data;
  }
};

// Servicios de solicitudes (vacaciones, permisos, horas extras)
export const solicitudService = {
  // Vacaciones
  obtenerMisDerechos: async () => {
    const response = await api.get('/solicitudes/vacaciones/derechos');
    return response.data;
  },

  solicitarVacaciones: async (data: any) => {
    const response = await api.post('/solicitudes/vacaciones/solicitar', data);
    return response.data;
  },

  // Permisos
  solicitarPermiso: async (data: any) => {
    const response = await api.post('/solicitudes/permisos/solicitar', data);
    return response.data;
  },

  obtenerPermisosPendientes: async () => {
    const response = await api.get('/solicitudes/permisos/pendientes');
    return response.data;
  },

  // Horas extras
  solicitarHorasExtras: async (data: any) => {
    const response = await api.post('/solicitudes/horas-extras/solicitar', data);
    return response.data;
  },

  obtenerReporteHorasExtras: async (params?: any) => {
    const response = await api.get('/solicitudes/horas-extras/reporte', { params });
    return response.data;
  },

  // Aprobaciones
  obtenerSolicitudesPendientes: async () => {
    const response = await api.get('/solicitudes/aprobaciones/pendientes');
    return response.data;
  },

  procesarAprobacion: async (aprobacionId: number, estado: string, comentarios: string) => {
    const response = await api.patch(`/solicitudes/aprobaciones/${aprobacionId}/procesar`, {
      estado,
      comentarios
    });
    return response.data;
  },

  editarAprobacion: async (aprobacionId: number, estado: string, comentarios: string) => {
    const response = await api.patch(`/solicitudes/aprobaciones/${aprobacionId}/editar`, {
      estado,
      comentarios
    });
    return response.data;
  },

  // Mis solicitudes
  obtenerMisSolicitudes: async (params?: any) => {
    const response = await api.get('/solicitudes/mis-solicitudes', { params });
    return response.data;
  },

  obtenerMisSolicitudesAprobadas: async (params?: any) => {
    const response = await api.get('/solicitudes/mis-solicitudes/aprobadas', { params });
    return response.data;
  },

  // Todas las solicitudes (admin/manager)
  obtenerTodasSolicitudesAprobadas: async (params?: any) => {
    const response = await api.get('/solicitudes/aprobadas', { params });
    return response.data;
  },

  // Detalle
  obtenerDetalleSolicitud: async (solicitudId: number) => {
    const response = await api.get(`/solicitudes/detalle/${solicitudId}`);
    return response.data;
  },

  // Cancelar solicitud
  cancelarSolicitud: async (solicitudId: number, motivo: string) => {
    const response = await api.patch(`/solicitudes/${solicitudId}/cancelar`, { motivo });
    return response.data;
  }
};

// Servicios de notificaciones
export const notificacionService = {
  obtenerMisNotificaciones: async (params?: any) => {
    const response = await api.get('/notificaciones/personales', { params });
    return response.data;
  },

  obtenerResumen: async () => {
    const response = await api.get('/notificaciones/resumen');
    return response.data;
  },

  marcarComoVista: async (notificacionId: number) => {
    const response = await api.patch(`/notificaciones/personales/${notificacionId}/vista`);
    return response.data;
  },

  marcarComoLeida: async (notificacionId: number) => {
    const response = await api.patch(`/notificaciones/personales/${notificacionId}/leida`);
    return response.data;
  },

  eliminarNotificacion: async (notificacionId: number) => {
    const response = await api.delete(`/notificaciones/personales/${notificacionId}`);
    return response.data;
  },

  marcarTodasComoVistas: async () => {
    const response = await api.patch('/notificaciones/personales/marcar-todas-vistas');
    return response.data;
  },

  obtenerGenerales: async (params?: any) => {
    const response = await api.get('/notificaciones/generales', { params });
    return response.data;
  },

  marcarGeneralComoVista: async (notificacionId: number) => {
    const response = await api.patch(`/notificaciones/generales/${notificacionId}/vista`);
    return response.data;
  }
};

// Servicios de aprobadores
export const aprobadorService = {
  obtenerActivos: async () => {
    const response = await api.get('/aprobadores/activos');
    return response.data;
  },

  agregarAprobador: async (usuarioId: number) => {
    const response = await api.post('/aprobadores/agregar', { usuarioId });
    return response.data;
  },

  quitarAprobador: async (usuarioId: number) => {
    const response = await api.delete(`/aprobadores/quitar/${usuarioId}`);
    return response.data;
  },

  verificarAprobador: async (usuarioId: number) => {
    const response = await api.get(`/aprobadores/verificar/${usuarioId}`);
    return response.data;
  }
};

export default api;