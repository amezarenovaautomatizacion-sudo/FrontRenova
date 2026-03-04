import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Nav,
  ButtonGroup,
  Modal,
  Form,
  InputGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DataTable from 'react-data-table-component';
import {
  faBell,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faClock,
  faEnvelope,
  faEnvelopeOpen,
  faTrash,
  faCheck,
  faEye,
  faFilter,
  faSync,
  faGlobe,
  faUserPlus,
  faHourglassHalf,
  faUmbrellaBeach,
  faCalendarCheck,
  faUserCircle,
  faBullhorn,
  faEnvelopeOpenText,
  faPaperPlane,
  faBellSlash,
  faInbox,
  faHistory,
  faUserCheck,
  faCalendarAlt,
  faSort,
  faDownload,
  faSearch,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Notificacion {
  ID: number;
  Titulo: string;
  Mensaje: string;
  DatosExtra?: any;
  Estado: 'no_vista' | 'vista' | 'eliminada';
  Leido: 0 | 1;
  FechaVista?: string;
  FechaEliminada?: string;
  VigenciaDias: number;
  FechaExpiracion: string;
  Activo: boolean;
  createdAt: string;
  updatedAt: string;
  Tipo: string;
  Icono?: string;
  Color?: string;
  Prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  Usuario?: string;
  NombreEmpleado?: string;
}

interface NotificacionGeneral {
  ID: number;
  Titulo: string;
  Mensaje: string;
  DatosExtra?: any;
  Importante: number | boolean;
  VigenciaDias: number;
  FechaExpiracion: string;
  Activo: boolean;
  createdAt: string;
  updatedAt: string;
  CreadoPor?: number;
  CreadorNombre?: string;
  Tipo: string;
  Icono: string;
  Color: string;
  YaVista: number;
  FechaVista?: string;
}

interface VistaNotificacion {
  ID: number;
  NotificacionID: number;
  UsuarioID: number;
  Usuario: string;
  NombreEmpleado: string;
  FechaVista: string;
  createdAt: string;
  Titulo: string;
  Tipo: string;
}

interface TipoNotificacion {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  Icono?: string;
  Color?: string;
  Prioridad: string;
  Activo: boolean;
}

interface ResumenNotificaciones {
  total: number;
  no_vistas: number;
  no_leidas: number;
  importantes: number;
  ultima_notificacion: string;
}

interface ResumenVistas {
  total_vistas: number;
  vistas_hoy: number;
  vistas_semana: number;
  vistas_mes: number;
  usuarios_activos: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Estilos personalizados para DataTable
const customStyles = {
  headRow: {
    style: {
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '2px solid var(--border-color)',
    },
  },
  headCells: {
    style: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      padding: '12px 8px',
    },
  },
  rows: {
    style: {
      fontSize: '14px',
      color: 'var(--text-primary)',
      backgroundColor: 'var(--bg-primary)',
      '&:hover': {
        backgroundColor: 'var(--bg-soft)',
        cursor: 'pointer',
      },
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid var(--border-color)',
      marginTop: '0',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    },
    pageButtonsStyle: {
      color: 'var(--text-primary)',
      fill: 'var(--text-primary)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--bg-soft)',
      },
      '&:focus': {
        outline: 'none',
      },
    },
  },
  noData: {
    style: {
      color: 'var(--text-muted)',
      backgroundColor: 'var(--bg-primary)',
    },
  },
  progress: {
    style: {
      backgroundColor: 'var(--bg-primary)',
    },
  },
};

// Componente para los filtros personalizados
const FilterComponent = ({ filterText, onFilter, onClear, placeholder }: any) => (
  <div className="d-flex align-items-center">
    <InputGroup style={{ minWidth: '300px' }}>
      <InputGroup.Text>
        <FontAwesomeIcon icon={faSearch} />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={placeholder || "Buscar..."}
        value={filterText}
        onChange={onFilter}
        className="border-start-0"
      />
      {filterText && (
        <Button variant="outline-secondary" onClick={onClear}>
          Limpiar
        </Button>
      )}
    </InputGroup>
  </div>
);

const Notificaciones: React.FC = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.rol === 'admin';
  const canCreateGeneral = isAdmin;
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filteredNotificaciones, setFilteredNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesGenerales, setNotificacionesGenerales] = useState<NotificacionGeneral[]>([]);
  const [filteredNotificacionesGenerales, setFilteredNotificacionesGenerales] = useState<NotificacionGeneral[]>([]);
  const [vistasNotificaciones, setVistasNotificaciones] = useState<VistaNotificacion[]>([]);
  const [filteredVistasNotificaciones, setFilteredVistasNotificaciones] = useState<VistaNotificacion[]>([]);
  const [tiposNotificacion, setTiposNotificacion] = useState<TipoNotificacion[]>([]);
  const [resumen, setResumen] = useState<ResumenNotificaciones>({
    total: 0,
    no_vistas: 0,
    no_leidas: 0,
    importantes: 0,
    ultima_notificacion: ''
  });
  const [resumenVistas, setResumenVistas] = useState<ResumenVistas>({
    total_vistas: 0,
    vistas_hoy: 0,
    vistas_semana: 0,
    vistas_mes: 0,
    usuarios_activos: 0
  });
  
  const [loading, setLoading] = useState({
    notificaciones: true,
    generales: true,
    vistas: true,
    tipos: true,
    resumen: true,
    resumenVistas: true,
    create: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('personales');
  const [activeSubTab, setActiveSubTab] = useState('todas');
  const [activeVistasTab, setActiveVistasTab] = useState('generales');
  
  // Estados para DataTable
  const [filterText, setFilterText] = useState('');
  const [filterTextGenerales, setFilterTextGenerales] = useState('');
  const [filterTextVistas, setFilterTextVistas] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [resetPaginationToggleGenerales, setResetPaginationToggleGenerales] = useState(false);
  const [resetPaginationToggleVistas, setResetPaginationToggleVistas] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [perPageGenerales, setPerPageGenerales] = useState(10);
  const [perPageVistas, setPerPageVistas] = useState(10);
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [paginationGenerales, setPaginationGenerales] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [paginationVistas, setPaginationVistas] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    importante: false,
    prioridad: ''
  });
  const [filtrosGenerales, setFiltrosGenerales] = useState({
    importante: false,
    vista: ''
  });
  const [filtrosVistas, setFiltrosVistas] = useState({
    fechaInicio: '',
    fechaFin: '',
    usuario: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFiltrosGenerales, setMostrarFiltrosGenerales] = useState(false);
  const [mostrarFiltrosVistas, setMostrarFiltrosVistas] = useState(false);
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');
  
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedNotificacion, setSelectedNotificacion] = useState<Notificacion | NotificacionGeneral | null>(null);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [notificacionAEliminar, setNotificacionAEliminar] = useState<Notificacion | NotificacionGeneral | null>(null);
  const [showDetalleVistaModal, setShowDetalleVistaModal] = useState(false);
  const [selectedVista, setSelectedVista] = useState<VistaNotificacion | null>(null);
  
  const [showCrearGeneralModal, setShowCrearGeneralModal] = useState(false);
  const [nuevaNotificacionGeneral, setNuevaNotificacionGeneral] = useState({
    titulo: '',
    mensaje: '',
    tipoNotificacionId: 15,
    importante: false,
    vigenciaDias: 30,
    datosExtra: null
  });

  const cargarResumen = useCallback(async () => {
    try {
      const response = await api.get('/notificaciones/resumen');
      if (response.data.success) {
        setResumen(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando resumen:', error);
    } finally {
      setLoading(prev => ({ ...prev, resumen: false }));
    }
  }, []);

  const cargarResumenVistas = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, resumenVistas: true }));
      const response = await api.get('/notificaciones/vistas/resumen');
      if (response.data.success) {
        setResumenVistas(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando resumen de vistas:', error);
    } finally {
      setLoading(prev => ({ ...prev, resumenVistas: false }));
    }
  }, []);

  const cargarTiposNotificacion = useCallback(async () => {
    try {
      const response = await api.get('/notificaciones/tipos');
      if (response.data.success) {
        setTiposNotificacion(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando tipos:', error);
    } finally {
      setLoading(prev => ({ ...prev, tipos: false }));
    }
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, notificaciones: true }));
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '100'
      });
      
      if (activeSubTab === 'no_vistas') {
        params.set('estado', 'no_vista');
      } else if (activeSubTab === 'importantes') {
        params.set('importante', 'true');
      }
      
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
      
      if (filtros.importante && activeSubTab !== 'importantes') {
        params.append('importante', 'true');
      }
      
      const response = await api.get(`/notificaciones/personales?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        const notificacionesData = data.notificaciones || [];
        
        const notificacionesOrdenadas = [...notificacionesData].sort((a: Notificacion, b: Notificacion) => {
          const fechaA = new Date(a.createdAt).getTime();
          const fechaB = new Date(b.createdAt).getTime();
          return orden === 'desc' ? fechaB - fechaA : fechaA - fechaB;
        });
        
        setNotificaciones(notificacionesOrdenadas);
        setFilteredNotificaciones(notificacionesOrdenadas);
        setPagination({
          page: data.pagination?.page || pagination.page,
          limit: data.pagination?.limit || pagination.limit,
          total: data.pagination?.total || notificacionesOrdenadas.length,
          totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || notificacionesOrdenadas.length) / pagination.limit)
        });
      }
    } catch (error: any) {
      console.error('Error cargando notificaciones:', error);
      setError('Error al cargar las notificaciones');
      setNotificaciones([]);
      setFilteredNotificaciones([]);
    } finally {
      setLoading(prev => ({ ...prev, notificaciones: false }));
    }
  }, [pagination.page, filtros.tipo, filtros.prioridad, filtros.importante, activeSubTab, orden]);

  const cargarNotificacionesGenerales = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, generales: true }));
      
      const params = new URLSearchParams({
        page: paginationGenerales.page.toString(),
        limit: '100'
      });
      
      if (filtrosGenerales.importante) params.append('importante', 'true');
      if (filtrosGenerales.vista) params.append('vista', filtrosGenerales.vista);
      
      const response = await api.get(`/notificaciones/generales?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        const notificacionesData = data.notificaciones || [];
        setNotificacionesGenerales(notificacionesData);
        setFilteredNotificacionesGenerales(notificacionesData);
        setPaginationGenerales({
          page: data.pagination?.page || paginationGenerales.page,
          limit: data.pagination?.limit || paginationGenerales.limit,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        });
      }
    } catch (error) {
      console.error('Error cargando notificaciones generales:', error);
      setNotificacionesGenerales([]);
      setFilteredNotificacionesGenerales([]);
    } finally {
      setLoading(prev => ({ ...prev, generales: false }));
    }
  }, [paginationGenerales.page, filtrosGenerales.importante, filtrosGenerales.vista]);

  const cargarVistasNotificaciones = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, vistas: true }));
      
      const params = new URLSearchParams({
        page: paginationVistas.page.toString(),
        limit: '100',
        tipo: activeVistasTab
      });
      
      if (filtrosVistas.fechaInicio) params.append('fechaInicio', filtrosVistas.fechaInicio);
      if (filtrosVistas.fechaFin) params.append('fechaFin', filtrosVistas.fechaFin);
      if (filtrosVistas.usuario) params.append('usuario', filtrosVistas.usuario);
      
      const response = await api.get(`/notificaciones/vistas?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        const vistasData = data.vistas || [];
        setVistasNotificaciones(vistasData);
        setFilteredVistasNotificaciones(vistasData);
        setPaginationVistas({
          page: data.pagination?.page || paginationVistas.page,
          limit: data.pagination?.limit || paginationVistas.limit,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        });
      }
    } catch (error) {
      console.error('Error cargando vistas de notificaciones:', error);
      setVistasNotificaciones([]);
      setFilteredVistasNotificaciones([]);
    } finally {
      setLoading(prev => ({ ...prev, vistas: false }));
    }
  }, [paginationVistas.page, filtrosVistas.fechaInicio, filtrosVistas.fechaFin, filtrosVistas.usuario, activeVistasTab]);

  // Filtrado en tiempo real para notificaciones personales
  useEffect(() => {
    if (!filterText) {
      setFilteredNotificaciones(notificaciones);
    } else {
      const filtered = notificaciones.filter(notif => {
        const searchTerm = filterText.toLowerCase();
        return (
          notif.Titulo.toLowerCase().includes(searchTerm) ||
          (notif.Mensaje && notif.Mensaje.toLowerCase().includes(searchTerm)) ||
          (notif.Tipo && notif.Tipo.toLowerCase().includes(searchTerm)) ||
          (notif.Usuario && notif.Usuario.toLowerCase().includes(searchTerm)) ||
          (notif.NombreEmpleado && notif.NombreEmpleado.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredNotificaciones(filtered);
    }
  }, [filterText, notificaciones]);

  // Filtrado en tiempo real para notificaciones generales
  useEffect(() => {
    if (!filterTextGenerales) {
      setFilteredNotificacionesGenerales(notificacionesGenerales);
    } else {
      const filtered = notificacionesGenerales.filter(notif => {
        const searchTerm = filterTextGenerales.toLowerCase();
        return (
          notif.Titulo.toLowerCase().includes(searchTerm) ||
          (notif.Mensaje && notif.Mensaje.toLowerCase().includes(searchTerm)) ||
          (notif.CreadorNombre && notif.CreadorNombre.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredNotificacionesGenerales(filtered);
    }
  }, [filterTextGenerales, notificacionesGenerales]);

  // Filtrado en tiempo real para vistas
  useEffect(() => {
    if (!filterTextVistas) {
      setFilteredVistasNotificaciones(vistasNotificaciones);
    } else {
      const filtered = vistasNotificaciones.filter(vista => {
        const searchTerm = filterTextVistas.toLowerCase();
        return (
          (vista.Usuario && vista.Usuario.toLowerCase().includes(searchTerm)) ||
          (vista.NombreEmpleado && vista.NombreEmpleado.toLowerCase().includes(searchTerm)) ||
          (vista.Titulo && vista.Titulo.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredVistasNotificaciones(filtered);
    }
  }, [filterTextVistas, vistasNotificaciones]);

  useEffect(() => {
    cargarResumen();
    cargarTiposNotificacion();
    cargarNotificacionesGenerales();
    if (isAdmin) {
      cargarResumenVistas();
    }
  }, [cargarResumen, cargarTiposNotificacion, cargarNotificacionesGenerales, cargarResumenVistas, isAdmin]);

  useEffect(() => {
    if (activeTab === 'personales') {
      cargarNotificaciones();
    }
  }, [
    activeTab,
    pagination.page,
    filtros.tipo,
    filtros.prioridad,
    filtros.importante,
    activeSubTab,
    orden,
    cargarNotificaciones
  ]);

  useEffect(() => {
    if (activeTab === 'generales') {
      cargarNotificacionesGenerales();
    }
  }, [
    activeTab,
    paginationGenerales.page,
    filtrosGenerales.importante,
    filtrosGenerales.vista,
    cargarNotificacionesGenerales
  ]);

  useEffect(() => {
    if (activeTab === 'vistas' && isAdmin) {
      cargarVistasNotificaciones();
    }
  }, [
    activeTab,
    activeVistasTab,
    paginationVistas.page,
    filtrosVistas.fechaInicio,
    filtrosVistas.fechaFin,
    filtrosVistas.usuario,
    cargarVistasNotificaciones,
    isAdmin
  ]);

  useEffect(() => {
    const refrescarNotificaciones = () => {
      console.log('🔄 Refrescando notificaciones por evento WebSocket');
      if (activeTab === 'personales') {
        cargarNotificaciones();
      } else if (activeTab === 'generales') {
        cargarNotificacionesGenerales();
      }
      cargarResumen();
    };

    window.addEventListener('refrescar-notificaciones', refrescarNotificaciones);
    
    return () => {
      window.removeEventListener('refrescar-notificaciones', refrescarNotificaciones);
    };
  }, [activeTab, cargarNotificaciones, cargarNotificacionesGenerales, cargarResumen]);

  const marcarComoVista = async (notificacionId: number) => {
    try {
      const response = await api.patch(`/notificaciones/personales/${notificacionId}/vista`);
      
      if (response.data.success) {
        setNotificaciones(prev =>
          prev.map(n =>
            n.ID === notificacionId
              ? { ...n, Estado: 'vista', FechaVista: new Date().toISOString() }
              : n
          )
        );
        setFilteredNotificaciones(prev =>
          prev.map(n =>
            n.ID === notificacionId
              ? { ...n, Estado: 'vista', FechaVista: new Date().toISOString() }
              : n
          )
        );
        cargarResumen();
        if (isAdmin) cargarResumenVistas();
        setSuccess('Notificación marcada como vista');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error marcando como vista:', error);
      setError('Error al marcar la notificación');
    }
  };

  const marcarGeneralComoVista = async (notificacionId: number) => {
    try {
      const response = await api.patch(`/notificaciones/generales/${notificacionId}/vista`);
      
      if (response.data.success) {
        setNotificacionesGenerales(prev =>
          prev.map(n =>
            n.ID === notificacionId
              ? { ...n, YaVista: 1, FechaVista: new Date().toISOString() }
              : n
          )
        );
        setFilteredNotificacionesGenerales(prev =>
          prev.map(n =>
            n.ID === notificacionId
              ? { ...n, YaVista: 1, FechaVista: new Date().toISOString() }
              : n
          )
        );
        if (isAdmin) cargarResumenVistas();
        setSuccess('Notificación general marcada como vista');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error marcando general como vista:', error);
      setError('Error al marcar la notificación general');
    }
  };

  const eliminarNotificacion = async () => {
    if (!notificacionAEliminar) return;
    
    try {
      const isGeneral = 'YaVista' in notificacionAEliminar;
      const endpoint = isGeneral 
        ? `/notificaciones/generales/${notificacionAEliminar.ID}`
        : `/notificaciones/personales/${notificacionAEliminar.ID}`;
      
      const response = await api.delete(endpoint);
      
      if (response.data.success) {
        if (isGeneral) {
          setNotificacionesGenerales(prev => prev.filter(n => n.ID !== notificacionAEliminar.ID));
          setFilteredNotificacionesGenerales(prev => prev.filter(n => n.ID !== notificacionAEliminar.ID));
          cargarNotificacionesGenerales();
        } else {
          setNotificaciones(prev => prev.filter(n => n.ID !== notificacionAEliminar.ID));
          setFilteredNotificaciones(prev => prev.filter(n => n.ID !== notificacionAEliminar.ID));
          cargarResumen();
        }
        if (isAdmin) cargarResumenVistas();
        setShowEliminarModal(false);
        setNotificacionAEliminar(null);
        setSuccess(isGeneral ? 'Notificación general eliminada' : 'Notificación eliminada');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      setError('Error al eliminar la notificación');
    }
  };

  const marcarTodasComoVistas = async () => {
    try {
      const response = await api.patch('/notificaciones/personales/marcar-todas-vistas');
      
      if (response.data.success) {
        setNotificaciones(prev =>
          prev.map(n => ({
            ...n,
            Estado: 'vista',
            FechaVista: new Date().toISOString()
          }))
        );
        setFilteredNotificaciones(prev =>
          prev.map(n => ({
            ...n,
            Estado: 'vista',
            FechaVista: new Date().toISOString()
          }))
        );
        cargarResumen();
        if (isAdmin) cargarResumenVistas();
        setSuccess(`Se marcaron ${response.data.data.afectadas} notificaciones como vistas`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error marcando todas como vistas:', error);
      setError('Error al marcar las notificaciones');
    }
  };

  const crearNotificacionGeneral = async () => {
    if (!canCreateGeneral) return;
    
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError('');
      
      if (!nuevaNotificacionGeneral.titulo || !nuevaNotificacionGeneral.mensaje) {
        setError('El título y mensaje son requeridos');
        return;
      }
      
      const response = await api.post('/notificaciones/generales', nuevaNotificacionGeneral);
      
      if (response.data.success) {
        setSuccess('Notificación general creada exitosamente');
        setShowCrearGeneralModal(false);
        setNuevaNotificacionGeneral({
          titulo: '',
          mensaje: '',
          tipoNotificacionId: 15,
          importante: false,
          vigenciaDias: 30,
          datosExtra: null
        });
        cargarNotificacionesGenerales();
        if (isAdmin) cargarResumenVistas();
      }
    } catch (error) {
      console.error('Error creando notificación general:', error);
      setError('Error al crear la notificación general');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const formatFechaHora = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatFechaRelativa = (fecha: string) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diffMs = ahora.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHoras = Math.floor(diffMs / 3600000);
      const diffDias = Math.floor(diffMs / 86400000);
      
      if (diffMin < 1) return 'Ahora mismo';
      if (diffMin < 60) return `Hace ${diffMin} minutos`;
      if (diffHoras < 24) return `Hace ${diffHoras} horas`;
      if (diffDias === 1) return 'Ayer';
      if (diffDias < 7) return `Hace ${diffDias} días`;
      return formatFechaHora(fecha);
    } catch {
      return formatFechaHora(fecha);
    }
  };

  const getIconoNotificacion = (tipo: string, prioridad: string, isGeneral: boolean = false) => {
    if (isGeneral) return faGlobe;
    
    const iconos: Record<string, any> = {
      'solicitud_vacaciones_creada': faUmbrellaBeach,
      'solicitud_vacaciones_aprobada': faCheckCircle,
      'solicitud_vacaciones_rechazada': faTimesCircle,
      'solicitud_permiso_creada': faCalendarCheck,
      'solicitud_permiso_aprobada': faCheckCircle,
      'solicitud_permiso_rechazada': faTimesCircle,
      'solicitud_horas_extras_creada': faClock,
      'solicitud_horas_extras_aprobada': faCheckCircle,
      'solicitud_horas_extras_rechazada': faTimesCircle,
      'nuevo_empleado_registrado': faUserPlus,
      'aprobacion_pendiente': faHourglassHalf,
      'incidencia_registrada': faExclamationTriangle,
      'notificacion_general': faBell,
      'notificacion_importante': faExclamationCircle
    };
    
    return iconos[tipo] || (prioridad === 'urgente' || prioridad === 'alta' ? faExclamationCircle : faBell);
  };

  const getColorNotificacion = (tipo: string, prioridad: string, estado: string, isGeneral: boolean = false) => {
    if (isGeneral) return 'info';
    if (estado === 'no_vista') return '';
    
    const colores: Record<string, string> = {
      'solicitud_vacaciones_aprobada': 'success',
      'solicitud_permiso_aprobada': 'success',
      'solicitud_horas_extras_aprobada': 'success',
      'solicitud_vacaciones_rechazada': 'danger',
      'solicitud_permiso_rechazada': 'danger',
      'solicitud_horas_extras_rechazada': 'danger',
      'aprobacion_pendiente': 'warning',
      'incidencia_registrada': 'danger'
    };
    
    return colores[tipo] || (prioridad === 'urgente' ? 'danger' : prioridad === 'alta' ? 'warning' : 'info');
  };

  const getBadgePrioridad = (prioridad: string) => {
    const colores = {
      baja: 'secondary',
      media: 'info',
      alta: 'warning',
      urgente: 'danger'
    };
    
    return (
      <Badge bg={colores[prioridad as keyof typeof colores] || 'secondary'} pill>
        {prioridad.toUpperCase()}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    return estado === 'no_vista' ? (
      <Badge bg="danger" pill>Nueva</Badge>
    ) : (
      <Badge bg="secondary" pill>Vista</Badge>
    );
  };

  const isNotificacionGeneral = (notificacion: Notificacion | NotificacionGeneral): notificacion is NotificacionGeneral => {
    return 'YaVista' in notificacion;
  };

  // Definición de columnas para DataTable - Notificaciones Personales
  const columnsPersonales = [
    {
      name: 'Estado',
      selector: (row: Notificacion) => row.Estado,
      sortable: true,
      cell: (row: Notificacion) => getEstadoBadge(row.Estado),
      width: '100px',
    },
    {
      name: 'Prioridad',
      selector: (row: Notificacion) => row.Prioridad,
      sortable: true,
      cell: (row: Notificacion) => getBadgePrioridad(row.Prioridad),
      width: '100px',
    },
    {
      name: 'Título',
      selector: (row: Notificacion) => row.Titulo,
      sortable: true,
      cell: (row: Notificacion) => (
        <div className="d-flex align-items-center">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: `var(--bs-${getColorNotificacion(row.Tipo, row.Prioridad, row.Estado)}-bg)`,
              color: `var(--bs-${getColorNotificacion(row.Tipo, row.Prioridad, row.Estado)})`
            }}
          >
            <FontAwesomeIcon 
              icon={getIconoNotificacion(row.Tipo, row.Prioridad)} 
              size="sm"
            />
          </div>
          <div>
            <strong>{row.Titulo}</strong>
            <div className="small text-muted">{row.Tipo?.replace(/_/g, ' ')}</div>
          </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Mensaje',
      selector: (row: Notificacion) => row.Mensaje,
      sortable: true,
      cell: (row: Notificacion) => (
        <div className="text-truncate" style={{ maxWidth: '300px' }}>
          {row.Mensaje && row.Mensaje.length > 100
            ? `${row.Mensaje.substring(0, 100)}...`
            : row.Mensaje}
        </div>
      ),
      grow: 3,
    },
    {
      name: 'Fecha',
      selector: (row: Notificacion) => row.createdAt,
      sortable: true,
      cell: (row: Notificacion) => (
        <div>
          <div>{formatFechaHora(row.createdAt)}</div>
          <small className="text-muted">{formatFechaRelativa(row.createdAt)}</small>
        </div>
      ),
    },
    {
      name: 'Destinatario',
      selector: (row: Notificacion) => row.NombreEmpleado || row.Usuario || '',
      sortable: true,
      cell: (row: Notificacion) => (
        <div>
          <div>{row.NombreEmpleado || 'Usuario'}</div>
          {row.Usuario && <small className="text-muted">@{row.Usuario}</small>}
        </div>
      ),
    },
    {
      name: 'Acciones',
      cell: (row: Notificacion) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNotificacion(row);
              setShowDetalleModal(true);
              if (row.Estado === 'no_vista') {
                marcarComoVista(row.ID);
              }
            }}
            title="Ver detalles"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faEye} />
          </Button>
          <Button
            variant="outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              setNotificacionAEliminar(row);
              setShowEliminarModal(true);
            }}
            title="Eliminar"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </ButtonGroup>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  // Definición de columnas para DataTable - Notificaciones Generales
  const columnsGenerales = [
    {
      name: 'Estado',
      selector: (row: NotificacionGeneral) => row.YaVista === 1 ? 'Vista' : 'No vista',
      sortable: true,
      cell: (row: NotificacionGeneral) => (
        <Badge bg={row.YaVista === 1 ? 'secondary' : 'success'} pill>
          {row.YaVista === 1 ? 'Vista' : 'No vista'}
        </Badge>
      ),
      width: '100px',
    },
    {
      name: 'Importancia',
      selector: (row: NotificacionGeneral) => row.Importante ? 'Importante' : 'Normal',
      sortable: true,
      cell: (row: NotificacionGeneral) => row.Importante ? (
        <Badge bg="danger" pill>IMPORTANTE</Badge>
      ) : (
        <Badge bg="secondary" pill>Normal</Badge>
      ),
      width: '100px',
    },
    {
      name: 'Título',
      selector: (row: NotificacionGeneral) => row.Titulo,
      sortable: true,
      cell: (row: NotificacionGeneral) => (
        <div className="d-flex align-items-center">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: `var(--bs-${row.Importante ? 'danger' : 'info'}-bg)`,
              color: `var(--bs-${row.Importante ? 'danger' : 'info'})`
            }}
          >
            <FontAwesomeIcon 
              icon={row.Importante ? faExclamationCircle : faGlobe} 
              size="sm"
            />
          </div>
          <strong>{row.Titulo}</strong>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Mensaje',
      selector: (row: NotificacionGeneral) => row.Mensaje,
      sortable: true,
      cell: (row: NotificacionGeneral) => (
        <div className="text-truncate" style={{ maxWidth: '300px' }}>
          {row.Mensaje && row.Mensaje.length > 100
            ? `${row.Mensaje.substring(0, 100)}...`
            : row.Mensaje}
        </div>
      ),
      grow: 3,
    },
    {
      name: 'Fecha',
      selector: (row: NotificacionGeneral) => row.createdAt,
      sortable: true,
      cell: (row: NotificacionGeneral) => (
        <div>
          <div>{formatFechaHora(row.createdAt)}</div>
          <small className="text-muted">{formatFechaRelativa(row.createdAt)}</small>
        </div>
      ),
    },
    {
      name: 'Creado por',
      selector: (row: NotificacionGeneral) => row.CreadorNombre || 'Sistema',
      sortable: true,
      cell: (row: NotificacionGeneral) => (
        <div>{row.CreadorNombre || 'Sistema'}</div>
      ),
    },
    {
      name: 'Acciones',
      cell: (row: NotificacionGeneral) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNotificacion(row);
              setShowDetalleModal(true);
              if (row.YaVista === 0) {
                marcarGeneralComoVista(row.ID);
              }
            }}
            title="Ver detalles"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faEye} />
          </Button>
          {canCreateGeneral && (
            <Button
              variant="outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                setNotificacionAEliminar(row);
                setShowEliminarModal(true);
              }}
              title="Eliminar"
              className="hover-bg-soft"
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          )}
        </ButtonGroup>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  // Definición de columnas para DataTable - Vistas
  const columnsVistas = [
    {
      name: 'Usuario',
      selector: (row: VistaNotificacion) => row.NombreEmpleado || row.Usuario,
      sortable: true,
      cell: (row: VistaNotificacion) => (
        <div>
          <div className="fw-bold">{row.NombreEmpleado || row.Usuario}</div>
          <small className="text-muted">@{row.Usuario}</small>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Notificación',
      selector: (row: VistaNotificacion) => row.Titulo,
      sortable: true,
      cell: (row: VistaNotificacion) => (
        <div>
          <div>{row.Titulo}</div>
          <small className="text-muted">{row.Tipo === 'generales' ? 'General' : 'Personal'}</small>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Fecha de Vista',
      selector: (row: VistaNotificacion) => row.FechaVista,
      sortable: true,
      cell: (row: VistaNotificacion) => (
        <div>
          <div>{formatFechaHora(row.FechaVista)}</div>
          <small className="text-muted">{formatFechaRelativa(row.FechaVista)}</small>
        </div>
      ),
    },
    {
      name: 'Acciones',
      cell: (row: VistaNotificacion) => (
        <Button
          variant="outline-info"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedVista(row);
            setShowDetalleVistaModal(true);
          }}
          title="Ver detalles"
          className="hover-bg-soft"
        >
          <FontAwesomeIcon icon={faEye} />
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  if (!user) {
    return (
      <Container fluid className="py-4">
        <Alert variant="warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          Debes iniciar sesión para ver tus notificaciones.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 text-primary">
                <FontAwesomeIcon icon={faBell} className="me-2" />
                Centro de Notificaciones
              </h2>
            </div>
            
            <div className="d-flex gap-2">
              {canCreateGeneral && (
                <Button 
                  variant="success" 
                  onClick={() => setShowCrearGeneralModal(true)}
                  className="shadow-sm"
                >
                  <FontAwesomeIcon icon={faBullhorn} className="me-2" />
                  Nueva Notificación General
                </Button>
              )}
              <ButtonGroup className="shadow-sm">
                <Button 
                  variant="outline-primary" 
                  onClick={() => {
                    if (activeTab === 'personales') {
                      cargarNotificaciones();
                    } else if (activeTab === 'generales') {
                      cargarNotificacionesGenerales();
                    } else if (activeTab === 'vistas' && isAdmin) {
                      cargarVistasNotificaciones();
                    }
                  }}
                  disabled={loading.notificaciones || loading.generales || loading.vistas}
                  className="hover-bg-soft"
                >
                  <FontAwesomeIcon icon={faSync} className={`me-2 ${loading.notificaciones || loading.generales || loading.vistas ? 'fa-spin' : ''}`} />
                  Actualizar
                </Button>
                {activeTab === 'personales' && resumen.no_vistas > 0 && (
                  <Button 
                    variant="outline-success"
                    onClick={marcarTodasComoVistas}
                    className="hover-bg-soft"
                  >
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Marcar todas como vistas
                  </Button>
                )}
              </ButtonGroup>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4 shadow-sm">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong className="me-2">Error:</strong>
            {error}
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4 shadow-sm">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
            <strong className="me-2">Éxito:</strong>
            {success}
          </div>
        </Alert>
      )}

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'personales')}>
            <Nav.Item>
              <Nav.Link eventKey="personales">
                <FontAwesomeIcon icon={faInbox} className="me-2" />
                Mis Notificaciones
                {resumen.no_vistas > 0 && (
                  <Badge bg="danger" className="ms-2">{resumen.no_vistas}</Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="generales">
                <FontAwesomeIcon icon={faGlobe} className="me-2" />
                Generales
                <Badge bg="info" className="ms-2">{paginationGenerales.total}</Badge>
              </Nav.Link>
            </Nav.Item>
            {isAdmin && (
              <Nav.Item>
                <Nav.Link eventKey="vistas">
                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                  Historial de Vistas
                  <Badge bg="secondary" className="ms-2">{paginationVistas.total}</Badge>
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </Card.Header>

        <Card.Body>
          {activeTab === 'personales' && (
            <>
              {!loading.resumen && (
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-primary text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small>Total</small>
                            <h2 className="mb-0 fw-bold">{resumen.total}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faEnvelope} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-danger text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small>No vistas</small>
                            <h2 className="mb-0 fw-bold">{resumen.no_vistas}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faEnvelopeOpen} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-warning text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small>Importantes</small>
                            <h2 className="mb-0 fw-bold">{resumen.importantes}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faExclamationCircle} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-info text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small>No leídas</small>
                            <h2 className="mb-0 fw-bold">{resumen.no_leidas}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faEnvelopeOpenText} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              <Nav variant="pills" className="mb-4" activeKey={activeSubTab} onSelect={(k) => setActiveSubTab(k || 'todas')}>
                <Nav.Item>
                  <Nav.Link eventKey="todas">Todas</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="no_vistas">
                    No vistas {resumen.no_vistas > 0 && <Badge bg="danger" className="ms-1">{resumen.no_vistas}</Badge>}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="importantes">
                    Importantes {resumen.importantes > 0 && <Badge bg="warning" className="ms-1">{resumen.importantes}</Badge>}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Card className="bg-light border-0 mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                      <h6 className="mb-0">Filtros</h6>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                      {mostrarFiltros ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  
                  {mostrarFiltros && (
                    <Row className="mt-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Tipo</Form.Label>
                          <Form.Select
                            size="sm"
                            value={filtros.tipo}
                            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                          >
                            <option value="">Todos</option>
                            {tiposNotificacion.map(tipo => (
                              <option key={tipo.ID} value={tipo.Nombre}>
                                {tipo.Nombre.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Prioridad</Form.Label>
                          <Form.Select
                            size="sm"
                            value={filtros.prioridad}
                            onChange={(e) => setFiltros({...filtros, prioridad: e.target.value})}
                          >
                            <option value="">Todas</option>
                            <option value="urgente">Urgente</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">&nbsp;</Form.Label>
                          <div>
                            <Form.Check
                              type="checkbox"
                              label="Solo importantes"
                              checked={filtros.importante}
                              onChange={(e) => setFiltros({...filtros, importante: e.target.checked})}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-0">
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <h6 className="mb-0">
                        <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                        Búsqueda y filtros
                      </h6>
                    </div>
                  </div>
                  <div className="p-3">
                    <FilterComponent
                      filterText={filterText}
                      onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
                      onClear={() => setFilterText('')}
                      placeholder="Buscar por título, mensaje, tipo, destinatario..."
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                  {loading.notificaciones ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Cargando notificaciones...</p>
                    </div>
                  ) : filteredNotificaciones.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faBellSlash} size="3x" className="text-muted" />
                      </div>
                      <h5 className="fw-normal">No hay notificaciones</h5>
                      <p className="text-muted">
                        {filterText 
                          ? 'No se encontraron resultados para tu búsqueda'
                          : activeSubTab === 'no_vistas' 
                          ? 'No tienes notificaciones sin ver' 
                          : activeSubTab === 'importantes'
                          ? 'No tienes notificaciones importantes'
                          : 'No hay notificaciones para mostrar'}
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      columns={columnsPersonales}
                      data={filteredNotificaciones}
                      pagination
                      paginationPerPage={perPage}
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                      onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                      highlightOnHover
                      pointerOnHover
                      selectableRows
                      selectableRowsHighlight
                      onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                      clearSelectedRows={toggleCleared}
                      onRowClicked={(row) => {
                        setSelectedNotificacion(row);
                        setShowDetalleModal(true);
                        if (row.Estado === 'no_vista') {
                          marcarComoVista(row.ID);
                        }
                      }}
                      responsive
                      customStyles={customStyles}
                      progressPending={loading.notificaciones}
                      progressComponent={
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando datos...</p>
                        </div>
                      }
                      sortIcon={
                        <FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />
                      }
                      noDataComponent={
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faBellSlash} size="3x" className="text-muted mb-3" />
                          <h5>No hay notificaciones</h5>
                          <p className="text-muted">No se encontraron notificaciones para mostrar</p>
                        </div>
                      }
                    />
                  )}
                </Card.Body>
                <Card.Footer className="bg-light border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faBell} className="me-1" />
                      Total: {filteredNotificaciones.length} notificaciones
                    </small>
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                      {selectedRows.length > 0 ? `${selectedRows.length} seleccionados` : 'Ninguno seleccionado'}
                    </small>
                  </div>
                </Card.Footer>
              </Card>
            </>
          )}

          {activeTab === 'generales' && (
            <>
              <Card className="bg-light border-0 mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                      <h6 className="mb-0">Filtros</h6>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setMostrarFiltrosGenerales(!mostrarFiltrosGenerales)}
                    >
                      {mostrarFiltrosGenerales ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  
                  {mostrarFiltrosGenerales && (
                    <Row className="mt-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small">Estado</Form.Label>
                          <Form.Select
                            size="sm"
                            value={filtrosGenerales.vista}
                            onChange={(e) => setFiltrosGenerales({...filtrosGenerales, vista: e.target.value})}
                          >
                            <option value="">Todas</option>
                            <option value="true">Vistas</option>
                            <option value="false">No vistas</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small">&nbsp;</Form.Label>
                          <div>
                            <Form.Check
                              type="checkbox"
                              label="Solo importantes"
                              checked={filtrosGenerales.importante}
                              onChange={(e) => setFiltrosGenerales({...filtrosGenerales, importante: e.target.checked})}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-0">
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <h6 className="mb-0">
                        <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                        Búsqueda
                      </h6>
                    </div>
                  </div>
                  <div className="p-3">
                    <FilterComponent
                      filterText={filterTextGenerales}
                      onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTextGenerales(e.target.value)}
                      onClear={() => setFilterTextGenerales('')}
                      placeholder="Buscar por título, mensaje, creador..."
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                  {loading.generales ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Cargando notificaciones generales...</p>
                    </div>
                  ) : filteredNotificacionesGenerales.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faGlobe} size="3x" className="text-muted" />
                      </div>
                      <h5 className="fw-normal">No hay notificaciones generales</h5>
                      <p className="text-muted">
                        {filterTextGenerales
                          ? 'No se encontraron resultados para tu búsqueda'
                          : canCreateGeneral 
                          ? 'Crea la primera notificación general usando el botón "Nueva Notificación General"'
                          : 'No hay notificaciones generales disponibles'}
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      columns={columnsGenerales}
                      data={filteredNotificacionesGenerales}
                      pagination
                      paginationPerPage={perPageGenerales}
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                      onChangeRowsPerPage={(newPerPage) => setPerPageGenerales(newPerPage)}
                      highlightOnHover
                      pointerOnHover
                      selectableRows
                      selectableRowsHighlight
                      onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                      clearSelectedRows={toggleCleared}
                      onRowClicked={(row) => {
                        setSelectedNotificacion(row);
                        setShowDetalleModal(true);
                        if (row.YaVista === 0) {
                          marcarGeneralComoVista(row.ID);
                        }
                      }}
                      responsive
                      customStyles={customStyles}
                      progressPending={loading.generales}
                      progressComponent={
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando datos...</p>
                        </div>
                      }
                      sortIcon={
                        <FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />
                      }
                      noDataComponent={
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faGlobe} size="3x" className="text-muted mb-3" />
                          <h5>No hay notificaciones generales</h5>
                          <p className="text-muted">No se encontraron notificaciones para mostrar</p>
                        </div>
                      }
                    />
                  )}
                </Card.Body>
                <Card.Footer className="bg-light border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faGlobe} className="me-1" />
                      Total: {filteredNotificacionesGenerales.length} notificaciones
                    </small>
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                      {selectedRows.length > 0 ? `${selectedRows.length} seleccionados` : 'Ninguno seleccionado'}
                    </small>
                  </div>
                </Card.Footer>
              </Card>
            </>
          )}

          {activeTab === 'vistas' && isAdmin && (
            <>
              <Card className="bg-light border-0 mb-4">
                <Card.Body>
                  <Nav variant="pills" className="mb-3" activeKey={activeVistasTab} onSelect={(k) => setActiveVistasTab(k || 'generales')}>
                    <Nav.Item>
                      <Nav.Link eventKey="generales">Vistas Generales</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="personales">Vistas Personales</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  {!loading.resumenVistas && (
                    <Row className="mb-3">
                      <Col md={3}>
                        <Card className="shadow-sm border-0 bg-primary text-white">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small>Total vistas</small>
                                <h3 className="mb-0">{resumenVistas.total_vistas}</h3>
                              </div>
                              <FontAwesomeIcon icon={faEye} size="2x" />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="shadow-sm border-0 bg-success text-white">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small>Hoy</small>
                                <h3 className="mb-0">{resumenVistas.vistas_hoy}</h3>
                              </div>
                              <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="shadow-sm border-0 bg-info text-white">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small>Esta semana</small>
                                <h3 className="mb-0">{resumenVistas.vistas_semana}</h3>
                              </div>
                              <FontAwesomeIcon icon={faHistory} size="2x" />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="shadow-sm border-0 bg-warning text-white">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small>Usuarios activos</small>
                                <h3 className="mb-0">{resumenVistas.usuarios_activos}</h3>
                              </div>
                              <FontAwesomeIcon icon={faUserCheck} size="2x" />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                      <h6 className="mb-0">Filtros</h6>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setMostrarFiltrosVistas(!mostrarFiltrosVistas)}
                    >
                      {mostrarFiltrosVistas ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  
                  {mostrarFiltrosVistas && (
                    <Row className="mt-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Fecha desde</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={filtrosVistas.fechaInicio}
                            onChange={(e) => setFiltrosVistas({...filtrosVistas, fechaInicio: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Fecha hasta</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={filtrosVistas.fechaFin}
                            onChange={(e) => setFiltrosVistas({...filtrosVistas, fechaFin: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small">Usuario</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Buscar usuario..."
                            value={filtrosVistas.usuario}
                            onChange={(e) => setFiltrosVistas({...filtrosVistas, usuario: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-0">
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <h6 className="mb-0">
                        <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                        Búsqueda
                      </h6>
                    </div>
                  </div>
                  <div className="p-3">
                    <FilterComponent
                      filterText={filterTextVistas}
                      onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTextVistas(e.target.value)}
                      onClear={() => setFilterTextVistas('')}
                      placeholder="Buscar por usuario, notificación..."
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                  {loading.vistas ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Cargando vistas...</p>
                    </div>
                  ) : filteredVistasNotificaciones.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <FontAwesomeIcon icon={faHistory} size="3x" className="text-muted" />
                      </div>
                      <h5 className="fw-normal">No hay vistas registradas</h5>
                      <p className="text-muted">
                        {filterTextVistas
                          ? 'No se encontraron resultados para tu búsqueda'
                          : 'No hay registros de vistas de notificaciones'}
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      columns={columnsVistas}
                      data={filteredVistasNotificaciones}
                      pagination
                      paginationPerPage={perPageVistas}
                      paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                      onChangeRowsPerPage={(newPerPage) => setPerPageVistas(newPerPage)}
                      highlightOnHover
                      pointerOnHover
                      onRowClicked={(row) => {
                        setSelectedVista(row);
                        setShowDetalleVistaModal(true);
                      }}
                      responsive
                      customStyles={customStyles}
                      progressPending={loading.vistas}
                      progressComponent={
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando datos...</p>
                        </div>
                      }
                      sortIcon={
                        <FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />
                      }
                      noDataComponent={
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faHistory} size="3x" className="text-muted mb-3" />
                          <h5>No hay vistas registradas</h5>
                          <p className="text-muted">No se encontraron registros de vistas</p>
                        </div>
                      }
                    />
                  )}
                </Card.Body>
                <Card.Footer className="bg-light border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faHistory} className="me-1" />
                      Total: {filteredVistasNotificaciones.length} vistas
                    </small>
                  </div>
                </Card.Footer>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Detalle */}
      <Modal show={showDetalleModal} onHide={() => setShowDetalleModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: selectedNotificacion 
                    ? isNotificacionGeneral(selectedNotificacion)
                      ? `var(--bs-${selectedNotificacion.Importante ? 'danger' : 'info'}-bg)`
                      : `var(--bs-${getColorNotificacion(selectedNotificacion.Tipo, selectedNotificacion.Prioridad, selectedNotificacion.Estado)}-bg)`
                    : 'var(--bs-info-bg)',
                  color: selectedNotificacion 
                    ? isNotificacionGeneral(selectedNotificacion)
                      ? `var(--bs-${selectedNotificacion.Importante ? 'danger' : 'info'})`
                      : `var(--bs-${getColorNotificacion(selectedNotificacion.Tipo, selectedNotificacion.Prioridad, selectedNotificacion.Estado)})`
                    : 'var(--bs-info)'
                }}
              >
                <FontAwesomeIcon 
                  icon={selectedNotificacion 
                    ? isNotificacionGeneral(selectedNotificacion)
                      ? (selectedNotificacion.Importante ? faExclamationCircle : faGlobe)
                      : getIconoNotificacion(selectedNotificacion.Tipo, selectedNotificacion.Prioridad)
                    : faBell
                  } 
                  size="lg"
                />
              </div>
              <div>
                <h5 className="mb-0">{selectedNotificacion?.Titulo}</h5>
                <small className="text-muted">
                  {selectedNotificacion && isNotificacionGeneral(selectedNotificacion) 
                    ? 'Notificación General'
                    : selectedNotificacion?.Tipo?.replace(/_/g, ' ')}
                </small>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedNotificacion && (
            <>
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  {!isNotificacionGeneral(selectedNotificacion) && getBadgePrioridad(selectedNotificacion.Prioridad)}
                  {isNotificacionGeneral(selectedNotificacion) ? (
                    <Badge bg={selectedNotificacion.YaVista === 1 ? 'secondary' : 'success'} pill className="ms-2">
                      {selectedNotificacion.YaVista === 1 ? 'Vista' : 'No vista'}
                    </Badge>
                  ) : (
                    getEstadoBadge(selectedNotificacion.Estado)
                  )}
                  {selectedNotificacion.Importante && (
                    <Badge bg="danger" className="ms-2">IMPORTANTE</Badge>
                  )}
                </div>
                
                <Card className="bg-light border-0">
                  <Card.Body>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem' }}>
                      {selectedNotificacion.Mensaje}
                    </p>
                  </Card.Body>
                </Card>
              </div>
              
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Fecha de recepción</small>
                    <strong>{formatFechaHora(selectedNotificacion.createdAt)}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Vigencia</small>
                    <strong>{selectedNotificacion.VigenciaDias} días</strong>
                  </div>
                  {isNotificacionGeneral(selectedNotificacion) ? (
                    <div className="mb-3">
                      <small className="text-muted d-block">Creado por</small>
                      <strong>{selectedNotificacion.CreadorNombre || 'Sistema'}</strong>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <small className="text-muted d-block">Destinatario</small>
                      <strong>{selectedNotificacion.NombreEmpleado || selectedNotificacion.Usuario || 'Usuario'}</strong>
                    </div>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <ButtonGroup>
            {selectedNotificacion && isNotificacionGeneral(selectedNotificacion) && selectedNotificacion.YaVista === 0 && (
              <Button 
                variant="primary" 
                onClick={() => {
                  marcarGeneralComoVista(selectedNotificacion.ID);
                  setShowDetalleModal(false);
                }}
              >
                <FontAwesomeIcon icon={faEye} className="me-2" />
                Marcar como vista
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetalleModal(false)}>
              Cerrar
            </Button>
          </ButtonGroup>
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalle de Vista */}
      <Modal show={showDetalleVistaModal} onHide={() => setShowDetalleVistaModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
            Detalle de Vista
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVista && (
            <>
              <div className="mb-3">
                <small className="text-muted d-block">Usuario</small>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faUserCircle} className="me-2 text-primary" size="lg" />
                  <div>
                    <strong>{selectedVista.NombreEmpleado || selectedVista.Usuario}</strong>
                    <br />
                    <small className="text-muted">@{selectedVista.Usuario}</small>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <small className="text-muted d-block">Notificación</small>
                <strong>{selectedVista.Titulo}</strong>
                <br />
                <small className="text-muted">ID: {selectedVista.NotificacionID}</small>
              </div>
              
              <div className="mb-3">
                <small className="text-muted d-block">Tipo</small>
                <Badge bg={activeVistasTab === 'generales' ? 'info' : 'primary'}>
                  {activeVistasTab === 'generales' ? 'Notificación General' : 'Notificación Personal'}
                </Badge>
              </div>
              
              <div className="mb-3">
                <small className="text-muted d-block">Fecha y Hora de Vista</small>
                <strong>{formatFechaHora(selectedVista.FechaVista)}</strong>
                <br />
                <small className="text-muted">{formatFechaRelativa(selectedVista.FechaVista)}</small>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalleVistaModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Crear Notificación General */}
      <Modal show={showCrearGeneralModal} onHide={() => setShowCrearGeneralModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faBullhorn} className="me-2" />
            Nueva Notificación General
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Título <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={nuevaNotificacionGeneral.titulo}
                onChange={(e) => setNuevaNotificacionGeneral({...nuevaNotificacionGeneral, titulo: e.target.value})}
                placeholder="Ej: Actualización del sistema"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Mensaje <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={nuevaNotificacionGeneral.mensaje}
                onChange={(e) => setNuevaNotificacionGeneral({...nuevaNotificacionGeneral, mensaje: e.target.value})}
                placeholder="Escribe el contenido de la notificación..."
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de notificación</Form.Label>
                  <Form.Select
                    value={nuevaNotificacionGeneral.tipoNotificacionId}
                    onChange={(e) => setNuevaNotificacionGeneral({
                      ...nuevaNotificacionGeneral, 
                      tipoNotificacionId: parseInt(e.target.value)
                    })}
                  >
                    {tiposNotificacion.map(tipo => (
                      <option key={tipo.ID} value={tipo.ID}>
                        {tipo.Nombre.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vigencia (días)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="365"
                    value={nuevaNotificacionGeneral.vigenciaDias}
                    onChange={(e) => setNuevaNotificacionGeneral({
                      ...nuevaNotificacionGeneral, 
                      vigenciaDias: parseInt(e.target.value)
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Marcar como importante"
                checked={nuevaNotificacionGeneral.importante}
                onChange={(e) => setNuevaNotificacionGeneral({
                  ...nuevaNotificacionGeneral, 
                  importante: e.target.checked
                })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCrearGeneralModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={crearNotificacionGeneral}
            disabled={!nuevaNotificacionGeneral.titulo || !nuevaNotificacionGeneral.mensaje || loading.create}
          >
            {loading.create ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                Publicar Notificación
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Eliminar */}
      <Modal show={showEliminarModal} onHide={() => setShowEliminarModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Eliminar notificación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <FontAwesomeIcon icon={faTrash} size="3x" className="text-danger mb-3" />
          <h5>¿Estás seguro de eliminar esta notificación?</h5>
          <p className="text-muted mb-0">
            Esta acción no se puede deshacer.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowEliminarModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={eliminarNotificacion}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Notificaciones;