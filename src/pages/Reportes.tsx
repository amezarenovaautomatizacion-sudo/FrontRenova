import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Modal,
  Alert,
  Spinner,
  Badge,
  InputGroup,
  Tabs,
  Tab,
  ButtonGroup,
  ListGroup,
  Dropdown,
  ProgressBar
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faDownload,
  faFileExcel,
  faFilePdf,
  faTable,
  faUsers,
  faFileAlt,
  faProjectDiagram,
  faBell,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faBan,
  faFilter,
  faSync,
  faEye,
  faChartPie,
  faChartLine,
  faInfoCircle,
  faSearch,
  faArrowRight,
  faHistory,
  faCalendar,
  faClock,
  faUser,
  faEnvelope,
  faBriefcase,
  faBuilding,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../services/api';

interface Empleado {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
  FechaIngreso: string;
  UsuarioActivo: boolean;
}

interface Solicitud {
  ID: number;
  EmpleadoID: number;
  Tipo: string;
  Estado: string;
  FechaSolicitud: string;
  FechaInicio?: string;
  FechaFin?: string;
  DiasSolicitados?: number;
  HorasSolicitadas?: number | string;
  Motivo: string;
  EmpleadoNombre?: string;
}

interface Proyecto {
  ID: number;
  Nombre: string;
  Estado: string;
  FechaInicio: string;
  FechaFin?: string;
  JefeProyectoNombre?: string;
  Presupuesto: number;
  MontoAsignado: number;
}

interface Incidencia {
  ID: number;
  EmpleadoID: number;
  EmpleadoNombre: string;
  TipoIncidenciaNombre: string;
  Descripcion: string;
  FechaIncidencia: string;
  Estado: string;
  CreadorNombre: string;
}

interface Notificacion {
  ID: number;
  Titulo: string;
  Mensaje: string;
  Tipo: string;
  Estado: string;
  Importante: boolean;
  FechaCreacion: string;
}

interface Metricas {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosInactivos: number;
  managers: number;
  admins: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  solicitudesCanceladas: number;
  proyectosActivos: number;
  proyectosPausados: number;
  proyectosFinalizados: number;
  notificacionesNoVistas: number;
  notificacionesImportantes: number;
}

interface ActividadReciente {
  id: number;
  tipo: 'solicitud' | 'proyecto' | 'incidencia' | 'notificacion';
  titulo: string;
  usuario: string;
  fecha: string;
  estado?: string;
  icono: any;
  color: string;
}

const Reportes: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const isManager = user?.rol === 'manager';
  const canViewAll = isAdmin || isManager;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  
  const [metricas, setMetricas] = useState<Metricas>({
    totalEmpleados: 0,
    empleadosActivos: 0,
    empleadosInactivos: 0,
    managers: 0,
    admins: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0,
    solicitudesCanceladas: 0,
    proyectosActivos: 0,
    proyectosPausados: 0,
    proyectosFinalizados: 0,
    notificacionesNoVistas: 0,
    notificacionesImportantes: 0
  });

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<string>('');
  const [selectedData, setSelectedData] = useState<any[]>([]);
  const [exportando, setExportando] = useState(false);

  const formatDateEs = (dateString: string | undefined | null): string => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatDateTimeEs = (dateString: string | undefined | null): string => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
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

  const cargarEmpleados = useCallback(async () => {
    try {
      const response = await api.get('/empleados/empleados?limit=1000');
      if (response.data.success) {
        const data = response.data.data;
        const empleadosData = data.empleados || [];
        setEmpleados(empleadosData);
        
        const activos = empleadosData.filter((e: any) => e.UsuarioActivo).length;
        const managers = empleadosData.filter((e: any) => e.RolApp === 'manager').length;
        const admins = empleadosData.filter((e: any) => e.RolApp === 'admin').length;
        
        setMetricas(prev => ({
          ...prev,
          totalEmpleados: empleadosData.length,
          empleadosActivos: activos,
          empleadosInactivos: empleadosData.length - activos,
          managers,
          admins
        }));
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    try {
      const misSolicitudesRes = await api.get('/solicitudes/mis-solicitudes');
      if (misSolicitudesRes.data.success) {
        const solicitudesData = misSolicitudesRes.data.data || [];
        setMisSolicitudes(solicitudesData);
        
        const pendientes = solicitudesData.filter((s: any) => s.Estado === 'pendiente').length;
        const aprobadas = solicitudesData.filter((s: any) => s.Estado === 'aprobada').length;
        const rechazadas = solicitudesData.filter((s: any) => s.Estado === 'rechazada').length;
        const canceladas = solicitudesData.filter((s: any) => s.Estado === 'cancelada').length;
        
        setMetricas(prev => ({
          ...prev,
          solicitudesPendientes: pendientes,
          solicitudesAprobadas: aprobadas,
          solicitudesRechazadas: rechazadas,
          solicitudesCanceladas: canceladas
        }));
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  }, []);

  const cargarProyectos = useCallback(async () => {
    try {
      const response = await api.get('/proyectos?limit=100');
      if (response.data.success) {
        const data = response.data.data;
        const proyectosData = data.proyectos || [];
        setProyectos(proyectosData);
        
        const activos = proyectosData.filter((p: any) => p.Estado === 'activo').length;
        const pausados = proyectosData.filter((p: any) => p.Estado === 'pausado').length;
        const finalizados = proyectosData.filter((p: any) => p.Estado === 'finalizado').length;
        
        setMetricas(prev => ({
          ...prev,
          proyectosActivos: activos,
          proyectosPausados: pausados,
          proyectosFinalizados: finalizados
        }));
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  }, []);

  const cargarIncidencias = useCallback(async () => {
    try {
      const response = await api.get('/incidencias?limit=100');
      if (response.data.success) {
        const data = response.data.data;
        setIncidencias(data.incidencias || []);
      }
    } catch (error) {
      console.error('Error cargando incidencias:', error);
    }
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const response = await api.get('/notificaciones/personales?limit=100');
      if (response.data.success) {
        const data = response.data.data;
        const notificacionesData = data.notificaciones || [];
        setNotificaciones(notificacionesData);
        
        const noVistas = notificacionesData.filter((n: any) => n.Estado === 'no_vista').length;
        const importantes = notificacionesData.filter((n: any) => n.Importante).length;
        
        setMetricas(prev => ({
          ...prev,
          notificacionesNoVistas: noVistas,
          notificacionesImportantes: importantes
        }));
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, []);

  const cargarActividadReciente = useCallback(async () => {
    try {
      const actividad: ActividadReciente[] = [];
      
      const solicitudesRes = await api.get('/solicitudes/mis-solicitudes?limit=5');
      if (solicitudesRes.data.success) {
        (solicitudesRes.data.data || []).slice(0, 3).forEach((s: any, index: number) => {
          actividad.push({
            id: s.ID || Date.now() + index,
            tipo: 'solicitud',
            titulo: `Solicitud de ${s.Tipo || 'desconocido'}`,
            usuario: s.EmpleadoNombre || 'Usuario',
            fecha: s.FechaSolicitud || new Date().toISOString(),
            estado: s.Estado || 'pendiente',
            icono: faFileAlt,
            color: s.Tipo === 'vacaciones' ? 'primary' : s.Tipo === 'permiso' ? 'info' : 'warning'
          });
        });
      }
      
      const proyectosRes = await api.get('/proyectos?limit=5');
      if (proyectosRes.data.success) {
        (proyectosRes.data.data.proyectos || []).slice(0, 2).forEach((p: any, index: number) => {
          actividad.push({
            id: p.ID || Date.now() + index + 100,
            tipo: 'proyecto',
            titulo: `Proyecto: ${p.Nombre || 'Sin nombre'}`,
            usuario: p.JefeProyectoNombre || 'Sistema',
            fecha: p.FechaInicio || new Date().toISOString(),
            estado: p.Estado || 'activo',
            icono: faProjectDiagram,
            color: p.Estado === 'activo' ? 'success' : p.Estado === 'pausado' ? 'warning' : 'secondary'
          });
        });
      }
      
      const incidenciasRes = await api.get('/incidencias?limit=5');
      if (incidenciasRes.data.success) {
        (incidenciasRes.data.data.incidencias || []).slice(0, 2).forEach((i: any, index: number) => {
          actividad.push({
            id: i.ID || Date.now() + index + 200,
            tipo: 'incidencia',
            titulo: `Incidencia: ${i.TipoIncidenciaNombre || 'Sin tipo'}`,
            usuario: i.EmpleadoNombre || 'Desconocido',
            fecha: i.FechaCreacion || new Date().toISOString(),
            estado: i.Estado || 'pendiente',
            icono: faExclamationTriangle,
            color: 'danger'
          });
        });
      }
      
      const notificacionesRes = await api.get('/notificaciones/personales?limit=5');
      if (notificacionesRes.data.success) {
        (notificacionesRes.data.data.notificaciones || []).slice(0, 2).forEach((n: any, index: number) => {
          actividad.push({
            id: n.ID || Date.now() + index + 300,
            tipo: 'notificacion',
            titulo: n.Titulo || 'Notificación',
            usuario: 'Sistema',
            fecha: n.createdAt || new Date().toISOString(),
            estado: n.Estado,
            icono: faBell,
            color: n.Importante ? 'danger' : 'info'
          });
        });
      }
      
      actividad.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setActividadReciente(actividad.slice(0, 10));
      
    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
    }
  }, []);

  const cargarTodosLosDatos = useCallback(async () => {
    if (!canViewAll) {
      setError('No tienes permisos para ver reportes');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        cargarEmpleados(),
        cargarSolicitudes(),
        cargarProyectos(),
        cargarIncidencias(),
        cargarNotificaciones(),
        cargarActividadReciente()
      ]);
      
      setSuccess('Datos cargados exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [canViewAll, cargarEmpleados, cargarSolicitudes, cargarProyectos, cargarIncidencias, cargarNotificaciones, cargarActividadReciente]);

  useEffect(() => {
    if (canViewAll) {
      cargarTodosLosDatos();
    }
  }, [canViewAll, cargarTodosLosDatos]);

  const exportToExcel = (data: any[], nombreArchivo: string) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      saveAs(blob, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      return false;
    }
  };

  const exportToCSV = (data: any[], nombreArchivo: string) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
      
      return true;
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      return false;
    }
  };

  const handleExport = (tipo: string, formato: 'excel' | 'csv') => {
    setExportando(true);
    
    try {
      let data: any[] = [];
      let nombreArchivo = '';
      
      switch (tipo) {
        case 'empleados':
          data = empleados;
          nombreArchivo = 'reporte_empleados';
          break;
        case 'solicitudes':
          data = misSolicitudes;
          nombreArchivo = 'reporte_solicitudes';
          break;
        case 'proyectos':
          data = proyectos;
          nombreArchivo = 'reporte_proyectos';
          break;
        case 'incidencias':
          data = incidencias;
          nombreArchivo = 'reporte_incidencias';
          break;
        case 'notificaciones':
          data = notificaciones;
          nombreArchivo = 'reporte_notificaciones';
          break;
        default:
          setError('Tipo de reporte no válido');
          setExportando(false);
          return;
      }
      
      if (data.length === 0) {
        setError('No hay datos para exportar');
        setExportando(false);
        return;
      }
      
      const success = formato === 'excel' 
        ? exportToExcel(data, nombreArchivo)
        : exportToCSV(data, nombreArchivo);
      
      if (success) {
        setSuccess(`${nombreArchivo} exportado exitosamente`);
        setTimeout(() => setSuccess(''), 3000);
        setShowExportModal(false);
      } else {
        setError('Error al exportar el archivo');
      }
      
    } catch (error) {
      console.error('Error en exportación:', error);
      setError('Error al exportar los datos');
    } finally {
      setExportando(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
  };

  const getEstadoBadge = (estado: string | undefined | null) => {
    if (!estado) {
      return (
        <Badge bg="secondary" className="d-flex align-items-center gap-1">
          <FontAwesomeIcon icon={faInfoCircle} size="xs" />
          <span>Sin estado</span>
        </Badge>
      );
    }

    const estadoLower = String(estado).toLowerCase();
    
    const estados: Record<string, { bg: string; icon: any }> = {
      activo: { bg: 'success', icon: faCheckCircle },
      activa: { bg: 'success', icon: faCheckCircle },
      pausado: { bg: 'warning', icon: faClock },
      finalizado: { bg: 'secondary', icon: faTimesCircle },
      pendiente: { bg: 'warning', icon: faHourglassHalf },
      aprobada: { bg: 'success', icon: faCheckCircle },
      aprobado: { bg: 'success', icon: faCheckCircle },
      rechazada: { bg: 'danger', icon: faTimesCircle },
      rechazado: { bg: 'danger', icon: faTimesCircle },
      cancelada: { bg: 'secondary', icon: faBan },
      no_vista: { bg: 'danger', icon: faBell },
      vista: { bg: 'info', icon: faBell },
      resuelta: { bg: 'success', icon: faCheckCircle },
      cerrada: { bg: 'secondary', icon: faTimesCircle }
    };
    
    const config = estados[estadoLower] || { bg: 'info', icon: faInfoCircle };
    
    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1">
        <FontAwesomeIcon icon={config.icon} size="xs" />
        <span>{String(estado).charAt(0).toUpperCase() + String(estado).slice(1).toLowerCase()}</span>
      </Badge>
    );
  };

  const getRolBadge = (rol: string) => {
    const colores: Record<string, string> = {
      admin: 'danger',
      manager: 'warning',
      employee: 'info'
    };
    return <Badge bg={colores[rol] || 'secondary'}>{rol.toUpperCase()}</Badge>;
  };

  if (!canViewAll) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <FontAwesomeIcon icon={faChartBar} size="3x" className="text-warning mb-3" />
            <h3>Acceso Restringido</h3>
            <p className="text-muted">
              Solo administradores y managers pueden acceder a los reportes y estadísticas.
            </p>
            <Badge bg={isAdmin ? 'danger' : isManager ? 'warning' : 'info'} 
              className="fs-6 p-2">
              Tu rol: {user?.rol?.toUpperCase() || 'NO DEFINIDO'}
            </Badge>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-primary" />
                Reportes y Estadísticas
              </h2>
              <p className="text-muted mb-0">
                Análisis de datos del sistema
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={cargarTodosLosDatos}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faSync} className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Actualizar'}
              </Button>
              
              <Button 
                variant="primary" 
                onClick={() => setShowExportModal(true)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Exportar
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          {success}
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small">Fecha desde</Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small">Fecha hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button 
                variant="primary" 
                onClick={cargarTodosLosDatos}
                className="w-100"
              >
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Aplicar Filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'dashboard')}
          className="mb-4"
          fill
        >
          <Tab eventKey="dashboard" title={
            <span>
              <FontAwesomeIcon icon={faChartPie} className="me-2" />
              Dashboard
            </span>
          }>
            <Row className="mb-4">
              <Col md={3}>
                <Card className="text-center shadow-sm border-primary">
                  <Card.Body>
                    <FontAwesomeIcon icon={faUsers} size="2x" className="text-primary mb-2" />
                    <h3>{metricas.totalEmpleados}</h3>
                    <small className="text-muted">Empleados</small>
                    <div className="mt-2 small">
                      <Badge bg="success" className="me-1">{metricas.empleadosActivos} activos</Badge>
                      <Badge bg="secondary">{metricas.empleadosInactivos} inactivos</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-warning">
                  <Card.Body>
                    <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-warning mb-2" />
                    <h3>{metricas.solicitudesPendientes}</h3>
                    <small className="text-muted">Solicitudes Pendientes</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-success">
                  <Card.Body>
                    <FontAwesomeIcon icon={faProjectDiagram} size="2x" className="text-success mb-2" />
                    <h3>{metricas.proyectosActivos}</h3>
                    <small className="text-muted">Proyectos Activos</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-info">
                  <Card.Body>
                    <FontAwesomeIcon icon={faBell} size="2x" className="text-info mb-2" />
                    <h3>{metricas.notificacionesNoVistas}</h3>
                    <small className="text-muted">Notificaciones no vistas</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    Resumen de Solicitudes
                  </Card.Header>
                  <Card.Body>
                    <Row className="text-center">
                      <Col xs={3}>
                        <div className="p-2">
                          <h5 className="text-warning">{metricas.solicitudesPendientes}</h5>
                          <small>Pendientes</small>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="p-2">
                          <h5 className="text-success">{metricas.solicitudesAprobadas}</h5>
                          <small>Aprobadas</small>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="p-2">
                          <h5 className="text-danger">{metricas.solicitudesRechazadas}</h5>
                          <small>Rechazadas</small>
                        </div>
                      </Col>
                      <Col xs={3}>
                        <div className="p-2">
                          <h5 className="text-secondary">{metricas.solicitudesCanceladas}</h5>
                          <small>Canceladas</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Resumen de Proyectos
                  </Card.Header>
                  <Card.Body>
                    <Row className="text-center">
                      <Col xs={4}>
                        <div className="p-2">
                          <h5 className="text-success">{metricas.proyectosActivos}</h5>
                          <small>Activos</small>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2">
                          <h5 className="text-warning">{metricas.proyectosPausados}</h5>
                          <small>Pausados</small>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2">
                          <h5 className="text-secondary">{metricas.proyectosFinalizados}</h5>
                          <small>Finalizados</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <FontAwesomeIcon icon={faHistory} className="me-2" />
                Actividad Reciente
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {actividadReciente.length === 0 ? (
                    <ListGroup.Item className="text-center py-4 text-muted">
                      No hay actividad reciente
                    </ListGroup.Item>
                  ) : (
                    actividadReciente.map((item) => (
                      <ListGroup.Item key={item.id} className="py-3">
                        <Row>
                          <Col xs="auto">
                            <div className={`rounded-circle bg-${item.color} bg-opacity-10 p-2`}>
                              <FontAwesomeIcon icon={item.icono} className={`text-${item.color}`} />
                            </div>
                          </Col>
                          <Col>
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>{item.titulo}</strong>
                                <div className="text-muted small">
                                  Por: {item.usuario}
                                  {item.estado && (
                                    <span className="ms-2">{getEstadoBadge(item.estado)}</span>
                                  )}
                                </div>
                              </div>
                              <small className="text-muted">
                                {formatDateTimeEs(item.fecha)}
                              </small>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="empleados" title={
            <span>
              <FontAwesomeIcon icon={faUsers} className="me-2" />
              Empleados
              <Badge bg="secondary" className="ms-2">{empleados.length}</Badge>
            </span>
          }>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Listado de Empleados
                </div>
                <ButtonGroup size="sm">
                  <Button variant="outline-success" onClick={() => {
                    setSelectedReporte('empleados');
                    setSelectedData(empleados);
                    setShowDetalleModal(true);
                  }}>
                    <FontAwesomeIcon icon={faEye} className="me-1" />
                    Ver detalle
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <Table hover size="sm" className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Puesto</th>
                        <th>Correo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.map((emp) => (
                        <tr key={emp.ID}>
                          <td>{emp.NombreCompleto}</td>
                          <td>{getRolBadge(emp.RolApp)}</td>
                          <td>{emp.PuestoNombre || 'N/A'}</td>
                          <td>{emp.CorreoElectronico}</td>
                          <td>
                            <Badge bg={emp.UsuarioActivo ? 'success' : 'secondary'}>
                              {emp.UsuarioActivo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {empleados.length > 20 && (
                  <div className="text-center p-2 bg-light">
                    <small className="text-muted">
                      Mostrando {empleados.length} empleados.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="solicitudes" title={
            <span>
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              Solicitudes
              <Badge bg="secondary" className="ms-2">{misSolicitudes.length}</Badge>
            </span>
          }>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Mis Solicitudes
                </div>
                <ButtonGroup size="sm">
                  <Button variant="outline-success" onClick={() => {
                    setSelectedReporte('solicitudes');
                    setSelectedData(misSolicitudes);
                    setShowDetalleModal(true);
                  }}>
                    <FontAwesomeIcon icon={faEye} className="me-1" />
                    Ver detalle
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <Table hover size="sm" className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misSolicitudes.map((sol) => (
                        <tr key={sol.ID}>
                          <td>#{sol.ID}</td>
                          <td>
                            <Badge bg={
                              sol.Tipo === 'vacaciones' ? 'primary' :
                              sol.Tipo === 'permiso' ? 'info' : 'warning'
                            }>
                              {sol.Tipo}
                            </Badge>
                          </td>
                          <td>{getEstadoBadge(sol.Estado)}</td>
                          <td>{formatDateEs(sol.FechaSolicitud)}</td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                              {sol.Motivo}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {misSolicitudes.length > 20 && (
                  <div className="text-center p-2 bg-light">
                    <small className="text-muted">
                      Mostrando {misSolicitudes.length} solicitudes.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="proyectos" title={
            <span>
              <FontAwesomeIcon icon={faProjectDiagram} className="me-2" />
              Proyectos
              <Badge bg="secondary" className="ms-2">{proyectos.length}</Badge>
            </span>
          }>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faProjectDiagram} className="me-2" />
                  Listado de Proyectos
                </div>
                <ButtonGroup size="sm">
                  <Button variant="outline-success" onClick={() => {
                    setSelectedReporte('proyectos');
                    setSelectedData(proyectos);
                    setShowDetalleModal(true);
                  }}>
                    <FontAwesomeIcon icon={faEye} className="me-1" />
                    Ver detalle
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <Table hover size="sm" className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>Proyecto</th>
                        <th>Estado</th>
                        <th>Jefe</th>
                        <th>Inicio</th>
                        <th>Presupuesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proyectos.map((proj) => (
                        <tr key={proj.ID}>
                          <td>{proj.Nombre}</td>
                          <td>{getEstadoBadge(proj.Estado)}</td>
                          <td>{proj.JefeProyectoNombre || 'N/A'}</td>
                          <td>{formatDateEs(proj.FechaInicio)}</td>
                          <td>{formatCurrency(proj.Presupuesto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {proyectos.length > 20 && (
                  <div className="text-center p-2 bg-light">
                    <small className="text-muted">
                      Mostrando {proyectos.length} proyectos.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="incidencias" title={
            <span>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Incidencias
              <Badge bg="secondary" className="ms-2">{incidencias.length}</Badge>
            </span>
          }>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  Listado de Incidencias
                </div>
                <ButtonGroup size="sm">
                  <Button variant="outline-success" onClick={() => {
                    setSelectedReporte('incidencias');
                    setSelectedData(incidencias);
                    setShowDetalleModal(true);
                  }}>
                    <FontAwesomeIcon icon={faEye} className="me-1" />
                    Ver detalle
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <Table hover size="sm" className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>ID</th>
                        <th>Empleado</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidencias.map((inc) => (
                        <tr key={inc.ID}>
                          <td>#{inc.ID}</td>
                          <td>{inc.EmpleadoNombre}</td>
                          <td>
                            <Badge bg="info">{inc.TipoIncidenciaNombre}</Badge>
                          </td>
                          <td>{formatDateEs(inc.FechaIncidencia)}</td>
                          <td>{getEstadoBadge(inc.Estado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {incidencias.length > 20 && (
                  <div className="text-center p-2 bg-light">
                    <small className="text-muted">
                      Mostrando {incidencias.length} incidencias.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="notificaciones" title={
            <span>
              <FontAwesomeIcon icon={faBell} className="me-2" />
              Notificaciones
              <Badge bg="secondary" className="ms-2">{notificaciones.length}</Badge>
            </span>
          }>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faBell} className="me-2" />
                  Mis Notificaciones
                </div>
                <ButtonGroup size="sm">
                  <Button variant="outline-success" onClick={() => {
                    setSelectedReporte('notificaciones');
                    setSelectedData(notificaciones);
                    setShowDetalleModal(true);
                  }}>
                    <FontAwesomeIcon icon={faEye} className="me-1" />
                    Ver detalle
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <Table hover size="sm" className="mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificaciones.map((not) => (
                        <tr key={not.ID}>
                          <td>
                            {not.Titulo}
                            {not.Importante && (
                              <Badge bg="danger" className="ms-2">!</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg="info">{not.Tipo}</Badge>
                          </td>
                          <td>{formatDateEs(not.FechaCreacion)}</td>
                          <td>
                            <Badge bg={not.Estado === 'no_vista' ? 'danger' : 'secondary'}>
                              {not.Estado === 'no_vista' ? 'No vista' : 'Vista'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {notificaciones.length > 20 && (
                  <div className="text-center p-2 bg-light">
                    <small className="text-muted">
                      Mostrando {notificaciones.length} notificaciones.
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}
      
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Exportar Reportes
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Selecciona el tipo de reporte y formato:</p>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tipo de reporte</Form.Label>
                <Form.Select
                  value={selectedReporte}
                  onChange={(e) => setSelectedReporte(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="empleados">Empleados</option>
                  <option value="solicitudes">Solicitudes</option>
                  <option value="proyectos">Proyectos</option>
                  <option value="incidencias">Incidencias</option>
                  <option value="notificaciones">Notificaciones</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="g-3">
            <Col md={6}>
              <Card 
                className={`text-center p-3 ${exportando || !selectedReporte ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => !exportando && selectedReporte && handleExport(selectedReporte, 'excel')}
                style={{ cursor: (exportando || !selectedReporte) ? 'not-allowed' : 'pointer' }}
              >
                <FontAwesomeIcon icon={faFileExcel} size="2x" className="text-success mb-2" />
                <h6>Excel</h6>
                <small className="text-muted">.xlsx</small>
              </Card>
            </Col>
            <Col md={6}>
              <Card 
                className={`text-center p-3 ${exportando || !selectedReporte ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => !exportando && selectedReporte && handleExport(selectedReporte, 'csv')}
                style={{ cursor: (exportando || !selectedReporte) ? 'not-allowed' : 'pointer' }}
              >
                <FontAwesomeIcon icon={faTable} size="2x" className="text-info mb-2" />
                <h6>CSV</h6>
                <small className="text-muted">.csv</small>
              </Card>
            </Col>
          </Row>
          
          {exportando && (
            <div className="text-center mt-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Exportando...</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={showDetalleModal} onHide={() => setShowDetalleModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Detalle de {selectedReporte === 'empleados' ? 'Empleados' :
                         selectedReporte === 'solicitudes' ? 'Solicitudes' :
                         selectedReporte === 'proyectos' ? 'Proyectos' :
                         selectedReporte === 'incidencias' ? 'Incidencias' :
                         selectedReporte === 'notificaciones' ? 'Notificaciones' : 'Reporte'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedData.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    {Object.keys(selectedData[0]).map((key) => (
                      <th key={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedData.map((item) => (
                    <tr key={item.ID || `row-${Math.random()}`}>
                      {Object.values(item).map((value: any, i) => (
                        <td key={`${item.ID || i}-${i}`}>
                          {typeof value === 'boolean' ? (
                            <Badge bg={value ? 'success' : 'secondary'}>
                              {value ? 'Sí' : 'No'}
                            </Badge>
                          ) : typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) ? (
                            formatDateEs(value)
                          ) : (
                            String(value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted">No hay datos para mostrar</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalleModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleExport(selectedReporte, 'excel')}
            disabled={exportando}
          >
            {exportando ? (
              <>
                <Spinner size="sm" className="me-2" />
                Exportando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Exportar a Excel
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s;
        }
        .sticky-top {
          top: 0;
          z-index: 10;
        }
      `}</style>
    </Container>
  );
};

export default Reportes;