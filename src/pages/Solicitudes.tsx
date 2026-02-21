import React, { useState, useEffect } from 'react';
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
  Pagination,
  Tabs,
  Tab,
  ButtonGroup,
  ListGroup,
  Accordion
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faUserClock,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faBan,
  faFileAlt,
  faSearch,
  faSync,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faDownload,
  faFilter,
  faCalendarCheck,
  faCalendarTimes,
  faCalendarDay,
  faUser,
  faUsers,
  faChartBar,
  faHistory,
  faComment,
  faPaperPlane,
  faEnvelope,
  faPhone,
  faBuilding,
  faBriefcase,
  faMoneyBillWave,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarPlus,
  faCalendarMinus,
  faQuestionCircle,
  faPrint,
  faArrowRight,
  faUserTie,
  faUserShield,
  faCalculator,
  faReceipt,
  faFileInvoiceDollar,
  faClipboardList,
  faTasks,
  faBusinessTime,
  faSortNumericUp,
  faMapMarkerAlt,
  faIdCard
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

// Interfaces actualizadas basadas en la API real
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
  EmpleadoRol?: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
}

interface Aprobacion {
  ID: number;
  SolicitudID: number;
  AprobadorID: number;
  Estado: 'pendiente' | 'aprobado' | 'rechazado';
  OrdenAprobacion: number;
  Comentarios?: string;
  FechaAprobacion?: string;
  AprobadorNombre?: string;
  RolAprobador?: string;
}

interface HistorialSolicitud {
  ID: number;
  SolicitudID: number;
  UsuarioID: number;
  Accion: string;
  Detalles?: string;
  Comentarios?: string;
  EstadoAnterior?: string;
  EstadoNuevo?: string;
  UsuarioNombre?: string;
  createdAt: string;
}

interface DerechosVacacionales {
  DiasDisponibles: number;
  DiasTomados: number;
  DiasPendientes: number;
  DiasTotales: number;
  AnioActual: number;
  ProximoPeriodo?: string;
  AntiguedadMeses?: number;
}

interface AprobacionPendiente {
  AprobacionID: number;
  SolicitudID: number;
  EmpleadoNombre: string;
  Tipo: string;
  FechaSolicitud: string;
  FechaInicio?: string;
  FechaFin?: string;
  DiasSolicitados?: number;
  HorasSolicitadas?: number | string;
  ConGoce?: boolean | number;
  Motivo: string;
  OrdenAprobacion: number;
  EstadoAprobacion: 'pendiente' | 'aprobado' | 'rechazado';
}

interface ReporteHorasExtras {
  ID: number;
  EmpleadoID: number;
  EmpleadoNombre: string;
  FechaInicio: string;
  HorasSolicitadas: number;
  Estado: string;
  Motivo: string;
  CreadoPor: string;
}

interface DetalleSolicitudResponse {
  solicitud: Solicitud;
  aprobaciones: Aprobacion[];
  historial: HistorialSolicitud[];
  incidencia: any;
  estadisticas: {
    totalAprobaciones: number;
    aprobadas: number;
    rechazadas: number;
    pendientes: number;
  };
}

// Interfaz extendida para mostrar detalles completos en aprobación
interface DetalleAprobacion extends AprobacionPendiente {
  MotivoCompleto?: string;
  Observaciones?: string;
  Departamento?: string;
  Puesto?: string;
}

const Solicitudes: React.FC = () => {
  const { user, logout } = useAuth();
  
  const getUserRol = () => {
    if (!user) return null;
    return user.rol || user.Rol || 'employee';
  };
  
  const userRol = getUserRol();
  
  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  const isEmployee = userRol === 'employee';
  
  const canViewAll = isAdmin || isManager;
  const canCreateVacaciones = true;
  const canCreatePermiso = true;
  const canCreateHorasExtras = isAdmin || isManager;
  const canApprove = isAdmin || isManager;
  const canViewReports = isAdmin || isManager;
  
  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('mis-solicitudes');
  
// Estados para listados
const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
const [solicitudesPendientes, setSolicitudesPendientes] = useState<AprobacionPendiente[]>([]);
const [solicitudesAprobadas, setSolicitudesAprobadas] = useState<Solicitud[]>([]);
const [reporteHorasExtras, setReporteHorasExtras] = useState<ReporteHorasExtras[]>([]);
const [empleadosSelect, setEmpleadosSelect] = useState<any[]>([]);
const [pendientesCount, setPendientesCount] = useState<number>(0); // <-- AGREGAR ESTA LÍNEA
  
  // Estados para formularios
  const [showVacacionesModal, setShowVacacionesModal] = useState(false);
  const [showPermisoModal, setShowPermisoModal] = useState(false);
  const [showHorasExtrasModal, setShowHorasExtrasModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditAprobacionModal, setShowEditAprobacionModal] = useState(false);
  
  // Datos de formularios
  const [vacacionesData, setVacacionesData] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    observaciones: ''
  });
  
  const [permisoData, setPermisoData] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    motivo: '',
    conGoce: true,
    observaciones: ''
  });
  
  const [horasExtrasData, setHorasExtrasData] = useState({
    empleadoId: '',
    fechaInicio: '',
    horasSolicitadas: '',
    motivo: '',
    observaciones: ''
  });
  
  const [aprobacionData, setAprobacionData] = useState({
    aprobacionId: 0,
    estado: 'aprobada',
    comentarios: ''
  });
  
  const [editAprobacionData, setEditAprobacionData] = useState({
    aprobacionId: 0,
    estado: 'aprobada',
    comentarios: ''
  });
  
  // Estados para datos adicionales
  const [derechosVacacionales, setDerechosVacacionales] = useState<DerechosVacacionales | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedSolicitudDetalle, setSelectedSolicitudDetalle] = useState<DetalleSolicitudResponse | null>(null);
  const [selectedAprobacion, setSelectedAprobacion] = useState<DetalleAprobacion | null>(null);
  
  // Estados para filtros
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadDerechosVacacionales();
    if (canViewAll) {
      loadEmpleadosSelect();
    }
     if (canApprove) {
      loadPendientesCount();
    }
  }, []);
  
  useEffect(() => {
    loadTabData();
  }, [activeTab, filterEstado, filterTipo, filterFechaDesde, filterFechaHasta]);
  

useEffect(() => {
  if (!canApprove) return;
  
  // Actualizar cada 30 segundos
  const interval = setInterval(() => {
    loadPendientesCount();
  }, 30000);
  return () => clearInterval(interval);
}, [canApprove]);

const loadTabData = () => {
  switch (activeTab) {
    case 'mis-solicitudes':
      loadMisSolicitudes();
      break;
    case 'pendientes':
      if (canApprove) loadSolicitudesPendientes();
      break;
    case 'aprobadas':
      if (canViewAll) loadSolicitudesAprobadas();
      break;
    case 'horas-extras':
      if (canViewReports) loadReporteHorasExtras();
      break;
  }
  
  // Siempre actualizar el contador de pendientes cuando se cambia de pestaña
  if (canApprove && activeTab !== 'pendientes') {
    loadPendientesCount();
  }
};
  
  const loadDerechosVacacionales = async () => {
    try {
      const response = await api.get('/solicitudes/vacaciones/derechos');
      console.log('Derechos vacacionales:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        // Calcular días totales si no vienen
        const diasTotales = data.DiasTotales || (data.DiasDisponibles + data.DiasTomados);
        
        setDerechosVacacionales({
          DiasDisponibles: data.DiasDisponibles || 0,
          DiasTomados: data.DiasTomados || 0,
          DiasPendientes: data.DiasPendientes || 0,
          DiasTotales: diasTotales,
          AnioActual: data.AnioActual || new Date().getFullYear(),
          ProximoPeriodo: data.ProximoPeriodo,
          AntiguedadMeses: data.AntiguedadMeses
        });
      } else {
        console.warn('Respuesta de derechos vacacionales sin éxito:', response.data);
      }
    } catch (error: any) {
      console.error('Error cargando derechos vacacionales:', error);
      // Si falla, crear datos por defecto
      setDerechosVacacionales({
        DiasDisponibles: 12,
        DiasTomados: 0,
        DiasPendientes: 0,
        DiasTotales: 12,
        AnioActual: new Date().getFullYear(),
        ProximoPeriodo: `${new Date().getFullYear() + 1}-01-01`,
        AntiguedadMeses: 12
      });
    }
  };
  
  const loadEmpleadosSelect = async () => {
    try {
      const response = await api.get('/empleados/catalogos');
      if (response.data.success) {
        setEmpleadosSelect(response.data.data.empleados || []);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };
  
  const loadMisSolicitudes = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (filterEstado) {
        // Usar endpoint de solicitudes por estado
        response = await api.get(`/solicitudes/estado/${filterEstado}`);
      } else {
        // Usar endpoint de todas mis solicitudes
        response = await api.get('/solicitudes/mis-solicitudes');
      }
      
      console.log('Mis solicitudes respuesta:', response.data);
      
      if (response.data.success) {
        let solicitudes = response.data.data || [];
        
        // Filtrar por tipo si se especificó
        if (filterTipo) {
          solicitudes = solicitudes.filter((s: Solicitud) => s.Tipo === filterTipo);
        }
        
        setMisSolicitudes(solicitudes);
      } else {
        setError(response.data.message || 'Error cargando solicitudes');
      }
    } catch (error: any) {
      console.error('Error en loadMisSolicitudes:', error);
      setError(error.response?.data?.message || 'Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  };
  
const loadSolicitudesPendientes = async () => {
  if (!canApprove) return;
  
  try {
    setLoading(true);
    setError('');
    
    const response = await api.get('/solicitudes/aprobaciones/pendientes');
    console.log('Aprobaciones pendientes respuesta:', response.data);
    
    if (response.data.success) {
      const data = response.data.data || [];
      setSolicitudesPendientes(data);
      setPendientesCount(data.length); // <-- ACTUALIZAR EL CONTADOR
    } else {
      setError(response.data.message || 'Error cargando aprobaciones pendientes');
    }
  } catch (error: any) {
    console.error('Error en loadSolicitudesPendientes:', error);
    setError(error.response?.data?.message || 'Error cargando aprobaciones pendientes');
  } finally {
    setLoading(false);
  }
};
  
  const loadSolicitudesAprobadas = async () => {
    if (!canViewAll) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Usar parámetros de filtro
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      if (filterTipo) params.append('tipo', filterTipo);
      
      const response = await api.get(`/solicitudes/aprobadas?${params}`);
      console.log('Solicitudes aprobadas respuesta:', response.data);
      
      if (response.data.success) {
        // La respuesta puede venir como data.data.solicitudes o directamente como data.data
        const data = response.data.data;
        setSolicitudesAprobadas(data?.solicitudes || data || []);
      } else {
        setError(response.data.message || 'Error cargando solicitudes aprobadas');
      }
    } catch (error: any) {
      console.error('Error en loadSolicitudesAprobadas:', error);
      setError(error.response?.data?.message || 'Error cargando solicitudes aprobadas');
    } finally {
      setLoading(false);
    }
  };
  
  const loadReporteHorasExtras = async () => {
    if (!canViewReports) return;
    
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filterFechaDesde) params.append('fechaDesde', filterFechaDesde);
      if (filterFechaHasta) params.append('fechaHasta', filterFechaHasta);
      
      const response = await api.get(`/solicitudes/horas-extras/reporte?${params}`);
      console.log('Reporte horas extras respuesta:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        setReporteHorasExtras(data?.reporte || data || []);
      } else {
        setError(response.data.message || 'Error cargando reporte de horas extras');
      }
    } catch (error: any) {
      console.error('Error en loadReporteHorasExtras:', error);
      setError(error.response?.data?.message || 'Error cargando reporte de horas extras');
    } finally {
      setLoading(false);
    }
  };

    const loadPendientesCount = async () => {
    if (!canApprove) return;
    
    try {
      // Usar el mismo endpoint que carga las pendientes pero solo para contar
      const response = await api.get('/solicitudes/aprobaciones/pendientes');
      if (response.data.success) {
        const count = response.data.data?.length || 0;
        setPendientesCount(count);
        console.log('📊 Pendientes count actualizado:', count);
      }
    } catch (error: any) {
      console.error('Error cargando contador de pendientes:', error);
    }
  };
  
  const loadDetalleSolicitud = async (solicitudId: number) => {
    try {
      setError('');
      setSelectedSolicitudDetalle(null);
      
      console.log('Cargando detalle de solicitud:', solicitudId);
      
      // Primero, buscar en mis solicitudes para tener datos básicos
      let solicitudBasica = misSolicitudes.find(s => s.ID === solicitudId);
      
      // Si no está en mis solicitudes y es admin/manager, buscar en aprobadas
      if (!solicitudBasica && canViewAll) {
        solicitudBasica = solicitudesAprobadas.find(s => s.ID === solicitudId);
      }
      
      // Intentar cargar detalles completos desde el endpoint
      let detalleCompleto = null;
      try {
        const response = await api.get(`/solicitudes/detalle/${solicitudId}`);
        console.log('Detalle completo respuesta:', response.data);
        
        if (response.data.success) {
          detalleCompleto = response.data.data;
        }
      } catch (detailError) {
        console.warn('No se pudo cargar detalle completo, usando datos básicos:', detailError);
      }
      
      // Combinar datos
      const solicitudCombinada: Solicitud = {
        ...(solicitudBasica || {}),
        ...(detalleCompleto?.solicitud || {}),
        ID: solicitudId,
        Tipo: solicitudBasica?.Tipo || detalleCompleto?.solicitud?.Tipo || 'permiso',
        Estado: solicitudBasica?.Estado || detalleCompleto?.solicitud?.Estado || 'pendiente',
        Motivo: solicitudBasica?.Motivo || detalleCompleto?.solicitud?.Motivo || 'No disponible',
        FechaSolicitud: solicitudBasica?.FechaSolicitud || detalleCompleto?.solicitud?.FechaSolicitud || new Date().toISOString()
      } as Solicitud;
      
      console.log('Solicitud combinada:', solicitudCombinada);
      
      setSelectedSolicitud(solicitudCombinada);
      setSelectedSolicitudDetalle(detalleCompleto);
      setShowDetailModal(true);
      
    } catch (error: any) {
      console.error('Error en loadDetalleSolicitud:', error);
      setError(error.response?.data?.message || 'Error cargando detalle de solicitud');
      
      // Mostrar modal con datos mínimos
      const solicitudMinima: Solicitud = {
        ID: solicitudId,
        EmpleadoID: 0,
        Tipo: 'permiso',
        Estado: 'pendiente',
        FechaSolicitud: new Date().toISOString(),
        Motivo: 'No se pudieron cargar los detalles completos',
        EmpleadoNombre: user?.usuario || 'Usuario actual'
      };
      
      setSelectedSolicitud(solicitudMinima);
      setShowDetailModal(true);
    }
  };
  
  const handleSolicitarVacaciones = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!vacacionesData.fechaInicio || !vacacionesData.fechaFin || !vacacionesData.motivo) {
        setError('Fecha inicio, fecha fin y motivo son requeridos');
        return;
      }
      
      const inicio = new Date(vacacionesData.fechaInicio);
      const fin = new Date(vacacionesData.fechaFin);
      
      if (inicio > fin) {
        setError('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }
      
      const diasSolicitados = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Verificar que tenga días disponibles
      if (derechosVacacionales && diasSolicitados > derechosVacacionales.DiasDisponibles) {
        setError(`Solo tienes ${derechosVacacionales.DiasDisponibles} días disponibles. Estás solicitando ${diasSolicitados} días.`);
        return;
      }
      
      const solicitudData = {
        ...vacacionesData,
        fechaInicio: inicio.toISOString().split('T')[0],
        fechaFin: fin.toISOString().split('T')[0],
        diasSolicitados: diasSolicitados
      };
      
      console.log('Enviando solicitud de vacaciones:', solicitudData);
      
      const response = await api.post('/solicitudes/vacaciones/solicitar', solicitudData);
      console.log('Respuesta vacaciones:', response.data);
      
      if (response.data.success) {
        setSuccess('Solicitud de vacaciones enviada exitosamente');
        setShowVacacionesModal(false);
        setVacacionesData({
          fechaInicio: '',
          fechaFin: '',
          motivo: '',
          observaciones: ''
        });
        loadMisSolicitudes();
        loadDerechosVacacionales();
      } else {
        setError(response.data.message || 'Error enviando solicitud');
      }
    } catch (error: any) {
      console.error('Error en handleSolicitarVacaciones:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error enviando solicitud';
      
      if (errorMsg.includes('No tiene días suficientes')) {
        setError('No tienes días de vacaciones disponibles');
      } else if (errorMsg.includes('ER_DUP_ENTRY')) {
        setError('Ya existe una solicitud similar');
      } else {
        setError(errorMsg);
      }
    }
  };
  
  const handleSolicitarPermiso = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!permisoData.fechaInicio || !permisoData.motivo) {
        setError('Fecha y motivo son requeridos');
        return;
      }
      
      // Validar 24 horas de anticipación
      const fechaSeleccionada = new Date(permisoData.fechaInicio);
      const ahora = new Date();
      const diferenciaHoras = (fechaSeleccionada.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      
      if (diferenciaHoras < 24) {
        setError('Los permisos deben solicitarse con al menos 24 horas de anticipación');
        return;
      }
      
      console.log('Enviando solicitud de permiso:', permisoData);
      
      const response = await api.post('/solicitudes/permisos/solicitar', {
        ...permisoData,
        fechaInicio: fechaSeleccionada.toISOString().split('T')[0]
      });
      
      console.log('Respuesta permiso:', response.data);
      
      if (response.data.success) {
        setSuccess('Solicitud de permiso enviada exitosamente');
        setShowPermisoModal(false);
        setPermisoData({
          fechaInicio: new Date().toISOString().split('T')[0],
          motivo: '',
          conGoce: true,
          observaciones: ''
        });
        loadMisSolicitudes();
      } else {
        setError(response.data.message || 'Error enviando solicitud');
      }
    } catch (error: any) {
      console.error('Error en handleSolicitarPermiso:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error enviando solicitud';
      
      if (errorMsg.includes('24 horas')) {
        setError('Los permisos deben solicitarse con al menos 24 horas de anticipación');
      } else {
        setError(errorMsg);
      }
    }
  };
  
  const handleSolicitarHorasExtras = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!horasExtrasData.empleadoId || !horasExtrasData.fechaInicio || 
          !horasExtrasData.horasSolicitadas || !horasExtrasData.motivo) {
        setError('Todos los campos son requeridos');
        return;
      }
      
      const horas = parseFloat(horasExtrasData.horasSolicitadas);
      if (horas <= 0 || horas > 24) {
        setError('Las horas solicitadas deben estar entre 0.5 y 24');
        return;
      }
      
      const solicitudData = {
        ...horasExtrasData,
        empleadoId: parseInt(horasExtrasData.empleadoId),
        horasSolicitadas: horas,
        fechaInicio: new Date(horasExtrasData.fechaInicio).toISOString().split('T')[0]
      };
      
      console.log('Enviando solicitud de horas extras:', solicitudData);
      
      const response = await api.post('/solicitudes/horas-extras/solicitar', solicitudData);
      console.log('Respuesta horas extras:', response.data);
      
      if (response.data.success) {
        setSuccess('Solicitud de horas extras enviada exitosamente');
        setShowHorasExtrasModal(false);
        setHorasExtrasData({
          empleadoId: '',
          fechaInicio: '',
          horasSolicitadas: '',
          motivo: '',
          observaciones: ''
        });
        loadReporteHorasExtras();
      } else {
        setError(response.data.message || 'Error enviando solicitud');
      }
    } catch (error: any) {
      console.error('Error en handleSolicitarHorasExtras:', error);
      setError(error.response?.data?.message || 'Error enviando solicitud');
    }
  };
  
const handleProcesarAprobacion = async () => {
  try {
    setError('');
    setSuccess('');
    
    if (!aprobacionData.comentarios || aprobacionData.comentarios.trim().length < 5) {
      setError('Se requiere un comentario explicativo de al menos 5 caracteres');
      return;
    }
    
    console.log('Procesando aprobación:', aprobacionData);
    
    const estadoAPI = aprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazado';
    
    const response = await api.patch(
      `/solicitudes/aprobaciones/${aprobacionData.aprobacionId}/procesar`,
      { 
        estado: estadoAPI, 
        comentarios: aprobacionData.comentarios 
      }
    );
    
    console.log('Respuesta procesar aprobación:', response.data);
    
    if (response.data.success) {
      setSuccess(`Aprobación ${aprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente`);
      setShowApproveModal(false);
      setAprobacionData({
        aprobacionId: 0,
        estado: 'aprobada',
        comentarios: ''
      });
      
      // Actualizar datos
      await loadSolicitudesPendientes(); // Esto ya actualiza el contador
      loadSolicitudesAprobadas();
      loadPendientesCount(); // <-- ACTUALIZAR EXPLÍCITAMENTE EL CONTADOR
    } else {
      setError(response.data.message || 'Error procesando aprobación');
    }
  } catch (error: any) {
    console.error('Error en handleProcesarAprobacion:', error);
    setError(error.response?.data?.message || 'Error procesando aprobación');
  }
};
  
const handleEditarAprobacion = async () => {
  try {
    setError('');
    setSuccess('');
    
    if (!editAprobacionData.comentarios || editAprobacionData.comentarios.trim().length < 10) {
      setError('Se requiere un comentario explicativo de al menos 10 caracteres');
      return;
    }
    
    console.log('Editando aprobación:', editAprobacionData);
    
    const estadoAPI = editAprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazado';
    
    const response = await api.patch(
      `/solicitudes/aprobaciones/${editAprobacionData.aprobacionId}/editar`,
      { 
        estado: estadoAPI, 
        comentarios: editAprobacionData.comentarios 
      }
    );
    
    console.log('Respuesta editar aprobación:', response.data);
    
    if (response.data.success) {
      setSuccess(`Aprobación actualizada a ${editAprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazada'}`);
      setShowEditAprobacionModal(false);
      setEditAprobacionData({
        aprobacionId: 0,
        estado: 'aprobada',
        comentarios: ''
      });
      
      // Actualizar datos
      await loadSolicitudesPendientes(); // Esto ya actualiza el contador
      loadPendientesCount(); // <-- ACTUALIZAR EXPLÍCITAMENTE EL CONTADOR
    } else {
      setError(response.data.message || 'Error editando aprobación');
    }
  } catch (error: any) {
    console.error('Error en handleEditarAprobacion:', error);
    setError(error.response?.data?.message || 'Error editando aprobación');
  }
};
  
  const handleCancelarSolicitud = async (solicitudId: number) => {
    if (!window.confirm('¿Estás seguro de cancelar esta solicitud?')) {
      return;
    }
    
    try {
      setError('');
      
      console.log('Cancelando solicitud:', solicitudId);
      
      const response = await api.patch(`/solicitudes/${solicitudId}/cancelar`);
      
      console.log('Respuesta cancelar:', response.data);
      
      if (response.data.success) {
        setSuccess('Solicitud cancelada exitosamente');
        loadMisSolicitudes();
        loadDerechosVacacionales();
      } else {
        setError(response.data.message || 'Error cancelando solicitud');
      }
    } catch (error: any) {
      console.error('Error en handleCancelarSolicitud:', error);
      setError(error.response?.data?.message || 'Error cancelando solicitud');
    }
  };
  
  const openApproveModal = async (aprobacion: AprobacionPendiente) => {
    try {
      // Cargar detalles adicionales de la solicitud
      let detallesCompletos: Partial<DetalleAprobacion> = {};
      
      try {
        const response = await api.get(`/solicitudes/${aprobacion.SolicitudID}`);
        if (response.data.success) {
          const solicitudData = response.data.data;
          detallesCompletos = {
            MotivoCompleto: solicitudData.Motivo,
            Observaciones: solicitudData.Observaciones,
            Departamento: solicitudData.DepartamentoNombre,
            Puesto: solicitudData.PuestoNombre
          };
        }
      } catch (error) {
        console.warn('No se pudieron cargar detalles adicionales:', error);
      }
      
      // Combinar datos
      const aprobacionCompleta: DetalleAprobacion = {
        ...aprobacion,
        ...detallesCompletos
      };
      
      setSelectedAprobacion(aprobacionCompleta);
      setAprobacionData({
        aprobacionId: aprobacion.AprobacionID,
        estado: 'aprobada',
        comentarios: ''
      });
      setShowApproveModal(true);
    } catch (error) {
      console.error('Error cargando detalles de aprobación:', error);
      // Si falla, usar los datos que ya tenemos
      setSelectedAprobacion(aprobacion);
      setAprobacionData({
        aprobacionId: aprobacion.AprobacionID,
        estado: 'aprobada',
        comentarios: ''
      });
      setShowApproveModal(true);
    }
  };
  
  const openEditAprobacionModal = (aprobacion: AprobacionPendiente) => {
    setSelectedAprobacion(aprobacion);
    setEditAprobacionData({
      aprobacionId: aprobacion.AprobacionID,
      estado: 'aprobada',
      comentarios: ''
    });
    setShowEditAprobacionModal(true);
  };
  
  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { bg: string, text: string, icon: any }> = {
      // Estados para SOLICITUDES
      pendiente: { bg: 'warning', text: 'Pendiente', icon: faHourglassHalf },
      aprobada: { bg: 'success', text: 'Aprobada', icon: faCheckCircle },
      rechazada: { bg: 'danger', text: 'Rechazada', icon: faTimesCircle },
      cancelada: { bg: 'secondary', text: 'Cancelada', icon: faBan },
      
      // Estados para APROBACIONES (valores que vienen del trigger)
      aprobado: { bg: 'success', text: 'Aprobado', icon: faCheckCircle },
      rechazado: { bg: 'danger', text: 'Rechazado', icon: faTimesCircle }
    };
    
    const estadoInfo = estados[estado] || { bg: 'secondary', text: estado, icon: faQuestionCircle };
    
    return (
      <Badge bg={estadoInfo.bg} className="d-flex align-items-center gap-1">
        <FontAwesomeIcon icon={estadoInfo.icon} />
        <span>{estadoInfo.text}</span>
      </Badge>
    );
  };
  
  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { bg: string, text: string, icon: any }> = {
      vacaciones: { bg: 'primary', text: 'Vacaciones', icon: faCalendarDay },
      permiso: { bg: 'info', text: 'Permiso', icon: faCalendarCheck },
      horas_extras: { bg: 'warning', text: 'Horas Extras', icon: faClock }
    };
    
    const tipoInfo = tipos[tipo] || { bg: 'secondary', text: tipo, icon: faFileAlt };
    
    return (
      <Badge bg={tipoInfo.bg} className="d-flex align-items-center gap-1">
        <FontAwesomeIcon icon={tipoInfo.icon} />
        <span>{tipoInfo.text}</span>
      </Badge>
    );
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  // Función para formatear el detalle de la solicitud según el tipo
  const getDetalleSolicitud = (aprobacion: DetalleAprobacion) => {
    if (aprobacion.Tipo === 'vacaciones') {
      const dias = aprobacion.DiasSolicitados || 0;
      const fechaInicio = aprobacion.FechaInicio ? formatDate(aprobacion.FechaInicio) : 'N/A';
      const fechaFin = aprobacion.FechaFin ? formatDate(aprobacion.FechaFin) : 'N/A';
      return (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faCalendarDay} className="text-primary me-2" />
            <strong className="text-primary">Detalles de Vacaciones:</strong>
          </div>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Período:</Col>
            <Col xs={7}><strong>{fechaInicio} → {fechaFin}</strong></Col>
          </Row>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Días solicitados:</Col>
            <Col xs={7}>
              <Badge bg="primary" className="fs-6">{dias} {dias === 1 ? 'día' : 'días'}</Badge>
            </Col>
          </Row>
        </div>
      );
    }
    
    if (aprobacion.Tipo === 'permiso') {
      const conGoce = aprobacion.ConGoce ? 'Sí' : 'No';
      const fecha = aprobacion.FechaInicio ? formatDate(aprobacion.FechaInicio) : 'N/A';
      return (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-info me-2" />
            <strong className="text-info">Detalles de Permiso:</strong>
          </div>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Fecha:</Col>
            <Col xs={7}><strong>{fecha}</strong></Col>
          </Row>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Con goce de sueldo:</Col>
            <Col xs={7}>
              <Badge bg={conGoce === 'Sí' ? 'success' : 'secondary'}>{conGoce}</Badge>
            </Col>
          </Row>
        </div>
      );
    }
    
    if (aprobacion.Tipo === 'horas_extras') {
      const horas = aprobacion.HorasSolicitadas || 0;
      const fecha = aprobacion.FechaInicio ? formatDate(aprobacion.FechaInicio) : 'N/A';
      return (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faClock} className="text-warning me-2" />
            <strong className="text-warning">Detalles de Horas Extras:</strong>
          </div>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Fecha:</Col>
            <Col xs={7}><strong>{fecha}</strong></Col>
          </Row>
          <Row className="mb-2">
            <Col xs={5} className="text-muted">Horas solicitadas:</Col>
            <Col xs={7}>
              <Badge bg="warning" className="fs-6">{horas} {horas === 1 ? 'hora' : 'horas'}</Badge>
            </Col>
          </Row>
        </div>
      );
    }
    
    return null;
  };
  
  // Calcular estadísticas
  const estadisticasVacaciones = derechosVacacionales ? {
    total: derechosVacacionales.DiasTotales,
    tomados: derechosVacacionales.DiasTomados,
    disponibles: derechosVacacionales.DiasDisponibles,
    pendientes: derechosVacacionales.DiasPendientes || 0,
    porcentaje: derechosVacacionales.DiasTotales > 0 
      ? Math.round((derechosVacacionales.DiasTomados / derechosVacacionales.DiasTotales) * 100)
      : 0
  } : null;
  
  // Calcular días solicitados en formulario
  const calcularDiasSolicitados = () => {
    if (!vacacionesData.fechaInicio || !vacacionesData.fechaFin) return 0;
    
    const inicio = new Date(vacacionesData.fechaInicio);
    const fin = new Date(vacacionesData.fechaFin);
    
    if (inicio > fin) return 0;
    
    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  // Calcular fecha mínima para permisos (24 horas después)
  const calcularFechaMinimaPermiso = () => {
    const ahora = new Date();
    const fechaMinima = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    return fechaMinima.toISOString().split('T')[0];
  };
  
  // Renderizar botones de acción
const renderActionButtons = () => {
  const sinDiasVacaciones = derechosVacacionales?.DiasDisponibles <= 0;
  
  return (
    <ButtonGroup>
      {canCreateVacaciones && (
        <Button 
          variant="primary" 
          onClick={() => setShowVacacionesModal(true)}
          disabled={sinDiasVacaciones}
          title={sinDiasVacaciones ? "No tienes días de vacaciones disponibles" : "Solicitar vacaciones"}
        >
          <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
          Vacaciones
          {sinDiasVacaciones && (
            <Badge bg="danger" className="ms-2">
              <FontAwesomeIcon icon={faExclamationTriangle} size="sm" />
            </Badge>
          )}
        </Button>
      )}
      
      {canCreatePermiso && (
        <Button variant="info" onClick={() => setShowPermisoModal(true)}>
          <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
          Permiso
        </Button>
      )}
      
      {canCreateHorasExtras && (
        <Button variant="warning" onClick={() => setShowHorasExtrasModal(true)}>
          <FontAwesomeIcon icon={faClock} className="me-2" />
          Horas Extras
        </Button>
      )}
    </ButtonGroup>
  );
};
  
  // Renderizar cards de estadísticas
const renderStatsCards = () => {
  return (
    <Row className="mb-4">
      {/* Vacaciones */}
      {estadisticasVacaciones && (
        <Col md={4} className="mb-3">
          <Card className={`border-${estadisticasVacaciones.disponibles <= 0 ? 'danger' : 'primary'} border-2 shadow-sm h-100`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <FontAwesomeIcon 
                    icon={faCalendarDay} 
                    size="2x" 
                    className={estadisticasVacaciones.disponibles <= 0 ? 'text-danger' : 'text-primary'} 
                  />
                </div>
                <div className="text-end">
                  <h3 className={`mb-0 ${estadisticasVacaciones.disponibles <= 0 ? 'text-danger' : ''}`}>
                    {estadisticasVacaciones.disponibles}
                  </h3>
                  <small className="text-muted">Días disponibles</small>
                </div>
              </div>
              <div className="progress mb-2" style={{ height: '8px' }}>
                <div 
                  className={`progress-bar ${estadisticasVacaciones.disponibles <= 0 ? 'bg-danger' : 'bg-primary'}`}
                  role="progressbar" 
                  style={{ width: `${estadisticasVacaciones.porcentaje}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between">
                <small className="text-muted">Tomados: {estadisticasVacaciones.tomados}</small>
                <small className="text-muted">Total: {estadisticasVacaciones.total}</small>
              </div>
              {estadisticasVacaciones.disponibles <= 0 && (
                <div className="mt-2">
                  <Badge bg="danger" className="w-100 py-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    No tienes días de vacaciones disponibles
                  </Badge>
                </div>
              )}
              {estadisticasVacaciones.pendientes > 0 && (
                <div className="mt-2 small">
                  <Badge bg="warning" className="me-1">Pendientes: {estadisticasVacaciones.pendientes}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      )}
      
      {/* Mis Solicitudes Pendientes */}
      <Col md={4} className="mb-3">
        <Card className="border-warning border-2 shadow-sm h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <FontAwesomeIcon icon={faHourglassHalf} size="2x" className="text-warning" />
              </div>
              <div className="text-end">
                <h3 className="mb-0">
                  {misSolicitudes.filter(s => s.Estado === 'pendiente').length}
                </h3>
                <small className="text-muted">Pendientes</small>
              </div>
            </div>
            <small className="text-muted d-block">Mis solicitudes en revisión</small>
          </Card.Body>
        </Card>
      </Col>
      
      {/* Mis Solicitudes Aprobadas */}
      <Col md={4} className="mb-3">
        <Card className="border-success border-2 shadow-sm h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="text-success" />
              </div>
              <div className="text-end">
                <h3 className="mb-0">
                  {misSolicitudes.filter(s => s.Estado === 'aprobada').length}
                </h3>
                <small className="text-muted">Aprobadas</small>
              </div>
            </div>
            <small className="text-muted d-block">Solicitudes aprobadas</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
  
  // Renderizar filtros
  const renderFilters = () => {
    return (
      <Row className="mb-3">
        {activeTab === 'mis-solicitudes' && (
          <>
            <Col md={4}>
              <Form.Group>
                <Form.Select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="rechazada">Rechazadas</option>
                  <option value="cancelada">Canceladas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="permiso">Permisos</option>
                  <option value="horas_extras">Horas Extras</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </>
        )}
        
        {activeTab === 'horas-extras' && (
          <>
            <Col md={4}>
              <Form.Group>
                <Form.Control
                  type="date"
                  placeholder="Fecha desde"
                  value={filterFechaDesde}
                  onChange={(e) => setFilterFechaDesde(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Control
                  type="date"
                  placeholder="Fecha hasta"
                  value={filterFechaHasta}
                  onChange={(e) => setFilterFechaHasta(e.target.value)}
                />
              </Form.Group>
            </Col>
          </>
        )}
        
        {(filterEstado || filterTipo || filterFechaDesde || filterFechaHasta) && (
          <Col md={4} className="d-flex align-items-end">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setFilterEstado('');
                setFilterTipo('');
                setFilterFechaDesde('');
                setFilterFechaHasta('');
              }}
              className="w-100"
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Limpiar filtros
            </Button>
          </Col>
        )}
      </Row>
    );
  };
  
  // Renderizar contenido según pestaña
  const renderTabContent = () => {
    switch (activeTab) {
      case 'mis-solicitudes':
        return renderMisSolicitudesContent();
      case 'pendientes':
        return renderPendientesContent();
      case 'aprobadas':
        return renderAprobadasContent();
      case 'horas-extras':
        return renderHorasExtrasContent();
      default:
        return null;
    }
  };
  
  const renderMisSolicitudesContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando solicitudes...</p>
        </div>
      );
    }
    
    if (misSolicitudes.length === 0) {
      return (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
          <h5>No tienes solicitudes</h5>
          <p className="text-muted">Crea tu primera solicitud usando los botones de arriba</p>
        </div>
      );
    }
    
    return (
      <div className="table-responsive">
        <Table hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Tipo</th>
              <th>Fecha Solicitud</th>
              <th>Periodo / Detalles</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {misSolicitudes.map((solicitud) => (
              <tr key={solicitud.ID}>
                <td>{getTipoBadge(solicitud.Tipo)}</td>
                <td>
                  <div className="small">{formatDateTime(solicitud.FechaSolicitud)}</div>
                </td>
                <td>
                  {solicitud.Tipo === 'vacaciones' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faCalendarPlus} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                        {solicitud.FechaFin && (
                          <>
                            <FontAwesomeIcon icon={faArrowRight} className="mx-2" />
                            {formatDate(solicitud.FechaFin!)}
                          </>
                        )}
                      </div>
                      {solicitud.DiasSolicitados && (
                        <small className="text-muted">{solicitud.DiasSolicitados} días</small>
                      )}
                    </div>
                  )}
                  {solicitud.Tipo === 'permiso' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                      </div>
                      <small className="text-muted">{solicitud.ConGoce ? 'Con goce' : 'Sin goce'}</small>
                    </div>
                  )}
                  {solicitud.Tipo === 'horas_extras' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faClock} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                      </div>
                      {solicitud.HorasSolicitadas && (
                        <small className="text-muted">{solicitud.HorasSolicitadas} horas</small>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: '200px' }} title={solicitud.Motivo}>
                    {solicitud.Motivo}
                  </div>
                </td>
                <td>{getEstadoBadge(solicitud.Estado)}</td>
                <td className="text-end">
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-primary"
                      onClick={() => loadDetalleSolicitud(solicitud.ID)}
                      title="Ver detalles"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    
                    {solicitud.Estado === 'pendiente' && (
                      <Button
                        variant="outline-danger"
                        onClick={() => handleCancelarSolicitud(solicitud.ID)}
                        title="Cancelar solicitud"
                      >
                        <FontAwesomeIcon icon={faBan} />
                      </Button>
                    )}
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };
  
  const renderPendientesContent = () => {
    if (!canApprove) return null;
    
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando aprobaciones pendientes...</p>
        </div>
      );
    }
    
    if (solicitudesPendientes.length === 0) {
      return (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-success mb-3" />
          <h5>No hay aprobaciones pendientes</h5>
          <p className="text-muted">No hay solicitudes pendientes de tu aprobación</p>
        </div>
      );
    }
    
    return (
      <div className="table-responsive">
        <Table hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Empleado</th>
              <th>Tipo</th>
              <th>Fecha Solicitud</th>
              <th>Detalles</th>
              <th>Motivo</th>
              <th>Orden Aprobación</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesPendientes.map((aprobacion) => (
              <tr key={aprobacion.AprobacionID}>
                <td>
                  <div className="fw-medium">{aprobacion.EmpleadoNombre}</div>
                </td>
                <td>{getTipoBadge(aprobacion.Tipo)}</td>
                <td>
                  <div className="small">{formatDateTime(aprobacion.FechaSolicitud)}</div>
                </td>
                <td>
                  {aprobacion.Tipo === 'vacaciones' && (
                    <div>
                      <div className="small">
                        {formatDate(aprobacion.FechaInicio!)} → {formatDate(aprobacion.FechaFin!)}
                      </div>
                      <small className="text-muted">{aprobacion.DiasSolicitados} días</small>
                    </div>
                  )}
                  {aprobacion.Tipo === 'permiso' && (
                    <div>
                      <div className="small">
                        {formatDate(aprobacion.FechaInicio!)}
                      </div>
                      <small className="text-muted">{aprobacion.ConGoce ? 'Con goce' : 'Sin goce'}</small>
                    </div>
                  )}
                  {aprobacion.Tipo === 'horas_extras' && (
                    <div>
                      <div className="small">
                        {formatDate(aprobacion.FechaInicio!)}
                      </div>
                      <small className="text-muted">{aprobacion.HorasSolicitadas} horas</small>
                    </div>
                  )}
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: '200px' }} title={aprobacion.Motivo}>
                    {aprobacion.Motivo}
                  </div>
                </td>
                <td>
                  <Badge bg="secondary">{aprobacion.OrdenAprobacion}°</Badge>
                </td>
                <td className="text-end">
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-success"
                      onClick={() => openApproveModal(aprobacion)}
                      title="Aprobar/Rechazar"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </Button>
                    
                    <Button
                      variant="outline-warning"
                      onClick={() => openEditAprobacionModal(aprobacion)}
                      title="Editar aprobación"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };
  
  const renderAprobadasContent = () => {
    if (!canViewAll) return null;
    
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando solicitudes aprobadas...</p>
        </div>
      );
    }
    
    if (solicitudesAprobadas.length === 0) {
      return (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faClipboardList} size="3x" className="text-muted mb-3" />
          <h5>No hay solicitudes aprobadas</h5>
          <p className="text-muted">No hay solicitudes aprobadas en el sistema</p>
        </div>
      );
    }
    
    return (
      <div className="table-responsive">
        <Table hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Empleado</th>
              <th>Tipo</th>
              <th>Fecha Solicitud</th>
              <th>Periodo / Detalles</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesAprobadas.map((solicitud) => (
              <tr key={solicitud.ID}>
                <td>
                  <div className="fw-medium">{solicitud.EmpleadoNombre || 'Sin nombre'}</div>
                  {solicitud.EmpleadoCorreo && (
                    <small className="text-muted d-block">{solicitud.EmpleadoCorreo}</small>
                  )}
                </td>
                <td>{getTipoBadge(solicitud.Tipo)}</td>
                <td>
                  <div className="small">{formatDateTime(solicitud.FechaSolicitud)}</div>
                </td>
                <td>
                  {solicitud.Tipo === 'vacaciones' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faCalendarPlus} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                        {solicitud.FechaFin && (
                          <>
                            <FontAwesomeIcon icon={faArrowRight} className="mx-2" />
                            {formatDate(solicitud.FechaFin!)}
                          </>
                        )}
                      </div>
                      {solicitud.DiasSolicitados && (
                        <small className="text-muted">{solicitud.DiasSolicitados} días</small>
                      )}
                    </div>
                  )}
                  {solicitud.Tipo === 'permiso' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                      </div>
                    </div>
                  )}
                  {solicitud.Tipo === 'horas_extras' && (
                    <div>
                      <div className="small">
                        <FontAwesomeIcon icon={faClock} className="me-1" />
                        {formatDate(solicitud.FechaInicio!)}
                      </div>
                      {solicitud.HorasSolicitadas && (
                        <small className="text-muted">{solicitud.HorasSolicitadas} horas</small>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: '200px' }} title={solicitud.Motivo}>
                    {solicitud.Motivo}
                  </div>
                </td>
                <td>{getEstadoBadge(solicitud.Estado)}</td>
                <td className="text-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => loadDetalleSolicitud(solicitud.ID)}
                    title="Ver detalles"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };
  
const renderHorasExtrasContent = () => {
  if (!canViewReports) return null;
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando reporte de horas extras...</p>
      </div>
    );
  }
  
  if (reporteHorasExtras.length === 0) {
    return (
      <div className="text-center py-5">
        <FontAwesomeIcon icon={faBusinessTime} size="3x" className="text-muted mb-3" />
        <h5>No hay horas extras registradas</h5>
        <p className="text-muted">No hay solicitudes de horas extras en el periodo seleccionado</p>
      </div>
    );
  }
  
  // Calcular total de horas asegurándonos de convertir a número
  const totalHoras = reporteHorasExtras.reduce((sum, item) => {
    // Convertir HorasSolicitadas a número (puede venir como string o número)
    const horas = typeof item.HorasSolicitadas === 'string' 
      ? parseFloat(item.HorasSolicitadas) 
      : (item.HorasSolicitadas || 0);
    return sum + horas;
  }, 0);
  
  const totalAprobadas = reporteHorasExtras.filter(item => item.Estado === 'aprobada').length;
  const totalPendientes = reporteHorasExtras.filter(item => item.Estado === 'pendiente').length;
  const totalRechazadas = reporteHorasExtras.filter(item => item.Estado === 'rechazada').length;
  
  return (
    <>
      <Card className="mb-3">
        <Card.Body className="bg-light">
          <Row>
            <Col md={3}>
              <div className="text-center">
                <h4 className="text-primary">{reporteHorasExtras.length}</h4>
                <small className="text-muted">Total Solicitudes</small>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <h4 className="text-success">{totalHoras.toFixed(1)}</h4>
                <small className="text-muted">Horas Totales</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <h4 className="text-success">{totalAprobadas}</h4>
                <small className="text-muted">Aprobadas</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <h4 className="text-warning">{totalPendientes}</h4>
                <small className="text-muted">Pendientes</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <h4 className="text-danger">{totalRechazadas}</h4>
                <small className="text-muted">Rechazadas</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <div className="table-responsive">
        <Table hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Horas Solicitadas</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Departamento</th>
              <th>Puesto</th>
            </tr>
          </thead>
          <tbody>
            {reporteHorasExtras.map((item) => {
              // Convertir horas a número para mostrarlas correctamente
              const horas = typeof item.HorasSolicitadas === 'string' 
                ? parseFloat(item.HorasSolicitadas) 
                : (item.HorasSolicitadas || 0);
              
              return (
                <tr key={item.ID}>
                  <td>
                    <div className="fw-medium">{item.EmpleadoNombre}</div>
                    <small className="text-muted">{item.CorreoElectronico}</small>
                  </td>
                  <td>
                    <div className="small">{formatDate(item.FechaInicio)}</div>
                  </td>
                  <td>
                    <Badge bg="warning" className="fs-6">
                      {horas.toFixed(1)} hrs
                    </Badge>
                  </td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={item.Motivo}>
                      {item.Motivo}
                    </div>
                  </td>
                  <td>{getEstadoBadge(item.Estado)}</td>
                  <td>
                    <small>{item.PuestoNombre || 'No asignado'}</small>
                  </td>
                  <td>
                    <small className="text-muted">{item.PuestoNombre || 'No asignado'}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </>
  );
};

  return (
  <Container fluid className="py-4">
    {/* Header */}
    <Row className="mb-4">
      <Col>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-0">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
              Gestión de Solicitudes
            </h2>
            <p className="text-muted mb-0">
              {isAdmin ? '🔐 Administrador - Gestión completa' : 
               isManager ? '👨‍💼 Manager - Aprobaciones y reportes' : 
               '👤 Empleado - Mis solicitudes'}
            </p>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={loadTabData}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Actualizar
            </Button>
            {renderActionButtons()}
          </div>
        </div>
      </Col>
    </Row>

    {/* Alerta de días disponibles */}
    {estadisticasVacaciones && estadisticasVacaciones.disponibles <= 0 && isEmployee && (
      <Alert variant="danger" className="mb-3">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="me-3" />
          <div>
            <h5 className="alert-heading mb-1">No tienes días de vacaciones disponibles</h5>
            <p className="mb-0">
              Has utilizado todos tus {estadisticasVacaciones.total} días de vacaciones de este año.
              {estadisticasVacaciones.pendientes > 0 && (
                <span className="d-block mt-1">
                  <Badge bg="warning">Tienes {estadisticasVacaciones.pendientes} días pendientes de aprobación</Badge>
                </span>
              )}
            </p>
          </div>
        </div>
      </Alert>
    )}

    {estadisticasVacaciones && estadisticasVacaciones.disponibles < 0 && (
      <Alert variant="warning" className="mb-3">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="me-3 text-warning" />
          <div>
            <h5 className="alert-heading mb-1">Has excedido tus días de vacaciones</h5>
            <p className="mb-0">
              Has tomado {Math.abs(estadisticasVacaciones.disponibles)} días adicionales.
              Por favor, contacta a Recursos Humanos para regularizar tu situación.
            </p>
          </div>
        </div>
      </Alert>
    )}

    {/* Alertas */}
    {error && (
      <Alert variant="danger" dismissible onClose={() => setError('')}>
        <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
        {error}
      </Alert>
    )}
    
    {success && (
      <Alert variant="success" dismissible onClose={() => setSuccess('')}>
        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
        {success}
      </Alert>
    )}

    {/* Estadísticas */}
    {renderStatsCards()}

      {/* Tabs principales */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => {
              setActiveTab(k || 'mis-solicitudes');
              setError('');
              setSuccess('');
            }}
            className="mb-0 px-3 pt-3"
            fill
          >
            <Tab eventKey="mis-solicitudes" title={
              <span>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Mis Solicitudes
              </span>
            }>
              <div className="p-3">
                {renderFilters()}
                {renderTabContent()}
              </div>
            </Tab>
            
            {canApprove && (
              <Tab eventKey="pendientes" title={
                <span>
                  <FontAwesomeIcon icon={faUserClock} className="me-2" />
                  Por Aprobar
                  {pendientesCount > 0 && ( // <-- USAR pendientesCount EN VEZ DE solicitudesPendientes.length
                    <Badge bg="danger" className="ms-2">{pendientesCount}</Badge>
                  )}
                </span>
              }>
                <div className="p-3">
                  <Alert variant="info" className="mb-3">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Tienes {pendientesCount} solicitudes pendientes de aprobación {/* <-- USAR pendientesCount */}
                  </Alert>
                  {renderTabContent()}
                </div>
              </Tab>
            )}
            
            {canViewAll && (
              <Tab eventKey="aprobadas" title={
                <span>
                  <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                  Todas Aprobadas
                </span>
              }>
                <div className="p-3">
                  {renderFilters()}
                  {renderTabContent()}
                </div>
              </Tab>
            )}

            {canViewReports && (
              <Tab eventKey="horas-extras" title={
                <span>
                  <FontAwesomeIcon icon={faBusinessTime} className="me-2" />
                  Reporte Horas Extras
                </span>
              }>
                <div className="p-3">
                  {renderFilters()}
                  {renderTabContent()}
                </div>
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>

{/* Modal de Vacaciones */}
<Modal show={showVacacionesModal} onHide={() => setShowVacacionesModal(false)} size="lg">
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
      Solicitar Vacaciones
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {estadisticasVacaciones && (
      <Alert 
        variant={estadisticasVacaciones.disponibles <= 0 ? "danger" : "info"} 
        className="mb-4"
      >
        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
        <div>
          <strong>Resumen de tus vacaciones:</strong>
          <div className="mt-2">
            <span className="me-3">
              <strong>Días disponibles:</strong> 
              <span className={estadisticasVacaciones.disponibles <= 0 ? 'text-danger fw-bold' : ''}>
                {' '}{estadisticasVacaciones.disponibles}
              </span>
            </span>
            <span className="me-3"><strong>Días tomados:</strong> {estadisticasVacaciones.tomados}</span>
            <span><strong>Total días:</strong> {estadisticasVacaciones.total}</span>
          </div>
          {estadisticasVacaciones.pendientes > 0 && (
            <div className="mt-1">
              <Badge bg="warning">Días pendientes de aprobación: {estadisticasVacaciones.pendientes}</Badge>
            </div>
          )}
          {estadisticasVacaciones.disponibles <= 0 && (
            <div className="mt-2 text-danger">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
              <strong>No puedes solicitar vacaciones porque no tienes días disponibles.</strong>
            </div>
          )}
        </div>
      </Alert>
    )}
    
    <Form>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Fecha de Inicio *</Form.Label>
            <Form.Control
              type="date"
              value={vacacionesData.fechaInicio}
              onChange={(e) => setVacacionesData({...vacacionesData, fechaInicio: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              disabled={estadisticasVacaciones?.disponibles <= 0}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Fecha de Fin *</Form.Label>
            <Form.Control
              type="date"
              value={vacacionesData.fechaFin}
              onChange={(e) => setVacacionesData({...vacacionesData, fechaFin: e.target.value})}
              min={vacacionesData.fechaInicio}
              disabled={estadisticasVacaciones?.disponibles <= 0}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-3">
        <Form.Label>Motivo *</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={vacacionesData.motivo}
          onChange={(e) => setVacacionesData({...vacacionesData, motivo: e.target.value})}
          placeholder="Describe el motivo de tu solicitud de vacaciones..."
          disabled={estadisticasVacaciones?.disponibles <= 0}
          required
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Observaciones (Opcional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={vacacionesData.observaciones}
          onChange={(e) => setVacacionesData({...vacacionesData, observaciones: e.target.value})}
          placeholder="Observaciones adicionales..."
          disabled={estadisticasVacaciones?.disponibles <= 0}
        />
      </Form.Group>
    </Form>
    
    {vacacionesData.fechaInicio && vacacionesData.fechaFin && (
      <Alert 
        variant={
          calcularDiasSolicitados() > (estadisticasVacaciones?.disponibles || 0) 
            ? "danger" 
            : "secondary"
        } 
        className="mt-3"
      >
        <FontAwesomeIcon icon={faCalculator} className="me-2" />
        <div>
          <strong>Días solicitados:</strong> {calcularDiasSolicitados()} días
          {estadisticasVacaciones && calcularDiasSolicitados() > estadisticasVacaciones.disponibles && (
            <div className="text-danger mt-1">
              ⚠️ Estás solicitando más días de los que tienes disponibles
            </div>
          )}
        </div>
      </Alert>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowVacacionesModal(false)}>
      Cancelar
    </Button>
    <Button 
      variant="primary" 
      onClick={handleSolicitarVacaciones}
      disabled={
        !vacacionesData.fechaInicio || 
        !vacacionesData.fechaFin || 
        !vacacionesData.motivo ||
        (estadisticasVacaciones?.disponibles <= 0)
      }
    >
      <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
      Enviar Solicitud
    </Button>
  </Modal.Footer>
</Modal>

      {/* Modal de Permiso */}
      <Modal show={showPermisoModal} onHide={() => setShowPermisoModal(false)}>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
            Solicitar Permiso
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha *</Form.Label>
              <Form.Control
                type="date"
                value={permisoData.fechaInicio}
                onChange={(e) => setPermisoData({...permisoData, fechaInicio: e.target.value})}
                min={calcularFechaMinimaPermiso()}
                required
              />
              <Form.Text className="text-muted">
                Los permisos deben solicitarse con al menos 24 horas de anticipación
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Motivo *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={permisoData.motivo}
                onChange={(e) => setPermisoData({...permisoData, motivo: e.target.value})}
                placeholder="Describe el motivo de tu permiso..."
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Con goce de sueldo"
                checked={permisoData.conGoce}
                onChange={(e) => setPermisoData({...permisoData, conGoce: e.target.checked})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Observaciones (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={permisoData.observaciones}
                onChange={(e) => setPermisoData({...permisoData, observaciones: e.target.value})}
                placeholder="Observaciones adicionales..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermisoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="info" 
            onClick={handleSolicitarPermiso}
            disabled={
              !permisoData.fechaInicio || 
              !permisoData.motivo ||
              (() => {
                if (!permisoData.fechaInicio) return true;
                const fechaSeleccionada = new Date(permisoData.fechaInicio);
                const ahora = new Date();
                const diferenciaHoras = (fechaSeleccionada.getTime() - ahora.getTime()) / (1000 * 60 * 60);
                return diferenciaHoras < 24;
              })()
            }
          >
            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
            Enviar Solicitud
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Horas Extras */}
      <Modal show={showHorasExtrasModal} onHide={() => setShowHorasExtrasModal(false)}>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FontAwesomeIcon icon={faClock} className="me-2" />
            Solicitar Horas Extras
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Empleado *</Form.Label>
              <Form.Select
                value={horasExtrasData.empleadoId}
                onChange={(e) => setHorasExtrasData({...horasExtrasData, empleadoId: e.target.value})}
                required
              >
                <option value="">Seleccionar empleado</option>
                {empleadosSelect.map((emp) => (
                  <option key={emp.ID} value={emp.ID}>
                    {emp.NombreCompleto} ({emp.RolApp})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Fecha *</Form.Label>
              <Form.Control
                type="date"
                value={horasExtrasData.fechaInicio}
                onChange={(e) => setHorasExtrasData({...horasExtrasData, fechaInicio: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Horas Solicitadas *</Form.Label>
              <Form.Control
                type="number"
                value={horasExtrasData.horasSolicitadas}
                onChange={(e) => setHorasExtrasData({...horasExtrasData, horasSolicitadas: e.target.value})}
                min="0.5"
                max="24"
                step="0.5"
                placeholder="Ej: 2.5"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Motivo *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={horasExtrasData.motivo}
                onChange={(e) => setHorasExtrasData({...horasExtrasData, motivo: e.target.value})}
                placeholder="Describe el motivo de las horas extras..."
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Observaciones (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={horasExtrasData.observaciones}
                onChange={(e) => setHorasExtrasData({...horasExtrasData, observaciones: e.target.value})}
                placeholder="Observaciones adicionales..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHorasExtrasModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="warning" 
            onClick={handleSolicitarHorasExtras}
            disabled={!horasExtrasData.empleadoId || !horasExtrasData.fechaInicio || 
                     !horasExtrasData.horasSolicitadas || !horasExtrasData.motivo}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
            Enviar Solicitud
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Aprobar/Rechazar */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} size="lg" centered>
        <Modal.Header closeButton className={aprobacionData.estado === 'aprobada' ? 'bg-success text-white' : 'bg-danger text-white'}>
          <Modal.Title>
            <FontAwesomeIcon icon={aprobacionData.estado === 'aprobada' ? faCheckCircle : faTimesCircle} className="me-2" />
            {aprobacionData.estado === 'aprobada' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAprobacion && (
            <>
              {/* Encabezado del empleado */}
              <div className="text-center mb-4">
                <FontAwesomeIcon 
                  icon={selectedAprobacion.Tipo === 'vacaciones' ? faCalendarDay : 
                        selectedAprobacion.Tipo === 'permiso' ? faCalendarCheck : faClock} 
                  size="3x" 
                  className={`mb-3 ${
                    selectedAprobacion.Tipo === 'vacaciones' ? 'text-primary' : 
                    selectedAprobacion.Tipo === 'permiso' ? 'text-info' : 'text-warning'
                  }`}
                />
                <h4>{selectedAprobacion.EmpleadoNombre}</h4>
                <div className="mb-3">
                  {getTipoBadge(selectedAprobacion.Tipo)}
                  {' '}
                  <Badge bg="secondary">Orden {selectedAprobacion.OrdenAprobacion}°</Badge>
                </div>
              </div>

              {/* Detalles específicos según el tipo */}
              {getDetalleSolicitud(selectedAprobacion)}

              {/* Información general */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Información de la Solicitud
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-2">
                      <small className="text-muted d-block">Fecha de solicitud</small>
                      <strong>{formatDateTime(selectedAprobacion.FechaSolicitud)}</strong>
                    </Col>
                    <Col md={6} className="mb-2">
                      <small className="text-muted d-block">Motivo</small>
                      <strong>{selectedAprobacion.Motivo}</strong>
                    </Col>
                    {selectedAprobacion.MotivoCompleto && selectedAprobacion.MotivoCompleto !== selectedAprobacion.Motivo && (
                      <Col md={12} className="mb-2">
                        <small className="text-muted d-block">Motivo completo</small>
                        <p className="mb-0">{selectedAprobacion.MotivoCompleto}</p>
                      </Col>
                    )}
                    {selectedAprobacion.Observaciones && (
                      <Col md={12} className="mb-2">
                        <small className="text-muted d-block">Observaciones adicionales</small>
                        <p className="mb-0">{selectedAprobacion.Observaciones}</p>
                      </Col>
                    )}
                    {(selectedAprobacion.Departamento || selectedAprobacion.Puesto) && (
                      <Col md={12} className="mt-2 pt-2 border-top">
                        <Row>
                          {selectedAprobacion.Departamento && (
                            <Col md={6}>
                              <small className="text-muted d-block">
                                <FontAwesomeIcon icon={faBuilding} className="me-1" />
                                Departamento
                              </small>
                              <span>{selectedAprobacion.Departamento}</span>
                            </Col>
                          )}
                          {selectedAprobacion.Puesto && (
                            <Col md={6}>
                              <small className="text-muted d-block">
                                <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                                Puesto
                              </small>
                              <span>{selectedAprobacion.Puesto}</span>
                            </Col>
                          )}
                        </Row>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Formulario de aprobación */}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <FontAwesomeIcon icon={faComment} className="me-2" />
                    Comentarios {aprobacionData.estado === 'rechazado' ? '(requeridos)' : '(recomendados)'}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={aprobacionData.comentarios}
                    onChange={(e) => setAprobacionData({...aprobacionData, comentarios: e.target.value})}
                    placeholder={aprobacionData.estado === 'aprobada' 
                      ? "Agrega comentarios sobre tu aprobación (opcional, pero recomendado)..." 
                      : "Explica detalladamente el motivo del rechazo (mínimo 5 caracteres)..."}
                    isInvalid={aprobacionData.estado === 'rechazado' && (!aprobacionData.comentarios || aprobacionData.comentarios.trim().length < 5)}
                    required={aprobacionData.estado === 'rechazado'}
                  />
                  {aprobacionData.estado === 'rechazado' && (!aprobacionData.comentarios || aprobacionData.comentarios.trim().length < 5) && (
                    <Form.Control.Feedback type="invalid">
                      Debes explicar el motivo del rechazo (mínimo 5 caracteres)
                    </Form.Control.Feedback>
                  )}
                  <Form.Text className="text-muted">
                    {aprobacionData.estado === 'aprobada' 
                      ? 'Puedes dejar comentarios sobre tu aprobación para el empleado.'
                      : 'Es importante explicar el motivo del rechazo para que el empleado pueda corregir su solicitud.'}
                  </Form.Text>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancelar
          </Button>
          <ButtonGroup>
            <Button 
              variant="success" 
              onClick={() => {
                setAprobacionData(prev => ({...prev, estado: 'aprobada'}));
              }}
              active={aprobacionData.estado === 'aprobada'}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Aprobar
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                setAprobacionData(prev => ({...prev, estado: 'rechazado'}));
              }}
              active={aprobacionData.estado === 'rechazado'}
            >
              <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
              Rechazar
            </Button>
          </ButtonGroup>
          <Button 
            variant={aprobacionData.estado === 'aprobada' ? 'success' : 'danger'} 
            onClick={handleProcesarAprobacion}
            disabled={
              (aprobacionData.estado === 'rechazado' && (!aprobacionData.comentarios || aprobacionData.comentarios.trim().length < 5)) ||
              (aprobacionData.estado === 'aprobada' && false) // Siempre habilitado para aprobar
            }
          >
            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
            Confirmar {aprobacionData.estado === 'aprobada' ? 'Aprobación' : 'Rechazo'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Editar Aprobación */}
      <Modal show={showEditAprobacionModal} onHide={() => setShowEditAprobacionModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Decisión de Aprobación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong>Advertencia:</strong> Solo puedes editar aprobaciones dentro de las primeras 24 horas después de haberlas realizado.
          </Alert>
          
          {selectedAprobacion && (
            <>
              {/* Encabezado */}
              <div className="text-center mb-4">
                <h4>{selectedAprobacion.EmpleadoNombre}</h4>
                <div className="mb-3">
                  {getTipoBadge(selectedAprobacion.Tipo)}
                </div>
              </div>

              {/* Detalles específicos */}
              {getDetalleSolicitud(selectedAprobacion)}

              {/* Información de la solicitud */}
              <Card className="mb-3">
                <Card.Body>
                  <p className="mb-2"><strong>Motivo:</strong> {selectedAprobacion.Motivo}</p>
                  <p className="mb-0 text-muted small">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    Solicitado el {formatDateTime(selectedAprobacion.FechaSolicitud)}
                  </p>
                </Card.Body>
              </Card>

              {/* Formulario de edición */}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nueva Decisión *</Form.Label>
                  <Form.Select
                    value={editAprobacionData.estado}
                    onChange={(e) => setEditAprobacionData({...editAprobacionData, estado: e.target.value})}
                  >
                    <option value="aprobada">Aprobar</option>
                    <option value="rechazado">Rechazar</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Comentarios * (mínimo 10 caracteres)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={editAprobacionData.comentarios}
                    onChange={(e) => setEditAprobacionData({...editAprobacionData, comentarios: e.target.value})}
                    placeholder="Explica por qué estás cambiando tu decisión..."
                    isInvalid={editAprobacionData.comentarios.trim().length < 10}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Debes explicar el motivo del cambio (mínimo 10 caracteres)
                  </Form.Control.Feedback>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditAprobacionModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant={editAprobacionData.estado === 'aprobada' ? 'success' : 'danger'} 
            onClick={handleEditarAprobacion}
            disabled={editAprobacionData.comentarios.trim().length < 10}
          >
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Actualizar Decisión
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalle de Solicitud */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Detalle de Solicitud
            {selectedSolicitud && (
              <Badge bg="secondary" className="ms-2">#{selectedSolicitud.ID}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSolicitud ? (
            <>
              <div className="text-center mb-4">
                <FontAwesomeIcon 
                  icon={selectedSolicitud.Tipo === 'vacaciones' ? faCalendarDay : 
                        selectedSolicitud.Tipo === 'permiso' ? faCalendarCheck : faClock} 
                  size="3x" 
                  className={`mb-3 ${
                    selectedSolicitud.Tipo === 'vacaciones' ? 'text-primary' : 
                    selectedSolicitud.Tipo === 'permiso' ? 'text-info' : 'text-warning'
                  }`}
                />
                <h4>{selectedSolicitud.EmpleadoNombre || 'Solicitud'}</h4>
                <div className="mb-3">
                  {getTipoBadge(selectedSolicitud.Tipo)}
                  {' '}
                  {getEstadoBadge(selectedSolicitud.Estado)}
                </div>
              </div>
              
              <Accordion defaultActiveKey="0" className="mb-3">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Información Básica
                  </Accordion.Header>
                  <Accordion.Body>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <div className="d-flex justify-content-between">
                          <strong><FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> Fecha de Solicitud:</strong>
                          <span>{formatDateTime(selectedSolicitud.FechaSolicitud)}</span>
                        </div>
                      </ListGroup.Item>
                      
                      {selectedSolicitud.Tipo === 'vacaciones' && (
                        <>
                          {selectedSolicitud.FechaInicio && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalendarPlus} className="me-2" /> Fecha Inicio:</strong>
                                <span>{formatDate(selectedSolicitud.FechaInicio)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          
                          {selectedSolicitud.FechaFin && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalendarMinus} className="me-2" /> Fecha Fin:</strong>
                                <span>{formatDate(selectedSolicitud.FechaFin)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          
                          {selectedSolicitud.DiasSolicitados && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalculator} className="me-2" /> Días Solicitados:</strong>
                                <span>{selectedSolicitud.DiasSolicitados} días</span>
                              </div>
                            </ListGroup.Item>
                          )}
                        </>
                      )}
                      
                      {selectedSolicitud.Tipo === 'permiso' && (
                        <>
                          {selectedSolicitud.FechaInicio && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalendarCheck} className="me-2" /> Fecha:</strong>
                                <span>{formatDate(selectedSolicitud.FechaInicio)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          
                          <ListGroup.Item>
                            <div className="d-flex justify-content-between">
                              <strong><FontAwesomeIcon icon={faMoneyBillWave} className="me-2" /> Tipo:</strong>
                              <span>{selectedSolicitud.ConGoce ? 'Con goce de sueldo' : 'Sin goce de sueldo'}</span>
                            </div>
                          </ListGroup.Item>
                        </>
                      )}
                      
                      {selectedSolicitud.Tipo === 'horas_extras' && (
                        <>
                          {selectedSolicitud.FechaInicio && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faClock} className="me-2" /> Fecha:</strong>
                                <span>{formatDate(selectedSolicitud.FechaInicio)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          
                          {selectedSolicitud.HorasSolicitadas && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faClock} className="me-2" /> Horas Solicitadas:</strong>
                                <span>{selectedSolicitud.HorasSolicitadas} horas</span>
                              </div>
                            </ListGroup.Item>
                          )}
                        </>
                      )}
                      
                      <ListGroup.Item>
                        <strong><FontAwesomeIcon icon={faComment} className="me-2" /> Motivo:</strong>
                        <div className="mt-2">{selectedSolicitud.Motivo}</div>
                      </ListGroup.Item>
                      
                      {selectedSolicitud.Observaciones && (
                        <ListGroup.Item>
                          <strong><FontAwesomeIcon icon={faComment} className="me-2" /> Observaciones:</strong>
                          <div className="mt-2">{selectedSolicitud.Observaciones}</div>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
                
                {selectedSolicitudDetalle?.aprobaciones && selectedSolicitudDetalle.aprobaciones.length > 0 && (
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <FontAwesomeIcon icon={faUserShield} className="me-2" />
                      Proceso de Aprobación
                      <Badge bg="info" className="ms-2">{selectedSolicitudDetalle.aprobaciones.length}</Badge>
                    </Accordion.Header>
                    <Accordion.Body>
                      <ListGroup variant="flush">
                        {selectedSolicitudDetalle.aprobaciones.map((aprobacion, index) => (
                          <ListGroup.Item key={index} className="mb-2">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong>{aprobacion.AprobadorNombre || 'Aprobador'}</strong>
                                <div className="text-muted small">{aprobacion.RolAprobador || 'Sin rol'}</div>
                              </div>
                              <div>
                                {getEstadoBadge(aprobacion.Estado)}
                              </div>
                            </div>
                            <div className="small text-muted mb-2">
                              <FontAwesomeIcon icon={faSortNumericUp} className="me-1" />
                              Orden: {aprobacion.OrdenAprobacion}°
                              {aprobacion.FechaAprobacion && (
                                <>
                                  <FontAwesomeIcon icon={faCalendarAlt} className="ms-3 me-1" />
                                  {formatDateTime(aprobacion.FechaAprobacion)}
                                </>
                              )}
                            </div>
                            {aprobacion.Comentarios && (
                              <div className="small">
                                <FontAwesomeIcon icon={faComment} className="me-1 text-muted" />
                                {aprobacion.Comentarios}
                              </div>
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Accordion.Body>
                  </Accordion.Item>
                )}
                
                {selectedSolicitudDetalle?.historial && selectedSolicitudDetalle.historial.length > 0 && (
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>
                      <FontAwesomeIcon icon={faHistory} className="me-2" />
                      Historial de Cambios
                      <Badge bg="secondary" className="ms-2">{selectedSolicitudDetalle.historial.length}</Badge>
                    </Accordion.Header>
                    <Accordion.Body>
                      <ListGroup variant="flush">
                        {selectedSolicitudDetalle.historial.map((historial, index) => (
                          <ListGroup.Item key={index} className="mb-2">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <div>
                                <strong>{historial.UsuarioNombre || 'Usuario'}</strong>
                              </div>
                              <div className="small text-muted">
                                {formatDateTime(historial.createdAt)}
                              </div>
                            </div>
                            <div className="small">
                              <strong>{historial.Accion}:</strong> 
                              <div className="mt-1">
                                {historial.Comentarios && (
                                  <div>{historial.Comentarios}</div>
                                )}
                                {historial.EstadoAnterior && historial.EstadoNuevo && (
                                  <div className="text-muted">
                                    <small>Estado: {historial.EstadoAnterior} → {historial.EstadoNuevo}</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Accordion.Body>
                  </Accordion.Item>
                )}
              </Accordion>
            </>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-warning mb-3" />
              <h5>No se pudieron cargar los detalles</h5>
              <p className="text-muted">La solicitud no está disponible</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Cerrar
          </Button>
          <Button variant="outline-primary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Imprimir
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Solicitudes;