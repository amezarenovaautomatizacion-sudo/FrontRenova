import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
  }
};

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
  }
};

export default api;