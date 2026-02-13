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
  faUserClock,
  faUserCheck,
  faUserSlash,
  faBuilding,
  faEnvelope,
  faBriefcase,
  faInfoCircle,
  faUserFriends,
  faPaperPlane,
  faLock,
  faCrown
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

// ============================================
// INTERFACES
// ============================================

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

interface TareaAsignacion {
  ID: number;
  TareaID: number;
  EmpleadoID: number;
  EmpleadoNombre: string;
  EmpleadoEmail?: string;
  FechaAsignacion: string;
  FechaFinalizacion?: string;
  AsignadoPor: number;
  AsignadoPorUsuario?: string;
  Activo: boolean;
  createdAt: string;
}

interface NotaTarea {
  ID: number;
  TareaID: number;
  EmpleadoID: number;
  EmpleadoNombre: string;
  EmpleadoEmail?: string;
  Contenido: string;
  EsPrivada: boolean;
  CreadoPor: number;
  CreadorUsuario?: string;
  createdAt: string;
  updatedAt: string;
  Activo: boolean;
}

interface EmpleadoProyecto {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  Celular?: string;
  RolApp: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
  DepartamentoID?: number;
  FechaAsignacion: string;
  FechaAsignacionFormateada?: string;
  Rol: 'jefe' | 'miembro' | 'colaborador';
  TareasActivas?: number;
  TareasAsignadas?: number;
  TareasCompletadas?: number;
  Progreso?: number;
  estadoAsignacion: 'asignado';
  AsignadoPorUsuario?: string;
}

interface EmpleadoDisponible {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  FechaIngreso: string;
  RFC?: string;
  CURP?: string;
  RolApp: string;
  PuestoNombre?: string;
  DepartamentoNombre?: string;
  DepartamentoID?: number;
  AntiguedadAnios: number;
  EsSubordinado: number;
  TareasPendientes: number;
  ProyectosActivos: number;
  EstadoAsignacion: 'asignado' | 'no_asignado';
  RolEnProyecto: 'jefe_proyecto' | 'empleado';
  Activo: number;
}

interface HistorialProyecto {
  ID: number;
  ProyectoID: number;
  UsuarioID: number;
  UsuarioNombre: string;
  EmpleadoNombre?: string;
  Accion: string;
  Detalles?: string;
  createdAt: string;
}

interface Paginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FiltrosEmpleados {
  busqueda: string;
  rol: string;
  puesto: string;
  departamento: string;
  modo: 'supervisados' | 'todos';
  soloNoAsignados: boolean;
}

interface FiltrosTareas {
  estado: string;
  prioridad: string;
  asignadoA: string;
  soloSinAsignar: boolean;
  search: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

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
  const canManageTareas = isAdmin || isManager;
  
  // ==========================================
  // ESTADOS PRINCIPALES
  // ==========================================
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [empleadosProyecto, setEmpleadosProyecto] = useState<EmpleadoProyecto[]>([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState<EmpleadoDisponible[]>([]);
  const [historial, setHistorial] = useState<HistorialProyecto[]>([]);
  const [notas, setNotas] = useState<NotaTarea[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const itemsPerPage = 9;
  
  const [filtrosEmpleados, setFiltrosEmpleados] = useState<FiltrosEmpleados>({
    busqueda: '',
    rol: '',
    puesto: '',
    departamento: '',
    modo: 'supervisados',
    soloNoAsignados: true
  });
  
  const [filtrosTareas, setFiltrosTareas] = useState<FiltrosTareas>({
    estado: '',
    prioridad: '',
    asignadoA: '',
    soloSinAsignar: false,
    search: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [activeTab, setActiveTab] = useState('proyectos');
  const [tareasTab, setTareasTab] = useState('todas');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showAsignarTareaModal, setShowAsignarTareaModal] = useState(false);
  const [showReasignarTareaModal, setShowReasignarTareaModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [showAsignarEmpleadoModal, setShowAsignarEmpleadoModal] = useState(false);
  const [showQuitarEmpleadoModal, setShowQuitarEmpleadoModal] = useState(false);
  const [showDetalleEmpleadoModal, setShowDetalleEmpleadoModal] = useState(false);
  const [isEditingTarea, setIsEditingTarea] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoProyecto | null>(null);
  
  const [miEmpleadoId, setMiEmpleadoId] = useState<number | null>(null);
  
  const [createData, setCreateData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    presupuesto: 0,
    montoAsignado: 0,
    moneda: 'MXN',
    estado: 'activo' as 'activo' | 'pausado' | 'finalizado',
    jefeProyectoId: 0
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
  
  // ==========================================
  // FUNCIÓN PARA OBTENER EMPLEADO ID
  // ==========================================
  
  const obtenerEmpleadoId = useCallback(async (): Promise<number | null> => {
    if (!user) return null;
    
    const cachedId = sessionStorage.getItem('empleadoId');
    if (cachedId) {
      const id = parseInt(cachedId);
      setMiEmpleadoId(id);
      if (user) (user as any).empleadoId = id;
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
        if (user) (user as any).empleadoId = empleadoId;
        setMiEmpleadoId(empleadoId);
        return empleadoId;
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }, [user]);
  
  // ==========================================
  // FUNCIÓN PARA VERIFICAR SI SOY EL ASIGNADO
  // ==========================================
  
  const soyAsignadoATarea = useCallback((tarea: Tarea): boolean => {
    if (!miEmpleadoId) return false;
    return tarea.EmpleadoAsignadoID === miEmpleadoId && tarea.estadoAsignacion === 'asignado';
  }, [miEmpleadoId]);
  
  // ==========================================
  // FUNCIÓN PARA VERIFICAR SI SOY JEFE DEL PROYECTO
  // ==========================================
  
  const soyJefeDelProyecto = useCallback((): boolean => {
    if (!selectedProyecto || !miEmpleadoId) return false;
    return selectedProyecto.JefeProyectoID === miEmpleadoId;
  }, [selectedProyecto, miEmpleadoId]);
  
  // ==========================================
  // FUNCIONES DE CARGA
  // ==========================================
  
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
      
      if (isEmployee) {
        params.append('soloMisProyectos', 'false');
      }
      
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
  }, [currentPage, searchTerm, filterEstado, isEmployee]);

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

const loadTareas = async (proyectoId: number, filtros?: Partial<FiltrosTareas>) => {
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
      console.log('📥 [DEBUG] Tareas recibidas:', response.data.data.tareas);
      
      // ✅ CORREGIDO: No filtrar por Activo porque el backend no lo envía
      // En lugar de eso, asumimos que todas las tareas recibidas están activas
      const tareasConDatos = (response.data.data.tareas || []).map((t: any) => ({
        ...t,
        EmpleadoAsignadoID: t.EmpleadoAsignadoID || null,
        EmpleadoAsignadoNombre: t.EmpleadoAsignadoNombre || null,
        estadoAsignacion: t.estadoAsignacion || (t.EmpleadoAsignadoID ? 'asignado' : 'sin_asignar'),
        Prioridad: t.Prioridad || 'media',
        Asignaciones: t.Asignaciones || [],
        Notas: t.Notas || [],
        Activo: true // ✅ Forzar a true ya que vienen del backend con Activo=1
      }));
      
      setTareas(tareasConDatos);
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
        let empleados = response.data.data || [];
        
        const tareasActivas = tareas.filter(t => t.Activo === true);
        
        if (tareasActivas.length > 0) {
          empleados = empleados.map((emp: EmpleadoProyecto) => {
            const tareasAsignadas = tareasActivas.filter(t => 
              t.EmpleadoAsignadoID === emp.ID && t.estadoAsignacion === 'asignado'
            );
            const tareasCompletadas = tareasAsignadas.filter(t => 
              t.Estado === 'realizada'
            );
            
            return {
              ...emp,
              TareasAsignadas: tareasAsignadas.length,
              TareasCompletadas: tareasCompletadas.length,
              Progreso: tareasAsignadas.length > 0 
                ? Math.round((tareasCompletadas.length / tareasAsignadas.length) * 100)
                : 0
            };
          });
        }
        
        setEmpleadosProyecto(empleados);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const loadEmpleadosDisponibles = async (proyectoId: number, modo: 'supervisados' | 'todos' = 'supervisados') => {
    try {
      setLoadingDisponibles(true);
      setError('');
      
      const params = new URLSearchParams();
      params.append('modo', modo);
      
      if (filtrosEmpleados.busqueda) params.append('search', filtrosEmpleados.busqueda);
      if (filtrosEmpleados.departamento) params.append('departamentoId', filtrosEmpleados.departamento);
      if (!filtrosEmpleados.soloNoAsignados) params.append('incluirAsignados', 'true');
      
      const response = await api.get(`/proyectos/${proyectoId}/empleados/disponibles?${params}`);
      
      if (response.data.success) {
        setEmpleadosDisponibles(response.data.data.empleados || []);
        setFiltrosEmpleados(prev => ({ ...prev, modo }));
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('La funcionalidad de empleados disponibles no está disponible en el servidor');
      } else {
        setError(error.response?.data?.message || 'Error cargando empleados disponibles');
      }
      setEmpleadosDisponibles([]);
    } finally {
      setLoadingDisponibles(false);
    }
  };

  const buscarEmpleadosGenerales = async (proyectoId: number) => {
    try {
      setLoadingDisponibles(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filtrosEmpleados.busqueda) params.append('search', filtrosEmpleados.busqueda);
      if (filtrosEmpleados.departamento) params.append('departamentoId', filtrosEmpleados.departamento);
      if (filtrosEmpleados.soloNoAsignados) params.append('soloNoAsignados', 'true');
      params.append('page', '1');
      params.append('limit', '20');
      
      const response = await api.get(`/proyectos/${proyectoId}/empleados/buscar?${params}`);
      
      if (response.data.success) {
        setEmpleadosDisponibles(response.data.data.empleados || []);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        await loadEmpleadosDisponibles(proyectoId, 'todos');
      } else {
        setError(error.response?.data?.message || 'Error en búsqueda de empleados');
      }
    } finally {
      setLoadingDisponibles(false);
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

  // ==========================================
  // EFECTOS
  // ==========================================
  
  useEffect(() => {
    loadProyectos();
  }, [loadProyectos]);

  useEffect(() => {
    const cargarEmpleadoId = async () => {
      const empleadoId = await obtenerEmpleadoId();
      if (empleadoId) {
        setMiEmpleadoId(empleadoId);
      }
    };
  
    cargarEmpleadoId();
  }, [obtenerEmpleadoId]);

  useEffect(() => {
    if (selectedProyecto) {
      loadTareas(selectedProyecto.ID);
      loadEmpleadosProyecto(selectedProyecto.ID);
      loadHistorial(selectedProyecto.ID);
    }
  }, [selectedProyecto, miEmpleadoId]);

  // ==========================================
  // FUNCIONES CRUD - PROYECTOS
  // ==========================================
  
  const handleCreateProyecto = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!createData.nombre || !createData.fechaInicio || !createData.presupuesto || !createData.jefeProyectoId) {
        setError('Nombre, fecha de inicio, presupuesto y jefe de proyecto son requeridos');
        return;
      }

      const response = await api.post('/proyectos', createData);
      
      if (response.data.success) {
        setSuccess('Proyecto creado exitosamente');
        setShowCreateModal(false);
        resetCreateForm();
        loadProyectos();
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
        loadProyectos();
        loadProyecto(selectedProyecto.ID);
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
        loadProyectos();
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
        loadProyectos();
        if (selectedProyecto?.ID === proyectoId) {
          loadProyecto(proyectoId);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cambiando estado');
    }
  };

  // ==========================================
  // FUNCIONES CRUD - EMPLEADOS
  // ==========================================
  
  const handleAsignarEmpleado = async (proyectoId: number, empleadoId: number) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await api.post(`/proyectos/${proyectoId}/empleados`, { empleadoId });
      
      if (response.data.success) {
        setSuccess(`Empleado asignado exitosamente al proyecto`);
        await Promise.all([
          loadEmpleadosProyecto(proyectoId),
          loadEmpleadosDisponibles(proyectoId, filtrosEmpleados.modo)
        ]);
        setShowAsignarEmpleadoModal(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error asignando empleado');
    }
  };

  const handleQuitarEmpleado = async (proyectoId: number, empleado: EmpleadoProyecto) => {
    const empleadoId = await obtenerEmpleadoId();
    if (!empleadoId) {
      setError('No se pudo verificar tu identidad');
      return;
    }
    
    const esJefeProyecto = selectedProyecto?.JefeProyectoID === empleadoId;
    
    if (!isAdmin && !esJefeProyecto) {
      setError('Solo el administrador o el jefe del proyecto pueden quitar empleados');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.delete(`/proyectos/${proyectoId}/empleados/${empleado.ID}`);
      
      if (response.data.success) {
        setSuccess(`Empleado ${empleado.NombreCompleto} removido exitosamente`);
        await Promise.all([
          loadEmpleadosProyecto(proyectoId),
          loadEmpleadosDisponibles(proyectoId, filtrosEmpleados.modo)
        ]);
        setShowQuitarEmpleadoModal(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error removiendo empleado');
    }
  };

  // ==========================================
  // FUNCIONES CRUD - TAREAS
  // ==========================================
  
  const handleCrearTarea = async () => {
    if (!selectedProyecto) return;
    
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
        resetTareaForm();
        setIsEditingTarea(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creando tarea');
    }
  };

  const handleActualizarTarea = async () => {
    if (!selectedProyecto || !selectedTarea) return;
    
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
    
    const esJefeProyecto = selectedProyecto.JefeProyectoID === miEmpleadoId;
    const esAsignado = tarea.EmpleadoAsignadoID === miEmpleadoId;
    const tareaSinAsignar = !tarea.EmpleadoAsignadoID || tarea.estadoAsignacion === 'sin_asignar';
    
    const puedeCambiarEstado = isAdmin || esJefeProyecto || esAsignado || tareaSinAsignar;
    
    if (!puedeCambiarEstado) {
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
    
    const empleadoId = await obtenerEmpleadoId();
    if (!empleadoId) {
      setError('No se pudo verificar tu identidad');
      return;
    }
    
    const esJefeProyecto = selectedProyecto.JefeProyectoID === empleadoId;
    
    if (!isAdmin && !esJefeProyecto) {
      setError('Solo el administrador o el jefe del proyecto pueden reasignar tareas');
      return;
    }
    
    try {
      setLoading(true);
      
      const payload = { 
        empleadoId: reasignarData.empleadoId 
      };
      
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
      if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'No tienes permiso para reasignar esta tarea');
      } else if (error.response?.status === 404) {
        setError('El endpoint de reasignación no existe o la tarea no fue encontrada');
      } else {
        setError(error.response?.data?.message || 'Error reasignando tarea');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTarea = async (tareaId: number) => {
    if (!selectedProyecto) return;
    
    const empleadoId = await obtenerEmpleadoId();
    if (!empleadoId) {
      setError('No se pudo verificar tu identidad');
      return;
    }
    
    const esJefeProyecto = selectedProyecto.JefeProyectoID === empleadoId;
    
    if (!isAdmin && !esJefeProyecto) {
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

  // ==========================================
  // FUNCIONES CRUD - NOTAS
  // ==========================================
  
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

  // ==========================================
  // FUNCIONES DE UTILIDAD
  // ==========================================
  
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
      jefeProyectoId: 0
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

  const resetFiltrosEmpleados = () => {
    setFiltrosEmpleados({
      busqueda: '',
      rol: '',
      puesto: '',
      departamento: '',
      modo: 'supervisados',
      soloNoAsignados: true
    });
  };

  const resetFiltrosTareas = () => {
    setFiltrosTareas({
      estado: '',
      prioridad: '',
      asignadoA: '',
      soloSinAsignar: false,
      search: ''
    });
  };

  const openProyecto = async (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    resetFiltrosTareas();
    await loadTareas(proyecto.ID);
    await loadEmpleadosProyecto(proyecto.ID);
    await loadHistorial(proyecto.ID);
    setShowViewModal(true);
    setActiveTab('tareas');
  };

  const openEditProyecto = (proyecto: Proyecto) => {
    setSelectedProyecto(proyecto);
    setEditData({
      nombre: proyecto.Nombre,
      descripcion: proyecto.Descripcion || '',
      fechaInicio: proyecto.FechaInicio,
      fechaFin: proyecto.FechaFin || '',
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

  const openAsignarEmpleadoModal = async (proyecto: Proyecto, modo: 'supervisados' | 'todos' = 'supervisados') => {
    setSelectedProyecto(proyecto);
    resetFiltrosEmpleados();
    setFiltrosEmpleados(prev => ({ ...prev, modo }));
    await loadEmpleadosDisponibles(proyecto.ID, modo);
    setShowAsignarEmpleadoModal(true);
  };

  const openQuitarEmpleadoModal = (empleado: EmpleadoProyecto) => {
    setSelectedEmpleado(empleado);
    setShowQuitarEmpleadoModal(true);
  };

  const openCrearTareaModal = () => {
    setIsEditingTarea(false);
    setSelectedTarea(null);
    resetTareaForm();
    setShowTareaModal(true);
  };

  const openEditarTareaModal = (tarea: Tarea) => {
    setIsEditingTarea(true);
    setSelectedTarea(tarea);
    setTareaData({
      titulo: tarea.Titulo,
      descripcion: tarea.Descripcion || '',
      fechaVencimiento: tarea.FechaVencimiento || '',
      prioridad: tarea.Prioridad as 'baja' | 'media' | 'alta' | 'urgente',
      estado: tarea.Estado,
      empleadoId: tarea.EmpleadoAsignadoID || null
    });
    setShowTareaModal(true);
  };

  const openReasignarTareaModal = (tarea: Tarea) => {
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

  const cambiarModoEmpleados = async (modo: 'supervisados' | 'todos') => {
    if (!selectedProyecto) return;
    setFiltrosEmpleados(prev => ({ ...prev, modo, busqueda: '', rol: '', puesto: '', departamento: '' }));
    await loadEmpleadosDisponibles(selectedProyecto.ID, modo);
  };

  const aplicarFiltrosEmpleados = async () => {
    if (!selectedProyecto) return;
    if (filtrosEmpleados.modo === 'todos' && filtrosEmpleados.soloNoAsignados) {
      await buscarEmpleadosGenerales(selectedProyecto.ID);
    } else {
      await loadEmpleadosDisponibles(selectedProyecto.ID, filtrosEmpleados.modo);
    }
  };

  const aplicarFiltrosTareas = async () => {
    if (!selectedProyecto) return;
    await loadTareas(selectedProyecto.ID, filtrosTareas);
  };

  // ==========================================
  // FUNCIONES DE RENDERIZADO
  // ==========================================
  
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
    const config: Record<string, { bg: string; label: string }> = {
      admin: { bg: 'danger', label: 'ADMIN' },
      manager: { bg: 'warning', label: 'MANAGER' },
      employee: { bg: 'info', label: 'EMPLEADO' }
    };
    const cfg = config[rol] || { bg: 'secondary', label: rol?.toUpperCase() || 'SIN ROL' };
    return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
  };

  // ==========================================
  // COMPONENTES INTERNOS
  // ==========================================
  
  const TarjetaEmpleado: React.FC<{ 
    empleado: EmpleadoProyecto; 
    proyectoId: number;
  }> = ({ empleado, proyectoId }) => {
    const [isHovered, setIsHovered] = useState(false);
    const esJefe = empleado.ID === selectedProyecto?.JefeProyectoID;
    const esMiUsuario = miEmpleadoId === empleado.ID;
    
    return (
      <Card 
        className={`h-100 shadow-sm border-0 ${esMiUsuario ? 'border-success border-2' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transition: 'all 0.2s',
          transform: isHovered ? 'translateY(-2px)' : 'none',
          boxShadow: isHovered ? '0 0.5rem 1rem rgba(0,0,0,0.15)' : '0 0.125rem 0.25rem rgba(0,0,0,0.075)'
        }}
      >
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-center">
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                  esJefe ? 'bg-warning' : 
                  esMiUsuario ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: '48px', height: '48px' }}
              >
                <FontAwesomeIcon icon={faUserCircle} className="text-white" size="lg" />
              </div>
              <div>
                <h6 className="mb-1 d-flex align-items-center">
                  {empleado.NombreCompleto}
                  {esJefe && (
                    <Badge bg="warning" text="dark" className="ms-2">
                      <FontAwesomeIcon icon={faCrown} className="me-1" size="sm" />
                      JEFE
                    </Badge>
                  )}
                  {esMiUsuario && !esJefe && (
                    <Badge bg="success" className="ms-2">
                      <FontAwesomeIcon icon={faUserCheck} className="me-1" size="sm" />
                      TÚ
                    </Badge>
                  )}
                </h6>
                <small className="text-muted d-block">{empleado.CorreoElectronico}</small>
                <div className="mt-1 d-flex flex-wrap gap-1">
                  {getRolBadge(empleado.RolApp)}
                  {empleado.PuestoNombre && (
                    <Badge bg="light" text="dark">
                      <FontAwesomeIcon icon={faBriefcase} className="me-1" size="sm" />
                      {empleado.PuestoNombre}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {canManage && !esJefe && (
              <Button
                variant={isHovered ? "danger" : "link"}
                className={isHovered ? "" : "text-muted p-0"}
                onClick={() => openQuitarEmpleadoModal(empleado)}
                size="sm"
              >
                <FontAwesomeIcon icon={faUserMinus} />
              </Button>
            )}
          </div>
          
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">
                <FontAwesomeIcon icon={faCalendar} className="me-1" />
                {empleado.FechaAsignacionFormateada || new Date(empleado.FechaAsignacion).toLocaleDateString()}
              </small>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Tareas asignadas / completadas</Tooltip>}
              >
                <Badge bg="info" className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faTasks} className="me-1" size="sm" />
                  {empleado.TareasAsignadas || 0}/{empleado.TareasCompletadas || 0}
                </Badge>
              </OverlayTrigger>
            </div>
            
            {(empleado.TareasAsignadas || 0) > 0 ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">Progreso</small>
                  <small className="text-muted">{empleado.Progreso || 0}%</small>
                </div>
                <ProgressBar 
                  now={empleado.Progreso || 0} 
                  variant="success"
                  style={{ height: '6px' }}
                />
              </div>
            ) : (
              <small className="text-muted fst-italic">Sin tareas asignadas</small>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  const TarjetaEmpleadoDisponible: React.FC<{ 
    empleado: EmpleadoDisponible; 
    proyectoId: number;
    onAsignar: () => void;
  }> = ({ empleado, onAsignar }) => {
    return (
      <ListGroup.Item 
        action
        className="py-3 px-3"
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-start">
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                empleado.RolApp === 'admin' ? 'bg-danger' :
                empleado.RolApp === 'manager' ? 'bg-warning' : 'bg-info'
              }`}
              style={{ width: '40px', height: '40px' }}
            >
              <FontAwesomeIcon icon={faUserCircle} className="text-white" />
            </div>
            <div>
              <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                <strong>{empleado.NombreCompleto}</strong>
                {getRolBadge(empleado.RolApp)}
                {empleado.EsSubordinado === 1 && (
                  <Badge bg="primary">
                    <FontAwesomeIcon icon={faUserClock} className="me-1" size="sm" />
                    BAJO SUPERVISIÓN
                  </Badge>
                )}
                {empleado.EstadoAsignacion === 'asignado' && (
                  <Badge bg="success">YA ASIGNADO</Badge>
                )}
              </div>
              
              <small className="text-muted d-block">
                <FontAwesomeIcon icon={faEnvelope} className="me-1" size="sm" />
                {empleado.CorreoElectronico}
              </small>
              
              <div className="d-flex flex-wrap gap-2 mt-1">
                {empleado.PuestoNombre && (
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faBriefcase} className="me-1" size="sm" />
                    {empleado.PuestoNombre}
                  </small>
                )}
                {empleado.DepartamentoNombre && (
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faBuilding} className="me-1" size="sm" />
                    {empleado.DepartamentoNombre}
                  </small>
                )}
                <small className="text-muted">
                  <FontAwesomeIcon icon={faCalendar} className="me-1" size="sm" />
                  {empleado.AntiguedadAnios} años
                </small>
              </div>
              
              <div className="d-flex gap-3 mt-1">
                <small className="text-muted">
                  <FontAwesomeIcon icon={faTasks} className="me-1" size="sm" />
                  {empleado.TareasPendientes} tareas pendientes
                </small>
                <small className="text-muted">
                  <FontAwesomeIcon icon={faProjectDiagram} className="me-1" size="sm" />
                  {empleado.ProyectosActivos} proyectos activos
                </small>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={onAsignar}
            disabled={empleado.EstadoAsignacion === 'asignado'}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-1" />
            Asignar
          </Button>
        </div>
      </ListGroup.Item>
    );
  };

  const KanbanBoard: React.FC<{ tareas: Tarea[] }> = ({ tareas }) => {
    const [draggedTask, setDraggedTask] = useState<Tarea | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const columnas = [
      { id: 'pendiente', titulo: 'Pendiente', icon: faClock, color: 'secondary', bg: '#f8f9fa' },
      { id: 'en_proceso', titulo: 'En Proceso', icon: faPlayCircle, color: 'primary', bg: '#e7f1ff' },
      { id: 'realizada', titulo: 'Finalizada', icon: faCheckCircle, color: 'success', bg: '#e8f5e9' }
    ];

  const getTareasByEstado = (estado: string) => {
    let tareasFiltradas = tareas.filter(t => t.Estado === estado);
    if (tareasTab === 'mis-tareas') {
      if (miEmpleadoId) {
        tareasFiltradas = tareasFiltradas.filter(t => 
          t.EmpleadoAsignadoID === miEmpleadoId
        );
      }
    }
    return tareasFiltradas;
  };

    const handleDragStart = (e: React.DragEvent, tarea: Tarea) => {
      const esJefe = soyJefeDelProyecto();
      const esAsignado = soyAsignadoATarea(tarea);
      const tareaSinAsignar = !tarea.EmpleadoAsignadoID;
      
      const puedeArrastrar = isAdmin || esJefe || esAsignado || tareaSinAsignar;
      
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
                    const puedeArrastrar = isAdmin || esJefe || esAsignado || tareaSinAsignar;
                    const puedeEditar = isAdmin || esJefe || esAsignado || tareaSinAsignar;
                    
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
                                  className="text-muted me-2" 
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
                                overlay={<Tooltip>Fecha límite: {new Date(tarea.FechaVencimiento).toLocaleDateString()}</Tooltip>}
                              >
                                <Badge 
                                  bg={new Date(tarea.FechaVencimiento) < new Date() && tarea.Estado !== 'realizada' ? 'danger' : 'light'} 
                                  text={new Date(tarea.FechaVencimiento) < new Date() && tarea.Estado !== 'realizada' ? 'white' : 'dark'}
                                  className="d-flex align-items-center"
                                >
                                  <FontAwesomeIcon icon={faCalendar} className="me-1" size="sm" />
                                  <small>{new Date(tarea.FechaVencimiento).toLocaleDateString()}</small>
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
                            {(isAdmin || esJefe) && (
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
                                {(isAdmin || esJefe || esAsignado || tareaSinAsignar) && (
                                  <Dropdown.Item onClick={() => openEditarTareaModal(tarea)}>
                                    <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
                                    Editar
                                  </Dropdown.Item>
                                )}
                                
                                {(isAdmin || esJefe) && (
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
    let tareasFiltradas = [...tareas].filter(t => t.Activo === true);

    if (tareasTab === 'mis-tareas') {
      if (miEmpleadoId) {
        tareasFiltradas = tareasFiltradas.filter(t => 
          t.EmpleadoAsignadoID === miEmpleadoId
        );
      }
    }

    if (loadingTareas) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando tareas...</p>
        </div>
      );
    }

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            {tareasFiltradas.length} tareas encontradas
          </small>
        </div>

        {tareasFiltradas.length === 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <FontAwesomeIcon icon={faTasks} size="3x" className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No hay tareas que mostrar</h6>
              <p className="text-muted small mb-0">
                {tareasTab === 'mis-tareas' 
                  ? 'No tienes tareas asignadas' 
                  : 'Intenta con otros filtros'}
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
                      <div className="d-flex align-items-center gap-2 mb-2">
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
                      
                      {tarea.Descripcion && (
                        <p className="small text-muted mb-2">{tarea.Descripcion}</p>
                      )}
                      
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        {tarea.FechaVencimiento && (
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faCalendar} className="me-1" />
                            Vence: {new Date(tarea.FechaVencimiento).toLocaleDateString()}
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
                        {(isAdmin || esJefe || esAsignado || tareaSinAsignar) && (
                          <>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'pendiente')}
                              disabled={tarea.Estado === 'pendiente'}
                            >
                              <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                              Mover a Pendiente
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'en_proceso')}
                              disabled={tarea.Estado === 'en_proceso'}
                            >
                              <FontAwesomeIcon icon={faPlayCircle} className="me-2 text-primary" />
                              Mover a En Proceso
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleCambiarEstadoTarea(tarea.ID, 'realizada')}
                              disabled={tarea.Estado === 'realizada'}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                              Mover a Finalizada
                            </Dropdown.Item>
                            <Dropdown.Divider />
                          </>
                        )}
                        
                        <Dropdown.Item onClick={() => openNotaModal(tarea)}>
                          <FontAwesomeIcon icon={faComment} className="me-2 text-info" />
                          Ver/Agregar Notas
                        </Dropdown.Item>
                        
                        {(isAdmin || esJefe) && (
                          <>
                            <Dropdown.Item onClick={() => openReasignarTareaModal(tarea)}>
                              <FontAwesomeIcon icon={faUserFriends} className="me-2 text-primary" />
                              Reasignar Tarea
                            </Dropdown.Item>
                          </>
                        )}
                        
                        {(isAdmin || esJefe || esAsignado || tareaSinAsignar) && (
                          <Dropdown.Item onClick={() => openEditarTareaModal(tarea)}>
                            <FontAwesomeIcon icon={faEdit} className="me-2 text-warning" />
                            Editar Tarea
                          </Dropdown.Item>
                        )}
                        
                        {(isAdmin || esJefe) && (
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

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  
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
              Rol: {userRol?.toUpperCase() || 'NO DEFINIDO'}
            </Badge>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">

      {/* HEADER */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h2 className="mb-0 d-flex align-items-center">
                <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-primary" />
                Gestión de Proyectos
              </h2>
              <p className="text-muted mb-0 d-flex align-items-center">
                {isAdmin && 'Administrador - Gestión completa'}
                {isManager && 'Manager - Administra tus proyectos'}
                {isEmployee && 'Empleado - Visualiza tus tareas asignadas'}
                {miEmpleadoId && ` (ID: ${miEmpleadoId})`}
                {selectedProyecto && soyJefeDelProyecto()}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  loadProyectos();
                  obtenerEmpleadoId();
                }}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faSync} className="me-2" />
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

      {/* ALERTAS */}
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

      {/* TABS PRINCIPALES */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'proyectos')}
        className="mb-4"
        fill
      >
        <Tab 
          eventKey="proyectos" 
          title={
            <span className="d-flex align-items-center justify-content-center gap-2">
              <FontAwesomeIcon icon={faProjectDiagram} />
              <span>Proyectos</span>
              <Badge bg="secondary" pill>{proyectos.length}</Badge>
            </span>
          }
        >
          {/* FILTROS DE PROYECTOS */}
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
                    <option value="activo">✅ Activos</option>
                    <option value="pausado">⏸️ Pausados</option>
                    <option value="finalizado">🏁 Finalizados</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* LISTA DE PROYECTOS */}
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
                                    <Dropdown.Item onClick={() => openAsignarEmpleadoModal(proyecto, 'supervisados')}>
                                      <FontAwesomeIcon icon={faUserPlus} className="me-2 text-primary" />
                                      Asignar Empleado
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
                                Inicio: {new Date(proyecto.FechaInicio).toLocaleDateString()}
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
                                  {soyJefeDeEsteProyecto}
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

              {/* PAGINACIÓN */}
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
        </Tab>
      </Tabs>

      {/* ======================================== */}
      {/* MODALES */}
      {/* ======================================== */}

      {/* MODAL DE VISUALIZACIÓN DE PROYECTO */}
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
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedProyecto && (
            <div>
              {/* HEADER DEL PROYECTO */}
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
                    Inicio: {new Date(selectedProyecto.FechaInicio).toLocaleDateString()}
                    {selectedProyecto.FechaFin && ` - Fin: ${new Date(selectedProyecto.FechaFin).toLocaleDateString()}`}
                  </p>
                </div>
                
                {canManage && (
                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={() => {
                        setShowViewModal(false);
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

              {/* DESCRIPCIÓN */}
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

              {/* TABS DEL PROYECTO */}
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
                  </span>
                }>
                  {/* FILTROS DE TAREAS */}
                  <Card className="mb-4 border-0 bg-light">
                    <Card.Body className="p-3">
                      <Row className="g-2">
                        <Col md={4}>
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
                        <Col md={2}>
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
                              <option key={emp.ID} value={emp.ID}>
                                {emp.NombreCompleto}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={2}>

                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* HEADER DE TAREAS */}
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
                      
                      {canManageTareas && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={openCrearTareaModal}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faPlus} className="me-2" />
                          Nueva Tarea
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* KANBAN / LISTA DE TAREAS */}
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
                  </span>
                }>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <h6 className="mb-3 mb-md-0 d-flex align-items-center">
                      <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                      Miembros del equipo ({empleadosProyecto.length})
                    </h6>
                    
                    {canManage && (
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openAsignarEmpleadoModal(selectedProyecto, 'supervisados')}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faUserClock} className="me-2" />
                          Asignar supervisados
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAsignarEmpleadoModal(selectedProyecto, 'todos')}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                          Asignar de toda la empresa
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {loadingEmpleados ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" size="sm" />
                      <p className="text-muted mt-2">Cargando empleados...</p>
                    </div>
                  ) : empleadosProyecto.length === 0 ? (
                    <Card className="text-center py-5 border-0 bg-light">
                      <Card.Body>
                        <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3 opacity-50" />
                        <h6 className="text-muted">No hay empleados asignados</h6>
                        <p className="text-muted mb-3">
                          Este proyecto no tiene miembros asignados.
                        </p>
                        {canManage && (
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openAsignarEmpleadoModal(selectedProyecto, 'supervisados')}
                            >
                              <FontAwesomeIcon icon={faUserClock} className="me-2" />
                              Asignar supervisados
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openAsignarEmpleadoModal(selectedProyecto, 'todos')}
                            >
                              <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                              Asignar primer empleado
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ) : (
                    <Row className="g-3">
                      {empleadosProyecto.map(empleado => (
                        <Col key={empleado.ID} xs={12} md={6} lg={4}>
                          <TarjetaEmpleado 
                            empleado={empleado}
                            proyectoId={selectedProyecto.ID}
                          />
                        </Col>
                      ))}
                    </Row>
                  )}
                </Tab>

                <Tab eventKey="historial" title={
                  <span className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faHistory} />
                    Historial
                  </span>
                }>
                  <div>
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
                        {historial.map((item, index) => (
                          <div key={item.ID} className="timeline-item">
                            <div className="timeline-badge">
                              {item.Accion.includes('creado') && '🆕'}
                              {item.Accion.includes('actualizado') && '✏️'}
                              {item.Accion.includes('asignado') && '👤'}
                              {item.Accion.includes('removido') && '❌'}
                              {item.Accion.includes('eliminado') && '🗑️'}
                              {!item.Accion.includes('creado') && 
                               !item.Accion.includes('actualizado') && 
                               !item.Accion.includes('asignado') && 
                               !item.Accion.includes('removido') && 
                               !item.Accion.includes('eliminado') && '📝'}
                            </div>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong className="text-primary">{item.Accion}</strong>
                                  <small className="text-muted">
                                    {new Date(item.createdAt).toLocaleString('es-MX', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
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
                  </div>
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

      {/* MODAL DE ASIGNAR EMPLEADO A PROYECTO */}
      <Modal 
        show={showAsignarEmpleadoModal} 
        onHide={() => setShowAsignarEmpleadoModal(false)} 
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className={`text-white ${
          filtrosEmpleados.modo === 'supervisados' ? 'bg-primary' : 'bg-success'
        }`}>
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon 
              icon={filtrosEmpleados.modo === 'supervisados' ? faUserClock : faUserPlus} 
              className="me-2" 
            />
            {filtrosEmpleados.modo === 'supervisados' 
              ? 'Asignar Empleado bajo Supervisión' 
              : 'Asignar Empleado de toda la Empresa'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* SELECTOR DE MODO */}
          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Modo de búsqueda:</span>
                <div className="d-flex gap-2">
                  <Button
                    variant={filtrosEmpleados.modo === 'supervisados' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => cambiarModoEmpleados('supervisados')}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon icon={faUserClock} className="me-2" />
                    Solo supervisados
                  </Button>
                  <Button
                    variant={filtrosEmpleados.modo === 'todos' ? 'success' : 'outline-success'}
                    size="sm"
                    onClick={() => cambiarModoEmpleados('todos')}
                    className="d-flex align-items-center"
                  >
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
                    Toda la empresa
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* FILTROS */}
          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={6}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white border-0">
                      <FontAwesomeIcon icon={faSearch} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar por nombre o email..."
                      value={filtrosEmpleados.busqueda}
                      onChange={(e) => {
                        setFiltrosEmpleados(prev => ({ ...prev, busqueda: e.target.value }));
                      }}
                      className="border-0 bg-white"
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosEmpleados.rol}
                    onChange={(e) => setFiltrosEmpleados(prev => ({ ...prev, rol: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={filtrosEmpleados.departamento}
                    onChange={(e) => setFiltrosEmpleados(prev => ({ ...prev, departamento: e.target.value }))}
                    className="bg-white border-0"
                  >
                    <option value="">Todos los deptos</option>
                  </Form.Select>
                </Col>
              </Row>
              
              {filtrosEmpleados.modo === 'todos' && (
                <Row className="mt-2">
                  <Col>
                    <Form.Check
                      type="checkbox"
                      label="Mostrar solo empleados no asignados"
                      checked={filtrosEmpleados.soloNoAsignados}
                      onChange={(e) => {
                        setFiltrosEmpleados(prev => ({ ...prev, soloNoAsignados: e.target.checked }));
                      }}
                    />
                  </Col>
                </Row>
              )}

              <div className="d-flex justify-content-end mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={aplicarFiltrosEmpleados}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Aplicar filtros
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* RESULTADOS */}
          {loadingDisponibles ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Buscando empleados...</p>
            </div>
          ) : error ? (
            <Alert variant="warning" className="mb-0">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <div>
                  {error}
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => selectedProyecto && loadEmpleadosDisponibles(selectedProyecto.ID, filtrosEmpleados.modo)}
                  >
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </Alert>
          ) : empleadosDisponibles.length === 0 ? (
            <Card className="text-center py-5 border-0 bg-light">
              <Card.Body>
                <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No hay empleados disponibles</h6>
                <p className="text-muted mb-0">
                  {filtrosEmpleados.modo === 'supervisados'
                    ? 'No hay más empleados bajo tu supervisión para asignar'
                    : 'Todos los empleados ya están asignados a este proyecto'}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <>
              <p className="text-muted small mb-3 d-flex align-items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Mostrando {empleadosDisponibles.length} empleados disponibles
              </p>
              <ListGroup variant="flush" className="border rounded">
                {empleadosDisponibles.map(emp => (
                  <TarjetaEmpleadoDisponible 
                    key={emp.ID}
                    empleado={emp}
                    proyectoId={selectedProyecto!.ID}
                    onAsignar={() => handleAsignarEmpleado(selectedProyecto!.ID, emp.ID)}
                  />
                ))}
              </ListGroup>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowAsignarEmpleadoModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE QUITAR EMPLEADO */}
      <Modal 
        show={showQuitarEmpleadoModal} 
        onHide={() => setShowQuitarEmpleadoModal(false)} 
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUserMinus} className="me-2" />
            Quitar Empleado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmpleado && (
            <>
              <p>¿Estás seguro de quitar a <strong>{selectedEmpleado.NombreCompleto}</strong> del proyecto?</p>
              <Alert variant="warning" className="mb-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Este empleado tiene <strong>{selectedEmpleado.TareasAsignadas || 0} tareas asignadas</strong>.
                {selectedEmpleado.TareasAsignadas ? ' Se desasignarán automáticamente.' : ''}
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuitarEmpleadoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={() => selectedProyecto && selectedEmpleado && 
              handleQuitarEmpleado(selectedProyecto.ID, selectedEmpleado)
            }
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Quitar Empleado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE CREAR/EDITAR TAREA */}
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
                    <option value="baja">🟢 Baja</option>
                    <option value="media">🔵 Media</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
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
                    <option key={emp.ID} value={emp.ID}>
                      {emp.NombreCompleto} ({emp.RolApp})
                      {emp.ID === miEmpleadoId}
                      {emp.ID === selectedProyecto?.JefeProyectoID}
                    </option>
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

      {/* MODAL DE REASIGNAR TAREA */}
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
                  {empleadosProyecto
                    .filter(emp => emp.Activo !== false)
                    .map(emp => (
                      <option key={emp.ID} value={emp.ID}>
                        {emp.NombreCompleto} ({emp.RolApp})
                        {emp.ID === selectedProyecto.JefeProyectoID && ' 👑'}
                        {emp.ID === miEmpleadoId && ' (tú)'}
                        {emp.ID === selectedTarea.EmpleadoAsignadoID && ' (actual)'}
                      </option>
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

      {/* MODAL DE NOTAS */}
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
              {canManage && (
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
                notas.map(nota => {
                  if (nota.EsPrivada && !isAdmin) return null;
                  return (
                    <Card key={nota.ID} className="mb-3 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                                 style={{ width: '32px', height: '32px' }}>
                              <FontAwesomeIcon icon={faUserCircle} className="text-white" size="sm" />
                            </div>
                            <div>
                              <strong className="d-block">{nota.EmpleadoNombre}</strong>
                              <small className="text-muted">
                                {new Date(nota.createdAt).toLocaleString('es-MX', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
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

      {/* MODAL DE CREAR PROYECTO */}
      <Modal 
  show={showCreateModal} 
  onHide={() => setShowCreateModal(false)} 
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
            <Form.Control
              type="number"
              value={createData.jefeProyectoId}
              onChange={(e) => setCreateData({...createData, jefeProyectoId: parseInt(e.target.value) || 0})}
              placeholder="ID del empleado"
              className="bg-light border-0"
            />
            <Form.Text className="text-muted">
              Debe ser un empleado con rol de manager
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
              <option value="activo" className="d-flex align-items-center">
                <span className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faPlayCircle} className="text-success me-2" />
                  Activo
                </span>
              </option>
              <option value="pausado" className="d-flex align-items-center">
                <span className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faPauseCircle} className="text-warning me-2" />
                  Pausado
                </span>
              </option>
              <option value="finalizado" className="d-flex align-items-center">
                <span className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faStopCircle} className="text-danger me-2" />
                  Finalizado
                </span>
              </option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
      Cancelar
    </Button>
    <Button variant="primary" onClick={handleCreateProyecto}>
      <FontAwesomeIcon icon={faSave} className="me-2" />
      Crear Proyecto
    </Button>
  </Modal.Footer>
</Modal>

      {/* MODAL DE EDITAR PROYECTO */}
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
                    <option value="activo" className="d-flex align-items-center">
                      <span className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faPlayCircle} className="text-success me-2" />
                        Activo
                      </span>
                    </option>
                    <option value="pausado" className="d-flex align-items-center">
                      <span className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faPauseCircle} className="text-warning me-2" />
                        Pausado
                      </span>
                    </option>
                    <option value="finalizado" className="d-flex align-items-center">
                      <span className="d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faStopCircle} className="text-danger me-2" />
                        Finalizado
                      </span>
                    </option>
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

      {/* MODAL DE ELIMINAR PROYECTO */}
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

      {/* ESTILOS ADICIONALES */}
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