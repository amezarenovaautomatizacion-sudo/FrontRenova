import api from './api';

interface CreateEmpleadoData {
  nombreCompleto: string;
  correoElectronico: string;
  contrasenia: string;
  fechaIngreso: string;
  fechaNacimiento: string;
  celular?: string;
  direccion?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp: string;
  departamentos: number[];
  jefes: number[];
}

interface UpdateEmpleadoData {
  nombreCompleto?: string;
  celular?: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp?: string;
  departamentos?: number[];
  jefes?: number[];
}

interface CambiarContraseniaData {
  contraseniaActual: string;
  nuevaContrasenia: string;
  confirmarContrasenia: string;
}

interface EmpleadoFilters {
  page?: number;
  limit?: number;
  search?: string;
  rol?: string;
  activo?: boolean;
}

export const empleadoService = {
  // Obtener catálogos
  obtenerCatalogos: async () => {
    const response = await api.get('/empleados/catalogos');
    return response.data;
  },

  // Obtener empleados con paginación y filtros
  obtenerEmpleados: async (filters: EmpleadoFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.rol) params.append('rol', filters.rol);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    
    const response = await api.get(`/empleados/empleados?${params}`);
    return response.data;
  },

  // Obtener empleado por ID
  obtenerEmpleado: async (id: number) => {
    const response = await api.get(`/empleados/empleados/${id}`);
    return response.data;
  },

  // Obtener datos sensibles (solo admin con reauth)
  obtenerDatosSensibles: async (id: number) => {
    const response = await api.get(`/empleados/empleados/${id}/sensible`);
    return response.data;
  },

  // Obtener todos los datos sensibles (solo admin)
  obtenerTodosSensibles: async () => {
    const response = await api.get('/empleados/sensibles');
    return response.data;
  },

  // Crear nuevo empleado
  crearEmpleado: async (data: CreateEmpleadoData) => {
    const response = await api.post('/empleados/empleados', data);
    return response.data;
  },

  // Actualizar empleado
  actualizarEmpleado: async (id: number, data: UpdateEmpleadoData) => {
    const response = await api.put(`/empleados/empleados/${id}`, data);
    return response.data;
  },

  // Actualizar perfil personal
  actualizarPerfil: async (empleadoId: number, data: UpdateEmpleadoData) => {
    const response = await api.put(`/empleados/empleados/${empleadoId}`, data);
    return response.data;
  },

  // Cambiar contraseña
  cambiarContrasenia: async (empleadoId: number, data: CambiarContraseniaData) => {
    // Solo enviamos la nueva contraseña
    const response = await api.put(`/empleados/empleados/${empleadoId}`, {
      contrasenia: data.nuevaContrasenia
    });
    return response.data;
  },

  // Cambiar estado del empleado (activar/desactivar)
  cambiarEstadoEmpleado: async (id: number, activo: boolean) => {
    const response = await api.patch(`/empleados/empleados/${id}/estado`, { activo });
    return response.data;
  },

  // Obtener mis permisos
  obtenerMisPermisos: async () => {
    const response = await api.get('/empleados/mis-permisos');
    return response.data;
  },

  // Obtener roles (solo admin)
  obtenerRoles: async () => {
    const response = await api.get('/empleados/roles');
    return response.data;
  },

  // Exportar empleados a CSV
  exportarEmpleados: async (filters: EmpleadoFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.rol) params.append('rol', filters.rol);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
    
    const response = await api.get(`/empleados/exportar?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};