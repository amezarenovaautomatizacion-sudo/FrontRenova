import { useState, useEffect, useCallback } from 'react';
import { empleadoService } from '../services/empleadoService';
import { authService } from '../services/api';

interface Empleado {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  Celular?: string;
  FechaIngreso: string;
  FechaNacimiento?: string;
  Direccion?: string;
  NSS?: string;
  RFC?: string;
  CURP?: string;
  TelefonoEmergencia?: string;
  RolApp: 'admin' | 'manager' | 'employee';
  PuestoNombre?: string;
  PuestoDescripcion?: string;
  UsuarioActivo: boolean;
  departamentos?: any[];
  jefes?: any[];
  PuestoID?: number;
  UsuarioID?: number;
  Usuario?: {
    ID: number;
    Usuario: string;
    Rol: string;
    Activo: boolean;
  };
}

export const usePerfilData = () => {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos iniciales desde localStorage
  const cargarDesdeLocalStorage = useCallback(() => {
    try {
      const empleadoData = localStorage.getItem('renova_empleado');
      const userData = localStorage.getItem('renova_user');
      
      if (empleadoData && userData) {
        const empleadoParsed = JSON.parse(empleadoData);
        const userParsed = JSON.parse(userData);
        
        const empleadoCompleto = {
          ...empleadoParsed,
          Usuario: userParsed
        };
        
        setEmpleado(empleadoCompleto);
        return empleadoCompleto;
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
      setError('Error al cargar los datos del perfil');
    }
    return null;
  }, []);

  // Cargar datos frescos desde API
  const cargarDesdeAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Usar el endpoint de profile que ya tienes en authService
      const response = await authService.profile();
      
      if (response.success) {
        const { user: userData, empleado: empleadoData } = response.data;
        
        // Actualizar localStorage
        localStorage.setItem('renova_user', JSON.stringify(userData));
        localStorage.setItem('renova_empleado', JSON.stringify(empleadoData));
        
        const empleadoCompleto = {
          ...empleadoData,
          Usuario: userData
        };
        
        setEmpleado(empleadoCompleto);
        return empleadoCompleto;
      } else {
        // Si la API falla, intentar con localStorage
        return cargarDesdeLocalStorage();
      }
    } catch (err: any) {
      console.error('Error al cargar desde API:', err);
      // Fallback a localStorage
      return cargarDesdeLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [cargarDesdeLocalStorage]);

  // Actualizar empleado localmente (para actualizaciones inmediatas)
  const actualizarLocalmente = useCallback((datosActualizados: Partial<Empleado>) => {
    if (!empleado) return null;
    
    const empleadoActualizado = {
      ...empleado,
      ...datosActualizados
    };
    
    // Actualizar localStorage
    localStorage.setItem('renova_empleado', JSON.stringify(empleadoActualizado));
    
    // Actualizar estado
    setEmpleado(empleadoActualizado);
    
    return empleadoActualizado;
  }, [empleado]);

  // Refrescar datos (forzar recarga desde API)
  const refrescar = useCallback(async () => {
    return await cargarDesdeAPI();
  }, [cargarDesdeAPI]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDesdeLocalStorage();
  }, [cargarDesdeLocalStorage]);

  return {
    empleado,
    loading,
    error,
    cargarDesdeAPI,
    actualizarLocalmente,
    refrescar,
    setError
  };
};