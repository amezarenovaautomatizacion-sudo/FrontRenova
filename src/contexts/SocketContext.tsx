import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

// Extraer la URL base sin '/api'
const API_BASE_URL = 'http://localhost:3000';

// Intentar obtener la URL base de la configuración de axios
const getBaseUrl = () => {
  try {
    // Obtener la baseURL de la instancia de axios
    const baseURL = api.defaults.baseURL;
    if (baseURL) {
      // Remover '/api' del final
      return baseURL.replace('/api', '');
    }
  } catch (error) {
    console.error('Error obteniendo base URL:', error);
  }
  return 'http://localhost:3000'; // Fallback
};

const SOCKET_URL = getBaseUrl();
console.log('🔌 Socket URL:', SOCKET_URL);

interface SocketContextType {
  socket: Socket | null;
  conectado: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  conectado: false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const { user, token } = useAuth();

  // Solicitar permiso de notificaciones al iniciar
  useEffect(() => {
    if (user && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  // Conectar WebSocket
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConectado(false);
      }
      return;
    }

    console.log('🔌 Conectando a WebSocket...');
    
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado!');
      setConectado(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      setConectado(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error WebSocket:', error.message);
    });

    // ============ NOTIFICACIONES DEL NAVEGADOR ============
    
    // Notificación última no vista al conectar
    socketInstance.on('notificacion:ultima', (data) => {
      console.log('📨 Última notificación:', data);
      mostrarNotificacionNavegador(data.data, 'pendiente');
    });

    // Notificación general
    socketInstance.on('notificacion:general', (data) => {
      console.log('🌐 Notificación general:', data);
      mostrarNotificacionNavegador(data.data, 'general');
      
      // Disparar evento para actualizar UI
      window.dispatchEvent(new CustomEvent('refrescar-notificaciones'));
    });

    // Notificación importante
    socketInstance.on('notificacion:importante', (data) => {
      console.log('⚠️ Notificación importante:', data);
      mostrarNotificacionNavegador(data.data, 'importante', true);
      
      window.dispatchEvent(new CustomEvent('refrescar-notificaciones'));
    });

    // Notificación personal
    socketInstance.on('notificacion:nueva', (data) => {
      console.log('👤 Notificación personal:', data);
      mostrarNotificacionNavegador(data.data, 'personal');
      
      window.dispatchEvent(new CustomEvent('refrescar-notificaciones'));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  // Función para mostrar notificación del navegador
  const mostrarNotificacionNavegador = (notificacion: any, tipo: string, mantener: boolean = false) => {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('⚠️ Este navegador no soporta notificaciones de escritorio');
      return;
    }

    // Verificar permiso
    if (Notification.permission === 'granted') {
      const titulo = notificacion.Titulo || 'Nueva notificación';
      
      let cuerpo = notificacion.Mensaje || '';
      if (cuerpo.length > 100) {
        cuerpo = cuerpo.substring(0, 100) + '...';
      }

      // Opciones de la notificación
      const opciones: NotificationOptions = {
        body: cuerpo,
        badge: '',
        tag: `notif-${notificacion.ID}`,
        renotify: true,
        silent: !mantener,
        vibrate: mantener ? [200, 100, 200] : undefined,
        data: {
          id: notificacion.ID,
          tipo: tipo,
          url: '/notificaciones'
        }
      };

      // Crear y mostrar notificación
      const notification = new Notification(titulo, opciones);

      // Manejar clic en la notificación
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = '/notificaciones';
        notification.close();
      };

      // Auto-cerrar después de 5 segundos (excepto importantes)
      if (!mantener) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } else if (Notification.permission !== 'denied') {
      // Solicitar permiso si no ha sido denegado
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Reintentar mostrar notificación
          mostrarNotificacionNavegador(notificacion, tipo, mantener);
        }
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, conectado }}>
      {children}
    </SocketContext.Provider>
  );
};