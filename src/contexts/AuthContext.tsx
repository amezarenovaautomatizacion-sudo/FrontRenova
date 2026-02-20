import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react';
import { authService } from '../services/api';

interface User {
  id: number;
  usuario: string;
  rol: string;
  activo: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usuario: string, contrasenia: string) => Promise<void>;
  loginWithUser: (usuario: string, contrasenia: string) => Promise<void>;
  logout: () => void;
  forceReauth: (usuario: string) => void;
  refreshAuth: () => Promise<boolean>;
  syncProfileData: (empleadoData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (userData: any): User => {
    return {
      id: userData.ID || userData.id,
      usuario: userData.Usuario || userData.usuario,
      rol: userData.Rol || userData.rol || 'employee',
      activo: userData.Activo || userData.activo || true
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('renova_token');
    const userData = localStorage.getItem('renova_user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = normalizeUser(parsedUser);
        setUser(normalizedUser);

        authService.verifyToken().catch((error) => {
          console.error('Error verificando token:', error);
          logout();
        });
      } catch {
        logout();
      }
    }

    setIsLoading(false);
  }, []);

  const syncProfileData = (empleadoData: any) => {
    try {
      localStorage.setItem('renova_empleado', JSON.stringify(empleadoData));
      
      if (empleadoData.NombreCompleto) {
        const userData = localStorage.getItem('renova_user');
        if (userData) {
          const userParsed = JSON.parse(userData);
          const updatedUser = {
            ...userParsed,
            nombreCompleto: empleadoData.NombreCompleto
          };
          localStorage.setItem('renova_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error al sincronizar datos del perfil:', error);
    }
  };

  const login = async (usuario: string, contrasenia: string) => {
    return await loginWithUser(usuario, contrasenia);
  };

  const loginWithUser = async (usuario: string, contrasenia: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(usuario, contrasenia);

      if (!response.success) {
        throw new Error(response.message || 'Error en el login');
      }

      const { token, user: userData, empleado } = response.data;

      const normalizedUser = normalizeUser(userData);

      localStorage.setItem('renova_token', token);
      localStorage.setItem('renova_user', JSON.stringify(normalizedUser));
      localStorage.setItem('renova_empleado', JSON.stringify(empleado));

      setUser(normalizedUser);
      
      return true;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || error.message || 'Error en el login'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('renova_token');
    localStorage.removeItem('renova_user');
    localStorage.removeItem('renova_empleado');
    setUser(null);
    window.location.href = '/login';
  };

  const forceReauth = (usuario: string) => {
    localStorage.setItem('reauth_user', usuario);
    logout();
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const response = await authService.verifyToken();

      if (response.success) {
        const profileResponse = await authService.profile();
        if (profileResponse.success) {
          const { user: userData, empleado } = profileResponse.data;
          
          localStorage.setItem('renova_user', JSON.stringify(userData));
          localStorage.setItem('renova_empleado', JSON.stringify(empleado));
          setUser(userData);
        }
        return true;
      }
    } catch (error) {
      console.error('Error al refrescar token:', error);
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithUser,
    logout,
    forceReauth,
    refreshAuth,
    syncProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};