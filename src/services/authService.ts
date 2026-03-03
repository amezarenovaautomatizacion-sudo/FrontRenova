import api from './api';

export interface ChangePasswordRequest {
  contraseniaActual: string;
  nuevaContrasenia: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const authService = {
  // Login normal
  login: async (usuario: string, contrasenia: string) => {
    const response = await api.post('/auth/login', { usuario, contrasenia });
    return response.data;
  },

  // Registro
  register: async (usuario: string, contrasenia: string) => {
    const response = await api.post('/auth/register', { usuario, contrasenia });
    return response.data;
  },

  // Obtener perfil
  profile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const token = localStorage.getItem('renova_token');
    if (!token) throw new Error('No hay token');
    
    const response = await api.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Verificar token
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Cambiar contraseña propia (requiere token)
  changeOwnPassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    try {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Error en changeOwnPassword:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar la contraseña'
      };
    }
  },

  // Cambiar contraseña de otro usuario (solo admin)
  changeUserPassword: async (userId: number, nuevaContrasenia: string): Promise<ChangePasswordResponse> => {
    try {
      const response = await api.put(`/auth/users/${userId}/change-password`, {
        nuevaContrasenia
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en changeUserPassword:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar la contraseña del usuario'
      };
    }
  }
};