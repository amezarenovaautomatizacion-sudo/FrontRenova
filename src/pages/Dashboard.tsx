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
  faExclamationCircle,
  faArrowRight,
  faUserCircle,
  faUserClock,
  faHourglassHalf,
  faPlus,
  faPlayCircle,
  faPauseCircle,
  faStopCircle,
  faFlag,
  faRedoAlt,
  faCrown,
  faUserFriends
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { formatDateDisplay, formatDateTimeDisplay } from '../utils/dateUtils';

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
  JefeProyectoID?: number;
  JefeProyectoNombre?: string;
  TotalTareas?: number;
  TareasCompletadas?: number;
  estadisticas?: {
    total_tareas: number;
    tareas_completadas: number;
    total_empleados: number;
    tareas_pendientes: number;
    tareas_en_proceso: number;
  };
  Presupuesto?: number;
  Moneda?: string;
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
  
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [aprobacionesPendientes, setAprobacionesPendientes] = useState<AprobacionPendiente[]>([]);
  const [notificacionesRecientes, setNotificacionesRecientes] = useState<Notificacion[]>([]);
  const [proyectosActivos, setProyectosActivos] = useState<Proyecto[]>([]);
  const [miEmpleadoId, setMiEmpleadoId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState({
    estadisticas: true,
    solicitudes: true,
    aprobaciones: true,
    notificaciones: true,
    proyectos: true
  });

  const [refreshing, setRefreshing] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const rol = user?.rol || user?.Rol || 'employee';
    setUserRol(rol);
  }, [user]);

  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  const canApprove = isAdmin || isManager;

  const obtenerEmpleadoId = useCallback(async (): Promise<number | null> => {
    if (!user) return null;
    
    const cachedId = sessionStorage.getItem('empleadoId');
    if (cachedId) {
      const id = parseInt(cachedId);
      setMiEmpleadoId(id);
      return id;
    }
    
    if ((user as any).empleadoId) {
      const empleadoId = (user as any).empleadoId;
      sessionStorage.setItem('empleadoId', empleadoId.toString());
      setMiEmpleadoId(empleadoId);
      return empleadoId;
    }
    
    try {
      const response = await api.get('/auth/profile');
      
      if (response.data?.success && response.data?.data?.empleado?.ID) {
        const empleadoId = response.data.data.empleado.ID;
        sessionStorage.setItem('empleadoId', empleadoId.toString());
        setMiEmpleadoId(empleadoId);
        return empleadoId;
      }
    } catch (error) {
      console.error('Error obteniendo empleadoId:', error);
    }
    
    return null;
  }, [user]);

  const soyJefeDelProyecto = useCallback((proyecto: Proyecto): boolean => {
    if (!miEmpleadoId || !proyecto) return false;
    return proyecto.JefeProyectoID === miEmpleadoId;
  }, [miEmpleadoId]);

  const soyMiembroDelProyecto = useCallback((proyecto: Proyecto): boolean => {
    if (!miEmpleadoId || !proyecto) return false;
    // Por ahora, consideramos miembro si es jefe (esto se puede mejorar)
    return proyecto.JefeProyectoID === miEmpleadoId;
  }, [miEmpleadoId]);

  const refreshSection = async (section: string) => {
    setRefreshing(prev => ({ ...prev, [section]: true }));
    try {
      switch(section) {
        case 'estadisticas':
          await cargarEstadisticas();
          break;
        case 'solicitudes':
          await cargarMisSolicitudes();
          break;
        case 'aprobaciones':
          await cargarAprobacionesPendientes();
          break;
        case 'notificaciones':
          await cargarNotificacionesRecientes();
          break;
        case 'proyectos':
          await cargarProyectosActivos();
          break;
        case 'todo':
          await Promise.all([
            cargarEstadisticas(),
            cargarMisSolicitudes(),
            cargarAprobacionesPendientes(),
            cargarNotificacionesRecientes(),
            cargarProyectosActivos()
          ]);
          break;
      }
    } finally {
      setRefreshing(prev => ({ ...prev, [section]: false }));
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(prev => ({ ...prev, estadisticas: true }));
      
      let totalEmpleados = 0;
      try {
        const empleadosRes = await api.get('/empleados/empleados?limit=1');
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
        console.error('Error cargando colaboradores:', error);
      }

      let totalProyectos = 0;
      try {
        const proyectosRes = await api.get('/proyectos?limit=1');
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

  // ==================== FUNCIÓN CORREGIDA PARA CARGAR PROYECTOS ====================
  const cargarProyectosActivos = async () => {
    try {
      setLoading(prev => ({ ...prev, proyectos: true }));
      
      let proyectos = [];
      
      // Construir parámetros como en Proyectos.tsx
      const params = new URLSearchParams({
        limit: '100' // Límite alto para obtener todos los proyectos activos
      });
      
      // Filtrar por estado activo (como en Proyectos.tsx cuando se usa filterEstado)
      params.append('estado', 'activo');
      
      console.log('Cargando proyectos con params:', params.toString());
      
      // Usar el mismo endpoint que en Proyectos.tsx para todos los roles
      const response = await api.get(`/proyectos?${params}`);
      
      if (response.data.success) {
        // Manejar la estructura de respuesta exactamente como en Proyectos.tsx
        const data = response.data.data;
        
        // Extraer proyectos como en Proyectos.tsx: response.data.data.proyectos
        if (data && data.proyectos) {
          proyectos = data.proyectos;
        } else if (Array.isArray(data)) {
          proyectos = data;
        } else {
          proyectos = [];
        }
        
        console.log('Proyectos recibidos:', proyectos.length);
        
        // Filtrar por estado activo (por si acaso)
        const activos = proyectos.filter((p: any) => 
          p.Estado && p.Estado.toLowerCase() === 'activo'
        );
        
        // Calcular progreso para cada proyecto
        const proyectosConProgreso = activos.map((p: any) => ({
          ...p,
          Progreso: p.TotalTareas && p.TotalTareas > 0 
            ? Math.round((p.TareasCompletadas || 0) / p.TotalTareas * 100) 
            : p.estadisticas?.total_tareas && p.estadisticas?.total_tareas > 0
              ? Math.round((p.estadisticas.tareas_completadas || 0) / p.estadisticas.total_tareas * 100)
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
    // Primero aseguramos que tenemos el ID del empleado
    const empleadoId = await obtenerEmpleadoId();
    
    // Luego cargamos todos los datos
    await Promise.all([
      cargarEstadisticas(),
      cargarMisSolicitudes(),
      cargarAprobacionesPendientes(),
      cargarNotificacionesRecientes(),
      cargarProyectosActivos()
    ]);
  }, [canApprove, isAdmin, isManager, obtenerEmpleadoId]);

  useEffect(() => {
    const empleadoData = localStorage.getItem('renova_empleado');
    if (empleadoData) {
      try {
        const parsedEmpleado = JSON.parse(empleadoData);
        setEmpleado(parsedEmpleado);
      } catch (error) {
        console.error('Error al parsear datos del colaborador:', error);
      }
    }
    
    // Si no hay datos en localStorage, intentar obtener del user
    if (!empleadoData && user) {
      setEmpleado({
        ID: (user as any).EmpleadoID || (user as any).id,
        NombreCompleto: (user as any).NombreCompleto || (user as any).nombre,
        PuestoNombre: (user as any).PuestoNombre
      });
    }

    cargarDashboard();
  }, [cargarDashboard, user]);

  const solicitudesRecientes = misSolicitudes
    .sort((a, b) => new Date(b.FechaSolicitud).getTime() - new Date(a.FechaSolicitud).getTime())
    .slice(0, 5);

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      pendiente: { bg: 'secondary', icon: faClock, label: 'PENDIENTE' },
      en_proceso: { bg: 'primary', icon: faPlayCircle, label: 'EN PROCESO' },
      realizada: { bg: 'success', icon: faCheckCircle, label: 'FINALIZADA' },
      activo: { bg: 'success', icon: faPlayCircle, label: 'ACTIVO' },
      pausado: { bg: 'warning', icon: faPauseCircle, label: 'PAUSADO' },
      finalizado: { bg: 'danger', icon: faStopCircle, label: 'FINALIZADO' }
    };
    const cfg = config[estado] || { bg: 'secondary', icon: faClock, label: estado.toUpperCase() };
    return (
      <Badge bg={cfg.bg} className="d-flex align-items-center" style={{ padding: '0.4rem 0.6rem' }}>
        <FontAwesomeIcon icon={cfg.icon} className="me-1" size="sm" />
        {cfg.label}
      </Badge>
    );
  };

  const getProgresoColor = (porcentaje: number) => {
    if (porcentaje >= 75) return 'success';
    if (porcentaje >= 50) return 'info';
    if (porcentaje >= 25) return 'warning';
    return 'danger';
  };

  if (loading.estadisticas && loading.solicitudes && loading.aprobaciones && loading.proyectos) {
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
        <Col lg={3} md={4} className="mb-4">
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
                {userRol === 'admin' ? 'ADMINISTRADOR' : userRol === 'manager' ? 'GERENTE' : 'COLABORADOR'}
              </Badge>
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-primary" />
                Mis Estadísticas
              </h6>
              <Button
                variant="link"
                size="sm"
                onClick={() => refreshSection('estadisticas')}
                disabled={refreshing.estadisticas}
                className="p-0"
              >
                <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.estadisticas} />
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="mb-3 p-2 bg-light rounded">
                <small className="text-muted d-block mb-1">Mis Solicitudes Pendientes</small>
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold text-warning">
                    {loading.solicitudes ? <Spinner animation="border" size="sm" /> : estadisticas.solicitudesPendientes}
                  </h3>
                  <FontAwesomeIcon icon={faHourglassHalf} className="text-warning fa-2x" />
                </div>
              </div>
              
              {canApprove && (
                <div className="mb-3 p-2 bg-light rounded">
                  <small className="text-muted d-block mb-1">Por Aprobar</small>
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0 fw-bold text-danger">
                      {loading.aprobaciones ? <Spinner animation="border" size="sm" /> : estadisticas.aprobacionesPendientes}
                    </h3>
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

        <Col lg={9} md={8}>
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
            <div className="d-flex gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={() => refreshSection('todo')}
                disabled={refreshing.todo}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.todo} className="me-2" />
                Actualizar todo
              </Button>
              <div className="bg-light p-3 rounded">
                <small className="text-muted">
                  {formatDateDisplay(new Date().toISOString())}
                </small>
              </div>
            </div>
          </div>

          <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Colaboradores</h6>
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

          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    Solicitudes
                  </h6>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => refreshSection('solicitudes')}
                      disabled={refreshing.solicitudes}
                      className="p-0"
                    >
                      <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.solicitudes} className="me-2" />
                      Refrescar
                    </Button>
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
                                to={`/solicitudes`}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <Badge bg={solicitud.Tipo === 'vacaciones' ? 'primary' : solicitud.Tipo === 'permiso' ? 'info' : 'warning'} className="me-2">
                                      {solicitud.Tipo === 'vacaciones' ? 'Vacaciones' : solicitud.Tipo === 'permiso' ? 'Permiso' : 'Horas Extras'}
                                    </Badge>
                                    <span className="fw-medium ms-2">
                                      {solicitud.Motivo && solicitud.Motivo.length > 40 
                                        ? `${solicitud.Motivo.substring(0, 40)}...` 
                                        : solicitud.Motivo || 'Sin motivo'}
                                    </span>
                                  </div>
                                  <Badge bg={solicitud.Estado === 'pendiente' ? 'warning' : solicitud.Estado === 'aprobada' ? 'success' : 'secondary'}>
                                    {solicitud.Estado}
                                  </Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                    {formatDateDisplay(solicitud.FechaSolicitud)}
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
                                    window.location.href = `/solicitudes`;
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <div className="d-flex align-items-center mb-1">
                                        <Badge bg={aprobacion.Tipo === 'vacaciones' ? 'primary' : aprobacion.Tipo === 'permiso' ? 'info' : 'warning'} className="me-2">
                                          {aprobacion.Tipo === 'vacaciones' ? 'Vacaciones' : aprobacion.Tipo === 'permiso' ? 'Permiso' : 'Horas Extras'}
                                        </Badge>
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
                                      {formatDateDisplay(aprobacion.FechaSolicitud)}
                                    </small>
                                    <small className="text-muted">
                                      {aprobacion.DiasHoras}
                                    </small>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                            
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

          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-success" />
                    Proyectos Activos
                  </h6>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => refreshSection('proyectos')}
                      disabled={refreshing.proyectos}
                      className="p-0"
                    >
                      <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.proyectos} className="me-2" />
                      Refrescar
                    </Button>
                    <Button variant="link" size="sm" as={Link as any} to="/proyectos" className="text-decoration-none">
                      Ver todos
                      <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                    </Button>
                  </div>
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
                        {proyectosActivos.slice(0, 2).map((proyecto) => {
                          const esJefe = soyJefeDelProyecto(proyecto);
                          
                          return (
                            <Col md={6} key={proyecto.ID} className="mb-3">
                              <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                      <h6 className="mb-1 fw-bold d-flex align-items-center flex-wrap gap-2">
                                        {proyecto.Nombre}
                                        {esJefe && (
                                          <Badge bg="warning" text="dark" size="sm">
                                            <FontAwesomeIcon icon={faCrown} className="me-1" size="sm" />
                                            JEFE
                                          </Badge>
                                        )}
                                      </h6>
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
                                      <small className="fw-bold d-flex align-items-center">
                                        <span className={`text-${getProgresoColor(proyecto.Progreso || 0)}`}>
                                          {proyecto.Progreso || 0}%
                                        </span>
                                      </small>
                                    </div>
                                    <ProgressBar 
                                      now={proyecto.Progreso || 0} 
                                      variant={getProgresoColor(proyecto.Progreso || 0)}
                                      style={{ height: '6px' }}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center mt-3">
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                      Inicio: {formatDateDisplay(proyecto.FechaInicio)}
                                    </small>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      as={Link as any}
                                      to={`/proyectos`}
                                    >
                                      Ver detalles
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                      
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
                      <p className="text-muted mb-0">
                        No hay proyectos activos en el sistema
                      </p>
                      {(isAdmin || isManager) && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          as={Link as any}
                          to="/proyectos"
                          className="mt-3"
                        >
                          <FontAwesomeIcon icon={faPlus} className="me-2" />
                          Crear Proyecto
                        </Button>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FontAwesomeIcon icon={faBell} className="me-2 text-info" />
                    Notificaciones Recientes
                  </h6>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => refreshSection('notificaciones')}
                      disabled={refreshing.notificaciones}
                      className="p-0"
                    >
                      <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.notificaciones} className="me-2" />
                      Refrescar
                    </Button>
                    <Button variant="link" size="sm" as={Link as any} to="/notificaciones" className="text-decoration-none">
                      Ver todas
                      <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                    </Button>
                  </div>
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
                                  <Badge bg={notificacion.Estado === 'no_vista' ? 'danger' : 'secondary'}>
                                    {notificacion.Estado === 'no_vista' ? 'Nueva' : 'Vista'}
                                  </Badge>
                                </div>
                                <p className="text-muted small mb-1">
                                  {notificacion.Mensaje && notificacion.Mensaje.length > 100 
                                    ? `${notificacion.Mensaje.substring(0, 100)}...` 
                                    : notificacion.Mensaje}
                                </p>
                                <small className="text-muted">
                                  <FontAwesomeIcon icon={faClock} className="me-1" />
                                  {formatDateTimeDisplay(notificacion.FechaCreacion)}
                                </small>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      
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