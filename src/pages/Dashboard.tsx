import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ListGroup,
  Spinner,
  ProgressBar,
  Tab,
  Tabs
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faChartBar,
  faBell,
  faHome,
  faFileAlt,
  faProjectDiagram,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faArrowRight,
  faUserCircle,
  faUserClock,
  faHourglassHalf,
  faBan,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

interface Estadisticas {
  totalEmpleados: number;
  solicitudesPendientes: number;
  totalProyectos: number;
  notificacionesSinLeer: number;
  aprobacionesPendientes: number;
}

interface Solicitud {
  ID: number;
  EmpleadoID: number;
  Tipo: 'vacaciones' | 'permiso' | 'horas_extras';
  Estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  FechaSolicitud: string;
  FechaInicio?: string;
  FechaFin?: string;
  DiasSolicitados?: number;
  HorasSolicitadas?: number | string;
  Motivo: string;
  Observaciones?: string;
  ConGoce?: boolean | number;
  EmpleadoNombre?: string;
  EmpleadoCorreo?: string;
}

interface AprobacionPendiente {
  AprobacionID: number;
  SolicitudID: number;
  EmpleadoNombre: string;
  Tipo: string;
  FechaSolicitud: string;
  DiasHoras: string;
  Motivo: string;
  OrdenAprobacion: number;
  EstadoAprobacion: string;
}

interface Notificacion {
  ID: number;
  Titulo: string;
  Mensaje: string;
  Estado: string;
  FechaCreacion: string;
  Importante: boolean;
  Tipo?: string;
  Icono?: string;
  Color?: string;
}

interface Proyecto {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  Estado: string;
  FechaInicio: string;
  FechaFin?: string;
  Progreso?: number;
  JefeProyectoNombre?: string;
  TotalTareas?: number;
  TareasCompletadas?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [empleado, setEmpleado] = useState<Record<string, unknown>>({});
  const [userRol, setUserRol] = useState<string>('employee');
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalEmpleados: 0,
    solicitudesPendientes: 0,
    totalProyectos: 0,
    notificacionesSinLeer: 0,
    aprobacionesPendientes: 0
  });
  
  // Estados para datos
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [aprobacionesPendientes, setAprobacionesPendientes] = useState<AprobacionPendiente[]>([]);
  const [notificacionesRecientes, setNotificacionesRecientes] = useState<Notificacion[]>([]);
  const [proyectosActivos, setProyectosActivos] = useState<Proyecto[]>([]);
  
  // Estados de carga
  const [loading, setLoading] = useState({
    estadisticas: true,
    solicitudes: true,
    aprobaciones: true,
    notificaciones: true,
    proyectos: true
  });

  // Determinar rol
  useEffect(() => {
    const rol = user?.rol || user?.Rol || 'employee';
    setUserRol(rol);
  }, [user]);

  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  const canApprove = isAdmin || isManager;

  // ==================== FUNCIONES DE CARGA ====================

  const cargarEstadisticas = async () => {
    try {
      setLoading(prev => ({ ...prev, estadisticas: true }));
      
      // 1. TOTAL EMPLEADOS - CORREGIDO
      let totalEmpleados = 0;
      try {
        const empleadosRes = await api.get('/empleados/empleados?limit=1');
        console.log('Respuesta empleados:', empleadosRes.data);
        
        if (empleadosRes.data.success) {
          const data = empleadosRes.data.data;
          
          if (data && data.pagination && data.pagination.total) {
            totalEmpleados = data.pagination.total;
          } else if (data && data.empleados && Array.isArray(data.empleados)) {
            totalEmpleados = data.empleados.length;
          } else if (Array.isArray(data)) {
            totalEmpleados = data.length;
          } else if (data && data.total) {
            totalEmpleados = data.total;
          }
        }
      } catch (error) {
        console.error('Error cargando empleados:', error);
      }

      // 2. TOTAL PROYECTOS - CORREGIDO
      let totalProyectos = 0;
      try {
        const proyectosRes = await api.get('/proyectos?limit=1');
        console.log('Respuesta proyectos:', proyectosRes.data);
        
        if (proyectosRes.data.success) {
          const data = proyectosRes.data.data;
          
          if (data && data.pagination && data.pagination.total) {
            totalProyectos = data.pagination.total;
          } else if (data && data.proyectos && Array.isArray(data.proyectos)) {
            totalProyectos = data.proyectos.length;
          } else if (Array.isArray(data)) {
            totalProyectos = data.length;
          } else if (data && data.total) {
            totalProyectos = data.total;
          }
        }
      } catch (error) {
        console.error('Error cargando total proyectos:', error);
      }
      
      // 3. NOTIFICACIONES SIN LEER - RESUMEN
      let notificacionesSinLeer = 0;
      try {
        const notificacionesRes = await api.get('/notificaciones/resumen');
        if (notificacionesRes.data.success && notificacionesRes.data.data) {
          notificacionesSinLeer = notificacionesRes.data.data.no_vistas || 
                                  notificacionesRes.data.data.total_no_vistas || 
                                  notificacionesRes.data.data.total || 0;
        }
      } catch (error) {
        console.error('Error cargando resumen notificaciones:', error);
      }
      
      setEstadisticas(prev => ({
        ...prev,
        totalEmpleados,
        totalProyectos,
        notificacionesSinLeer: notificacionesSinLeer || prev.notificacionesSinLeer,
      }));
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(prev => ({ ...prev, estadisticas: false }));
    }
  };

  const cargarMisSolicitudes = async () => {
    try {
      const response = await api.get('/solicitudes/mis-solicitudes');
      if (response.data.success) {
        const solicitudes = response.data.data || [];
        setMisSolicitudes(solicitudes);
        
        // Actualizar contador de mis solicitudes pendientes
        const misPendientes = solicitudes.filter((s: Solicitud) => s.Estado === 'pendiente').length;
        setEstadisticas(prev => ({ ...prev, solicitudesPendientes: misPendientes }));
      }
    } catch (error) {
      console.error('Error cargando mis solicitudes:', error);
    } finally {
      setLoading(prev => ({ ...prev, solicitudes: false }));
    }
  };

  const cargarAprobacionesPendientes = async () => {
    if (!canApprove) {
      setLoading(prev => ({ ...prev, aprobaciones: false }));
      return;
    }

    try {
      const response = await api.get('/solicitudes/aprobaciones/pendientes');
      if (response.data.success) {
        const aprobaciones = response.data.data || [];
        setAprobacionesPendientes(aprobaciones);
        setEstadisticas(prev => ({ ...prev, aprobacionesPendientes: aprobaciones.length }));
      }
    } catch (error) {
      console.error('Error cargando aprobaciones pendientes:', error);
    } finally {
      setLoading(prev => ({ ...prev, aprobaciones: false }));
    }
  };

  const cargarNotificacionesRecientes = async () => {
    try {
      setLoading(prev => ({ ...prev, notificaciones: true }));
      
      const response = await api.get('/notificaciones/personales?limit=5');
      
      if (response.data.success) {
        const data = response.data.data;
        let notificaciones = data.notificaciones || data || [];
        
        if (!Array.isArray(notificaciones)) {
          notificaciones = [];
        }
        
        setNotificacionesRecientes(notificaciones);
        
        // Actualizar contador de notificaciones sin leer
        const sinLeer = notificaciones.filter((n: any) => n.Estado === 'no_vista').length;
        setEstadisticas(prev => ({ ...prev, notificacionesSinLeer: sinLeer }));
      } else {
        setNotificacionesRecientes([]);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setNotificacionesRecientes([]);
    } finally {
      setLoading(prev => ({ ...prev, notificaciones: false }));
    }
  };

  const cargarProyectosActivos = async () => {
    try {
      setLoading(prev => ({ ...prev, proyectos: true }));
      
      const endpoint = isAdmin || isManager ? '/proyectos?limit=100' : '/proyectos/asignados?limit=100';
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const data = response.data.data;
        let proyectos = [];
        
        // Manejar diferentes estructuras de respuesta
        if (data && data.proyectos) {
          proyectos = data.proyectos;
        } else if (Array.isArray(data)) {
          proyectos = data;
        }
        
        // Filtrar solo activos
        const activos = proyectos.filter((p: any) => 
          p.Estado && p.Estado.toLowerCase() === 'activo'
        );
        
        // Calcular progreso para cada proyecto
        const proyectosConProgreso = activos.map((p: any) => ({
          ...p,
          Progreso: p.TotalTareas && p.TotalTareas > 0 
            ? Math.round((p.TareasCompletadas || 0) / p.TotalTareas * 100) 
            : 0
        }));
        
        setProyectosActivos(proyectosConProgreso);
      } else {
        setProyectosActivos([]);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setProyectosActivos([]);
    } finally {
      setLoading(prev => ({ ...prev, proyectos: false }));
    }
  };

  const cargarDashboard = useCallback(async () => {
    // Cargar todo en paralelo
    await Promise.all([
      cargarEstadisticas(),
      cargarMisSolicitudes(),
      cargarAprobacionesPendientes(),
      cargarNotificacionesRecientes(),
      cargarProyectosActivos()
    ]);
  }, [canApprove, isAdmin, isManager]);

  useEffect(() => {
    // Obtener datos del empleado del localStorage
    const empleadoData = localStorage.getItem('renova_empleado');
    if (empleadoData) {
      try {
        setEmpleado(JSON.parse(empleadoData));
      } catch (error) {
        console.error('Error al parsear datos del empleado:', error);
      }
    }

    // Cargar datos del dashboard
    cargarDashboard();
  }, [cargarDashboard]);

  // ==================== FUNCIONES AUXILIARES ====================

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      
      if (isNaN(date.getTime())) {
        const parts = fecha.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          const date2 = new Date(year, month, day);
          if (!isNaN(date2.getTime())) {
            return date2.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
          }
        }
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatFechaHora = (fecha: string) => {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: string, icon: any }> = {
      'pendiente': { variant: 'warning', icon: faHourglassHalf },
      'aprobada': { variant: 'success', icon: faCheckCircle },
      'aprobado': { variant: 'success', icon: faCheckCircle },
      'rechazada': { variant: 'danger', icon: faTimesCircle },
      'rechazado': { variant: 'danger', icon: faTimesCircle },
      'cancelada': { variant: 'secondary', icon: faBan },
      'no_vista': { variant: 'danger', icon: faBell },
      'vista': { variant: 'info', icon: faBell },
      'activo': { variant: 'success', icon: faCheckCircle },
      'pausado': { variant: 'warning', icon: faClock },
      'finalizado': { variant: 'secondary', icon: faTimesCircle }
    };

    const config = estados[estado.toLowerCase()] || { variant: 'info', icon: faExclamationCircle };
    
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1" style={{ padding: '0.35rem 0.65rem' }}>
        <FontAwesomeIcon icon={config.icon} size="xs" />
        <span>{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
      </Badge>
    );
  };

  const getTipoSolicitud = (tipo: string) => {
    const tipos: Record<string, { nombre: string, color: string, icon: any }> = {
      'vacaciones': { nombre: 'Vacaciones', color: 'primary', icon: faCalendarAlt },
      'permiso': { nombre: 'Permiso', color: 'info', icon: faUserClock },
      'horas_extras': { nombre: 'Horas Extras', color: 'warning', icon: faClock }
    };

    const config = tipos[tipo] || { nombre: tipo, color: 'secondary', icon: faFileAlt };
    
    return (
      <Badge bg={config.color} className="me-2 d-inline-flex align-items-center gap-1">
        <FontAwesomeIcon icon={config.icon} size="xs" />
        {config.nombre}
      </Badge>
    );
  };

  // Obtener las solicitudes más recientes (máximo 5)
  const solicitudesRecientes = misSolicitudes
    .sort((a, b) => new Date(b.FechaSolicitud).getTime() - new Date(a.FechaSolicitud).getTime())
    .slice(0, 5);

  // ==================== RENDERIZADO ====================

  if (loading.estadisticas && loading.solicitudes && loading.aprobaciones) {
    return (
      <Container fluid className="grow py-4">
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <span className="mt-3 fs-5">Cargando dashboard...</span>
          <span className="text-muted small mt-2">Obteniendo información del sistema</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="grow py-4">
      <Row>
        {/* Sidebar izquierda */}
        <Col lg={3} md={4} className="mb-4">
          {/* Información del usuario */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Body className="text-center bg-gradient bg-light">
              <div className="mb-3">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto shadow" 
                     style={{ width: '90px', height: '90px' }}>
                  <FontAwesomeIcon icon={faUserCircle} size="4x" className="text-white" />
                </div>
              </div>
              <h5 className="mb-1 fw-bold">{empleado?.NombreCompleto as string || 'Usuario'}</h5>
              <p className="text-muted mb-2 small">
                <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                {empleado?.PuestoNombre as string || 'Sin puesto asignado'}
              </p>
              <Badge 
                bg={userRol === 'admin' ? 'danger' : userRol === 'manager' ? 'warning' : 'info'}
                className="px-3 py-2"
              >
                {userRol.toUpperCase()}
              </Badge>
            </Card.Body>
          </Card>

          {/* Estadísticas rápidas */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-light border-0">
              <h6 className="mb-0">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-primary" />
                Mis Estadísticas
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-1">Mis Solicitudes Pendientes</small>
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold text-warning">{estadisticas.solicitudesPendientes}</h3>
                  <FontAwesomeIcon icon={faHourglassHalf} className="text-warning fa-2x" />
                </div>
              </div>
              
              {canApprove && (
                <div className="mb-3 p-2 bg-light rounded">
                  <small className="text-muted d-block mb-1">Por Aprobar</small>
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0 fw-bold text-danger">{estadisticas.aprobacionesPendientes}</h3>
                    <FontAwesomeIcon icon={faUserClock} className="text-danger fa-2x" />
                  </div>
                </div>
              )}
              
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-1">Notificaciones</small>
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold text-info">
                    {loading.notificaciones ? <Spinner animation="border" size="sm" /> : estadisticas.notificacionesSinLeer}
                  </h3>
                  <FontAwesomeIcon icon={faBell} className="text-info fa-2x" />
                </div>
                <small className="text-muted d-block mt-1">
                  {notificacionesRecientes.length} recientes
                </small>
              </div>
              
              <div className="p-2 bg-light rounded">
                <small className="text-muted d-block mb-1">Proyectos Activos</small>
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold text-success">
                    {loading.proyectos ? <Spinner animation="border" size="sm" /> : proyectosActivos.length}
                  </h3>
                  <FontAwesomeIcon icon={faProjectDiagram} className="text-success fa-2x" />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Acceso rápido */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light border-0">
              <h6 className="mb-0">
                <FontAwesomeIcon icon={faHome} className="me-2 text-primary" />
                Acceso Rápido
              </h6>
            </Card.Header>
            <Card.Body className="p-2">
              <ListGroup variant="flush">
                <ListGroup.Item 
                  action 
                  as={Link as any} 
                  to="/solicitudes?tab=mis-solicitudes" 
                  className="d-flex align-items-center py-3 border-0 rounded-3 mb-1"
                >
                  <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                    <FontAwesomeIcon icon={faFileAlt} className="text-primary" />
                  </div>
                  <div>
                    <div className="fw-medium">Mis Solicitudes</div>
                    <small className="text-muted">Historial y seguimiento</small>
                  </div>
                </ListGroup.Item>
                
                {canApprove && (
                  <ListGroup.Item 
                    action 
                    as={Link as any} 
                    to="/solicitudes?tab=pendientes" 
                    className="d-flex align-items-center py-3 border-0 rounded-3 mb-1"
                  >
                    <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                      <FontAwesomeIcon icon={faUserClock} className="text-warning" />
                    </div>
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <div>
                        <div className="fw-medium">Aprobaciones Pendientes</div>
                        <small className="text-muted">Revisar solicitudes</small>
                      </div>
                      {estadisticas.aprobacionesPendientes > 0 && (
                        <Badge bg="danger" pill className="ms-2">
                          {estadisticas.aprobacionesPendientes}
                        </Badge>
                      )}
                    </div>
                  </ListGroup.Item>
                )}
                
                <ListGroup.Item 
                  action 
                  as={Link as any} 
                  to="/proyectos" 
                  className="d-flex align-items-center py-3 border-0 rounded-3 mb-1"
                >
                  <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                    <FontAwesomeIcon icon={faProjectDiagram} className="text-success" />
                  </div>
                  <div>
                    <div className="fw-medium">Mis Proyectos</div>
                    <small className="text-muted">Proyectos asignados</small>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Contenido principal */}
        <Col lg={9} md={8}>
          {/* Header del dashboard */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1 fw-bold">
                <FontAwesomeIcon icon={faHome} className="me-2 text-primary" />
                Dashboard
              </h2>
              <p className="text-muted mb-0">
                Bienvenido al sistema de gestión RENOVA
              </p>
            </div>
            <div className="bg-light p-3 rounded">
              <small className="text-muted d-block">
                <FontAwesomeIcon icon={faUserCircle} className="me-1" />
                {user?.usuario}
              </small>
              <small className="text-muted">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </small>
            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Empleados</h6>
                      <h2 className="text-primary mb-0 fw-bold">
                        {loading.estadisticas ? <Spinner animation="border" size="sm" /> : estadisticas.totalEmpleados}
                      </h2>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <FontAwesomeIcon icon={faUsers} size="lg" className="text-primary" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="w-100 d-flex justify-content-between align-items-center"
                      as={Link as any}
                      to="/empleados"
                    >
                      Ver todos
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Mis Pendientes</h6>
                      <h2 className="text-warning mb-0 fw-bold">
                        {loading.solicitudes ? <Spinner animation="border" size="sm" /> : estadisticas.solicitudesPendientes}
                      </h2>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      <FontAwesomeIcon icon={faHourglassHalf} size="lg" className="text-warning" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="w-100 d-flex justify-content-between align-items-center"
                      as={Link as any}
                      to="/solicitudes?tab=mis-solicitudes"
                    >
                      Ver mis solicitudes
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {canApprove && (
              <Col md={6} lg={3} className="mb-3">
                <Card className="border-0 shadow-sm h-100 border-danger border-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-muted mb-2">Por Aprobar</h6>
                        <h2 className="text-danger mb-0 fw-bold">
                          {loading.aprobaciones ? <Spinner animation="border" size="sm" /> : estadisticas.aprobacionesPendientes}
                        </h2>
                      </div>
                      <div className="bg-danger bg-opacity-10 p-3 rounded">
                        <FontAwesomeIcon icon={faUserClock} size="lg" className="text-danger" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="w-100 d-flex justify-content-between align-items-center"
                        as={Link as any}
                        to="/solicitudes?tab=pendientes"
                      >
                        Revisar pendientes
                        <FontAwesomeIcon icon={faArrowRight} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col md={6} lg={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Notificaciones</h6>
                      <h2 className="text-info mb-0 fw-bold">
                        {loading.notificaciones ? <Spinner animation="border" size="sm" /> : estadisticas.notificacionesSinLeer}
                      </h2>
                      <small className="text-muted">{notificacionesRecientes.length} recientes</small>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <FontAwesomeIcon icon={faBell} size="lg" className="text-info" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="w-100 d-flex justify-content-between align-items-center"
                      as={Link as any}
                      to="/notificaciones"
                    >
                      Ver notificaciones
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabs de solicitudes */}
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                      Solicitudes
                    </h6>
                    <Button 
                      variant="link" 
                      size="sm" 
                      as={Link as any} 
                      to="/solicitudes"
                      className="text-decoration-none"
                    >
                      Ver todas
                      <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Tabs
                    defaultActiveKey="mis-solicitudes"
                    className="mb-3"
                    fill
                  >
                    <Tab 
                      eventKey="mis-solicitudes" 
                      title={
                        <span>
                          <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                          Mis Solicitudes
                          {estadisticas.solicitudesPendientes > 0 && (
                            <Badge bg="warning" className="ms-2">
                              {estadisticas.solicitudesPendientes}
                            </Badge>
                          )}
                        </span>
                      }
                    >
                      {loading.solicitudes ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" size="sm" />
                          <div className="mt-2">Cargando solicitudes...</div>
                        </div>
                      ) : solicitudesRecientes.length > 0 ? (
                        <>
                          <ListGroup variant="flush">
                            {solicitudesRecientes.slice(0, 2).map((solicitud) => (
                              <ListGroup.Item 
                                key={solicitud.ID} 
                                className="py-3 px-0 border-bottom"
                                action
                                as={Link as any}
                                to={`/solicitudes/detalle/${solicitud.ID}`}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    {getTipoSolicitud(solicitud.Tipo)}
                                    <span className="fw-medium ms-2">
                                      {solicitud.Motivo && solicitud.Motivo.length > 40 
                                        ? `${solicitud.Motivo.substring(0, 40)}...` 
                                        : solicitud.Motivo || 'Sin motivo'}
                                    </span>
                                  </div>
                                  {getEstadoBadge(solicitud.Estado)}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                    {formatFecha(solicitud.FechaSolicitud)}
                                  </small>
                                  {solicitud.Tipo === 'vacaciones' && solicitud.DiasSolicitados && (
                                    <small className="text-muted">
                                      {solicitud.DiasSolicitados} día(s)
                                    </small>
                                  )}
                                  {solicitud.Tipo === 'horas_extras' && solicitud.HorasSolicitadas && (
                                    <small className="text-muted">
                                      {solicitud.HorasSolicitadas} horas
                                    </small>
                                  )}
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                          
                          {/* Texto centrado con solicitudes faltantes */}
                          {solicitudesRecientes.length > 2 && (
                            <div className="text-center mt-3 mb-2">
                              <small className="text-muted fw-medium">
                                + {solicitudesRecientes.length - 2} solicitud(es) más
                              </small>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                          <h6 className="fw-normal">No tienes solicitudes</h6>
                          <p className="text-muted small mb-3">Crea tu primera solicitud</p>
                          <Button 
                            variant="primary" 
                            size="sm"
                            as={Link as any}
                            to="/solicitudes"
                          >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Nueva Solicitud
                          </Button>
                        </div>
                      )}
                    </Tab>

                    {canApprove && (
                      <Tab 
                        eventKey="pendientes" 
                        title={
                          <span>
                            <FontAwesomeIcon icon={faUserClock} className="me-2" />
                            Por Aprobar
                            {estadisticas.aprobacionesPendientes > 0 && (
                              <Badge bg="danger" className="ms-2">
                                {estadisticas.aprobacionesPendientes}
                              </Badge>
                            )}
                          </span>
                        }
                      >
                        {loading.aprobaciones ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" size="sm" />
                            <div className="mt-2">Cargando aprobaciones...</div>
                          </div>
                        ) : aprobacionesPendientes.length > 0 ? (
                          <>
                            <ListGroup variant="flush">
                              {aprobacionesPendientes.slice(0, 2).map((aprobacion) => (
                                <ListGroup.Item 
                                  key={aprobacion.AprobacionID} 
                                  className="py-3 px-0 border-bottom"
                                  action
                                  onClick={() => {
                                    window.location.href = `/solicitudes?aprobar=${aprobacion.AprobacionID}`;
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <div className="d-flex align-items-center mb-1">
                                        {getTipoSolicitud(aprobacion.Tipo)}
                                        <span className="ms-2 fw-medium">
                                          {aprobacion.EmpleadoNombre}
                                        </span>
                                      </div>
                                      <small className="text-muted d-block">
                                        {aprobacion.Motivo && aprobacion.Motivo.length > 60 
                                          ? `${aprobacion.Motivo.substring(0, 60)}...` 
                                          : aprobacion.Motivo}
                                      </small>
                                    </div>
                                    <Badge bg="warning" pill>
                                      #{aprobacion.OrdenAprobacion}
                                    </Badge>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                      {formatFecha(aprobacion.FechaSolicitud)}
                                    </small>
                                    <small className="text-muted">
                                      {aprobacion.DiasHoras}
                                    </small>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                            
                            {/* Texto centrado con aprobaciones faltantes */}
                            {aprobacionesPendientes.length > 2 && (
                              <div className="text-center mt-3 mb-2">
                                <small className="text-muted fw-medium">
                                  + {aprobacionesPendientes.length - 2} aprobación(es) pendiente(s) más
                                </small>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-5">
                            <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-success mb-3" />
                            <h6 className="fw-normal">No hay aprobaciones pendientes</h6>
                            <p className="text-muted small">Todas las solicitudes han sido procesadas</p>
                          </div>
                        )}
                      </Tab>
                    )}
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Proyectos activos */}
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-success" />
                    Proyectos Activos
                  </h6>
                  <Button variant="link" size="sm" as={Link as any} to="/proyectos" className="text-decoration-none">
                    Ver todos
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                </Card.Header>
                <Card.Body>
                  {loading.proyectos ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" variant="success" />
                      <div className="mt-2">Cargando proyectos...</div>
                    </div>
                  ) : proyectosActivos.length > 0 ? (
                    <>
                      <Row>
                        {proyectosActivos.slice(0, 2).map((proyecto) => (
                          <Col md={6} key={proyecto.ID} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="mb-1 fw-bold">{proyecto.Nombre}</h6>
                                    {proyecto.JefeProyectoNombre && (
                                      <small className="text-muted d-block">
                                        Jefe: {proyecto.JefeProyectoNombre}
                                      </small>
                                    )}
                                  </div>
                                  {getEstadoBadge(proyecto.Estado)}
                                </div>
                                <p className="text-muted small mb-3">
                                  {proyecto.Descripcion 
                                    ? (proyecto.Descripcion.length > 80 
                                        ? `${proyecto.Descripcion.substring(0, 80)}...` 
                                        : proyecto.Descripcion)
                                    : 'Sin descripción'}
                                </p>
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className="text-muted">Progreso</small>
                                    <small className="fw-bold">{proyecto.Progreso || 0}%</small>
                                  </div>
                                  <ProgressBar 
                                    now={proyecto.Progreso || 0} 
                                    variant={proyecto.Progreso && proyecto.Progreso >= 100 ? 'success' : 'primary'}
                                    style={{ height: '6px' }}
                                  />
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                    Inicio: {formatFecha(proyecto.FechaInicio)}
                                  </small>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    as={Link as any}
                                    to={`/proyectos/${proyecto.ID}`}
                                  >
                                    Ver detalles
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                      
                      {/* Texto centrado con proyectos faltantes */}
                      {proyectosActivos.length > 2 && (
                        <div className="text-center mt-2 mb-1">
                          <small className="text-muted fw-medium">
                            + {proyectosActivos.length - 2} proyecto(s) activo(s) más
                          </small>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <FontAwesomeIcon icon={faProjectDiagram} size="2x" className="text-muted mb-3" />
                      <p className="text-muted mb-0">No hay proyectos activos asignados</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Notificaciones recientes */}
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FontAwesomeIcon icon={faBell} className="me-2 text-info" />
                    Notificaciones Recientes
                  </h6>
                  <Button variant="link" size="sm" as={Link as any} to="/notificaciones" className="text-decoration-none">
                    Ver todas
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                </Card.Header>
                <Card.Body>
                  {loading.notificaciones ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" variant="info" />
                      <div className="mt-2">Cargando notificaciones...</div>
                    </div>
                  ) : notificacionesRecientes.length > 0 ? (
                    <>
                      <ListGroup variant="flush">
                        {notificacionesRecientes.slice(0, 2).map((notificacion) => (
                          <ListGroup.Item 
                            key={notificacion.ID} 
                            className={`py-3 px-0 border-bottom ${notificacion.Estado === 'no_vista' ? 'bg-light' : ''}`}
                            action
                            as={Link as any}
                            to="/notificaciones"
                          >
                            <div className="d-flex">
                              {notificacion.Importante && (
                                <div className="me-3">
                                  <FontAwesomeIcon icon={faExclamationCircle} className="text-danger" />
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div>
                                    <h6 className="mb-0 fw-bold">{notificacion.Titulo}</h6>
                                    {notificacion.Tipo && (
                                      <small className="text-muted d-block">
                                        {notificacion.Tipo}
                                      </small>
                                    )}
                                  </div>
                                  {getEstadoBadge(notificacion.Estado)}
                                </div>
                                <p className="text-muted small mb-1">
                                  {notificacion.Mensaje && notificacion.Mensaje.length > 100 
                                    ? `${notificacion.Mensaje.substring(0, 100)}...` 
                                    : notificacion.Mensaje}
                                </p>
                                <small className="text-muted">
                                  <FontAwesomeIcon icon={faClock} className="me-1" />
                                  {formatFechaHora(notificacion.FechaCreacion)}
                                </small>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      
                      {/* Texto centrado con notificaciones faltantes */}
                      {notificacionesRecientes.length > 2 && (
                        <div className="text-center mt-3 mb-2">
                          <small className="text-muted fw-medium">
                            + {notificacionesRecientes.length - 2} notificación(es) más
                          </small>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <FontAwesomeIcon icon={faBell} size="2x" className="text-muted mb-3" />
                      <p className="text-muted mb-0">No hay notificaciones recientes</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;