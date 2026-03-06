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
  Pagination,
  Tabs,
  Tab,
  ButtonGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  ListGroup,
  ProgressBar
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faProjectDiagram,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faSearch,
  faCalendar,
  faUser,
  faUsers,
  faTasks,
  faCheckCircle,
  faClock,
  faPauseCircle,
  faPlayCircle,
  faStopCircle,
  faFlag,
  faComment,
  faHistory,
  faUserTie,
  faUserCircle,
  faSync,
  faColumns,
  faList,
  faGripVertical,
  faUserPlus,
  faUserMinus,
  faSave,
  faChevronDown,
  faArrowRight,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faUserCheck,
  faUserSlash,
  faBuilding,
  faEnvelope,
  faBriefcase,
  faInfoCircle,
  faUserFriends,
  faPaperPlane,
  faLock,
  faCrown,
  faUndo,
  faChartLine,
  faTrophy,
  faMedal,
  faStar,
  faRedoAlt
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import { formatDateDisplay, formatDateTimeDisplay, formatDateForInput } from '../utils/dateUtils';

interface Proyecto {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  FechaInicio: string;
  FechaFin?: string;
  Estado: 'activo' | 'pausado' | 'finalizado';
  Presupuesto: number;
  MontoAsignado: number;
  Moneda: string;
  JefeProyectoID: number;
  JefeProyectoNombre?: string;
  JefeProyectoEmail?: string;
  CreadoPor: number;
  CreadorUsuario?: string;
  createdAt: string;
  updatedAt: string;
  Activo: boolean;
  TotalEmpleados?: number;
  TotalTareas?: number;
  TareasCompletadas?: number;
  estadisticas?: {
    total_tareas: number;
    tareas_completadas: number;
    total_empleados: number;
    tareas_pendientes: number;
    tareas_en_proceso: number;
  };
}

interface Tarea {
  ID: number;
  ProyectoID: number;
  Titulo: string;
  Descripcion?: string;
  Estado: 'pendiente' | 'en_proceso' | 'realizada';
  Prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  FechaVencimiento?: string;
  FechaCreacion: string;
  CreadoPor: number;
  CreadorUsuario?: string;
  createdAt: string;
  updatedAt: string;
  Activo: boolean;
  EmpleadoAsignadoID?: number | null;
  EmpleadoAsignadoNombre?: string | null;
  estadoAsignacion?: 'asignado' | 'sin_asignar';
  Asignaciones?: any[];
  Notas?: any[];
  JefeProyectoID?: number;
}

interface Empleado {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
  DepartamentoID?: number;
  FechaIngreso?: string;
  RFC?: string;
  CURP?: string;
  UsuarioActivo?: boolean;
}

interface EmpleadoProyecto extends Empleado {
  Rol: string;
  FechaAsignacion: string;
  TareasActivas: number;
  EstadoAsignacion: string;
  AsignadoPorUsuario?: string;
  tareasCompletadas?: number;
  tareasPendientes?: number;
  progreso?: number;
}

interface FiltrosEmpleados {
  busqueda: string;
  rol: string;
  departamento: string;
  page: number;
  limit: number;
}

interface ProgresoMiembro {
  empleadoId: number;
  nombre: string;
  rol: string;
  totalTareas: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  tareasEnProceso: number;
  progreso: number;
  puesto: string;
}

const Proyectos: React.FC = () => {
  const { user } = useAuth();
  
  const getUserRol = (): string | null => {
    if (!user) return null;
    return (user as any).rol || (user as any).Rol || 'employee';
  };
  
  const userRol = getUserRol();
  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  const isEmployee = userRol === 'employee';
  const canManage = isAdmin || isManager;
  const canManageProyectos = isAdmin || isManager;
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [empleadosProyecto, setEmpleadosProyecto] = useState<EmpleadoProyecto[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const itemsPerPage = 9;
  
  const [filtrosTareas, setFiltrosTareas] = useState({
    estado: '',
    prioridad: '',
    asignadoA: '',
    soloSinAsignar: false,
    search: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [loadingProyecto, setLoadingProyecto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [activeTab, setActiveTab] = useState('tareas');
  const [refreshing, setRefreshing] = useState<{[key: string]: boolean}>({});
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showReasignarTareaModal, setShowReasignarTareaModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  
  const [showAsignarEmpleadoModal, setShowAsignarEmpleadoModal] = useState(false);
  const [showQuitarEmpleadoModal, setShowQuitarEmpleadoModal] = useState(false);
  const [showSeleccionarJefeModal, setShowSeleccionarJefeModal] = useState(false);
  
  const [isEditingTarea, setIsEditingTarea] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoProyecto | null>(null);
  
  const [miEmpleadoId, setMiEmpleadoId] = useState<number | null>(null);
  
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState<Empleado[]>([]);
  const [filtrosJefe, setFiltrosJefe] = useState<FiltrosEmpleados>({
    busqueda: '',
    rol: '',
    departamento: '',
    page: 1,
    limit: 10
  });
  const [totalJefePages, setTotalJefePages] = useState(1);
  const [loadingJefe, setLoadingJefe] = useState(false);
  
  const [empleadosParaAsignar, setEmpleadosParaAsignar] = useState<Empleado[]>([]);
  const [filtrosAsignar, setFiltrosAsignar] = useState<FiltrosEmpleados>({
    busqueda: '',
    rol: '',
    departamento: '',
    page: 1,
    limit: 10
  });
  const [totalAsignarPages, setTotalAsignarPages] = useState(1);
  const [loadingAsignar, setLoadingAsignar] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState<'supervisados' | 'todos'>('todos');
  
  const [progresoGeneral, setProgresoGeneral] = useState({
    totalTareas: 0,
    completadas: 0,
    pendientes: 0,
    enProceso: 0,
    porcentaje: 0
  });
  const [progresoMiembros, setProgresoMiembros] = useState<ProgresoMiembro[]>([]);
  
  const [createData, setCreateData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    presupuesto: 0,
    montoAsignado: 0,
    moneda: 'MXN',
    estado: 'activo' as 'activo' | 'pausado' | 'finalizado',
    jefeProyectoId: 0,
    jefeProyectoNombre: ''
  });
  
  const [editData, setEditData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    presupuesto: 0,
    montoAsignado: 0,
    estado: 'activo' as 'activo' | 'pausado' | 'finalizado'
  });
  
  const [tareaData, setTareaData] = useState({
    titulo: '',
    descripcion: '',
    fechaVencimiento: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta' | 'urgente',
    estado: 'pendiente' as 'pendiente' | 'en_proceso' | 'realizada',
    empleadoId: null as number | null
  });
  
  const [reasignarData, setReasignarData] = useState({
    empleadoId: null as number | null
  });
  
  const [notaData, setNotaData] = useState({
    contenido: '',
    esPrivada: false
  });
  
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
  
  const soyAsignadoATarea = useCallback((tarea: Tarea): boolean => {
    if (!miEmpleadoId) return false;
    return tarea.EmpleadoAsignadoID === miEmpleadoId && tarea.estadoAsignacion === 'asignado';
  }, [miEmpleadoId]);
  
  const soyJefeDelProyecto = useCallback((): boolean => {
    if (!selectedProyecto || !miEmpleadoId) return false;
    return selectedProyecto.JefeProyectoID === miEmpleadoId;
  }, [selectedProyecto, miEmpleadoId]);
  
  // ==================== FUNCIONES DE PERMISOS ====================
  
  const puedeEditarTarea = useCallback((tarea: Tarea): boolean => {
    // Admin siempre puede editar
    if (isAdmin) return true;
    
    // Jefe del proyecto puede editar cualquier tarea
    if (soyJefeDelProyecto()) return true;
    
    // Usuario asignado a la tarea puede editar
    if (miEmpleadoId && tarea.EmpleadoAsignadoID === miEmpleadoId) return true;
    
    // Tarea sin asignar puede ser editada por cualquiera con acceso al proyecto
    if (!tarea.EmpleadoAsignadoID) return true;
    
    return false;
  }, [isAdmin, soyJefeDelProyecto, miEmpleadoId]);

  const puedeCambiarEstadoTarea = useCallback((tarea: Tarea): boolean => {
    // Admin siempre puede cambiar estado
    if (isAdmin) return true;
    
    // Jefe del proyecto puede cambiar estado de cualquier tarea
    if (soyJefeDelProyecto()) return true;
    
    // Usuario asignado a la tarea puede cambiar su estado
    if (miEmpleadoId && tarea.EmpleadoAsignadoID === miEmpleadoId) return true;
    
    // Tarea sin asignar puede ser cambiada por cualquiera con acceso al proyecto
    if (!tarea.EmpleadoAsignadoID) return true;
    
    return false;
  }, [isAdmin, soyJefeDelProyecto, miEmpleadoId]);

const puedeReasignarTarea = useCallback((tarea?: Tarea): boolean => {
  // Admin siempre puede reasignar
  if (isAdmin) return true;
  
  // Jefe del proyecto puede reasignar cualquier tarea
  if (soyJefeDelProyecto()) return true;
  
  // Empleado asignado a la tarea puede reasignarla a otro
  if (tarea && miEmpleadoId && tarea.EmpleadoAsignadoID === miEmpleadoId) return true;
  
  return false;
}, [isAdmin, soyJefeDelProyecto, miEmpleadoId]);

  const puedeEliminarTarea = useCallback((): boolean => {
    // Solo admin o jefe del proyecto pueden eliminar tareas
    return isAdmin || soyJefeDelProyecto();
  }, [isAdmin, soyJefeDelProyecto]);
  
  const puedeAsignarEmpleado = useCallback((): boolean => {
    // Solo admin o jefe del proyecto pueden asignar empleados al proyecto
    return isAdmin || soyJefeDelProyecto();
  }, [isAdmin, soyJefeDelProyecto]);
  
  // ==================== FUNCIONES DE CARGA ====================
  
  const refreshSection = async (section: string, projectId?: number) => {
    setRefreshing(prev => ({ ...prev, [section]: true }));
    try {
      switch(section) {
        case 'proyectos':
          await loadProyectos();
          break;
        case 'proyecto':
          if (projectId) await loadProyecto(projectId);
          break;
        case 'tareas':
          if (selectedProyecto) await loadTareas(selectedProyecto.ID, filtrosTareas);
          break;
        case 'empleados':
          if (selectedProyecto) await loadEmpleadosProyecto(selectedProyecto.ID);
          break;
        case 'historial':
          if (selectedProyecto) await loadHistorial(selectedProyecto.ID);
          break;
        case 'todo':
          if (selectedProyecto) {
            await Promise.all([
              loadTareas(selectedProyecto.ID, filtrosTareas),
              loadEmpleadosProyecto(selectedProyecto.ID),
              loadHistorial(selectedProyecto.ID)
            ]);
          }
          break;
      }
    } finally {
      setRefreshing(prev => ({ ...prev, [section]: false }));
    }
  };
  
  const loadProyectos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterEstado) params.append('estado', filterEstado);
      
      const response = await api.get(`/proyectos?${params}`);
      
      if (response.data.success) {
        setProyectos(response.data.data.proyectos || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando proyectos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterEstado]);

  const loadProyecto = async (id: number) => {
    try {
      const response = await api.get(`/proyectos/${id}`);
      if (response.data.success) {
        setSelectedProyecto(response.data.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando proyecto');
    }
  };

  const loadTareas = async (proyectoId: number, filtros?: any) => {
    try {
      setLoadingTareas(true);
      
      const params = new URLSearchParams();
      const filtrosActuales = filtros || filtrosTareas;
      
      if (filtrosActuales.estado) params.append('estado', filtrosActuales.estado);
      if (filtrosActuales.prioridad) params.append('prioridad', filtrosActuales.prioridad);
      if (filtrosActuales.asignadoA) params.append('asignadoA', filtrosActuales.asignadoA);
      if (filtrosActuales.soloSinAsignar) params.append('soloSinAsignar', 'true');
      if (filtrosActuales.search) params.append('search', filtrosActuales.search);
      
      const response = await api.get(`/proyectos/${proyectoId}/tareas?${params}`);
      
      if (response.data.success) {
        const tareasConDatos = (response.data.data.tareas || []).map((t: any) => ({
          ...t,
          EmpleadoAsignadoID: t.EmpleadoAsignadoID || null,
          EmpleadoAsignadoNombre: t.EmpleadoAsignadoNombre || null,
          estadoAsignacion: t.estadoAsignacion || (t.EmpleadoAsignadoID ? 'asignado' : 'sin_asignar'),
          Prioridad: t.Prioridad || 'media',
          Asignaciones: t.Asignaciones || [],
          Notas: t.Notas || [],
          Activo: true
        }));
        
        setTareas(tareasConDatos);
        
        if (empleadosProyecto.length > 0) {
          calcularProgreso(tareasConDatos, empleadosProyecto);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando tareas');
    } finally {
      setLoadingTareas(false);
    }
  };

  const loadEmpleadosProyecto = async (proyectoId: number) => {
    try {
      setLoadingEmpleados(true);
      const response = await api.get(`/proyectos/${proyectoId}/empleados`);
      
      if (response.data.success) {
        const empleados = response.data.data || [];
        setEmpleadosProyecto(empleados);
        
        if (tareas.length > 0) {
          calcularProgreso(tareas, empleados);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const loadHistorial = async (proyectoId: number) => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}/historial`);
      if (response.data.success) {
        setHistorial(response.data.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando historial');
    }
  };

  const loadNotas = async (proyectoId: number, tareaId: number) => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}/tareas/${tareaId}/notas`);
      if (response.data.success) {
        setNotas(response.data.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando notas');
    }
  };
  
  const calcularProgreso = (tareasList: Tarea[], empleadosList: EmpleadoProyecto[]) => {
    const total = tareasList.length;
    const completadas = tareasList.filter(t => t.Estado === 'realizada').length;
    const pendientes = tareasList.filter(t => t.Estado === 'pendiente').length;
    const enProceso = tareasList.filter(t => t.Estado === 'en_proceso').length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    setProgresoGeneral({
      totalTareas: total,
      completadas,
      pendientes,
      enProceso,
      porcentaje
    });
    
    const progreso: ProgresoMiembro[] = [];
    
    empleadosList.forEach(emp => {
      const tareasEmpleado = tareasList.filter(t => t.EmpleadoAsignadoID === emp.ID);
      const totalEmp = tareasEmpleado.length;
      const completadasEmp = tareasEmpleado.filter(t => t.Estado === 'realizada').length;
      const pendientesEmp = tareasEmpleado.filter(t => t.Estado === 'pendiente').length;
      const enProcesoEmp = tareasEmpleado.filter(t => t.Estado === 'en_proceso').length;
      const progresoEmp = totalEmp > 0 ? Math.round((completadasEmp / totalEmp) * 100) : 0;
      
      progreso.push({
        empleadoId: emp.ID,
        nombre: emp.NombreCompleto,
        rol: emp.Rol || emp.RolApp,
        totalTareas: totalEmp,
        tareasCompletadas: completadasEmp,
        tareasPendientes: pendientesEmp,
        tareasEnProceso: enProcesoEmp,
        progreso: progresoEmp,
        puesto: emp.PuestoNombre || 'Sin puesto'
      });
    });
    
    progreso.sort((a, b) => b.progreso - a.progreso);
    setProgresoMiembros(progreso);
  };

  const loadEmpleadosParaAsignar = async (filtros?: Partial<FiltrosEmpleados>, modo: 'supervisados' | 'todos' = 'todos') => {
    if (!selectedProyecto) return;
    
    try {
      setLoadingAsignar(true);
      
      const params = new URLSearchParams();
      const filtrosActuales = { ...filtrosAsignar, ...filtros };
      
      if (filtrosActuales.busqueda) params.append('search', filtrosActuales.busqueda);
      if (filtrosActuales.rol) params.append('rol', filtrosActuales.rol);
      if (filtrosActuales.departamento) params.append('departamentoId', filtrosActuales.departamento);
      params.append('page', filtrosActuales.page.toString());
      params.append('limit', filtrosActuales.limit.toString());
      params.append('modo', modo);
      
      const response = await api.get(`/proyectos/${selectedProyecto.ID}/empleados/disponibles?${params}`);
      
      if (response.data.success) {
        setEmpleadosParaAsignar(response.data.data.empleados || []);
        setTotalAsignarPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando empleados disponibles');
    } finally {
      setLoadingAsignar(false);
    }
  };

  const loadEmpleadosParaJefe = async (filtros?: Partial<FiltrosEmpleados>) => {
    try {
      setLoadingJefe(true);
      
      const params = new URLSearchParams();
      const filtrosActuales = { ...filtrosJefe, ...filtros };
      
      if (filtrosActuales.busqueda) params.append('search', filtrosActuales.busqueda);
      if (filtrosActuales.rol) params.append('rol', filtrosActuales.rol);
      if (filtrosActuales.departamento) params.append('departamentoId', filtrosActuales.departamento);
      params.append('page', filtrosActuales.page.toString());
      params.append('limit', filtrosActuales.limit.toString());
      
      const response = await api.get(`/empleados/empleados?${params}`);
      
      if (response.data.success) {
        setEmpleadosDisponibles(response.data.data.empleados || []);
        setTotalJefePages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando empleados');
    } finally {
      setLoadingJefe(false);
    }
  };
  
  useEffect(() => {
    loadProyectos();
  }, [loadProyectos]);

  useEffect(() => {
    const cargarEmpleadoId = async () => {
      const empleadoId = await obtenerEmpleadoId();
      if (empleadoId) setMiEmpleadoId(empleadoId);
    };
  
    cargarEmpleadoId();
  }, [obtenerEmpleadoId]);

  useEffect(() => {
    if (selectedProyecto) {
      const loadData = async () => {
        setLoadingProyecto(true);
        try {
          await Promise.all([
            loadTareas(selectedProyecto.ID, filtrosTareas),
            loadEmpleadosProyecto(selectedProyecto.ID),
            loadHistorial(selectedProyecto.ID)
          ]);
        } finally {
          setLoadingProyecto(false);
        }
      };
      
      loadData();
    }
  }, [selectedProyecto]);

  useEffect(() => {
    if (showSeleccionarJefeModal) loadEmpleadosParaJefe();
  }, [showSeleccionarJefeModal]);

  useEffect(() => {
    if (showAsignarEmpleadoModal && selectedProyecto) {
      loadEmpleadosParaAsignar({}, modoSeleccion);
    }
  }, [showAsignarEmpleadoModal, selectedProyecto, modoSeleccion]);
  
  // ==================== FUNCIONES DE ACCIÓN ====================
  
  const handleCreateProyecto = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!createData.nombre || !createData.fechaInicio || !createData.presupuesto || !createData.jefeProyectoId) {
        setError('Nombre, fecha de inicio, presupuesto y jefe de proyecto son requeridos');
        return;
      }

      const response = await api.post('/proyectos', {
        nombre: createData.nombre,
        descripcion: createData.descripcion,
        fechaInicio: createData.fechaInicio,
        fechaFin: createData.fechaFin || null,
        presupuesto: createData.presupuesto,
        montoAsignado: createData.montoAsignado,
        moneda: createData.moneda,
        estado: createData.estado,
        jefeProyectoId: createData.jefeProyectoId
      });
      
      if (response.data.success) {
        setSuccess('Proyecto creado exitosamente');
        setShowCreateModal(false);
        resetCreateForm();
        await loadProyectos();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creando proyecto');
    }
  };

  const handleUpdateProyecto = async () => {
    if (!selectedProyecto) return;
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.put(`/proyectos/${selectedProyecto.ID}`, editData);
      
      if (response.data.success) {
        setSuccess('Proyecto actualizado exitosamente');
        setShowEditModal(false);
        await loadProyecto(selectedProyecto.ID);
        await refreshSection('todo', selectedProyecto.ID);
        await loadProyectos();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error actualizando proyecto');
    }
  };

  const handleDeleteProyecto = async () => {
    if (!selectedProyecto) return;
    
    const empleadoId = await obtenerEmpleadoId();
    if (!empleadoId) {
      setError('No se pudo verificar tu identidad');
      return;
    }
    
    const esJefeProyecto = selectedProyecto.JefeProyectoID === empleadoId;
    
    if (!isAdmin && !esJefeProyecto) {
      setError('Solo el administrador o el jefe del proyecto pueden eliminar el proyecto');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.delete(`/proyectos/${selectedProyecto.ID}`);
      
      if (response.data.success) {
        setSuccess('Proyecto eliminado exitosamente');
        setShowDeleteModal(false);
        setShowViewModal(false);
        await loadProyectos();
        setSelectedProyecto(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando proyecto');
    }
  };

  const handleCambiarEstadoProyecto = async (proyectoId: number, estado: 'activo' | 'pausado' | 'finalizado') => {
    try {
      const response = await api.patch(`/proyectos/${proyectoId}/estado`, { estado });
      
      if (response.data.success) {
        setSuccess(`Estado del proyecto cambiado a: ${estado}`);
        await loadProyectos();
        if (selectedProyecto?.ID === proyectoId) {
          await refreshSection('todo', proyectoId);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cambiando estado');
    }
  };
  
  const handleAsignarEmpleado = async (empleadoId: number) => {
    if (!selectedProyecto) return;
    
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para asignar empleados');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.post(`/proyectos/${selectedProyecto.ID}/empleados`, {
        empleadoId
      });
      
      if (response.data.success) {
        setSuccess('Empleado asignado al proyecto exitosamente');
        setShowAsignarEmpleadoModal(false);
        
        await Promise.all([
          loadEmpleadosProyecto(selectedProyecto.ID),
          loadTareas(selectedProyecto.ID)
        ]);
        
        setEmpleadosParaAsignar([]);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error asignando empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarEmpleado = async () => {
    if (!selectedProyecto || !selectedEmpleado) return;
    
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para quitar empleados');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.delete(`/proyectos/${selectedProyecto.ID}/empleados/${selectedEmpleado.ID}`);
      
      if (response.data.success) {
        setSuccess('Empleado removido del proyecto exitosamente');
        setShowQuitarEmpleadoModal(false);
        
        await Promise.all([
          loadEmpleadosProyecto(selectedProyecto.ID),
          loadTareas(selectedProyecto.ID)
        ]);
        
        setSelectedEmpleado(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error removiendo empleado');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCrearTarea = async () => {
    if (!selectedProyecto) return;
    
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para crear tareas');
      return;
    }
    
    try {
      setError('');
      
      if (!tareaData.titulo) {
        setError('El título es requerido');
        return;
      }

      const dataToSend = {
        titulo: tareaData.titulo,
        descripcion: tareaData.descripcion || null,
        fechaVencimiento: tareaData.fechaVencimiento || null,
        prioridad: tareaData.prioridad,
        estado: tareaData.estado,
        empleadoId: tareaData.empleadoId || null
      };

      const response = await api.post(`/proyectos/${selectedProyecto.ID}/tareas`, dataToSend);
      
      if (response.data.success) {
        setSuccess(tareaData.empleadoId 
          ? 'Tarea creada y asignada exitosamente' 
          : 'Tarea creada exitosamente (sin asignar)'
        );
        setShowTareaModal(false);
        await loadTareas(selectedProyecto.ID);
        await loadEmpleadosProyecto(selectedProyecto.ID);
        resetTareaForm();
        setIsEditingTarea(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creando tarea');
    }
  };

  const handleActualizarTarea = async () => {
    if (!selectedProyecto || !selectedTarea) return;
    
    if (!puedeEditarTarea(selectedTarea)) {
      setError('No tienes permiso para editar esta tarea');
      return;
    }
    
    try {
      setError('');
      
      if (!tareaData.titulo) {
        setError('El título es requerido');
        return;
      }

      const response = await api.put(
        `/proyectos/${selectedProyecto.ID}/tareas/${selectedTarea.ID}`, 
        {
          titulo: tareaData.titulo,
          descripcion: tareaData.descripcion || null,
          fechaVencimiento: tareaData.fechaVencimiento || null,
          prioridad: tareaData.prioridad
        }
      );
      
      if (response.data.success) {
        setSuccess('Tarea actualizada exitosamente');
        setShowTareaModal(false);
        await loadTareas(selectedProyecto.ID);
        resetTareaForm();
        setIsEditingTarea(false);
        setSelectedTarea(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error actualizando tarea');
    }
  };

  const handleCambiarEstadoTarea = async (tareaId: number, estado: 'pendiente' | 'en_proceso' | 'realizada') => {
    if (!selectedProyecto) return;
    
    if (!miEmpleadoId) {
      const empleadoId = await obtenerEmpleadoId();
      if (!empleadoId) {
        setError('No se pudo verificar tu identidad');
        return;
      }
      setMiEmpleadoId(empleadoId);
    }
    
    const tarea = tareas.find(t => t.ID === tareaId);
    if (!tarea) {
      setError('No se pudo encontrar la tarea');
      return;
    }
    
    if (!puedeCambiarEstadoTarea(tarea)) {
      setError('No tienes permisos para cambiar el estado de esta tarea');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.patch(
        `/proyectos/${selectedProyecto.ID}/tareas/${tareaId}/estado`, 
        { estado }
      );
      
      if (response.data.success) {
        setSuccess(`Estado de tarea cambiado a: ${estado}`);
        await loadTareas(selectedProyecto.ID, filtrosTareas);
        await loadEmpleadosProyecto(selectedProyecto.ID);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'No tienes permiso para cambiar el estado de esta tarea');
      } else {
        setError(error.response?.data?.message || 'Error cambiando estado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReasignarTarea = async () => {
    if (!selectedProyecto || !selectedTarea) return;
    
    if (!puedeReasignarTarea()) {
      setError('Solo el administrador o el jefe del proyecto pueden reasignar tareas');
      return;
    }
    
    try {
      setLoading(true);
      
      const payload = { empleadoId: reasignarData.empleadoId };
      
      const response = await api.patch(
        `/proyectos/${selectedProyecto.ID}/tareas/${selectedTarea.ID}/reasignar`,
        payload
      );
      
      if (response.data.success) {
        setSuccess(reasignarData.empleadoId 
          ? 'Tarea reasignada exitosamente' 
          : 'Tarea desasignada (sin asignar)'
        );
        setShowReasignarTareaModal(false);
        await loadTareas(selectedProyecto.ID, filtrosTareas);
        await loadEmpleadosProyecto(selectedProyecto.ID);
        setReasignarData({ empleadoId: null });
        setSelectedTarea(null);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error reasignando tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTarea = async (tareaId: number) => {
    if (!selectedProyecto) return;
    
    if (!puedeEliminarTarea()) {
      setError('Solo el administrador o el jefe del proyecto pueden eliminar tareas');
      return;
    }
    
    if (!window.confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.delete(
        `/proyectos/${selectedProyecto.ID}/tareas/${tareaId}`
      );
      
      if (response.data.success) {
        setSuccess('Tarea eliminada exitosamente');
        await loadTareas(selectedProyecto.ID, filtrosTareas);
        await loadEmpleadosProyecto(selectedProyecto.ID);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando tarea');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCrearNota = async (tareaId: number) => {
    if (!selectedProyecto || !selectedTarea) return;
    
    try {
      setError('');
      
      if (!notaData.contenido.trim()) {
        setError('El contenido de la nota es requerido');
        return;
      }

      const response = await api.post(
        `/proyectos/${selectedProyecto.ID}/tareas/${tareaId}/notas`,
        notaData
      );
      
      if (response.data.success) {
        setSuccess('Nota creada exitosamente');
        await loadNotas(selectedProyecto.ID, tareaId);
        await loadTareas(selectedProyecto.ID, filtrosTareas);
        resetNotaForm();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creando nota');
    }
  };
  
  const resetCreateForm = () => {
    setCreateData({
      nombre: '',
      descripcion: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      presupuesto: 0,
      montoAsignado: 0,
      moneda: 'MXN',
      estado: 'activo',
      jefeProyectoId: 0,
      jefeProyectoNombre: ''
    });
  };

  const resetTareaForm = () => {
    setTareaData({
      titulo: '',
      descripcion: '',
      fechaVencimiento: '',
      prioridad: 'media',
      estado: 'pendiente',
      empleadoId: null
    });
  };

  const resetNotaForm = () => {
    setNotaData({
      contenido: '',
      esPrivada: false
    });
  };

  const resetFiltrosJefe = () => {
    setFiltrosJefe({
      busqueda: '',
      rol: '',
      departamento: '',
      page: 1,
      limit: 10
    });
  };

  const resetFiltrosAsignar = () => {
    setFiltrosAsignar({
      busqueda: '',
      rol: '',
      departamento: '',
      page: 1,
      limit: 10
    });
  };

  const openProyecto = async (proyecto: Proyecto) => {
    await obtenerEmpleadoId();
    setSelectedProyecto(proyecto);
    setShowViewModal(true);
    setActiveTab('tareas');
  };

  const openEditProyecto = (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    
    setEditData({
      nombre: proyecto.Nombre,
      descripcion: proyecto.Descripcion || '',
      fechaInicio: formatDateForInput(proyecto.FechaInicio),
      fechaFin: formatDateForInput(proyecto.FechaFin),
      presupuesto: proyecto.Presupuesto,
      montoAsignado: proyecto.MontoAsignado,
      estado: proyecto.Estado
    });
    setShowEditModal(true);
  };

  const openDeleteProyecto = (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setShowDeleteModal(true);
  };

  const openSeleccionarJefeModal = () => {
    resetFiltrosJefe();
    loadEmpleadosParaJefe();
    setShowSeleccionarJefeModal(true);
  };

  const seleccionarJefe = (empleado: Empleado) => {
    setCreateData({
      ...createData,
      jefeProyectoId: empleado.ID,
      jefeProyectoNombre: empleado.NombreCompleto
    });
    setShowSeleccionarJefeModal(false);
  };

  const openAsignarEmpleadoModal = (modo: 'supervisados' | 'todos' = 'todos') => {
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para asignar empleados');
      return;
    }
    resetFiltrosAsignar();
    setModoSeleccion(modo);
    loadEmpleadosParaAsignar({}, modo);
    setShowAsignarEmpleadoModal(true);
  };

  const openQuitarEmpleadoModal = (empleado: EmpleadoProyecto) => {
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para quitar empleados');
      return;
    }
    setSelectedEmpleado(empleado);
    setShowQuitarEmpleadoModal(true);
  };

  const aplicarFiltrosJefe = () => {
    setFiltrosJefe(prev => ({ ...prev, page: 1 }));
    loadEmpleadosParaJefe({ ...filtrosJefe, page: 1 });
  };

  const cambiarPaginaJefe = (nuevaPagina: number) => {
    setFiltrosJefe(prev => ({ ...prev, page: nuevaPagina }));
    loadEmpleadosParaJefe({ page: nuevaPagina });
  };

  const aplicarFiltrosAsignar = () => {
    setFiltrosAsignar(prev => ({ ...prev, page: 1 }));
    loadEmpleadosParaAsignar({ ...filtrosAsignar, page: 1 }, modoSeleccion);
  };

  const cambiarPaginaAsignar = (nuevaPagina: number) => {
    setFiltrosAsignar(prev => ({ ...prev, page: nuevaPagina }));
    loadEmpleadosParaAsignar({ page: nuevaPagina }, modoSeleccion);
  };

  const openCrearTareaModal = () => {
    if (!puedeAsignarEmpleado()) {
      setError('No tienes permisos para crear tareas');
      return;
    }
    setIsEditingTarea(false);
    setSelectedTarea(null);
    resetTareaForm();
    setShowTareaModal(true);
  };

  const openEditarTareaModal = (tarea: Tarea) => {
    if (!puedeEditarTarea(tarea)) {
      setError('No tienes permiso para editar esta tarea');
      return;
    }
    
    setIsEditingTarea(true);
    setSelectedTarea(tarea);
    setTareaData({
      titulo: tarea.Titulo,
      descripcion: tarea.Descripcion || '',
      fechaVencimiento: formatDateForInput(tarea.FechaVencimiento),
      prioridad: tarea.Prioridad as 'baja' | 'media' | 'alta' | 'urgente',
      estado: tarea.Estado,
      empleadoId: tarea.EmpleadoAsignadoID || null
    });
    setShowTareaModal(true);
  };

const openReasignarTareaModal = (tarea: Tarea) => {
  if (!puedeReasignarTarea(tarea)) {
    setError('No tienes permisos para reasignar esta tarea');
    return;
  }
  
  setSelectedTarea(tarea);
  setReasignarData({
    empleadoId: tarea.EmpleadoAsignadoID || null
  });
  setShowReasignarTareaModal(true);
};

  const openNotaModal = async (tarea: Tarea) => {
    setSelectedTarea(tarea);
    resetNotaForm();
    setShowNotaModal(true);
    if (selectedProyecto) {
      await loadNotas(selectedProyecto.ID, tarea.ID);
    }
  };

  const aplicarFiltrosTareas = async () => {
    if (!selectedProyecto) return;
    await loadTareas(selectedProyecto.ID, filtrosTareas);
  };
  
  // ==================== FUNCIONES DE UTILIDAD ====================
  
  const getPrioridadBadge = (prioridad: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      baja: { bg: 'success', icon: faFlag, label: 'BAJA' },
      media: { bg: 'info', icon: faFlag, label: 'MEDIA' },
      alta: { bg: 'warning', icon: faFlag, label: 'ALTA' },
      urgente: { bg: 'danger', icon: faExclamationTriangle, label: 'URGENTE' }
    };
    const cfg = config[prioridad] || config.media;
    return (
      <Badge bg={cfg.bg} className="d-flex align-items-center" style={{ padding: '0.4rem 0.6rem' }}>
        <FontAwesomeIcon icon={cfg.icon} className="me-1" size="sm" />
        {cfg.label}
      </Badge>
    );
  };

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

  const getRolBadge = (rol: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      admin: { bg: 'danger', icon: faCrown, label: 'ADMIN' },
      manager: { bg: 'warning', icon: faUserTie, label: 'MANAGER' },
      employee: { bg: 'info', icon: faUser, label: 'EMPLEADO' }
    };
    const cfg = config[rol] || { bg: 'secondary', icon: faUser, label: rol?.toUpperCase() || 'SIN ROL' };
    return (
      <Badge bg={cfg.bg} className="d-flex align-items-center">
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

  const getProgresoIcon = (porcentaje: number) => {
    if (porcentaje >= 75) return faTrophy;
    if (porcentaje >= 50) return faMedal;
    if (porcentaje >= 25) return faStar;
    return faClock;
  };
  
  // ==================== COMPONENTES INTERNOS ====================
  
  const KanbanBoard: React.FC<{ tareas: Tarea[] }> = ({ tareas }) => {
    const [draggedTask, setDraggedTask] = useState<Tarea | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const columnas = [
      { id: 'pendiente', titulo: 'Pendiente', icon: faClock, color: 'secondary', bg: '#f8f9fa' },
      { id: 'en_proceso', titulo: 'En Proceso', icon: faPlayCircle, color: 'primary', bg: '#e7f1ff' },
      { id: 'realizada', titulo: 'Finalizada', icon: faCheckCircle, color: 'success', bg: '#e8f5e9' }
    ];

    const getTareasByEstado = (estado: string) => {
      return tareas.filter(t => t.Estado === estado);
    };

    const handleDragStart = (e: React.DragEvent, tarea: Tarea) => {
      const puedeArrastrar = puedeCambiarEstadoTarea(tarea);
      
      if (!puedeArrastrar) {
        e.preventDefault();
        return;
      }
      setDraggedTask(tarea);
      setIsDragging(true);
      e.dataTransfer.setData('tareaId', tarea.ID.toString());
      e.dataTransfer.setData('estadoActual', tarea.Estado);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
      setDraggedTask(null);
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
      e.preventDefault();
      setIsDragging(false);
      
      const tareaId = e.dataTransfer.getData('tareaId');
      const estadoActual = e.dataTransfer.getData('estadoActual');
      
      if (!tareaId || estadoActual === nuevoEstado) return;
      
      await handleCambiarEstadoTarea(parseInt(tareaId), nuevoEstado as any);
      setDraggedTask(null);
    };

    if (loadingTareas) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando tareas...</p>
        </div>
      );
    }

    return (
      <Row className="g-3">
        {columnas.map(columna => (
          <Col key={columna.id} lg={4} md={12} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header 
                className={`bg-${columna.color} text-white py-3`}
                style={{ borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FontAwesomeIcon icon={columna.icon} className="me-2" />
                    {columna.titulo}
                  </h6>
                  <Badge bg="light" text="dark" pill className="px-3">
                    {getTareasByEstado(columna.id).length}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body 
                className="p-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columna.id)}
                style={{ 
                  minHeight: '500px', 
                  maxHeight: '700px', 
                  overflowY: 'auto',
                  backgroundColor: isDragging && draggedTask?.Estado !== columna.id ? '#e3f2fd' : columna.bg,
                  transition: 'background-color 0.2s'
                }}
              >
                {getTareasByEstado(columna.id).length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <FontAwesomeIcon icon={faTasks} size="2x" className="mb-2 opacity-50" />
                    <p className="mb-0 small">No hay tareas</p>
                  </div>
                ) : (
                  getTareasByEstado(columna.id).map(tarea => {
                    const esJefe = soyJefeDelProyecto();
                    const esAsignado = soyAsignadoATarea(tarea);
                    const tareaSinAsignar = !tarea.EmpleadoAsignadoID;
                    const puedeArrastrar = puedeCambiarEstadoTarea(tarea);
                    
                    const estadosMap = {
                      pendiente: { icon: faClock, color: 'secondary', label: 'Pendiente' },
                      en_proceso: { icon: faPlayCircle, color: 'primary', label: 'En Proceso' },
                      realizada: { icon: faCheckCircle, color: 'success', label: 'Finalizada' }
                    };
                    
                    return (
                      <Card
                        key={tarea.ID}
                        className="mb-2 shadow-sm border-0"
                        draggable={puedeArrastrar}
                        onDragStart={(e) => handleDragStart(e, tarea)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          cursor: puedeArrastrar ? 'grab' : 'default',
                          opacity: draggedTask?.ID === tarea.ID ? 0.5 : 1,
                          borderLeft: `4px solid ${
                            tarea.Prioridad === 'urgente' ? '#dc3545' :
                            tarea.Prioridad === 'alta' ? '#ffc107' :
                            tarea.Prioridad === 'media' ? '#0dcaf0' :
                            '#198754'
                          }`
                        }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center">
                              {puedeArrastrar && (
                                <FontAwesomeIcon 
                                  icon={faGripVertical} 
                                  className="text-muted me-2 d-none d-md-inline" 
                                />
                              )}
                              <strong className="small">{tarea.Titulo}</strong>
                              {esJefe && (
                                <Badge bg="warning" text="dark" className="ms-2">
                                  <FontAwesomeIcon icon={faCrown} className="me-1" size="sm" />
                                  JEFE
                                </Badge>
                              )}
                            </div>
                            {getPrioridadBadge(tarea.Prioridad)}
                          </div>
                          
                          <div className="d-md-none mb-2">
                            <Dropdown>
                              <Dropdown.Toggle 
                                variant="outline-secondary" 
                                size="sm" 
                                className="w-100 d-flex align-items-center justify-content-between"
                              >
                                <span className="d-flex align-items-center">
                                  <FontAwesomeIcon 
                                    icon={estadosMap[tarea.Estado].icon} 
                                    className={`me-2 text-${estadosMap[tarea.Estado].color}`} 
                                  />
                                  {estadosMap[tarea.Estado].label}
                                </span>
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoTarea(tarea.ID, 'pendiente')}
                                  disabled={tarea.Estado === 'pendiente' || !puedeCambiarEstadoTarea(tarea)}
                                  className={tarea.Estado === 'pendiente' ? 'bg-light' : ''}
                                >
                                  <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                                  Pendiente
                                  {tarea.Estado === 'pendiente' && ' ✓'}
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoTarea(tarea.ID, 'en_proceso')}
                                  disabled={tarea.Estado === 'en_proceso' || !puedeCambiarEstadoTarea(tarea)}
                                  className={tarea.Estado === 'en_proceso' ? 'bg-light' : ''}
                                >
                                  <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-primary" />
                                  En Proceso
                                  {tarea.Estado === 'en_proceso' && ' ✓'}
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoTarea(tarea.ID, 'realizada')}
                                  disabled={tarea.Estado === 'realizada' || !puedeCambiarEstadoTarea(tarea)}
                                  className={tarea.Estado === 'realizada' ? 'bg-light' : ''}
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                  Finalizada
                                  {tarea.Estado === 'realizada' && ' ✓'}
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                          
                          {tarea.Descripcion && (
                            <p className="small text-muted mb-2">
                              {tarea.Descripcion.length > 80 
                                ? `${tarea.Descripcion.substring(0, 80)}...` 
                                : tarea.Descripcion}
                            </p>
                          )}
                          
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {tarea.FechaVencimiento && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Fecha límite: {formatDateDisplay(tarea.FechaVencimiento)}</Tooltip>}
                              >
                                <Badge 
                                  bg={new Date(tarea.FechaVencimiento) < new Date() && tarea.Estado !== 'realizada' ? 'danger' : 'light'} 
                                  text={new Date(tarea.FechaVencimiento) < new Date() && tarea.Estado !== 'realizada' ? 'white' : 'dark'}
                                  className="d-flex align-items-center"
                                >
                                  <FontAwesomeIcon icon={faCalendar} className="me-1" size="sm" />
                                  <small>{formatDateDisplay(tarea.FechaVencimiento)}</small>
                                </Badge>
                              </OverlayTrigger>
                            )}
                            
                            {tarea.estadoAsignacion === 'asignado' && tarea.EmpleadoAsignadoID ? (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    Asignado a: {tarea.EmpleadoAsignadoNombre}
                                  </Tooltip>
                                }
                              >
                                <Badge 
                                  bg={tarea.EmpleadoAsignadoID === miEmpleadoId ? 'success' : 'info'} 
                                  className="d-flex align-items-center"
                                >
                                  <FontAwesomeIcon icon={faUserCheck} className="me-1" size="sm" />
                                  <small>{tarea.EmpleadoAsignadoNombre?.split(' ')[0]}</small>
                                </Badge>
                              </OverlayTrigger>
                            ) : (
                              <Badge bg="secondary" className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faUserSlash} className="me-1" size="sm" />
                                <small>Sin asignar</small>
                              </Badge>
                            )}
                            
                            {tarea.Notas && tarea.Notas.length > 0 && (
                              <Badge bg="secondary" className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faComment} className="me-1" size="sm" />
                                <small>{tarea.Notas.length}</small>
                              </Badge>
                            )}

                            {esAsignado && (
                              <Badge bg="success" className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faUserCheck} className="me-1" size="sm" />
                                <small>Mi tarea</small>
                              </Badge>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-end mt-2 pt-2 border-top">
                            {puedeReasignarTarea(tarea) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 me-3"
                                onClick={() => openReasignarTareaModal(tarea)}
                              >
                                <FontAwesomeIcon icon={faUserFriends} className="text-primary me-1" />
                                <small>Reasignar</small>
                              </Button>
                            )}
                            
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 me-3"
                              onClick={() => openNotaModal(tarea)}
                            >
                              <FontAwesomeIcon icon={faComment} className="text-info me-1" />
                              <small>Notas</small>
                            </Button>
                            
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="link" size="sm" className="p-0 text-muted">
                                <FontAwesomeIcon icon={faChevronDown} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {puedeEditarTarea(tarea) && (
                                  <Dropdown.Item onClick={() => openEditarTareaModal(tarea)}>
                                    <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
                                    Editar
                                  </Dropdown.Item>
                                )}
                                
                                {puedeEliminarTarea() && (
                                  <Dropdown.Item 
                                    onClick={() => handleEliminarTarea(tarea.ID)}
                                    className="text-danger"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                                    Eliminar
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const ListaTareasView: React.FC<{ tareas: Tarea[] }> = ({ tareas }) => {
    const tareasFiltradas = [...tareas].filter(t => t.Activo === true);

    if (loadingTareas) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando tareas...</p>
        </div>
      );
    }

    const estadosMap = {
      pendiente: { icon: faClock, color: 'secondary', label: 'Pendiente' },
      en_proceso: { icon: faPlayCircle, color: 'primary', label: 'En Proceso' },
      realizada: { icon: faCheckCircle, color: 'success', label: 'Finalizada' }
    };

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            {tareasFiltradas.length} tareas encontradas
          </small>
          <Button
            variant="light"
            size="sm"
            onClick={() => refreshSection('tareas')}
            disabled={refreshing.tareas}
          >
            <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.tareas} className="me-2" />
            Refrescar
          </Button>
        </div>

        {tareasFiltradas.length === 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <FontAwesomeIcon icon={faTasks} size="3x" className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No hay tareas que mostrar</h6>
              <p className="text-muted small mb-0">
                Intenta con otros filtros
              </p>
            </Card.Body>
          </Card>
        ) : (
          tareasFiltradas.map(tarea => {
            const esJefe = soyJefeDelProyecto();
            const esAsignado = soyAsignadoATarea(tarea);
            const tareaSinAsignar = !tarea.EmpleadoAsignadoID;
            
            return (
              <Card key={tarea.ID} className="mb-2 shadow-sm border-0">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <h6 className="mb-0">{tarea.Titulo}</h6>
                        {getEstadoBadge(tarea.Estado)}
                        {getPrioridadBadge(tarea.Prioridad)}
                        {esJefe && (
                          <Badge bg="warning" text="dark">
                            <FontAwesomeIcon icon={faCrown} className="me-1" size="sm" />
                            JEFE
                          </Badge>
                        )}
                        {esAsignado && (
                          <Badge bg="success">
                            <FontAwesomeIcon icon={faUserCheck} className="me-1" size="sm" />
                            MI TAREA
                          </Badge>
                        )}
                      </div>
                      
                      <div className="d-md-none mb-3">
                        <Dropdown>
                          <Dropdown.Toggle 
                            variant="outline-secondary" 
                            size="sm" 
                            className="w-100 d-flex align-items-center justify-content-between"
                          >
                            <span className="d-flex align-items-center">
                              <FontAwesomeIcon 
                                icon={estadosMap[tarea.Estado].icon} 
                                className={`me-2 text-${estadosMap[tarea.Estado].color}`} 
                              />
                              {estadosMap[tarea.Estado].label}
                            </span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'pendiente')}
                              disabled={tarea.Estado === 'pendiente' || !puedeCambiarEstadoTarea(tarea)}
                              className={tarea.Estado === 'pendiente' ? 'bg-light' : ''}
                            >
                              <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                              Pendiente
                              {tarea.Estado === 'pendiente' && ' ✓'}
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'en_proceso')}
                              disabled={tarea.Estado === 'en_proceso' || !puedeCambiarEstadoTarea(tarea)}
                              className={tarea.Estado === 'en_proceso' ? 'bg-light' : ''}
                            >
                              <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-primary" />
                              En Proceso
                              {tarea.Estado === 'en_proceso' && ' ✓'}
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'realizada')}
                              disabled={tarea.Estado === 'realizada' || !puedeCambiarEstadoTarea(tarea)}
                              className={tarea.Estado === 'realizada' ? 'bg-light' : ''}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                              Finalizada
                              {tarea.Estado === 'realizada' && ' ✓'}
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      
                      {tarea.Descripcion && (
                        <p className="small text-muted mb-2">{tarea.Descripcion}</p>
                      )}
                      
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        {tarea.FechaVencimiento && (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faCalendar} className="me-1" />
                            Vence: {formatDateDisplay(tarea.FechaVencimiento)}
                            {new Date(tarea.FechaVencimiento) < new Date() && tarea.Estado !== 'realizada' && (
                              <Badge bg="danger" className="ms-2">ATRASADA</Badge>
                            )}
                          </small>
                        )}
                        
                        {tarea.estadoAsignacion === 'asignado' && tarea.EmpleadoAsignadoID ? (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faUserCheck} className="me-1 text-success" />
                            Asignado a: <strong>{tarea.EmpleadoAsignadoNombre}</strong>
                            {tarea.EmpleadoAsignadoID === miEmpleadoId && ' (tú)'}
                          </small>
                        ) : (
                          <small className="text-muted fst-italic">
                            <FontAwesomeIcon icon={faUserSlash} className="me-1" />
                            Sin asignar
                          </small>
                        )}
                        
                        <small className="text-muted">
                          <FontAwesomeIcon icon={faComment} className="me-1" />
                          {tarea.Notas?.length || 0} notas
                        </small>
                      </div>
                    </div>
                    
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="link" size="sm" className="p-0 text-muted">
                        <FontAwesomeIcon icon={faChevronDown} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <div className="d-none d-md-block">
                          {puedeCambiarEstadoTarea(tarea) && (
                            <>
                              <Dropdown.Item 
                                onClick={() => handleCambiarEstadoTarea(tarea.ID, 'pendiente')}
                                disabled={tarea.Estado === 'pendiente'}
                              >
                                <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                                Mover a Pendiente
                                {tarea.Estado === 'pendiente' && ' ✓'}
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleCambiarEstadoTarea(tarea.ID, 'en_proceso')}
                                disabled={tarea.Estado === 'en_proceso'}
                              >
                                <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-primary" />
                                Mover a En Proceso
                                {tarea.Estado === 'en_proceso' && ' ✓'}
                              </Dropdown.Item>
                              <Dropdown.Item 
                                onClick={() => handleCambiarEstadoTarea(tarea.ID, 'realizada')}
                                disabled={tarea.Estado === 'realizada'}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                Mover a Finalizada
                                {tarea.Estado === 'realizada' && ' ✓'}
                              </Dropdown.Item>
                              <Dropdown.Divider />
                            </>
                          )}
                        </div>
                        
                        <Dropdown.Item onClick={() => openNotaModal(tarea)}>
                          <FontAwesomeIcon icon={faComment} className="me-2 text-info" />
                          Ver/Agregar Notas
                        </Dropdown.Item>
                        {puedeReasignarTarea(tarea) && (
                          <Dropdown.Item onClick={() => openReasignarTareaModal(tarea)}>
                            <FontAwesomeIcon icon={faUserFriends} className="me-2 text-primary" />
                            Reasignar Tarea
                          </Dropdown.Item>
                        )}
                        
                        {puedeEditarTarea(tarea) && (
                          <Dropdown.Item onClick={() => openEditarTareaModal(tarea)}>
                            <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
                            Editar Tarea
                          </Dropdown.Item>
                        )}
                        
                        {puedeEliminarTarea() && (
                          <Dropdown.Item 
                            onClick={() => handleEliminarTarea(tarea.ID)}
                            className="text-danger"
                          >
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Eliminar Tarea
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Card.Body>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  const ProgresoView: React.FC = () => {
    return (
      <div>
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white py-3">
            <h6 className="mb-0 d-flex align-items-center">
              <FontAwesomeIcon icon={faChartLine} className="me-2" />
              Progreso General del Proyecto
              <Button
                variant="light"
                size="sm"
                className="ms-auto"
                onClick={() => refreshSection('todo')}
                disabled={refreshing.todo}
              >
                <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.todo} className="me-2" />
                Actualizar
              </Button>
            </h6>
          </Card.Header>
          <Card.Body>
            {loadingProyecto ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" size="sm" />
                <p className="mt-2 text-muted">Actualizando datos...</p>
              </div>
            ) : progresoGeneral.totalTareas === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faTasks} size="2x" className="text-muted mb-2 opacity-50" />
                <p className="text-muted mb-0">No hay tareas en el proyecto</p>
              </div>
            ) : (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold">Avance total</span>
                  <span className={`text-${getProgresoColor(progresoGeneral.porcentaje)} fw-bold`}>
                    <FontAwesomeIcon icon={getProgresoIcon(progresoGeneral.porcentaje)} className="me-2" />
                    {progresoGeneral.porcentaje}%
                  </span>
                </div>
                <ProgressBar 
                  now={progresoGeneral.porcentaje} 
                  variant={getProgresoColor(progresoGeneral.porcentaje)}
                  className="mb-3"
                  style={{ height: '20px' }}
                />
                
                <Row className="text-center g-2">
                  <Col xs={6} md={3}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="py-2">
                        <h5>{progresoGeneral.totalTareas}</h5>
                        <small className="text-muted">Total tareas</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="py-2">
                        <h5 className="text-success">{progresoGeneral.completadas}</h5>
                        <small className="text-muted">Completadas</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="py-2">
                        <h5 className="text-warning">{progresoGeneral.pendientes}</h5>
                        <small className="text-muted">Pendientes</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} md={3}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="py-2">
                        <h5 className="text-info">{progresoGeneral.enProceso}</h5>
                        <small className="text-muted">En proceso</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-info text-white py-3">
            <h6 className="mb-0 d-flex align-items-center">
              <FontAwesomeIcon icon={faUsers} className="me-2" />
              Progreso por Miembro del Equipo
              <Button
                variant="light"
                size="sm"
                className="ms-auto"
                onClick={() => refreshSection('empleados')}
                disabled={refreshing.empleados}
              >
                <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.empleados} className="me-2" />
                Actualizar
              </Button>
            </h6>
          </Card.Header>
          <Card.Body>
            {loadingEmpleados ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" size="sm" />
                <p className="mt-2 text-muted">Cargando miembros...</p>
              </div>
            ) : empleadosProyecto.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faUsers} size="2x" className="text-muted mb-2 opacity-50" />
                <p className="text-muted mb-0">No hay miembros asignados</p>
              </div>
            ) : progresoMiembros.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faTasks} size="2x" className="text-muted mb-2 opacity-50" />
                <p className="text-muted mb-0">Hay miembros pero no tienen tareas asignadas</p>
              </div>
            ) : (
              <Row>
                {progresoMiembros.map((miembro, index) => (
                  <Col md={6} lg={4} key={miembro.empleadoId} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                              miembro.rol === 'jefe' ? 'bg-warning' : 
                              miembro.rol === 'admin' ? 'bg-danger' :
                              miembro.rol === 'manager' ? 'bg-warning' : 'bg-info'
                            }`}
                            style={{ width: '48px', height: '48px' }}
                          >
                            <FontAwesomeIcon 
                              icon={
                                miembro.rol === 'jefe' ? faCrown :
                                miembro.rol === 'admin' ? faCrown :
                                miembro.rol === 'manager' ? faUserTie :
                                faUser
                              } 
                              className="text-white" 
                            />
                          </div>
                          <div>
                            <h6 className="mb-1">{miembro.nombre}</h6>
                            <small className="text-muted">{miembro.puesto}</small>
                            {miembro.rol === 'jefe' && (
                              <Badge bg="warning" text="dark" className="ms-2">JEFE</Badge>
                            )}
                          </div>
                        </div>
                        
                        {miembro.totalTareas > 0 ? (
                          <>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between align-items-center small">
                                <span>Progreso</span>
                                <span className={`text-${getProgresoColor(miembro.progreso)} fw-bold`}>
                                  {miembro.progreso}%
                                </span>
                              </div>
                              <ProgressBar 
                                now={miembro.progreso} 
                                variant={getProgresoColor(miembro.progreso)}
                                style={{ height: '8px' }}
                              />
                            </div>
                            
                            <div className="d-flex justify-content-between mt-2 small">
                              <div>
                                <Badge bg="success" className="me-1">
                                  {miembro.tareasCompletadas}
                                </Badge>
                                Completadas
                              </div>
                              <div>
                                <Badge bg="secondary" className="me-1">
                                  {miembro.totalTareas}
                                </Badge>
                                Total
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-2">
                            <Badge bg="light" text="dark" className="px-3 py-2">
                              Sin tareas asignadas
                            </Badge>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };
  
  // ==================== RENDERIZADO ====================
  
  if (!isAdmin && !isManager && !isEmployee) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <FontAwesomeIcon icon={faProjectDiagram} size="3x" className="text-warning mb-3" />
            <h3>Acceso Restringido</h3>
            <p className="text-muted">
              No tienes permisos para acceder a la gestión de proyectos.
            </p>
            <Badge bg="secondary" className="fs-6 p-2">
              <FontAwesomeIcon icon={faUser} className="me-2" />
              Rol: {userRol?.toUpperCase() || 'NO DEFINIDO'}
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h2 className="mb-0 d-flex align-items-center">
                <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-primary" />
                Gestión de Proyectos
              </h2>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => refreshSection('proyectos')}
                disabled={refreshing.proyectos}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.proyectos} className="me-2" />
                <span className="d-none d-md-inline">Actualizar</span>
              </Button>
              
              {canManageProyectos && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  <span className="d-none d-md-inline">Nuevo Proyecto</span>
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" size="lg" />
            <div>{error}</div>
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faCheck} className="me-2" size="lg" />
            <div>{success}</div>
          </div>
        </Alert>
      )}

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-3">
          <Row className="g-2">
            <Col xs={12} md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar proyecto por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-light"
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                    className="border-0"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            
            <Col xs={12} md={6}>
              <Form.Select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="bg-light border-0"
              >
                <option value="">Todos los estados</option>
                <option value="activo"><FontAwesomeIcon icon={faPlayCircle} className="me-2 text-success" />Activos</option>
                <option value="pausado"><FontAwesomeIcon icon={faPauseCircle} className="me-2 text-warning" />Pausados</option>
                <option value="finalizado"><FontAwesomeIcon icon={faStopCircle} className="me-2 text-danger" />Finalizados</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando proyectos...</p>
        </div>
      ) : proyectos.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body>
            <FontAwesomeIcon icon={faProjectDiagram} size="3x" className="text-muted mb-3 opacity-50" />
            <h5>No hay proyectos registrados</h5>
            <p className="text-muted">
              {searchTerm || filterEstado 
                ? 'Intenta con otros filtros de búsqueda' 
                : 'Comienza creando un nuevo proyecto'}
            </p>
            {canManageProyectos && (
              <Button 
                variant="primary" 
                onClick={() => setShowCreateModal(true)} 
                className="mt-3 d-flex align-items-center mx-auto"
                style={{ width: 'fit-content' }}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Crear Primer Proyecto
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="g-4">
            {proyectos.map(proyecto => {
              const soyJefeDeEsteProyecto = miEmpleadoId === proyecto.JefeProyectoID;
              
              return (
                <Col key={proyecto.ID} xs={12} md={6} lg={4}>
                  <Card className={`h-100 shadow-sm border-0 ${soyJefeDeEsteProyecto ? 'border-warning border-2' : ''}`}>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="mb-2 d-flex align-items-center">
                            {proyecto.Nombre}
                            {soyJefeDeEsteProyecto && (
                              <Badge bg="warning" text="dark" className="ms-2">
                                <FontAwesomeIcon icon={faCrown} className="me-1" size="sm" />
                                MI PROYECTO
                              </Badge>
                            )}
                          </h5>
                          <div className="mb-2">
                            {getEstadoBadge(proyecto.Estado)}
                          </div>
                        </div>
                        <Dropdown>
                          <Dropdown.Toggle variant="link" className="p-0 text-muted">
                            <FontAwesomeIcon icon={faChevronDown} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu align="end">
                            <Dropdown.Item onClick={() => openProyecto(proyecto)}>
                              <FontAwesomeIcon icon={faEye} className="me-2 text-info" />
                              Ver detalles
                            </Dropdown.Item>
                            {canManageProyectos && (
                              <>
                                <Dropdown.Item onClick={() => openEditProyecto(proyecto)}>
                                  <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
                                  Editar
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoProyecto(proyecto.ID, 'activo')}
                                  disabled={proyecto.Estado === 'activo'}
                                >
                                  <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-success" />
                                  Activar
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoProyecto(proyecto.ID, 'pausado')}
                                  disabled={proyecto.Estado === 'pausado'}
                                >
                                  <FontAwesomeIcon icon={faPauseCircle} className="me-2 text-warning" />
                                  Pausar
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  onClick={() => handleCambiarEstadoProyecto(proyecto.ID, 'finalizado')}
                                  disabled={proyecto.Estado === 'finalizado'}
                                >
                                  <FontAwesomeIcon icon={faStopCircle} className="me-2 text-danger" />
                                  Finalizar
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => openDeleteProyecto(proyecto)}
                                  className="text-danger"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                                  Eliminar
                                </Dropdown.Item>
                              </>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      
                      <p className="text-muted small mb-3">
                        {proyecto.Descripcion && (
                          <>
                            {proyecto.Descripcion.length > 100 
                              ? `${proyecto.Descripcion.substring(0, 100)}...` 
                              : proyecto.Descripcion}
                          </>
                        )}
                        {!proyecto.Descripcion && (
                          <span className="fst-italic">Sin descripción</span>
                        )}
                      </p>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faCalendar} className="me-1" />
                            Inicio: {formatDateDisplay(proyecto.FechaInicio)}
                          </small>
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faFlag} className="me-1" />
                            ${proyecto.Presupuesto.toLocaleString()}
                          </small>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faUserTie} className="text-primary me-2" />
                            <small className="text-muted">
                              {proyecto.JefeProyectoNombre || 'Sin jefe'}
                            </small>
                          </div>
                          
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openProyecto(proyecto)}
                            className="d-flex align-items-center"
                          >
                            <FontAwesomeIcon icon={faArrowRight} className="me-1" />
                            Ver tareas
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1} 
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1} 
                />
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + idx;
                  if (page <= totalPages) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  }
                  return null;
                })}
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages} 
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages} 
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      <Modal 
        show={showSeleccionarJefeModal} 
        onHide={() => setShowSeleccionarJefeModal(false)} 
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserTie} className="me-2" />
            Seleccionar Jefe de Proyecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={5}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white border-0">
                      <FontAwesomeIcon icon={faSearch} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar por nombre o email..."
                      value={filtrosJefe.busqueda}
                      onChange={(e) => setFiltrosJefe(prev => ({ ...prev, busqueda: e.target.value }))}
                      className="border-0 bg-white"
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosJefe.rol}
                    onChange={(e) => setFiltrosJefe(prev => ({ ...prev, rol: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Empleado</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosJefe.departamento}
                    onChange={(e) => setFiltrosJefe(prev => ({ ...prev, departamento: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los departamentos</option>
                    <option value="1">Sistemas y TI</option>
                    <option value="2">Automatización</option>
                    <option value="3">Administrativo</option>
                    <option value="4">Operaciones</option>
                    <option value="5">Ensamble</option>
                    <option value="6">Desarrollo</option>
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={aplicarFiltrosJefe}
                    className="w-100 d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    resetFiltrosJefe();
                    loadEmpleadosParaJefe({ busqueda: '', rol: '', departamento: '', page: 1 });
                  }}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faUndo} className="me-2" />
                  Limpiar filtros
                </Button>
              </div>
            </Card.Body>
          </Card>

          {loadingJefe ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Cargando empleados...</p>
            </div>
          ) : empleadosDisponibles.length === 0 ? (
            <Card className="text-center py-5 border-0 bg-light">
              <Card.Body>
                <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No se encontraron empleados</h6>
                <p className="text-muted mb-0">
                  Intenta con otros filtros de búsqueda
                </p>
              </Card.Body>
            </Card>
          ) : (
            <>
              <p className="text-muted small mb-3 d-flex align-items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Mostrando {empleadosDisponibles.length} empleados
              </p>
              <ListGroup variant="flush" className="border rounded">
                {empleadosDisponibles.map(emp => (
                  <ListGroup.Item 
                    key={emp.ID}
                    action
                    onClick={() => seleccionarJefe(emp)}
                    className="py-3 px-3"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-start">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                            emp.RolApp === 'admin' ? 'bg-danger' :
                            emp.RolApp === 'manager' ? 'bg-warning' : 'bg-info'
                          }`}
                          style={{ width: '48px', height: '48px' }}
                        >
                          <FontAwesomeIcon icon={
                            emp.RolApp === 'admin' ? faCrown :
                            emp.RolApp === 'manager' ? faUserTie :
                            faUser
                          } className="text-white" />
                        </div>
                        <div>
                          <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                            <strong>{emp.NombreCompleto}</strong>
                            {getRolBadge(emp.RolApp)}
                          </div>
                          
                          <small className="text-muted d-block">
                            <FontAwesomeIcon icon={faEnvelope} className="me-1" size="sm" />
                            {emp.CorreoElectronico}
                          </small>
                          
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {emp.PuestoNombre && (
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faBriefcase} className="me-1" size="sm" />
                                {emp.PuestoNombre}
                              </small>
                            )}
                            {emp.DepartamentoNombre && (
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faBuilding} className="me-1" size="sm" />
                                {emp.DepartamentoNombre}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="d-flex align-items-center"
                      >
                        <FontAwesomeIcon icon={faUserCheck} className="me-1" />
                        Seleccionar
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {totalJefePages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev 
                      onClick={() => cambiarPaginaJefe(filtrosJefe.page - 1)} 
                      disabled={filtrosJefe.page === 1} 
                    />
                    {[...Array(Math.min(5, totalJefePages))].map((_, idx) => {
                      const page = Math.max(1, Math.min(totalJefePages - 4, filtrosJefe.page - 2)) + idx;
                      if (page <= totalJefePages) {
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === filtrosJefe.page}
                            onClick={() => cambiarPaginaJefe(page)}
                          >
                            {page}
                          </Pagination.Item>
                        );
                      }
                      return null;
                    })}
                    <Pagination.Next 
                      onClick={() => cambiarPaginaJefe(filtrosJefe.page + 1)} 
                      disabled={filtrosJefe.page === totalJefePages} 
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowSeleccionarJefeModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showAsignarEmpleadoModal} 
        onHide={() => setShowAsignarEmpleadoModal(false)} 
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Asignar Miembros al Equipo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={12}>
                  <Form.Label className="fw-bold">Modo de selección</Form.Label>
                  <ButtonGroup className="w-100">
                    <Button
                      variant={modoSeleccion === 'supervisados' ? 'primary' : 'outline-primary'}
                      onClick={() => {
                        setModoSeleccion('supervisados');
                        loadEmpleadosParaAsignar({ page: 1 }, 'supervisados');
                      }}
                    >
                      <FontAwesomeIcon icon={faUserFriends} className="me-2" />
                      Subordinados
                    </Button>
                    <Button
                      variant={modoSeleccion === 'todos' ? 'primary' : 'outline-primary'}
                      onClick={() => {
                        setModoSeleccion('todos');
                        loadEmpleadosParaAsignar({ page: 1 }, 'todos');
                      }}
                    >
                      <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      Todos los empleados
                    </Button>
                  </ButtonGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={5}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white border-0">
                      <FontAwesomeIcon icon={faSearch} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar por nombre o email..."
                      value={filtrosAsignar.busqueda}
                      onChange={(e) => setFiltrosAsignar(prev => ({ ...prev, busqueda: e.target.value }))}
                      className="border-0 bg-white"
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosAsignar.rol}
                    onChange={(e) => setFiltrosAsignar(prev => ({ ...prev, rol: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Empleado</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosAsignar.departamento}
                    onChange={(e) => setFiltrosAsignar(prev => ({ ...prev, departamento: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los departamentos</option>
                    <option value="1">Sistemas y TI</option>
                    <option value="2">Automatización</option>
                    <option value="3">Administrativo</option>
                    <option value="4">Operaciones</option>
                    <option value="5">Ensamble</option>
                    <option value="6">Desarrollo</option>
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={aplicarFiltrosAsignar}
                    className="w-100 d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    resetFiltrosAsignar();
                    loadEmpleadosParaAsignar({ busqueda: '', rol: '', departamento: '', page: 1 }, modoSeleccion);
                  }}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faUndo} className="me-2" />
                  Limpiar filtros
                </Button>
              </div>
            </Card.Body>
          </Card>

          {loadingAsignar ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Cargando empleados disponibles...</p>
            </div>
          ) : empleadosParaAsignar.length === 0 ? (
            <Card className="text-center py-5 border-0 bg-light">
              <Card.Body>
                <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No hay empleados disponibles para asignar</h6>
                <p className="text-muted mb-0">
                  {modoSeleccion === 'supervisados' 
                    ? 'No tienes subordinados disponibles o ya están asignados'
                    : 'No hay empleados disponibles en la empresa'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <>
              <p className="text-muted small mb-3 d-flex align-items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Mostrando {empleadosParaAsignar.length} empleados disponibles
              </p>
              <ListGroup variant="flush" className="border rounded">
                {empleadosParaAsignar.map(emp => (
                  <ListGroup.Item 
                    key={emp.ID}
                    className="py-3 px-3"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-start">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                            emp.RolApp === 'admin' ? 'bg-danger' :
                            emp.RolApp === 'manager' ? 'bg-warning' : 'bg-info'
                          }`}
                          style={{ width: '48px', height: '48px' }}
                        >
                          <FontAwesomeIcon icon={
                            emp.RolApp === 'admin' ? faCrown :
                            emp.RolApp === 'manager' ? faUserTie :
                            faUser
                          } className="text-white" />
                        </div>
                        <div>
                          <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                            <strong>{emp.NombreCompleto}</strong>
                            {getRolBadge(emp.RolApp)}
                          </div>
                          
                          <small className="text-muted d-block">
                            <FontAwesomeIcon icon={faEnvelope} className="me-1" size="sm" />
                            {emp.CorreoElectronico}
                          </small>
                          
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {emp.PuestoNombre && (
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faBriefcase} className="me-1" size="sm" />
                                {emp.PuestoNombre}
                              </small>
                            )}
                            {emp.DepartamentoNombre && (
                              <small className="text-muted">
                                <FontAwesomeIcon icon={faBuilding} className="me-1" size="sm" />
                                {emp.DepartamentoNombre}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleAsignarEmpleado(emp.ID)}
                        className="d-flex align-items-center"
                      >
                        <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                        Asignar
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {totalAsignarPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.Prev 
                      onClick={() => cambiarPaginaAsignar(filtrosAsignar.page - 1)} 
                      disabled={filtrosAsignar.page === 1} 
                    />
                    {[...Array(Math.min(5, totalAsignarPages))].map((_, idx) => {
                      const page = Math.max(1, Math.min(totalAsignarPages - 4, filtrosAsignar.page - 2)) + idx;
                      if (page <= totalAsignarPages) {
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === filtrosAsignar.page}
                            onClick={() => cambiarPaginaAsignar(page)}
                          >
                            {page}
                          </Pagination.Item>
                        );
                      }
                      return null;
                    })}
                    <Pagination.Next 
                      onClick={() => cambiarPaginaAsignar(filtrosAsignar.page + 1)} 
                      disabled={filtrosAsignar.page === totalAsignarPages} 
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowAsignarEmpleadoModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showQuitarEmpleadoModal} 
        onHide={() => {
          setShowQuitarEmpleadoModal(false);
          setSelectedEmpleado(null);
        }} 
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserMinus} className="me-2" />
            Quitar Miembro del Equipo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmpleado && (
            <>
              <p>¿Estás seguro de quitar a <strong>{selectedEmpleado.NombreCompleto}</strong> del proyecto?</p>
              <Alert variant="warning" className="mb-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Este empleado tiene <strong>{selectedEmpleado.TareasActivas}</strong> tareas activas asignadas. 
                Al quitarlo, las tareas quedarán sin asignar.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowQuitarEmpleadoModal(false);
              setSelectedEmpleado(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleQuitarEmpleado}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Quitar del Proyecto
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showCreateModal} 
        onHide={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Nuevo Proyecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nombre del Proyecto *</Form.Label>
              <Form.Control
                type="text"
                value={createData.nombre}
                onChange={(e) => setCreateData({...createData, nombre: e.target.value})}
                placeholder="Ej: Sistema de Gestión RENOVA"
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createData.descripcion}
                onChange={(e) => setCreateData({...createData, descripcion: e.target.value})}
                placeholder="Descripción del proyecto..."
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fecha de Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={createData.fechaInicio}
                    onChange={(e) => setCreateData({...createData, fechaInicio: e.target.value})}
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fecha de Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={createData.fechaFin}
                    onChange={(e) => setCreateData({...createData, fechaFin: e.target.value})}
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Presupuesto *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0">$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={createData.presupuesto}
                      onChange={(e) => setCreateData({...createData, presupuesto: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="bg-light border-0"
                    />
                    <Form.Select
                      value={createData.moneda}
                      onChange={(e) => setCreateData({...createData, moneda: e.target.value})}
                      style={{ maxWidth: '100px' }}
                      className="bg-light border-0"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Monto Asignado</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0">$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={createData.montoAsignado}
                      onChange={(e) => setCreateData({...createData, montoAsignado: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="bg-light border-0"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Jefe de Proyecto *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={createData.jefeProyectoNombre}
                      placeholder="Selecciona un jefe de proyecto"
                      readOnly
                      className="bg-light border-0"
                    />
                    <Button
                      variant="outline-primary"
                      onClick={openSeleccionarJefeModal}
                    >
                      <FontAwesomeIcon icon={faSearch} />
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Debe ser un empleado con rol de administrador o manager
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Estado</Form.Label>
                  <Form.Select
                    value={createData.estado}
                    onChange={(e) => setCreateData({...createData, estado: e.target.value as any})}
                    className="bg-light border-0"
                  >
                    <option value="activo"><FontAwesomeIcon icon={faPlayCircle} className="me-2 text-success" />Activo</option>
                    <option value="pausado"><FontAwesomeIcon icon={faPauseCircle} className="me-2 text-warning" />Pausado</option>
                    <option value="finalizado"><FontAwesomeIcon icon={faStopCircle} className="me-2 text-danger" />Finalizado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateProyecto}>
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Crear Proyecto
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        size="xl" 
        fullscreen="lg-down" 
        scrollable
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faProjectDiagram} className="me-2" />
            {selectedProyecto?.Nombre}
            {selectedProyecto && miEmpleadoId === selectedProyecto.JefeProyectoID && (
              <Badge bg="warning" text="dark" className="ms-3">
                <FontAwesomeIcon icon={faCrown} className="me-1" />
                JEFE DEL PROYECTO
              </Badge>
            )}
            <Button
              variant="light"
              size="sm"
              className="ms-auto me-2"
              onClick={() => refreshSection('todo')}
              disabled={refreshing.todo}
            >
              <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.todo} className="me-2" />
              Actualizar
            </Button>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedProyecto && (
            <div>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                <div>
                  <div className="d-flex gap-2 mb-2">
                    {getEstadoBadge(selectedProyecto.Estado)}
                    <Badge bg="info" className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faFlag} className="me-1" />
                      ${selectedProyecto.Presupuesto.toLocaleString()} {selectedProyecto.Moneda}
                    </Badge>
                  </div>
                  <p className="text-muted mb-0">
                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                    Inicio: {formatDateDisplay(selectedProyecto.FechaInicio)}
                    {selectedProyecto.FechaFin && ` - Fin: ${formatDateDisplay(selectedProyecto.FechaFin)}`}
                  </p>
                </div>
                
                {canManage && (
                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => {
                        openEditProyecto(selectedProyecto);
                      }}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      Editar
                    </Button>
                    <Button 
                      variant={selectedProyecto.Estado === 'activo' ? 'warning' : 'success'} 
                      size="sm"
                      onClick={() => handleCambiarEstadoProyecto(
                        selectedProyecto.ID, 
                        selectedProyecto.Estado === 'activo' ? 'pausado' : 'activo'
                      )}
                      className="d-flex align-items-center text-white"
                    >
                      <FontAwesomeIcon icon={selectedProyecto.Estado === 'activo' ? faPauseCircle : faPlayCircle} className="me-2" />
                      {selectedProyecto.Estado === 'activo' ? 'Pausar' : 'Activar'}
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => openDeleteProyecto(selectedProyecto)}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>

              {selectedProyecto.Descripcion && (
                <Card className="mb-4 border-0 bg-light">
                  <Card.Body>
                    <h6 className="mb-2 d-flex align-items-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                      Descripción
                    </h6>
                    <p className="mb-0">{selectedProyecto.Descripcion}</p>
                  </Card.Body>
                </Card>
              )}

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'tareas')}
                className="mb-4"
              >
                <Tab eventKey="tareas" title={
                  <span className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faTasks} />
                    Tareas
                    <Badge bg="secondary" pill>{tareas.length}</Badge>
                    {refreshing.tareas && (
                      <Spinner animation="border" size="sm" variant="primary" />
                    )}
                  </span>
                }>
                  <Card className="mb-4 border-0 bg-light">
                    <Card.Body className="p-3">
                      <Row className="g-2">
                        <Col md={3}>
                          <InputGroup size="sm">
                            <InputGroup.Text className="bg-white border-0">
                              <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                              placeholder="Buscar tarea..."
                              value={filtrosTareas.search}
                              onChange={(e) => {
                                setFiltrosTareas(prev => ({ ...prev, search: e.target.value }));
                                aplicarFiltrosTareas();
                              }}
                              className="border-0 bg-white"
                            />
                          </InputGroup>
                        </Col>
                        <Col md={2}>
                          <Form.Select
                            size="sm"
                            value={filtrosTareas.estado}
                            onChange={(e) => {
                              setFiltrosTareas(prev => ({ ...prev, estado: e.target.value }));
                              aplicarFiltrosTareas();
                            }}
                            className="bg-white border-0"
                          >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="realizada">Finalizada</option>
                          </Form.Select>
                        </Col>
                        <Col md={2}>
                          <Form.Select
                            size="sm"
                            value={filtrosTareas.prioridad}
                            onChange={(e) => {
                              setFiltrosTareas(prev => ({ ...prev, prioridad: e.target.value }));
                              aplicarFiltrosTareas();
                            }}
                            className="bg-white border-0"
                          >
                            <option value="">Todas las prioridades</option>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                          </Form.Select>
                        </Col>
                        <Col md={3}>
                          <Form.Select
                            size="sm"
                            value={filtrosTareas.asignadoA}
                            onChange={(e) => {
                              setFiltrosTareas(prev => ({ ...prev, asignadoA: e.target.value }));
                              aplicarFiltrosTareas();
                            }}
                            className="bg-white border-0"
                          >
                            <option value="">Todos los asignados</option>
                            {empleadosProyecto.map(emp => (
                              <option key={emp.ID} value={emp.ID}>{emp.NombreCompleto}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={2}>
                          <Form.Check
                            type="switch"
                            label="Sin asignar"
                            checked={filtrosTareas.soloSinAsignar}
                            onChange={(e) => {
                              setFiltrosTareas(prev => ({ ...prev, soloSinAsignar: e.target.checked }));
                              aplicarFiltrosTareas();
                            }}
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <div className="d-flex gap-2 mb-3 mb-md-0">
                      <ButtonGroup>
                        <Button
                          variant={viewMode === 'kanban' ? 'primary' : 'outline-primary'}
                          onClick={() => setViewMode('kanban')}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faColumns} className="me-2" />
                          Kanban
                        </Button>
                        <Button
                          variant={viewMode === 'lista' ? 'primary' : 'outline-primary'}
                          onClick={() => setViewMode('lista')}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faList} className="me-2" />
                          Lista
                        </Button>
                      </ButtonGroup>
                    </div>
                    
                    <div className="d-flex gap-2 w-100 w-md-auto">
                      {(isAdmin || soyJefeDelProyecto()) && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => openAsignarEmpleadoModal('todos')}
                            className="d-flex align-items-center"
                          >
                            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                            Asignar Miembro
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={openCrearTareaModal}
                            className="d-flex align-items-center"
                          >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Nueva Tarea
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {viewMode === 'kanban' ? (
                    <KanbanBoard tareas={tareas} />
                  ) : (
                    <ListaTareasView tareas={tareas} />
                  )}
                </Tab>

                <Tab eventKey="equipo" title={
                  <span className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} />
                    Equipo
                    <Badge bg="secondary" pill>{empleadosProyecto.length}</Badge>
                    {refreshing.empleados && (
                      <Spinner animation="border" size="sm" variant="primary" />
                    )}
                  </span>
                }>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Miembros del Equipo</h6>
                      <div className="d-flex gap-2">
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => refreshSection('empleados')}
                          disabled={refreshing.empleados}
                        >
                          <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.empleados} className="me-2" />
                          Refrescar
                        </Button>
                        {(isAdmin || soyJefeDelProyecto()) && (
                          <Dropdown>
                            <Dropdown.Toggle variant="success" size="sm">
                              <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                              Agregar Miembro
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => openAsignarEmpleadoModal('supervisados')}>
                                <FontAwesomeIcon icon={faUserFriends} className="me-2 text-primary" />
                                Subordinados
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => openAsignarEmpleadoModal('todos')}>
                                <FontAwesomeIcon icon={faBuilding} className="me-2 text-info" />
                                Todos los empleados
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                    </div>

                    {empleadosProyecto.length === 0 ? (
                      <Card className="text-center py-5 border-0 bg-light">
                        <Card.Body>
                          <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3 opacity-50" />
                          <h6 className="text-muted">No hay miembros en el equipo</h6>
                          <p className="text-muted mb-0">
                            Asigna miembros para comenzar a trabajar
                          </p>
                        </Card.Body>
                      </Card>
                    ) : (
                      <Row>
                        {empleadosProyecto.map(emp => {
                          const esElJefe = emp.Rol === 'jefe' || 
                                          emp.ID === selectedProyecto?.JefeProyectoID || 
                                          emp.RolApp === 'jefe' || 
                                          (emp as any).esJefe === true;
                          
                          return (
                            <Col md={6} lg={4} key={emp.ID} className="mb-3">
                              <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="d-flex align-items-center">
                                      <div 
                                        className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                          esElJefe ? 'bg-warning' : 
                                          emp.RolApp === 'admin' ? 'bg-danger' :
                                          emp.RolApp === 'manager' ? 'bg-warning' : 'bg-info'
                                        }`}
                                        style={{ width: '48px', height: '48px' }}
                                      >
                                        <FontAwesomeIcon icon={
                                          esElJefe ? faCrown :
                                          emp.RolApp === 'admin' ? faCrown :
                                          emp.RolApp === 'manager' ? faUserTie :
                                          faUser
                                        } className="text-white" />
                                      </div>
                                      <div>
                                        <h6 className="mb-1">{emp.NombreCompleto}</h6>
                                        <small className="text-muted">{emp.PuestoNombre || 'Sin puesto'}</small>
                                      </div>
                                    </div>
                                    {esElJefe && (
                                      <Badge bg="warning" text="dark">JEFE</Badge>
                                    )}
                                  </div>

                                  <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1 small">
                                      <span>Tareas activas</span>
                                      <span className="fw-bold">{emp.TareasActivas || 0}</span>
                                    </div>
                                  </div>

                                  <div className="d-flex flex-wrap gap-2 mb-3">
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                      {emp.CorreoElectronico}
                                    </small>
                                    {emp.DepartamentoNombre && (
                                      <small className="text-muted d-block">
                                        <FontAwesomeIcon icon={faBuilding} className="me-1" />
                                        {emp.DepartamentoNombre}
                                      </small>
                                    )}
                                  </div>

                                  {(isAdmin || soyJefeDelProyecto()) && !esElJefe && (
                                    <div className="d-flex justify-content-end border-top pt-2">
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => openQuitarEmpleadoModal(emp)}
                                        className="d-flex align-items-center"
                                      >
                                        <FontAwesomeIcon icon={faUserMinus} className="me-1" />
                                        Quitar
                                      </Button>
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="progreso" title={
                  <span className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} />
                    Progreso
                    {(refreshing.todo || refreshing.empleados) && (
                      <Spinner animation="border" size="sm" variant="primary" />
                    )}
                  </span>
                }>
                  <ProgresoView />
                </Tab>

                <Tab eventKey="historial" title={
                  <span className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faHistory} />
                    Historial
                    {refreshing.historial && (
                      <Spinner animation="border" size="sm" variant="primary" />
                    )}
                  </span>
                }>
                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => refreshSection('historial')}
                      disabled={refreshing.historial}
                    >
                      <FontAwesomeIcon icon={faRedoAlt} spin={refreshing.historial} className="me-2" />
                      Refrescar
                    </Button>
                  </div>
                  {historial.length === 0 ? (
                    <Card className="text-center py-5 border-0 bg-light">
                      <Card.Body>
                        <FontAwesomeIcon icon={faHistory} size="3x" className="text-muted mb-3 opacity-50" />
                        <h6 className="text-muted">No hay historial de actividades</h6>
                        <p className="text-muted mb-0">Este proyecto aún no tiene registros.</p>
                      </Card.Body>
                    </Card>
                  ) : (
                    <div className="timeline">
                      {historial.map((item: any, index) => (
                        <div key={item.ID} className="timeline-item">
                          <div className="timeline-badge">
                            <FontAwesomeIcon icon={
                              item.Accion.includes('creado') ? faPlus :
                              item.Accion.includes('actualizado') ? faEdit :
                              item.Accion.includes('asignado') ? faUserPlus :
                              item.Accion.includes('removido') ? faUserMinus :
                              item.Accion.includes('eliminado') ? faTrash :
                              faHistory
                            } size="sm" />
                          </div>
                          <Card className="mb-3 border-0 shadow-sm">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong className="text-primary">{item.Accion}</strong>
                                <small className="text-muted">
                                  {formatDateTimeDisplay(item.createdAt)}
                                </small>
                              </div>
                              <p className="mb-0">{item.Detalles || item.Accion}</p>
                              <small className="text-muted d-block mt-2">
                                <FontAwesomeIcon icon={faUser} className="me-1" />
                                Por: {item.UsuarioNombre || item.EmpleadoNombre || 'Sistema'}
                              </small>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </Tab>
              </Tabs>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title className="d-flex align-items-center text-white">
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Proyecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nombre del Proyecto *</Form.Label>
              <Form.Control
                type="text"
                value={editData.nombre}
                onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.descripcion}
                onChange={(e) => setEditData({...editData, descripcion: e.target.value})}
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fecha de Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.fechaInicio}
                    onChange={(e) => setEditData({...editData, fechaInicio: e.target.value})}
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fecha de Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.fechaFin}
                    onChange={(e) => setEditData({...editData, fechaFin: e.target.value})}
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Presupuesto *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0">$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={editData.presupuesto}
                      onChange={(e) => setEditData({...editData, presupuesto: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                      className="bg-light border-0"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Monto Asignado</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0">$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={editData.montoAsignado}
                      onChange={(e) => setEditData({...editData, montoAsignado: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                      className="bg-light border-0"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Estado</Form.Label>
                  <Form.Select
                    value={editData.estado}
                    onChange={(e) => setEditData({...editData, estado: e.target.value as any})}
                    className="bg-light border-0"
                  >
                    <option value="activo"><FontAwesomeIcon icon={faPlayCircle} className="me-2 text-success" />Activo</option>
                    <option value="pausado"><FontAwesomeIcon icon={faPauseCircle} className="me-2 text-warning" />Pausado</option>
                    <option value="finalizado"><FontAwesomeIcon icon={faStopCircle} className="me-2 text-danger" />Finalizado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleUpdateProyecto} className="text-white">
            <FontAwesomeIcon icon={faSave} className="me-2" />
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Eliminar Proyecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProyecto && (
            <>
              <p>¿Estás seguro de eliminar el proyecto <strong>{selectedProyecto.Nombre}</strong>?</p>
              <Alert variant="danger" className="mb-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Esta acción es irreversible. Se eliminarán todas las tareas y asignaciones asociadas.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteProyecto}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Eliminar Proyecto
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showTareaModal} 
        onHide={() => {
          setShowTareaModal(false);
          resetTareaForm();
          setIsEditingTarea(false);
          setSelectedTarea(null);
        }} 
        centered
      >
        <Modal.Header closeButton className={isEditingTarea ? 'bg-warning' : 'bg-success'}>
          <Modal.Title className="d-flex align-items-center text-white">
            <FontAwesomeIcon icon={isEditingTarea ? faEdit : faPlus} className="me-2" />
            {isEditingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Título *</Form.Label>
              <Form.Control
                type="text"
                value={tareaData.titulo}
                onChange={(e) => setTareaData({...tareaData, titulo: e.target.value})}
                placeholder="Ej: Diseñar interfaz de usuario"
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tareaData.descripcion}
                onChange={(e) => setTareaData({...tareaData, descripcion: e.target.value})}
                placeholder="Descripción detallada de la tarea..."
                className="bg-light border-0"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Prioridad</Form.Label>
                  <Form.Select
                    value={tareaData.prioridad}
                    onChange={(e) => setTareaData({...tareaData, prioridad: e.target.value as any})}
                    className="bg-light border-0"
                  >
                    <option value="baja"><FontAwesomeIcon icon={faFlag} className="me-2 text-success" />Baja</option>
                    <option value="media"><FontAwesomeIcon icon={faFlag} className="me-2 text-info" />Media</option>
                    <option value="alta"><FontAwesomeIcon icon={faFlag} className="me-2 text-warning" />Alta</option>
                    <option value="urgente"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-danger" />Urgente</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Fecha Límite</Form.Label>
                  <Form.Control
                    type="date"
                    value={tareaData.fechaVencimiento}
                    onChange={(e) => setTareaData({...tareaData, fechaVencimiento: e.target.value})}
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
            </Row>

            {!isEditingTarea && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Asignar a empleado (opcional)</Form.Label>
                <Form.Select
                  value={tareaData.empleadoId || ''}
                  onChange={(e) => setTareaData({...tareaData, empleadoId: e.target.value ? parseInt(e.target.value) : null})}
                  className="bg-light border-0"
                >
                  <option value="">-- Sin asignar --</option>
                  {empleadosProyecto.map(emp => (
                    <option key={emp.ID} value={emp.ID}>{emp.NombreCompleto}</option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  * Puedes asignar la tarea después de crearla
                </Form.Text>
              </Form.Group>
            )}

            {isEditingTarea && selectedTarea?.EmpleadoAsignadoID && (
              <Alert variant="light" className="mb-0">
                <small>
                  <FontAwesomeIcon icon={faUserCheck} className="me-1 text-success" />
                  <strong>Asignado actualmente:</strong> {selectedTarea.EmpleadoAsignadoNombre}
                  {selectedTarea.EmpleadoAsignadoID === miEmpleadoId && ' (tú)'}
                </small>
                <br />
                <small className="text-muted">
                  Para cambiar la asignación, usa la opción "Reasignar" en el menú de la tarea.
                </small>
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowTareaModal(false);
            resetTareaForm();
            setIsEditingTarea(false);
            setSelectedTarea(null);
          }}>
            Cancelar
          </Button>
          <Button 
            variant={isEditingTarea ? "warning" : "success"} 
            onClick={isEditingTarea ? handleActualizarTarea : handleCrearTarea}
            className="text-white"
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {isEditingTarea ? 'Actualizar' : 'Crear'} Tarea
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={showReasignarTareaModal} 
        onHide={() => {
          setShowReasignarTareaModal(false);
          setReasignarData({ empleadoId: null });
          setSelectedTarea(null);
        }} 
        centered
      >
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserFriends} className="me-2" />
            Reasignar Tarea
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTarea && selectedProyecto ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Asignar a:</Form.Label>
                <Form.Select
                  value={reasignarData.empleadoId || ''}
                  onChange={(e) => setReasignarData({ 
                    empleadoId: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="bg-light border-0"
                >
                  <option value="">-- Sin asignar --</option>
                  {empleadosProyecto.map(emp => (
                    <option key={emp.ID} value={emp.ID}>{emp.NombreCompleto}</option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  * Selecciona "Sin asignar" para desasignar la tarea
                </Form.Text>
              </Form.Group>
            </>
          ) : (
            <Alert variant="warning">
              No se pudo cargar la información de la tarea
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowReasignarTareaModal(false);
              setReasignarData({ empleadoId: null });
              setSelectedTarea(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            variant="info" 
            onClick={handleReasignarTarea}
            className="text-white"
            disabled={!selectedTarea || !selectedProyecto}
          >
            <FontAwesomeIcon icon={faSave} className="me-2" />
            {reasignarData.empleadoId ? 'Reasignar' : 'Desasignar'}
          </Button>
        </Modal.Footer>
      </Modal>

<Modal 
  show={showNotaModal} 
  onHide={() => setShowNotaModal(false)} 
  size="lg"
  centered
  scrollable
>
  <Modal.Header closeButton className="bg-info text-white">
    <Modal.Title className="d-flex align-items-center">
      <FontAwesomeIcon icon={faComment} className="me-2" />
      Notas - {selectedTarea?.Titulo}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedTarea && (
      <>
        {/* Verificar si el usuario puede agregar notas: admin, jefe del proyecto, o empleado asignado */}
        {(isAdmin || soyJefeDelProyecto() || soyAsignadoATarea(selectedTarea)) && (
          <Card className="mb-4 border-0 bg-light">
            <Card.Body>
              <h6 className="mb-3">Agregar Nueva Nota</h6>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notaData.contenido}
                  onChange={(e) => setNotaData({...notaData, contenido: e.target.value})}
                  placeholder="Escribe tu nota aquí..."
                  className="bg-white border-0"
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                label="Nota privada (solo visible para administradores)"
                checked={notaData.esPrivada}
                onChange={(e) => setNotaData({...notaData, esPrivada: e.target.checked})}
                className="mb-3"
              />
              <Button
                variant="primary"
                onClick={() => handleCrearNota(selectedTarea.ID)}
                disabled={!notaData.contenido.trim()}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                Agregar Nota
              </Button>
            </Card.Body>
          </Card>
        )}

        <h6 className="mb-3 d-flex align-items-center">
          <FontAwesomeIcon icon={faHistory} className="me-2" />
          Notas Anteriores ({notas.length})
        </h6>
        
        {notas.length === 0 ? (
          <Card className="text-center py-4 border-0 bg-light">
            <Card.Body>
              <FontAwesomeIcon icon={faComment} size="2x" className="text-muted mb-2 opacity-50" />
              <p className="text-muted mb-0">No hay notas para esta tarea</p>
            </Card.Body>
          </Card>
        ) : (
          notas.map((nota: any) => {
            // Si es privada y no es admin, no mostrar
            if (nota.EsPrivada && !isAdmin) return null;
            
            // Determinar si la nota es del usuario actual
            const esMiNota = nota.EmpleadoID === miEmpleadoId;
            
            return (
              <Card key={nota.ID} className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle ${esMiNota ? 'bg-success' : 'bg-primary'} d-flex align-items-center justify-content-center me-2`} 
                           style={{ width: '32px', height: '32px' }}>
                        <FontAwesomeIcon icon={faUserCircle} className="text-white" size="sm" />
                      </div>
                      <div>
                        <strong className="d-block">
                          {nota.EmpleadoNombre}
                          {esMiNota && ' (tú)'}
                        </strong>
                        <small className="text-muted">
                          {formatDateTimeDisplay(nota.createdAt)}
                        </small>
                      </div>
                    </div>
                    {nota.EsPrivada && (
                      <Badge bg="warning" text="dark">
                        <FontAwesomeIcon icon={faLock} className="me-1" />
                        Privada
                      </Badge>
                    )}
                  </div>
                  <p className="mb-0 mt-2 ps-4">{nota.Contenido}</p>
                </Card.Body>
              </Card>
            );
          })
        )}
      </>
    )}
  </Modal.Body>
  <Modal.Footer className="border-0">
    <Button variant="secondary" onClick={() => setShowNotaModal(false)}>
      Cerrar
    </Button>
  </Modal.Footer>
</Modal>

      <style>{`
        .timeline {
          position: relative;
          padding: 20px 0;
        }
        .timeline-item {
          position: relative;
          padding-left: 40px;
          margin-bottom: 20px;
        }
        .timeline-badge {
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 2px solid #0d6efd;
        }
        @media (max-width: 768px) {
          .btn-group {
            width: 100%;
          }
          .btn-group .btn {
            flex: 1;
          }
        }
      `}</style>
    </Container>
  );
};

export default Proyectos;