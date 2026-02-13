import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ListGroup,
  Spinner,
  Alert,
  Nav,
  Dropdown,
  ButtonGroup,
  Modal,
  Form,
  Pagination,
  Table
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faEllipsisV,
  faSync,
  faGlobe,
  faUserPlus,
  faHourglassHalf,
  faUmbrellaBeach,
  faCalendarCheck,
  faUserCircle,
  faTag,
  faBullhorn,
  faEnvelopeOpenText,
  faPaperPlane,
  faBellSlash,
  faInbox,
  faHistory,
  faUserCheck,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

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

const Notificaciones: React.FC = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.rol === 'admin';
  const canCreateGeneral = isAdmin;
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesGenerales, setNotificacionesGenerales] = useState<NotificacionGeneral[]>([]);
  const [vistasNotificaciones, setVistasNotificaciones] = useState<VistaNotificacion[]>([]);
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
        limit: pagination.limit.toString()
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
    } finally {
      setLoading(prev => ({ ...prev, notificaciones: false }));
    }
  }, [pagination.page, pagination.limit, filtros.tipo, filtros.prioridad, filtros.importante, activeSubTab, orden]);

  const cargarNotificacionesGenerales = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, generales: true }));
      
      const params = new URLSearchParams({
        page: paginationGenerales.page.toString(),
        limit: paginationGenerales.limit.toString()
      });
      
      if (filtrosGenerales.importante) params.append('importante', 'true');
      if (filtrosGenerales.vista) params.append('vista', filtrosGenerales.vista);
      
      const response = await api.get(`/notificaciones/generales?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setNotificacionesGenerales(data.notificaciones || []);
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
    } finally {
      setLoading(prev => ({ ...prev, generales: false }));
    }
  }, [paginationGenerales.page, paginationGenerales.limit, filtrosGenerales.importante, filtrosGenerales.vista]);

  const cargarVistasNotificaciones = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, vistas: true }));
      
      const params = new URLSearchParams({
        page: paginationVistas.page.toString(),
        limit: paginationVistas.limit.toString(),
        tipo: activeVistasTab
      });
      
      if (filtrosVistas.fechaInicio) params.append('fechaInicio', filtrosVistas.fechaInicio);
      if (filtrosVistas.fechaFin) params.append('fechaFin', filtrosVistas.fechaFin);
      if (filtrosVistas.usuario) params.append('usuario', filtrosVistas.usuario);
      
      const response = await api.get(`/notificaciones/vistas?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setVistasNotificaciones(data.vistas || []);
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
    } finally {
      setLoading(prev => ({ ...prev, vistas: false }));
    }
  }, [paginationVistas.page, paginationVistas.limit, filtrosVistas.fechaInicio, filtrosVistas.fechaFin, filtrosVistas.usuario, activeVistasTab]);

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
    pagination.limit,
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
    paginationGenerales.limit,
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
    paginationVistas.limit,
    filtrosVistas.fechaInicio,
    filtrosVistas.fechaFin,
    filtrosVistas.usuario,
    cargarVistasNotificaciones,
    isAdmin
  ]);

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
          cargarNotificacionesGenerales();
        } else {
          setNotificaciones(prev => prev.filter(n => n.ID !== notificacionAEliminar.ID));
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
    if (estado === 'no_vista') return 'light';
    
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
    <Container fluid className="grow py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faBell} className="me-2 text-primary" />
                Centro de Notificaciones
              </h2>
              <p className="text-muted mb-0">
                <FontAwesomeIcon icon={faUserCircle} className="me-1" />
                {user?.usuario} • {user?.rol}
              </p>
            </div>
            
            <ButtonGroup>
              {canCreateGeneral && (
                <Button 
                  variant="success" 
                  onClick={() => setShowCrearGeneralModal(true)}
                >
                  <FontAwesomeIcon icon={faBullhorn} className="me-2" />
                  Nueva Notificación General
                </Button>
              )}
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  if (activeTab === 'personales') {
                    setPagination(prev => ({ ...prev, page: 1 }));
                    cargarNotificaciones();
                  } else if (activeTab === 'generales') {
                    setPaginationGenerales(prev => ({ ...prev, page: 1 }));
                    cargarNotificacionesGenerales();
                  } else if (activeTab === 'vistas' && isAdmin) {
                    setPaginationVistas(prev => ({ ...prev, page: 1 }));
                    cargarVistasNotificaciones();
                  }
                }}
                disabled={loading.notificaciones || loading.generales || loading.vistas}
              >
                <FontAwesomeIcon icon={faSync} className="me-2" spin={loading.notificaciones || loading.generales || loading.vistas} />
                Actualizar
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong className="me-2">Error:</strong>
            {error}
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4">
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
                  <Badge bg="secondary" className="ms-2">{resumenVistas.total_vistas}</Badge>
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
                            <small className="text-white-50">Total</small>
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
                            <small className="text-white-50">No vistas</small>
                            <h2 className="mb-0 fw-bold">{resumen.no_vistas}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faEnvelopeOpen} size="2x" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="text-danger w-100"
                            onClick={marcarTodasComoVistas}
                            disabled={resumen.no_vistas === 0}
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            Marcar todas como vistas
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-warning text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-white-50">Importantes</small>
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
                            <small className="text-white-50">No leídas</small>
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

              {loading.notificaciones ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando notificaciones...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faBellSlash} size="3x" className="text-muted" />
                  </div>
                  <h5 className="fw-normal">No hay notificaciones</h5>
                  <p className="text-muted">
                    {activeSubTab === 'no_vistas' 
                      ? 'No tienes notificaciones sin ver' 
                      : activeSubTab === 'importantes'
                      ? 'No tienes notificaciones importantes'
                      : 'No hay notificaciones para mostrar'}
                  </p>
                </div>
              ) : (
                <>
                  <ListGroup variant="flush">
                    {notificaciones.map((notificacion) => (
                      <ListGroup.Item 
                        key={notificacion.ID}
                        className={`py-3 px-0 border-bottom ${notificacion.Estado === 'no_vista' ? 'bg-light' : ''}`}
                        action
                        onClick={() => {
                          setSelectedNotificacion(notificacion);
                          setShowDetalleModal(true);
                          if (notificacion.Estado === 'no_vista') {
                            marcarComoVista(notificacion.ID);
                          }
                        }}
                      >
                        <Row>
                          <Col xs="auto" className="d-flex align-items-center">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: `var(--bs-${getColorNotificacion(notificacion.Tipo, notificacion.Prioridad, notificacion.Estado)}-bg)`,
                                color: `var(--bs-${getColorNotificacion(notificacion.Tipo, notificacion.Prioridad, notificacion.Estado)})`
                              }}
                            >
                              <FontAwesomeIcon 
                                icon={getIconoNotificacion(notificacion.Tipo, notificacion.Prioridad)} 
                                size="lg"
                              />
                            </div>
                          </Col>
                          
                          <Col className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="d-flex align-items-center mb-1">
                                  <h6 className="mb-0 fw-bold">{notificacion.Titulo}</h6>
                                  {notificacion.Prioridad === 'urgente' && (
                                    <Badge bg="danger" className="ms-2">URGENTE</Badge>
                                  )}
                                  {notificacion.Prioridad === 'alta' && (
                                    <Badge bg="warning" className="ms-2">ALTA</Badge>
                                  )}
                                </div>
                                <p className="text-muted small mb-2">
                                  {notificacion.Mensaje && notificacion.Mensaje.length > 120
                                    ? `${notificacion.Mensaje.substring(0, 120)}...`
                                    : notificacion.Mensaje}
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                    {formatFechaRelativa(notificacion.createdAt)}
                                  </small>
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faTag} className="me-1" />
                                    {notificacion.Tipo?.replace(/_/g, ' ')}
                                  </small>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                {getEstadoBadge(notificacion.Estado)}
                                {getBadgePrioridad(notificacion.Prioridad)}
                                
                                <Dropdown className="ms-2">
                                  <Dropdown.Toggle variant="link" size="sm" className="text-muted no-arrow">
                                    <FontAwesomeIcon icon={faEllipsisV} />
                                  </Dropdown.Toggle>
                                  
                                  <Dropdown.Menu align="end">
                                    <Dropdown.Item 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNotificacionAEliminar(notificacion);
                                        setShowEliminarModal(true);
                                      }}
                                      className="text-danger"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                                      Eliminar
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <small className="text-muted">
                          Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                          {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                          {pagination.total} notificaciones
                        </small>
                      </div>
                      
                      <Pagination>
                        <Pagination.First 
                          onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                          disabled={pagination.page === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                        />
                        
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                          let page = pagination.page - 2 + idx;
                          if (page < 1) page = 1 + idx;
                          if (page > pagination.totalPages) page = pagination.totalPages - (4 - idx);
                          if (page < 1) page = 1;
                          
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === pagination.page}
                              onClick={() => setPagination(prev => ({ ...prev, page }))}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        
                        <Pagination.Next 
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.totalPages}
                        />
                        <Pagination.Last 
                          onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                          disabled={pagination.page === pagination.totalPages}
                        />
                      </Pagination>
                      
                      <Form.Select
                        size="sm"
                        style={{ width: 'auto' }}
                        value={pagination.limit}
                        onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                      >
                        <option value="10">10 / página</option>
                        <option value="25">25 / página</option>
                        <option value="50">50 / página</option>
                      </Form.Select>
                    </div>
                  )}
                </>
              )}
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

              {loading.generales ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando notificaciones generales...</p>
                </div>
              ) : notificacionesGenerales.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faGlobe} size="3x" className="text-muted" />
                  </div>
                  <h5 className="fw-normal">No hay notificaciones generales</h5>
                  <p className="text-muted">
                    {canCreateGeneral 
                      ? 'Crea la primera notificación general usando el botón "Nueva Notificación General"'
                      : 'No hay notificaciones generales disponibles'}
                  </p>
                </div>
              ) : (
                <>
                  <ListGroup variant="flush">
                    {notificacionesGenerales.map((notificacion) => (
                      <ListGroup.Item 
                        key={notificacion.ID}
                        className={`py-3 px-0 border-bottom ${notificacion.YaVista === 0 ? 'bg-light' : ''}`}
                        action
                        onClick={() => {
                          setSelectedNotificacion(notificacion);
                          setShowDetalleModal(true);
                          if (notificacion.YaVista === 0) {
                            marcarGeneralComoVista(notificacion.ID);
                          }
                        }}
                      >
                        <Row>
                          <Col xs="auto" className="d-flex align-items-center">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: `var(--bs-${notificacion.Importante ? 'danger' : 'info'}-bg)`,
                                color: `var(--bs-${notificacion.Importante ? 'danger' : 'info'})`
                              }}
                            >
                              <FontAwesomeIcon 
                                icon={notificacion.Importante ? faExclamationCircle : faGlobe} 
                                size="lg"
                              />
                            </div>
                          </Col>
                          
                          <Col className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="d-flex align-items-center mb-1">
                                  <h6 className="mb-0 fw-bold">{notificacion.Titulo}</h6>
                                  {notificacion.Importante && (
                                    <Badge bg="danger" className="ms-2">IMPORTANTE</Badge>
                                  )}
                                </div>
                                <p className="text-muted small mb-2">
                                  {notificacion.Mensaje && notificacion.Mensaje.length > 120
                                    ? `${notificacion.Mensaje.substring(0, 120)}...`
                                    : notificacion.Mensaje}
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                    {formatFechaRelativa(notificacion.createdAt)}
                                  </small>
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faUserCircle} className="me-1" />
                                    {notificacion.CreadorNombre || 'Sistema'}
                                  </small>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                <Badge 
                                  bg={notificacion.YaVista === 1 ? 'secondary' : 'success'} 
                                  pill
                                >
                                  {notificacion.YaVista === 1 ? 'Vista' : 'No vista'}
                                </Badge>
                                
                                {canCreateGeneral && (
                                  <Dropdown className="ms-2">
                                    <Dropdown.Toggle variant="link" size="sm" className="text-muted no-arrow">
                                      <FontAwesomeIcon icon={faEllipsisV} />
                                    </Dropdown.Toggle>
                                    
                                    <Dropdown.Menu align="end">
                                      <Dropdown.Item 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNotificacionAEliminar(notificacion);
                                          setShowEliminarModal(true);
                                        }}
                                        className="text-danger"
                                      >
                                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                                        Eliminar
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  {paginationGenerales.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <small className="text-muted">
                          Mostrando {((paginationGenerales.page - 1) * paginationGenerales.limit) + 1} a{' '}
                          {Math.min(paginationGenerales.page * paginationGenerales.limit, paginationGenerales.total)} de{' '}
                          {paginationGenerales.total} notificaciones
                        </small>
                      </div>
                      
                      <Pagination>
                        <Pagination.First 
                          onClick={() => setPaginationGenerales(prev => ({ ...prev, page: 1 }))}
                          disabled={paginationGenerales.page === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => setPaginationGenerales(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={paginationGenerales.page === 1}
                        />
                        
                        {[...Array(Math.min(5, paginationGenerales.totalPages))].map((_, idx) => {
                          let page = paginationGenerales.page - 2 + idx;
                          if (page < 1) page = 1 + idx;
                          if (page > paginationGenerales.totalPages) page = paginationGenerales.totalPages - (4 - idx);
                          if (page < 1) page = 1;
                          
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === paginationGenerales.page}
                              onClick={() => setPaginationGenerales(prev => ({ ...prev, page }))}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        
                        <Pagination.Next 
                          onClick={() => setPaginationGenerales(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={paginationGenerales.page === paginationGenerales.totalPages}
                        />
                        <Pagination.Last 
                          onClick={() => setPaginationGenerales(prev => ({ ...prev, page: paginationGenerales.totalPages }))}
                          disabled={paginationGenerales.page === paginationGenerales.totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'vistas' && isAdmin && (
            <>
              {!loading.resumenVistas && (
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-primary text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-white-50">Total Vistas</small>
                            <h2 className="mb-0 fw-bold">{resumenVistas.total_vistas}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faEye} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="shadow-sm border-0 bg-success text-white">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-white-50">Hoy</small>
                            <h2 className="mb-0 fw-bold">{resumenVistas.vistas_hoy}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
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
                            <small className="text-white-50">Esta Semana</small>
                            <h2 className="mb-0 fw-bold">{resumenVistas.vistas_semana}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
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
                            <small className="text-white-50">Usuarios Activos</small>
                            <h2 className="mb-0 fw-bold">{resumenVistas.usuarios_activos}</h2>
                          </div>
                          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                            <FontAwesomeIcon icon={faUserCheck} size="2x" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              <Nav variant="pills" className="mb-4" activeKey={activeVistasTab} onSelect={(k) => setActiveVistasTab(k || 'generales')}>
                <Nav.Item>
                  <Nav.Link eventKey="generales">Notificaciones Generales</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="personales">Notificaciones Personales</Nav.Link>
                </Nav.Item>
              </Nav>

              <Card className="bg-light border-0 mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                      <h6 className="mb-0">Filtros de Vistas</h6>
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
                          <Form.Label className="small">Fecha Inicio</Form.Label>
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
                          <Form.Label className="small">Fecha Fin</Form.Label>
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
                            placeholder="Nombre de usuario"
                            value={filtrosVistas.usuario}
                            onChange={(e) => setFiltrosVistas({...filtrosVistas, usuario: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {loading.vistas ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando historial de vistas...</p>
                </div>
              ) : vistasNotificaciones.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faHistory} size="3x" className="text-muted" />
                  </div>
                  <h5 className="fw-normal">No hay registros de vistas</h5>
                  <p className="text-muted">
                    No se encontraron vistas de notificaciones con los filtros seleccionados
                  </p>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead className="bg-light">
                      <tr>
                        <th>Usuario</th>
                        <th>Notificación</th>
                        <th>Tipo</th>
                        <th>Fecha de Vista</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vistasNotificaciones.map((vista) => (
                        <tr key={vista.ID}>
                          <td>
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faUserCircle} className="me-2 text-primary" />
                              <div>
                                <div>{vista.NombreEmpleado || vista.Usuario}</div>
                                <small className="text-muted">@{vista.Usuario}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">{vista.Titulo}</div>
                              <small className="text-muted">ID: {vista.NotificacionID}</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info">
                              {activeVistasTab === 'generales' ? 'General' : 'Personal'}
                            </Badge>
                          </td>
                          <td>
                            <div>
                              <div>{formatFechaHora(vista.FechaVista)}</div>
                              <small className="text-muted">{formatFechaRelativa(vista.FechaVista)}</small>
                            </div>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedVista(vista);
                                setShowDetalleVistaModal(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {paginationVistas.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <small className="text-muted">
                          Mostrando {((paginationVistas.page - 1) * paginationVistas.limit) + 1} a{' '}
                          {Math.min(paginationVistas.page * paginationVistas.limit, paginationVistas.total)} de{' '}
                          {paginationVistas.total} registros
                        </small>
                      </div>
                      
                      <Pagination>
                        <Pagination.First 
                          onClick={() => setPaginationVistas(prev => ({ ...prev, page: 1 }))}
                          disabled={paginationVistas.page === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => setPaginationVistas(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={paginationVistas.page === 1}
                        />
                        
                        {[...Array(Math.min(5, paginationVistas.totalPages))].map((_, idx) => {
                          let page = paginationVistas.page - 2 + idx;
                          if (page < 1) page = 1 + idx;
                          if (page > paginationVistas.totalPages) page = paginationVistas.totalPages - (4 - idx);
                          if (page < 1) page = 1;
                          
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === paginationVistas.page}
                              onClick={() => setPaginationVistas(prev => ({ ...prev, page }))}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        
                        <Pagination.Next 
                          onClick={() => setPaginationVistas(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={paginationVistas.page === paginationVistas.totalPages}
                        />
                        <Pagination.Last 
                          onClick={() => setPaginationVistas(prev => ({ ...prev, page: paginationVistas.totalPages }))}
                          disabled={paginationVistas.page === paginationVistas.totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>

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