import api from './api';

export const authService = {
  // Login normal
  login: async (usuario: string, contrasenia: string) => {
    const response = await api.post('/auth/login', { usuario, contrasenia });
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
  }
};