import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
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
  Accordion
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DataTable from 'react-data-table-component';
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
  faIdCard,
  faSort,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDateDisplay, formatDateTimeDisplay, formatDateForInput } from '../utils/dateUtils';

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
  CorreoElectronico?: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
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

interface DetalleAprobacion extends AprobacionPendiente {
  MotivoCompleto?: string;
  Observaciones?: string;
  Departamento?: string;
  Puesto?: string;
}

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

const esFinDeSemana = (fecha: string): boolean => {
  const date = new Date(fecha);
  const diaSemana = date.getDay();
  return diaSemana === 0 || diaSemana === 6;
};

const obtenerDiaHabilSiguiente = (fecha: Date): Date => {
  const siguiente = new Date(fecha);
  siguiente.setDate(siguiente.getDate() + 1);
  
  while (esFinDeSemana(siguiente.toISOString().split('T')[0])) {
    siguiente.setDate(siguiente.getDate() + 1);
  }
  
  return siguiente;
};

const obtenerDiaHabilMasCercano = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  if (!esFinDeSemana(date.toISOString().split('T')[0])) {
    return date.toISOString().split('T')[0];
  }
  
  const diaSemana = date.getDay();
  let diasASumar = 1;
  
  if (diaSemana === 0) {
    diasASumar = 1;
  } else if (diaSemana === 6) {
    diasASumar = 2;
  }
  
  const proximoLunes = new Date(date);
  proximoLunes.setDate(date.getDate() + diasASumar);
  
  return proximoLunes.toISOString().split('T')[0];
};

// ========== FUNCIONES UTC PARA MANEJO CORRECTO DE FECHAS ==========

const getUTCDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

const getCurrentUTCDate = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
};

const formatUTCDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calcularFechaMinimaPermiso = (): string => {
  const hoyUTC = getCurrentUTCDate();
  const fechaMinima = new Date(hoyUTC);
  fechaMinima.setUTCDate(hoyUTC.getUTCDate() + 1);
  
  let fechaStr = formatUTCDate(fechaMinima);
  
  while (esFinDeSemana(fechaStr)) {
    fechaMinima.setUTCDate(fechaMinima.getUTCDate() + 1);
    fechaStr = formatUTCDate(fechaMinima);
  }
  
  return fechaStr;
};

const tiene24HorasAnticipacion = (fechaSeleccionadaStr: string): boolean => {
  const fechaSeleccionada = getUTCDate(fechaSeleccionadaStr);
  const ahoraUTC = getCurrentUTCDate();
  
  const fechaMinima = new Date(ahoraUTC);
  fechaMinima.setUTCDate(ahoraUTC.getUTCDate() + 1);
  
  return fechaSeleccionada >= fechaMinima;
};

// ========== FIN FUNCIONES UTC ==========

const validarYCorregirFechasVacaciones = (
  fechaInicio: string, 
  fechaFin: string
): { fechaInicio: string; fechaFin: string } => {
  let inicio = new Date(fechaInicio);
  let fin = new Date(fechaFin);
  
  if (fin < inicio) {
    [inicio, fin] = [fin, inicio];
  }
  
  if (esFinDeSemana(inicio.toISOString().split('T')[0])) {
    inicio = new Date(obtenerDiaHabilMasCercano(inicio));
  }
  
  if (esFinDeSemana(fin.toISOString().split('T')[0])) {
    fin = new Date(obtenerDiaHabilMasCercano(fin));
  }
  
  if (fin < inicio) {
    fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    while (esFinDeSemana(fin.toISOString().split('T')[0])) {
      fin.setDate(fin.getDate() + 1);
    }
  }
  
  return {
    fechaInicio: inicio.toISOString().split('T')[0],
    fechaFin: fin.toISOString().split('T')[0]
  };
};

const calcularDiasHabiles = (fechaInicio: string, fechaFin: string): number => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  let diasHabiles = 0;
  const currentDate = new Date(inicio);
  
  while (currentDate <= fin) {
    const diaSemana = currentDate.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasHabiles++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return diasHabiles;
};

const obtenerSiguienteDiaHabil = (fecha: Date): Date => {
  const siguiente = new Date(fecha);
  siguiente.setDate(siguiente.getDate() + 1);
  
  while (esFinDeSemana(siguiente.toISOString().split('T')[0])) {
    siguiente.setDate(siguiente.getDate() + 1);
  }
  
  return siguiente;
};

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

  // ========== VERIFICACIÓN DE APROBADOR VÍA API ==========
  const [esAprobador, setEsAprobador] = useState<boolean>(false);
  const [loadingAprobador, setLoadingAprobador] = useState<boolean>(true);

  useEffect(() => {
    const verificarAprobador = async () => {
      // Solo admin/manager pueden ser aprobadores; si es employee, saltar la llamada
      if (!user?.id || isEmployee) {
        setEsAprobador(false);
        setLoadingAprobador(false);
        return;
      }
      try {
        const response = await api.get(`/aprobadores/verificar/${user.id}`);
        if (response.data.success) {
          setEsAprobador(response.data.data.esAprobador === true);
        } else {
          setEsAprobador(false);
        }
      } catch (error) {
        console.error('Error verificando aprobador:', error);
        setEsAprobador(false);
      } finally {
        setLoadingAprobador(false);
      }
    };

    verificarAprobador();
  }, [user?.id]);
  // ========== FIN VERIFICACIÓN DE APROBADOR ==========

  // Permisos: el rol sigue siendo requerido, pero además debe estar en la tabla de aprobadores
  const canViewAll = (isAdmin || isManager) && esAprobador;
  const canCreateVacaciones = true;
  const canCreatePermiso = true;
  const canCreateHorasExtras = isAdmin || isManager;
  const canApprove = (isAdmin || isManager) && esAprobador;
  const canViewReports = (isAdmin || isManager) && esAprobador;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('mis-solicitudes');
  
  const [misSolicitudes, setMisSolicitudes] = useState<Solicitud[]>([]);
  const [filteredMisSolicitudes, setFilteredMisSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<AprobacionPendiente[]>([]);
  const [filteredSolicitudesPendientes, setFilteredSolicitudesPendientes] = useState<AprobacionPendiente[]>([]);
  const [solicitudesAprobadas, setSolicitudesAprobadas] = useState<Solicitud[]>([]);
  const [filteredSolicitudesAprobadas, setFilteredSolicitudesAprobadas] = useState<Solicitud[]>([]);
  const [reporteHorasExtras, setReporteHorasExtras] = useState<ReporteHorasExtras[]>([]);
  const [filteredReporteHorasExtras, setFilteredReporteHorasExtras] = useState<ReporteHorasExtras[]>([]);
  const [empleadosSelect, setEmpleadosSelect] = useState<any[]>([]);
  const [pendientesCount, setPendientesCount] = useState<number>(0);
  
  const [filterText, setFilterText] = useState('');
  const [filterTextPendientes, setFilterTextPendientes] = useState('');
  const [filterTextAprobadas, setFilterTextAprobadas] = useState('');
  const [filterTextHorasExtras, setFilterTextHorasExtras] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [perPagePendientes, setPerPagePendientes] = useState(10);
  const [perPageAprobadas, setPerPageAprobadas] = useState(10);
  const [perPageHorasExtras, setPerPageHorasExtras] = useState(10);
  
  const [showVacacionesModal, setShowVacacionesModal] = useState(false);
  const [showPermisoModal, setShowPermisoModal] = useState(false);
  const [showHorasExtrasModal, setShowHorasExtrasModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditAprobacionModal, setShowEditAprobacionModal] = useState(false);
  
  const [vacacionesData, setVacacionesData] = useState({
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    observaciones: ''
  });
  
  const [permisoData, setPermisoData] = useState({
    fechaInicio: calcularFechaMinimaPermiso(),
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
  
  const [derechosVacacionales, setDerechosVacacionales] = useState<DerechosVacacionales | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedSolicitudDetalle, setSelectedSolicitudDetalle] = useState<DetalleSolicitudResponse | null>(null);
  const [selectedAprobacion, setSelectedAprobacion] = useState<DetalleAprobacion | null>(null);
  
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  useEffect(() => {
    if (!filterText) {
      setFilteredMisSolicitudes(misSolicitudes);
    } else {
      const filtered = misSolicitudes.filter(solicitud => {
        const searchTerm = filterText.toLowerCase();
        return (
          (solicitud.EmpleadoNombre && solicitud.EmpleadoNombre.toLowerCase().includes(searchTerm)) ||
          solicitud.Motivo.toLowerCase().includes(searchTerm) ||
          solicitud.Tipo.toLowerCase().includes(searchTerm) ||
          (solicitud.Observaciones && solicitud.Observaciones.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredMisSolicitudes(filtered);
    }
  }, [filterText, misSolicitudes]);

  useEffect(() => {
    if (!filterTextPendientes) {
      setFilteredSolicitudesPendientes(solicitudesPendientes);
    } else {
      const filtered = solicitudesPendientes.filter(aprobacion => {
        const searchTerm = filterTextPendientes.toLowerCase();
        return (
          aprobacion.EmpleadoNombre.toLowerCase().includes(searchTerm) ||
          aprobacion.Motivo.toLowerCase().includes(searchTerm) ||
          aprobacion.Tipo.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredSolicitudesPendientes(filtered);
    }
  }, [filterTextPendientes, solicitudesPendientes]);

  useEffect(() => {
    if (!filterTextAprobadas) {
      setFilteredSolicitudesAprobadas(solicitudesAprobadas);
    } else {
      const filtered = solicitudesAprobadas.filter(solicitud => {
        const searchTerm = filterTextAprobadas.toLowerCase();
        return (
          (solicitud.EmpleadoNombre && solicitud.EmpleadoNombre.toLowerCase().includes(searchTerm)) ||
          solicitud.Motivo.toLowerCase().includes(searchTerm) ||
          solicitud.Tipo.toLowerCase().includes(searchTerm) ||
          (solicitud.Observaciones && solicitud.Observaciones.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredSolicitudesAprobadas(filtered);
    }
  }, [filterTextAprobadas, solicitudesAprobadas]);

  useEffect(() => {
    if (!filterTextHorasExtras) {
      setFilteredReporteHorasExtras(reporteHorasExtras);
    } else {
      const filtered = reporteHorasExtras.filter(item => {
        const searchTerm = filterTextHorasExtras.toLowerCase();
        return (
          item.EmpleadoNombre.toLowerCase().includes(searchTerm) ||
          item.Motivo.toLowerCase().includes(searchTerm) ||
          (item.CorreoElectronico && item.CorreoElectronico.toLowerCase().includes(searchTerm)) ||
          (item.PuestoNombre && item.PuestoNombre.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredReporteHorasExtras(filtered);
    }
  }, [filterTextHorasExtras, reporteHorasExtras]);

  // Esperar a que la verificación de aprobador termine antes de cargar datos dependientes
  useEffect(() => {
    if (loadingAprobador) return;

    loadDerechosVacacionales();
    if (canViewAll) {
      loadEmpleadosSelect();
    }
    if (canApprove) {
      loadPendientesCount();
    }
  }, [loadingAprobador]);
  
  useEffect(() => {
    if (loadingAprobador) return;
    loadTabData();
  }, [activeTab, filterEstado, filterTipo, filterFechaDesde, filterFechaHasta, loadingAprobador]);

  useEffect(() => {
    if (!canApprove) return;
    
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
    
    if (canApprove && activeTab !== 'pendientes') {
      loadPendientesCount();
    }
  };
  
  const loadDerechosVacacionales = async () => {
    try {
      const response = await api.get('/solicitudes/vacaciones/derechos');
      
      if (response.data.success) {
        const data = response.data.data;
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
      console.error('Error cargando colaboradores:', error);
    }
  };
  
  const loadMisSolicitudes = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (filterEstado) {
        response = await api.get(`/solicitudes/estado/${filterEstado}`);
      } else {
        response = await api.get('/solicitudes/mis-solicitudes');
      }
      
      if (response.data.success) {
        let solicitudes = response.data.data || [];
        
        if (filterTipo) {
          solicitudes = solicitudes.filter((s: Solicitud) => s.Tipo === filterTipo);
        }
        
        setMisSolicitudes(solicitudes);
        setFilteredMisSolicitudes(solicitudes);
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
      
      if (response.data.success) {
        const data = response.data.data || [];
        setSolicitudesPendientes(data);
        setFilteredSolicitudesPendientes(data);
        setPendientesCount(data.length);
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
      
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      if (filterTipo) params.append('tipo', filterTipo);
      
      const response = await api.get(`/solicitudes/aprobadas?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        const solicitudes = data?.solicitudes || data || [];
        setSolicitudesAprobadas(solicitudes);
        setFilteredSolicitudesAprobadas(solicitudes);
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
      
      if (response.data.success) {
        const data = response.data.data;
        const reporte = data?.reporte || data || [];
        setReporteHorasExtras(reporte);
        setFilteredReporteHorasExtras(reporte);
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
      const response = await api.get('/solicitudes/aprobaciones/pendientes');
      if (response.data.success) {
        const count = response.data.data?.length || 0;
        setPendientesCount(count);
      }
    } catch (error: any) {
      console.error('Error cargando contador de pendientes:', error);
    }
  };
  
  const loadDetalleSolicitud = async (solicitudId: number) => {
    try {
      setError('');
      setSelectedSolicitudDetalle(null);
      
      let solicitudBasica = misSolicitudes.find(s => s.ID === solicitudId);
      
      if (!solicitudBasica && canViewAll) {
        solicitudBasica = solicitudesAprobadas.find(s => s.ID === solicitudId);
      }
      
      let detalleCompleto = null;
      try {
        const response = await api.get(`/solicitudes/detalle/${solicitudId}`);
        
        if (response.data.success) {
          detalleCompleto = response.data.data;
        }
      } catch (detailError) {
        console.warn('No se pudo cargar detalle completo, usando datos básicos:', detailError);
      }
      
      const solicitudCombinada: Solicitud = {
        ...(solicitudBasica || {}),
        ...(detalleCompleto?.solicitud || {}),
        ID: solicitudId,
        Tipo: solicitudBasica?.Tipo || detalleCompleto?.solicitud?.Tipo || 'permiso',
        Estado: solicitudBasica?.Estado || detalleCompleto?.solicitud?.Estado || 'pendiente',
        Motivo: solicitudBasica?.Motivo || detalleCompleto?.solicitud?.Motivo || 'No disponible',
        FechaSolicitud: solicitudBasica?.FechaSolicitud || detalleCompleto?.solicitud?.FechaSolicitud || new Date().toISOString()
      } as Solicitud;
      
      setSelectedSolicitud(solicitudCombinada);
      setSelectedSolicitudDetalle(detalleCompleto);
      setShowDetailModal(true);
      
    } catch (error: any) {
      console.error('Error en loadDetalleSolicitud:', error);
      setError(error.response?.data?.message || 'Error cargando detalle de solicitud');
      
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
      
      if (esFinDeSemana(vacacionesData.fechaInicio)) {
        setError('Las vacaciones no pueden comenzar en fin de semana. Por favor selecciona un día hábil.');
        return;
      }
      
      const diasHabiles = calcularDiasHabiles(vacacionesData.fechaInicio, vacacionesData.fechaFin);
      
      if (diasHabiles <= 0) {
        setError('El período seleccionado no contiene días hábiles');
        return;
      }
      
      if (derechosVacacionales && diasHabiles > derechosVacacionales.DiasDisponibles) {
        setError(`Solo tienes ${derechosVacacionales.DiasDisponibles} días disponibles. Estás solicitando ${diasHabiles} días hábiles.`);
        return;
      }
      
      const solicitudData = {
        ...vacacionesData,
        fechaInicio: inicio.toISOString().split('T')[0],
        fechaFin: fin.toISOString().split('T')[0],
        diasSolicitados: diasHabiles
      };
      
      const response = await api.post('/solicitudes/vacaciones/solicitar', solicitudData);
      
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
      
      if (esFinDeSemana(permisoData.fechaInicio)) {
        setError('Los permisos no pueden solicitarse en fin de semana. Por favor selecciona un día hábil.');
        return;
      }
      
      if (!tiene24HorasAnticipacion(permisoData.fechaInicio)) {
        const fechaMinima = calcularFechaMinimaPermiso();
        setError(`Los permisos deben solicitarse con al menos 24 horas de anticipación. La fecha mínima permitida es ${fechaMinima}`);
        return;
      }
      
      console.log('=== ENVIANDO SOLICITUD DE PERMISO ===');
      console.log('Fecha seleccionada:', permisoData.fechaInicio);
      console.log('Fecha mínima permitida:', calcularFechaMinimaPermiso());
      console.log('Validación superada: OK');
      
      const response = await api.post('/solicitudes/permisos/solicitar', {
        ...permisoData,
        fechaInicio: permisoData.fechaInicio
      });
      
      if (response.data.success) {
        setSuccess('Solicitud de permiso enviada exitosamente');
        setShowPermisoModal(false);
        setPermisoData({
          fechaInicio: calcularFechaMinimaPermiso(),
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
      
      if (errorMsg.includes('24 horas') || errorMsg.includes('anticipación')) {
        setError(`Los permisos deben solicitarse con al menos 24 horas de anticipación. La fecha mínima es ${calcularFechaMinimaPermiso()}`);
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
      
      if (esFinDeSemana(horasExtrasData.fechaInicio)) {
        setError('Las horas extras no pueden solicitarse en fin de semana. Por favor selecciona un día hábil.');
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
      
      const response = await api.post('/solicitudes/horas-extras/solicitar', solicitudData);
      
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
      
      const estadoAPI = aprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazado';
      
      const response = await api.patch(
        `/solicitudes/aprobaciones/${aprobacionData.aprobacionId}/procesar`,
        { 
          estado: estadoAPI, 
          comentarios: aprobacionData.comentarios 
        }
      );
      
      if (response.data.success) {
        setSuccess(`Aprobación ${aprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazada'} exitosamente`);
        setShowApproveModal(false);
        setAprobacionData({
          aprobacionId: 0,
          estado: 'aprobada',
          comentarios: ''
        });
        
        await loadSolicitudesPendientes();
        loadSolicitudesAprobadas();
        loadPendientesCount();
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
      
      const estadoAPI = editAprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazado';
      
      const response = await api.patch(
        `/solicitudes/aprobaciones/${editAprobacionData.aprobacionId}/editar`,
        { 
          estado: estadoAPI, 
          comentarios: editAprobacionData.comentarios 
        }
      );
      
      if (response.data.success) {
        setSuccess(`Aprobación actualizada a ${editAprobacionData.estado === 'aprobada' ? 'aprobada' : 'rechazada'}`);
        setShowEditAprobacionModal(false);
        setEditAprobacionData({
          aprobacionId: 0,
          estado: 'aprobada',
          comentarios: ''
        });
        
        await loadSolicitudesPendientes();
        loadPendientesCount();
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
      
      const response = await api.patch(`/solicitudes/${solicitudId}/cancelar`);
      
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
      pendiente: { bg: 'warning', text: 'Pendiente', icon: faHourglassHalf },
      aprobada: { bg: 'success', text: 'Aprobada', icon: faCheckCircle },
      rechazada: { bg: 'danger', text: 'Rechazada', icon: faTimesCircle },
      cancelada: { bg: 'secondary', text: 'Cancelada', icon: faBan },
      aprobado: { bg: 'success', text: 'Aprobado', icon: faCheckCircle },
      rechazado: { bg: 'danger', text: 'Rechazado', icon: faTimesCircle }
    };
    
    const estadoInfo = estados[estado] || { bg: 'secondary', text: estado, icon: faQuestionCircle };
    
    return (
      <Badge bg={estadoInfo.bg} className="d-flex align-items-center gap-1 px-2 py-1">
        <FontAwesomeIcon icon={estadoInfo.icon} size="sm" />
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
      <Badge bg={tipoInfo.bg} className="d-flex align-items-center gap-1 px-2 py-1">
        <FontAwesomeIcon icon={tipoInfo.icon} size="sm" />
        <span>{tipoInfo.text}</span>
      </Badge>
    );
  };
  
  const getDetalleSolicitud = (aprobacion: DetalleAprobacion) => {
    if (aprobacion.Tipo === 'vacaciones') {
      const dias = aprobacion.DiasSolicitados || 0;
      const fechaInicio = aprobacion.FechaInicio ? formatDateDisplay(aprobacion.FechaInicio) : 'N/A';
      const fechaFin = aprobacion.FechaFin ? formatDateDisplay(aprobacion.FechaFin) : 'N/A';
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
            <Col xs={5} className="text-muted">Días hábiles solicitados:</Col>
            <Col xs={7}>
              <Badge bg="primary" className="fs-6">{dias} {dias === 1 ? 'día' : 'días'}</Badge>
            </Col>
          </Row>
        </div>
      );
    }
    
    if (aprobacion.Tipo === 'permiso') {
      const conGoce = aprobacion.ConGoce ? 'Sí' : 'No';
      const fecha = aprobacion.FechaInicio ? formatDateDisplay(aprobacion.FechaInicio) : 'N/A';
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
      const fecha = aprobacion.FechaInicio ? formatDateDisplay(aprobacion.FechaInicio) : 'N/A';
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
  
  const estadisticasVacaciones = derechosVacacionales ? {
    total: derechosVacacionales.DiasTotales,
    tomados: derechosVacacionales.DiasTomados,
    disponibles: derechosVacacionales.DiasDisponibles,
    pendientes: derechosVacacionales.DiasPendientes || 0,
    porcentaje: derechosVacacionales.DiasTotales > 0 
      ? Math.round((derechosVacacionales.DiasTomados / derechosVacacionales.DiasTotales) * 100)
      : 0
  } : null;
  
  const calcularDiasSolicitados = () => {
    if (!vacacionesData.fechaInicio || !vacacionesData.fechaFin) return 0;
    return calcularDiasHabiles(vacacionesData.fechaInicio, vacacionesData.fechaFin);
  };

  const handleFechaInicioVacacionesChange = (fecha: string) => {
    if (!fecha) {
      setVacacionesData(prev => ({ ...prev, fechaInicio: fecha }));
      return;
    }
    const fechaCorregida = obtenerDiaHabilMasCercano(fecha);
    setVacacionesData(prev => {
      let newData = { ...prev, fechaInicio: fechaCorregida };
      if (prev.fechaFin) {
        const fechasCorregidas = validarYCorregirFechasVacaciones(fechaCorregida, prev.fechaFin);
        newData = { ...newData, fechaInicio: fechasCorregidas.fechaInicio, fechaFin: fechasCorregidas.fechaFin };
      }
      return newData;
    });
  };

  const handleFechaFinVacacionesChange = (fecha: string) => {
    if (!fecha) {
      setVacacionesData(prev => ({ ...prev, fechaFin: fecha }));
      return;
    }
    const fechaCorregida = obtenerDiaHabilMasCercano(fecha);
    setVacacionesData(prev => {
      if (prev.fechaInicio) {
        const fechasCorregidas = validarYCorregirFechasVacaciones(prev.fechaInicio, fechaCorregida);
        return { ...prev, fechaInicio: fechasCorregidas.fechaInicio, fechaFin: fechasCorregidas.fechaFin };
      }
      return { ...prev, fechaFin: fechaCorregida };
    });
  };

  const handleFechaPermisoChange = (fecha: string) => {
    if (!fecha) {
      setPermisoData(prev => ({ ...prev, fechaInicio: fecha }));
      return;
    }
    const fechaCorregida = obtenerDiaHabilMasCercano(fecha);
    setPermisoData(prev => ({ ...prev, fechaInicio: fechaCorregida }));
  };

  const handleFechaHorasExtrasChange = (fecha: string) => {
    if (!fecha) {
      setHorasExtrasData(prev => ({ ...prev, fechaInicio: fecha }));
      return;
    }
    const fechaCorregida = obtenerDiaHabilMasCercano(fecha);
    setHorasExtrasData(prev => ({ ...prev, fechaInicio: fechaCorregida }));
  };

  const handleFechaInicioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFechaInicioVacacionesChange(e.target.value);
  };

  const handleFechaFinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFechaFinVacacionesChange(e.target.value);
  };

  const handleFechaPermisoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFechaPermisoChange(e.target.value);
  };

  const handleFechaHorasExtrasInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFechaHorasExtrasChange(e.target.value);
  };

  const exportToExcel = (data: any[], filename: string) => {
    try {
      if (data.length === 0) {
        setError('No hay datos para exportar');
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes');
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccess('Exportación completada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      setError('Error al exportar a Excel');
    }
  };

  const exportToPDF = (data: any[], columns: any[], filename: string) => {
    try {
      if (data.length === 0) {
        setError('No hay datos para exportar');
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(13, 110, 253);
      doc.text(`Reporte de ${filename}`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text(`Generado: ${formatDateDisplay(new Date().toISOString())}`, 14, 32);
      doc.text(`Total de registros: ${data.length}`, 14, 38);
      const tableColumn = columns.map((col: any) => col.name);
      const tableRows = data.map((item: any) =>
        columns.map((col: any) => {
          const value = col.selector(item);
          return value !== undefined && value !== null ? String(value) : '';
        })
      );
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [13, 110, 253], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('Exportación completada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      setError('Error al exportar a PDF');
    }
  };

  const columnsMisSolicitudes = [
    {
      name: 'ID',
      selector: (row: Solicitud) => row.ID,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Tipo',
      selector: (row: Solicitud) => row.Tipo,
      sortable: true,
      cell: (row: Solicitud) => getTipoBadge(row.Tipo),
    },
    {
      name: 'Fecha Solicitud',
      selector: (row: Solicitud) => row.FechaSolicitud,
      sortable: true,
      cell: (row: Solicitud) => formatDateTimeDisplay(row.FechaSolicitud),
    },
    {
      name: 'Periodo / Detalles',
      selector: (row: Solicitud) => row.FechaInicio || '',
      sortable: true,
      cell: (row: Solicitud) => {
        if (row.Tipo === 'vacaciones') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faCalendarPlus} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
                {row.FechaFin && (
                  <>
                    <FontAwesomeIcon icon={faArrowRight} className="mx-2" />
                    {formatDateDisplay(row.FechaFin!)}
                  </>
                )}
              </div>
              {row.DiasSolicitados && (
                <small className="text-muted">{row.DiasSolicitados} días hábiles</small>
              )}
            </div>
          );
        }
        if (row.Tipo === 'permiso') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
              </div>
              <small className="text-muted">{row.ConGoce ? 'Con goce' : 'Sin goce'}</small>
            </div>
          );
        }
        if (row.Tipo === 'horas_extras') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faClock} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
              </div>
              {row.HorasSolicitadas && (
                <small className="text-muted">{row.HorasSolicitadas} horas</small>
              )}
            </div>
          );
        }
        return null;
      },
      grow: 2,
    },
    {
      name: 'Motivo',
      selector: (row: Solicitud) => row.Motivo,
      sortable: true,
      cell: (row: Solicitud) => (
        <div className="text-truncate" style={{ maxWidth: '200px' }} title={row.Motivo}>
          {row.Motivo}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Estado',
      selector: (row: Solicitud) => row.Estado,
      sortable: true,
      cell: (row: Solicitud) => getEstadoBadge(row.Estado),
    },
    {
      name: 'Acciones',
      cell: (row: Solicitud) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={(e) => { e.stopPropagation(); loadDetalleSolicitud(row.ID); }}
            title="Ver detalles"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faEye} />
          </Button>
          {row.Estado === 'pendiente' && (
            <Button
              variant="outline-danger"
              onClick={(e) => { e.stopPropagation(); handleCancelarSolicitud(row.ID); }}
              title="Cancelar solicitud"
              className="hover-bg-soft"
            >
              <FontAwesomeIcon icon={faBan} />
            </Button>
          )}
        </ButtonGroup>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const columnsPendientes = [
    {
      name: 'Colaborador',
      selector: (row: AprobacionPendiente) => row.EmpleadoNombre,
      sortable: true,
      cell: (row: AprobacionPendiente) => (
        <div className="fw-medium">{row.EmpleadoNombre}</div>
      ),
      grow: 2,
    },
    {
      name: 'Tipo',
      selector: (row: AprobacionPendiente) => row.Tipo,
      sortable: true,
      cell: (row: AprobacionPendiente) => getTipoBadge(row.Tipo),
    },
    {
      name: 'Fecha Solicitud',
      selector: (row: AprobacionPendiente) => row.FechaSolicitud,
      sortable: true,
      cell: (row: AprobacionPendiente) => formatDateTimeDisplay(row.FechaSolicitud),
    },
    {
      name: 'Detalles',
      selector: (row: AprobacionPendiente) => row.FechaInicio || '',
      sortable: true,
      cell: (row: AprobacionPendiente) => {
        if (row.Tipo === 'vacaciones') {
          return (
            <div>
              <div>{formatDateDisplay(row.FechaInicio!)} → {formatDateDisplay(row.FechaFin!)}</div>
              <small className="text-muted">{row.DiasSolicitados} días hábiles</small>
            </div>
          );
        }
        if (row.Tipo === 'permiso') {
          return (
            <div>
              <div>{formatDateDisplay(row.FechaInicio!)}</div>
              <small className="text-muted">{row.ConGoce ? 'Con goce' : 'Sin goce'}</small>
            </div>
          );
        }
        if (row.Tipo === 'horas_extras') {
          return (
            <div>
              <div>{formatDateDisplay(row.FechaInicio!)}</div>
              <small className="text-muted">{row.HorasSolicitadas} horas</small>
            </div>
          );
        }
        return null;
      },
      grow: 2,
    },
    {
      name: 'Motivo',
      selector: (row: AprobacionPendiente) => row.Motivo,
      sortable: true,
      cell: (row: AprobacionPendiente) => (
        <div className="text-truncate" style={{ maxWidth: '200px' }} title={row.Motivo}>
          {row.Motivo}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Orden',
      selector: (row: AprobacionPendiente) => row.OrdenAprobacion,
      sortable: true,
      cell: (row: AprobacionPendiente) => (
        <Badge bg="secondary">{row.OrdenAprobacion}°</Badge>
      ),
    },
    {
      name: 'Acciones',
      cell: (row: AprobacionPendiente) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-success"
            onClick={(e) => { e.stopPropagation(); openApproveModal(row); }}
            title="Aprobar/Rechazar"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faCheckCircle} />
          </Button>
          <Button
            variant="outline-warning"
            onClick={(e) => { e.stopPropagation(); openEditAprobacionModal(row); }}
            title="Editar aprobación"
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        </ButtonGroup>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const columnsAprobadas = [
    {
      name: 'Colaborador',
      selector: (row: Solicitud) => row.EmpleadoNombre || '',
      sortable: true,
      cell: (row: Solicitud) => (
        <div>
          <div className="fw-medium">{row.EmpleadoNombre || 'Sin nombre'}</div>
          {row.EmpleadoCorreo && (
            <small className="text-muted d-block">{row.EmpleadoCorreo}</small>
          )}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Tipo',
      selector: (row: Solicitud) => row.Tipo,
      sortable: true,
      cell: (row: Solicitud) => getTipoBadge(row.Tipo),
    },
    {
      name: 'Fecha Solicitud',
      selector: (row: Solicitud) => row.FechaSolicitud,
      sortable: true,
      cell: (row: Solicitud) => formatDateTimeDisplay(row.FechaSolicitud),
    },
    {
      name: 'Periodo / Detalles',
      selector: (row: Solicitud) => row.FechaInicio || '',
      sortable: true,
      cell: (row: Solicitud) => {
        if (row.Tipo === 'vacaciones') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faCalendarPlus} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
                {row.FechaFin && (
                  <>
                    <FontAwesomeIcon icon={faArrowRight} className="mx-2" />
                    {formatDateDisplay(row.FechaFin!)}
                  </>
                )}
              </div>
              {row.DiasSolicitados && (
                <small className="text-muted">{row.DiasSolicitados} días hábiles</small>
              )}
            </div>
          );
        }
        if (row.Tipo === 'permiso') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
              </div>
            </div>
          );
        }
        if (row.Tipo === 'horas_extras') {
          return (
            <div>
              <div>
                <FontAwesomeIcon icon={faClock} className="me-1" />
                {formatDateDisplay(row.FechaInicio!)}
              </div>
              {row.HorasSolicitadas && (
                <small className="text-muted">{row.HorasSolicitadas} horas</small>
              )}
            </div>
          );
        }
        return null;
      },
      grow: 2,
    },
    {
      name: 'Motivo',
      selector: (row: Solicitud) => row.Motivo,
      sortable: true,
      cell: (row: Solicitud) => (
        <div className="text-truncate" style={{ maxWidth: '200px' }} title={row.Motivo}>
          {row.Motivo}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Estado',
      selector: (row: Solicitud) => row.Estado,
      sortable: true,
      cell: (row: Solicitud) => getEstadoBadge(row.Estado),
    },
    {
      name: 'Acciones',
      cell: (row: Solicitud) => (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={(e) => { e.stopPropagation(); loadDetalleSolicitud(row.ID); }}
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

  const columnsHorasExtras = [
    {
      name: 'Colaborador',
      selector: (row: ReporteHorasExtras) => row.EmpleadoNombre,
      sortable: true,
      cell: (row: ReporteHorasExtras) => (
        <div>
          <div className="fw-medium">{row.EmpleadoNombre}</div>
          {row.CorreoElectronico && (
            <small className="text-muted d-block">{row.CorreoElectronico}</small>
          )}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Fecha',
      selector: (row: ReporteHorasExtras) => row.FechaInicio,
      sortable: true,
      cell: (row: ReporteHorasExtras) => formatDateDisplay(row.FechaInicio),
    },
    {
      name: 'Horas',
      selector: (row: ReporteHorasExtras) => row.HorasSolicitadas,
      sortable: true,
      cell: (row: ReporteHorasExtras) => {
        const horas = typeof row.HorasSolicitadas === 'string'
          ? parseFloat(row.HorasSolicitadas)
          : (row.HorasSolicitadas || 0);
        return (
          <Badge bg="warning" className="fs-6">
            {horas.toFixed(1)} hrs
          </Badge>
        );
      },
    },
    {
      name: 'Motivo',
      selector: (row: ReporteHorasExtras) => row.Motivo,
      sortable: true,
      cell: (row: ReporteHorasExtras) => (
        <div className="text-truncate" style={{ maxWidth: '200px' }} title={row.Motivo}>
          {row.Motivo}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Estado',
      selector: (row: ReporteHorasExtras) => row.Estado,
      sortable: true,
      cell: (row: ReporteHorasExtras) => getEstadoBadge(row.Estado),
    },
    {
      name: 'Puesto',
      selector: (row: ReporteHorasExtras) => row.PuestoNombre || '',
      sortable: true,
      cell: (row: ReporteHorasExtras) => (
        <small>{row.PuestoNombre || 'No asignado'}</small>
      ),
    },
  ];

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
  
  const renderStatsCards = () => {
    return (
      <Row className="mb-4">
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
  
  const renderFilters = () => {
    return (
      <Row className="mb-3">
        {activeTab === 'mis-solicitudes' && (
          <>
            <Col md={4}>
              <Form.Group>
                <Form.Select
                  size="sm"
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
                  size="sm"
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
                  size="sm"
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
                  size="sm"
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
              size="sm"
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

  // Mostrar spinner mientras se verifica si es aprobador
  if (!user || loadingAprobador) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Verificando permisos...</p>
        </div>
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
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Gestión de Solicitudes
              </h2>
            </div>
            <div className="d-flex gap-2">
              <ButtonGroup className="shadow-sm">
                <Button
                  variant="outline-primary"
                  onClick={loadTabData}
                  disabled={loading}
                  className="hover-bg-soft"
                >
                  <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} me="2" />
                  Actualizar
                </Button>
                {renderActionButtons()}
              </ButtonGroup>
            </div>
          </div>
        </Col>
      </Row>

      {estadisticasVacaciones && estadisticasVacaciones.disponibles <= 0 && isEmployee && (
        <Alert variant="danger" className="mb-3 shadow-sm">
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
        <Alert variant="warning" className="mb-3 shadow-sm">
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

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3 shadow-sm">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
            <strong className="me-2">Error:</strong>
            {error}
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3 shadow-sm">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
            <strong className="me-2">Éxito:</strong>
            {success}
          </div>
        </Alert>
      )}

      {renderStatsCards()}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => {
              setActiveTab(k || 'mis-solicitudes');
              setError('');
              setSuccess('');
              setFilterText('');
              setFilterTextPendientes('');
              setFilterTextAprobadas('');
              setFilterTextHorasExtras('');
            }}
            className="mb-0 px-3 pt-3"
            fill
          >
            <Tab eventKey="mis-solicitudes" title={
              <span>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Mis Solicitudes
                <Badge bg="primary" className="ms-2">{misSolicitudes.length}</Badge>
              </span>
            }>
              <div className="p-3">
                {renderFilters()}
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body className="p-0">
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                      <div>
                        <h6 className="mb-0">
                          <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                          Búsqueda
                        </h6>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            const dataToExport = selectedRows.length > 0 ? selectedRows : filteredMisSolicitudes;
                            exportToExcel(
                              dataToExport.map(s => ({
                                ID: s.ID,
                                Tipo: s.Tipo,
                                'Fecha Solicitud': formatDateTimeDisplay(s.FechaSolicitud),
                                'Fecha Inicio': s.FechaInicio ? formatDateDisplay(s.FechaInicio) : '',
                                'Fecha Fin': s.FechaFin ? formatDateDisplay(s.FechaFin) : '',
                                'Días/Horas': s.DiasSolicitados || s.HorasSolicitadas || '',
                                Motivo: s.Motivo,
                                Estado: s.Estado
                              })),
                              'mis_solicitudes'
                            );
                          }}
                          className="hover-bg-soft"
                        >
                          <FontAwesomeIcon icon={faDownload} className="me-1" />
                          Excel
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            const dataToExport = selectedRows.length > 0 ? selectedRows : filteredMisSolicitudes;
                            exportToPDF(dataToExport, columnsMisSolicitudes.filter(col => col.name !== 'Acciones'), 'mis_solicitudes');
                          }}
                          className="hover-bg-soft"
                        >
                          <FontAwesomeIcon icon={faPrint} className="me-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <FilterComponent
                        filterText={filterText}
                        onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
                        onClear={() => setFilterText('')}
                        placeholder="Buscar por motivo, tipo, colaborador..."
                      />
                    </div>
                  </Card.Body>
                </Card>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Cargando solicitudes...</p>
                      </div>
                    ) : filteredMisSolicitudes.length === 0 ? (
                      <div className="text-center py-5">
                        <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                        <h5>No tienes solicitudes</h5>
                        <p className="text-muted">
                          {filterText
                            ? 'No se encontraron resultados para tu búsqueda'
                            : 'Crea tu primera solicitud usando los botones de arriba'}
                        </p>
                      </div>
                    ) : (
                      <DataTable
                        columns={columnsMisSolicitudes}
                        data={filteredMisSolicitudes}
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
                        onRowClicked={(row) => loadDetalleSolicitud(row.ID)}
                        responsive
                        customStyles={customStyles}
                        progressPending={loading}
                        progressComponent={
                          <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Cargando datos...</p>
                          </div>
                        }
                        sortIcon={<FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />}
                        noDataComponent={
                          <div className="text-center py-5">
                            <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                            <h5>No hay solicitudes</h5>
                            <p className="text-muted">No se encontraron solicitudes para mostrar</p>
                          </div>
                        }
                      />
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-light border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faFileAlt} className="me-1" />
                        Total: {filteredMisSolicitudes.length} solicitudes
                      </small>
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                        {selectedRows.length > 0 ? `${selectedRows.length} seleccionados` : 'Ninguno seleccionado'}
                      </small>
                    </div>
                  </Card.Footer>
                </Card>
              </div>
            </Tab>

            {canApprove && (
              <Tab eventKey="pendientes" title={
                <span>
                  <FontAwesomeIcon icon={faUserClock} className="me-2" />
                  Por Aprobar
                  {pendientesCount > 0 && (
                    <Badge bg="danger" className="ms-2">{pendientesCount}</Badge>
                  )}
                </span>
              }>
                <div className="p-3">
                  <Alert variant="info" className="mb-3">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Tienes {pendientesCount} solicitudes pendientes de aprobación
                  </Alert>
                  <Card className="shadow-sm border-0 mb-3">
                    <Card.Body className="p-0">
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <div>
                          <h6 className="mb-0">
                            <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                            Búsqueda
                          </h6>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              exportToExcel(
                                filteredSolicitudesPendientes.map(s => ({
                                  Colaborador: s.EmpleadoNombre,
                                  Tipo: s.Tipo,
                                  'Fecha Solicitud': formatDateTimeDisplay(s.FechaSolicitud),
                                  'Fecha Inicio': s.FechaInicio ? formatDateDisplay(s.FechaInicio) : '',
                                  'Fecha Fin': s.FechaFin ? formatDateDisplay(s.FechaFin) : '',
                                  'Días/Horas': s.DiasSolicitados || s.HorasSolicitadas || '',
                                  Motivo: s.Motivo
                                })),
                                'pendientes'
                              );
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faDownload} className="me-1" />
                            Excel
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              exportToPDF(
                                filteredSolicitudesPendientes,
                                columnsPendientes.filter(col => col.name !== 'Acciones'),
                                'pendientes'
                              );
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faPrint} className="me-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <FilterComponent
                          filterText={filterTextPendientes}
                          onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTextPendientes(e.target.value)}
                          onClear={() => setFilterTextPendientes('')}
                          placeholder="Buscar por colaborador, motivo, tipo..."
                        />
                      </div>
                    </Card.Body>
                  </Card>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      {loading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando aprobaciones pendientes...</p>
                        </div>
                      ) : filteredSolicitudesPendientes.length === 0 ? (
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-success mb-3" />
                          <h5>No hay aprobaciones pendientes</h5>
                          <p className="text-muted">No hay solicitudes pendientes de tu aprobación</p>
                        </div>
                      ) : (
                        <DataTable
                          columns={columnsPendientes}
                          data={filteredSolicitudesPendientes}
                          pagination
                          paginationPerPage={perPagePendientes}
                          paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                          onChangeRowsPerPage={(newPerPage) => setPerPagePendientes(newPerPage)}
                          highlightOnHover
                          pointerOnHover
                          onRowClicked={(row) => openApproveModal(row)}
                          responsive
                          customStyles={customStyles}
                          progressPending={loading}
                          progressComponent={
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-3 text-muted">Cargando datos...</p>
                            </div>
                          }
                          sortIcon={<FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />}
                          noDataComponent={
                            <div className="text-center py-5">
                              <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-muted mb-3" />
                              <h5>No hay aprobaciones pendientes</h5>
                              <p className="text-muted">No se encontraron solicitudes pendientes</p>
                            </div>
                          }
                        />
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </Tab>
            )}

            {canViewAll && (
              <Tab eventKey="aprobadas" title={
                <span>
                  <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                  Todas Aprobadas
                  <Badge bg="success" className="ms-2">{solicitudesAprobadas.length}</Badge>
                </span>
              }>
                <div className="p-3">
                  {renderFilters()}
                  <Card className="shadow-sm border-0 mb-3">
                    <Card.Body className="p-0">
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <div>
                          <h6 className="mb-0">
                            <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                            Búsqueda
                          </h6>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              exportToExcel(
                                filteredSolicitudesAprobadas.map(s => ({
                                  ID: s.ID,
                                  Colaborador: s.EmpleadoNombre || '',
                                  Tipo: s.Tipo,
                                  'Fecha Solicitud': formatDateTimeDisplay(s.FechaSolicitud),
                                  'Fecha Inicio': s.FechaInicio ? formatDateDisplay(s.FechaInicio) : '',
                                  'Fecha Fin': s.FechaFin ? formatDateDisplay(s.FechaFin) : '',
                                  'Días/Horas': s.DiasSolicitados || s.HorasSolicitadas || '',
                                  Motivo: s.Motivo,
                                  Estado: s.Estado
                                })),
                                'aprobadas'
                              );
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faDownload} className="me-1" />
                            Excel
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              exportToPDF(
                                filteredSolicitudesAprobadas,
                                columnsAprobadas.filter(col => col.name !== 'Acciones'),
                                'aprobadas'
                              );
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faPrint} className="me-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <FilterComponent
                          filterText={filterTextAprobadas}
                          onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTextAprobadas(e.target.value)}
                          onClear={() => setFilterTextAprobadas('')}
                          placeholder="Buscar por colaborador, motivo, tipo..."
                        />
                      </div>
                    </Card.Body>
                  </Card>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      {loading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando solicitudes aprobadas...</p>
                        </div>
                      ) : filteredSolicitudesAprobadas.length === 0 ? (
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faClipboardList} size="3x" className="text-muted mb-3" />
                          <h5>No hay solicitudes aprobadas</h5>
                          <p className="text-muted">No hay solicitudes aprobadas en el sistema</p>
                        </div>
                      ) : (
                        <DataTable
                          columns={columnsAprobadas}
                          data={filteredSolicitudesAprobadas}
                          pagination
                          paginationPerPage={perPageAprobadas}
                          paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                          onChangeRowsPerPage={(newPerPage) => setPerPageAprobadas(newPerPage)}
                          highlightOnHover
                          pointerOnHover
                          onRowClicked={(row) => loadDetalleSolicitud(row.ID)}
                          responsive
                          customStyles={customStyles}
                          progressPending={loading}
                          progressComponent={
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-3 text-muted">Cargando datos...</p>
                            </div>
                          }
                          sortIcon={<FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />}
                          noDataComponent={
                            <div className="text-center py-5">
                              <FontAwesomeIcon icon={faClipboardList} size="3x" className="text-muted mb-3" />
                              <h5>No hay solicitudes aprobadas</h5>
                              <p className="text-muted">No se encontraron solicitudes aprobadas</p>
                            </div>
                          }
                        />
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </Tab>
            )}

            {canViewReports && (
              <Tab eventKey="horas-extras" title={
                <span>
                  <FontAwesomeIcon icon={faBusinessTime} className="me-2" />
                  Reporte Horas Extras
                  <Badge bg="warning" className="ms-2">{reporteHorasExtras.length}</Badge>
                </span>
              }>
                <div className="p-3">
                  {renderFilters()}
                  <Card className="mb-3 shadow-sm border-0">
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
                            <h4 className="text-success">
                              {reporteHorasExtras.reduce((sum, item) => {
                                const horas = typeof item.HorasSolicitadas === 'string'
                                  ? parseFloat(item.HorasSolicitadas)
                                  : (item.HorasSolicitadas || 0);
                                return sum + horas;
                              }, 0).toFixed(1)}
                            </h4>
                            <small className="text-muted">Horas Totales</small>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="text-center">
                            <h4 className="text-success">
                              {reporteHorasExtras.filter(item => item.Estado === 'aprobada').length}
                            </h4>
                            <small className="text-muted">Aprobadas</small>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="text-center">
                            <h4 className="text-warning">
                              {reporteHorasExtras.filter(item => item.Estado === 'pendiente').length}
                            </h4>
                            <small className="text-muted">Pendientes</small>
                          </div>
                        </Col>
                        <Col md={2}>
                          <div className="text-center">
                            <h4 className="text-danger">
                              {reporteHorasExtras.filter(item => item.Estado === 'rechazada').length}
                            </h4>
                            <small className="text-muted">Rechazadas</small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  <Card className="shadow-sm border-0 mb-3">
                    <Card.Body className="p-0">
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <div>
                          <h6 className="mb-0">
                            <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                            Búsqueda
                          </h6>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              exportToExcel(
                                filteredReporteHorasExtras.map(item => ({
                                  Colaborador: item.EmpleadoNombre,
                                  Fecha: formatDateDisplay(item.FechaInicio),
                                  Horas: item.HorasSolicitadas,
                                  Motivo: item.Motivo,
                                  Estado: item.Estado,
                                  Puesto: item.PuestoNombre || ''
                                })),
                                'horas_extras'
                              );
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faDownload} className="me-1" />
                            Excel
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              exportToPDF(filteredReporteHorasExtras, columnsHorasExtras, 'horas_extras');
                            }}
                            className="hover-bg-soft"
                          >
                            <FontAwesomeIcon icon={faPrint} className="me-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <FilterComponent
                          filterText={filterTextHorasExtras}
                          onFilter={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTextHorasExtras(e.target.value)}
                          onClear={() => setFilterTextHorasExtras('')}
                          placeholder="Buscar por colaborador, motivo, puesto..."
                        />
                      </div>
                    </Card.Body>
                  </Card>
                  <Card className="shadow-sm border-0">
                    <Card.Body className="p-0">
                      {loading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-3 text-muted">Cargando reporte de horas extras...</p>
                        </div>
                      ) : filteredReporteHorasExtras.length === 0 ? (
                        <div className="text-center py-5">
                          <FontAwesomeIcon icon={faBusinessTime} size="3x" className="text-muted mb-3" />
                          <h5>No hay horas extras registradas</h5>
                          <p className="text-muted">
                            {filterTextHorasExtras
                              ? 'No se encontraron resultados para tu búsqueda'
                              : 'No hay solicitudes de horas extras en el periodo seleccionado'}
                          </p>
                        </div>
                      ) : (
                        <DataTable
                          columns={columnsHorasExtras}
                          data={filteredReporteHorasExtras}
                          pagination
                          paginationPerPage={perPageHorasExtras}
                          paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
                          onChangeRowsPerPage={(newPerPage) => setPerPageHorasExtras(newPerPage)}
                          highlightOnHover
                          pointerOnHover
                          responsive
                          customStyles={customStyles}
                          progressPending={loading}
                          progressComponent={
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-3 text-muted">Cargando datos...</p>
                            </div>
                          }
                          sortIcon={<FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />}
                          noDataComponent={
                            <div className="text-center py-5">
                              <FontAwesomeIcon icon={faBusinessTime} size="3x" className="text-muted mb-3" />
                              <h5>No hay horas extras registradas</h5>
                              <p className="text-muted">No se encontraron registros de horas extras</p>
                            </div>
                          }
                        />
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>

      {/* ===== MODALES ===== */}

      <Modal show={showVacacionesModal} onHide={() => setShowVacacionesModal(false)} size="lg" centered>
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
          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            <strong>Importante:</strong> Solo se cuentan días hábiles (lunes a viernes).
            Si seleccionas un fin de semana, se ajustará automáticamente al siguiente día hábil.
            Si la fecha fin es anterior a la fecha inicio, se intercambiarán automáticamente.
          </Alert>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formatDateForInput(vacacionesData.fechaInicio)}
                    onChange={handleFechaInicioInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={estadisticasVacaciones?.disponibles <= 0}
                    required
                  />
                  {vacacionesData.fechaInicio && esFinDeSemana(vacacionesData.fechaInicio) && (
                    <Form.Text className="text-warning">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                      Se ajustará a {obtenerDiaHabilMasCercano(vacacionesData.fechaInicio)}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Fin *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formatDateForInput(vacacionesData.fechaFin)}
                    onChange={handleFechaFinInputChange}
                    min={vacacionesData.fechaInicio || new Date().toISOString().split('T')[0]}
                    disabled={estadisticasVacaciones?.disponibles <= 0 || !vacacionesData.fechaInicio}
                    required
                  />
                  {vacacionesData.fechaFin && esFinDeSemana(vacacionesData.fechaFin) && (
                    <Form.Text className="text-warning">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                      Se ajustará a {obtenerDiaHabilMasCercano(vacacionesData.fechaFin)}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Motivo *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={vacacionesData.motivo}
                onChange={(e) => setVacacionesData({ ...vacacionesData, motivo: e.target.value })}
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
                onChange={(e) => setVacacionesData({ ...vacacionesData, observaciones: e.target.value })}
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
                <strong>Días hábiles solicitados:</strong> {calcularDiasSolicitados()} días
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

      <Modal show={showPermisoModal} onHide={() => setShowPermisoModal(false)} centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
            Solicitar Permiso
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            <strong>Importante:</strong> Los permisos solo pueden solicitarse en días hábiles (lunes a viernes)
            y con al menos 24 horas de anticipación. La fecha mínima permitida es <strong>{calcularFechaMinimaPermiso()}</strong>.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha *</Form.Label>
              <Form.Control
                type="date"
                value={formatDateForInput(permisoData.fechaInicio)}
                onChange={handleFechaPermisoInputChange}
                min={calcularFechaMinimaPermiso()}
                required
              />
              {permisoData.fechaInicio && esFinDeSemana(permisoData.fechaInicio) && (
                <Form.Text className="text-warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                  Se ajustará a {obtenerDiaHabilMasCercano(permisoData.fechaInicio)}
                </Form.Text>
              )}
              <Form.Text className="text-muted d-block">
                Los permisos deben solicitarse con al menos 24 horas de anticipación en días hábiles
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Motivo *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={permisoData.motivo}
                onChange={(e) => setPermisoData({ ...permisoData, motivo: e.target.value })}
                placeholder="Describe el motivo de tu permiso..."
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Con goce de sueldo"
                checked={permisoData.conGoce}
                onChange={(e) => setPermisoData({ ...permisoData, conGoce: e.target.checked })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observaciones (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={permisoData.observaciones}
                onChange={(e) => setPermisoData({ ...permisoData, observaciones: e.target.value })}
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
              !tiene24HorasAnticipacion(permisoData.fechaInicio)
            }
          >
            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
            Enviar Solicitud
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showHorasExtrasModal} onHide={() => setShowHorasExtrasModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FontAwesomeIcon icon={faClock} className="me-2" />
            Solicitar Horas Extras
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            <strong>Importante:</strong> Las horas extras solo pueden solicitarse en días hábiles (lunes a viernes).
            Si seleccionas un fin de semana, se ajustará automáticamente al siguiente día hábil.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Colaborador *</Form.Label>
              <Form.Select
                value={horasExtrasData.empleadoId}
                onChange={(e) => setHorasExtrasData({ ...horasExtrasData, empleadoId: e.target.value })}
                required
              >
                <option value="">Seleccionar colaborador</option>
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
                value={formatDateForInput(horasExtrasData.fechaInicio)}
                onChange={handleFechaHorasExtrasInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {horasExtrasData.fechaInicio && esFinDeSemana(horasExtrasData.fechaInicio) && (
                <Form.Text className="text-warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                  Se ajustará a {obtenerDiaHabilMasCercano(horasExtrasData.fechaInicio)}
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Horas Solicitadas *</Form.Label>
              <Form.Control
                type="number"
                value={horasExtrasData.horasSolicitadas}
                onChange={(e) => setHorasExtrasData({ ...horasExtrasData, horasSolicitadas: e.target.value })}
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
                onChange={(e) => setHorasExtrasData({ ...horasExtrasData, motivo: e.target.value })}
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
                onChange={(e) => setHorasExtrasData({ ...horasExtrasData, observaciones: e.target.value })}
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
              <div className="text-center mb-4">
                <FontAwesomeIcon
                  icon={selectedAprobacion.Tipo === 'vacaciones' ? faCalendarDay :
                    selectedAprobacion.Tipo === 'permiso' ? faCalendarCheck : faClock}
                  size="3x"
                  className={`mb-3 ${selectedAprobacion.Tipo === 'vacaciones' ? 'text-primary' :
                    selectedAprobacion.Tipo === 'permiso' ? 'text-info' : 'text-warning'}`}
                />
                <h4>{selectedAprobacion.EmpleadoNombre}</h4>
                <div className="mb-3">
                  {getTipoBadge(selectedAprobacion.Tipo)}
                  {' '}
                  <Badge bg="secondary">Orden {selectedAprobacion.OrdenAprobacion}°</Badge>
                </div>
              </div>
              {getDetalleSolicitud(selectedAprobacion)}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Información de la Solicitud
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-2">
                      <small className="text-muted d-block">Fecha de solicitud</small>
                      <strong>{formatDateTimeDisplay(selectedAprobacion.FechaSolicitud)}</strong>
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
                    onChange={(e) => setAprobacionData({ ...aprobacionData, comentarios: e.target.value })}
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
                      ? 'Puedes dejar comentarios sobre tu aprobación para el colaborador.'
                      : 'Es importante explicar el motivo del rechazo para que el colaborador pueda corregir su solicitud.'}
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
              onClick={() => setAprobacionData(prev => ({ ...prev, estado: 'aprobada' }))}
              active={aprobacionData.estado === 'aprobada'}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Aprobar
            </Button>
            <Button
              variant="danger"
              onClick={() => setAprobacionData(prev => ({ ...prev, estado: 'rechazado' }))}
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
              (aprobacionData.estado === 'rechazado' && (!aprobacionData.comentarios || aprobacionData.comentarios.trim().length < 5))
            }
          >
            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
            Confirmar {aprobacionData.estado === 'aprobada' ? 'Aprobación' : 'Rechazo'}
          </Button>
        </Modal.Footer>
      </Modal>

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
              <div className="text-center mb-4">
                <h4>{selectedAprobacion.EmpleadoNombre}</h4>
                <div className="mb-3">
                  {getTipoBadge(selectedAprobacion.Tipo)}
                </div>
              </div>
              {getDetalleSolicitud(selectedAprobacion)}
              <Card className="mb-3">
                <Card.Body>
                  <p className="mb-2"><strong>Motivo:</strong> {selectedAprobacion.Motivo}</p>
                  <p className="mb-0 text-muted small">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    Solicitado el {formatDateTimeDisplay(selectedAprobacion.FechaSolicitud)}
                  </p>
                </Card.Body>
              </Card>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nueva Decisión *</Form.Label>
                  <Form.Select
                    value={editAprobacionData.estado}
                    onChange={(e) => setEditAprobacionData({ ...editAprobacionData, estado: e.target.value })}
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
                    onChange={(e) => setEditAprobacionData({ ...editAprobacionData, comentarios: e.target.value })}
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

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" scrollable centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
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
                  className={`mb-3 ${selectedSolicitud.Tipo === 'vacaciones' ? 'text-primary' :
                    selectedSolicitud.Tipo === 'permiso' ? 'text-info' : 'text-warning'}`}
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
                          <span>{formatDateTimeDisplay(selectedSolicitud.FechaSolicitud)}</span>
                        </div>
                      </ListGroup.Item>
                      {selectedSolicitud.Tipo === 'vacaciones' && (
                        <>
                          {selectedSolicitud.FechaInicio && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalendarPlus} className="me-2" /> Fecha Inicio:</strong>
                                <span>{formatDateDisplay(selectedSolicitud.FechaInicio)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          {selectedSolicitud.FechaFin && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalendarMinus} className="me-2" /> Fecha Fin:</strong>
                                <span>{formatDateDisplay(selectedSolicitud.FechaFin)}</span>
                              </div>
                            </ListGroup.Item>
                          )}
                          {selectedSolicitud.DiasSolicitados && (
                            <ListGroup.Item>
                              <div className="d-flex justify-content-between">
                                <strong><FontAwesomeIcon icon={faCalculator} className="me-2" /> Días Hábiles Solicitados:</strong>
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
                                <span>{formatDateDisplay(selectedSolicitud.FechaInicio)}</span>
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
                                <span>{formatDateDisplay(selectedSolicitud.FechaInicio)}</span>
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
                                  {formatDateTimeDisplay(aprobacion.FechaAprobacion)}
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
                                {formatDateTimeDisplay(historial.createdAt)}
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