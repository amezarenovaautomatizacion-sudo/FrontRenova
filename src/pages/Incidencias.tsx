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
  Pagination,
  Tabs,
  Tab,
  ButtonGroup,
  ListGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faSearch,
  faCalendar,
  faClock,
  faUser,
  faCheckCircle,
  faTimesCircle,
  faSync,
  faExclamationTriangle,
  faInfoCircle,
  faFilter,
  faUserCircle,
  faUserShield,
  faStickyNote,
  faBan,
  faListAlt,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

// Interfaces actualizadas según la API real
interface TipoIncidencia {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  Activo: number; // La API devuelve 1 o 0
  createdAt: string;
  updatedAt: string;
}

interface EmpleadoSelect {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  PuestoNombre?: string | null;
}

// Interfaz para la respuesta de /incidencias (admin/manager)
interface IncidenciaFromAPI {
  ID: number;
  EmpleadoID: number;
  TipoIncidenciaID: number;
  Descripcion: string;
  FechaIncidencia: string;
  HoraIncidencia: string | null;
  Observaciones: string | null;
  Activo: number; // 1 o 0
  CreadoPor: number;
  createdAt: string;
  updatedAt: string;
  SolicitudID: number | null;
  TipoIncidenciaNombre: string;
  EmpleadoNombre: string;
  EmpleadoCorreo: string;
  CreadoPorUsuario: string; // Email de quien creó
}

// Interfaz para la respuesta de /mis-incidencias (employee)
interface MisIncidenciaFromAPI extends IncidenciaFromAPI {
  TipoIncidenciaDescripcion?: string;
  TipoSolicitud?: string;
  EstadoSolicitud?: string;
  MotivoSolicitud?: string;
}

// Interfaz unificada para usar en el frontend
interface Incidencia {
  ID: number;
  EmpleadoID: number;
  EmpleadoNombre: string;
  EmpleadoCorreo?: string;
  TipoIncidenciaID: number;
  TipoIncidenciaNombre: string;
  Descripcion: string;
  FechaIncidencia: string;
  HoraIncidencia?: string | null;
  Observaciones?: string | null;
  activo: boolean; // Convertido de Activo (1/0)
  CreadoPor: number;
  CreadorEmail: string; // Cambiado de CreadorNombre a CreadorEmail
  FechaCreacion: string;
  // Campos opcionales de mis-incidencias
  TipoSolicitud?: string;
  EstadoSolicitud?: string;
}

interface CreateIncidenciaData {
  empleadoId: number;
  tipoIncidenciaId: number;
  descripcion: string;
  fechaIncidencia: string;
  horaIncidencia?: string;
  observaciones?: string;
}

interface UpdateIncidenciaData {
  tipoIncidenciaId?: number;
  descripcion?: string;
  fechaIncidencia?: string;
  horaIncidencia?: string;
  observaciones?: string;
}

const Incidencias: React.FC = () => {
  const { user } = useAuth();
  const userRol = user?.rol || '';
  
  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  const isEmployee = userRol === 'employee';
  
  const canCreate = isAdmin || isManager;
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canChangeStatus = isAdmin;
  const canViewAll = isAdmin || isManager;
  const canViewTipos = isAdmin || isManager;
  const canManageTipos = isAdmin;
  
  const [activeTab, setActiveTab] = useState('incidencias');
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [misIncidencias, setMisIncidencias] = useState<Incidencia[]>([]);
  const [tiposIncidencia, setTiposIncidencia] = useState<TipoIncidencia[]>([]);
  const [empleadosSupervisados, setEmpleadosSupervisados] = useState<EmpleadoSelect[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateTipoModal, setShowCreateTipoModal] = useState(false);
  const [showEditTipoModal, setShowEditTipoModal] = useState(false);
  
  // Estados para formularios
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoIncidencia | null>(null);
  const [createData, setCreateData] = useState<CreateIncidenciaData>({
    empleadoId: 0,
    tipoIncidenciaId: 0,
    descripcion: '',
    fechaIncidencia: new Date().toISOString().split('T')[0],
    horaIncidencia: ''
  });
  const [editData, setEditData] = useState<UpdateIncidenciaData>({});
  const [tipoData, setTipoData] = useState({ nombre: '', descripcion: '' });
  const [editTipoData, setEditTipoData] = useState({ nombre: '', descripcion: '' });
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpleado, setFilterEmpleado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Función para cargar incidencias (admin/manager)
  const loadIncidencias = useCallback(async () => {
    if (!canViewAll) return;
    
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterEmpleado) params.append('empleadoId', filterEmpleado);
      if (filterTipo) params.append('tipoIncidenciaId', filterTipo);
      if (filterFechaDesde) params.append('fechaDesde', filterFechaDesde);
      if (filterFechaHasta) params.append('fechaHasta', filterFechaHasta);
      
      const response = await api.get(`/incidencias?${params}`);
      
      if (response.data.success) {
        const incidenciasFromAPI: IncidenciaFromAPI[] = response.data.data.incidencias || [];
        
        const mappedIncidencias: Incidencia[] = incidenciasFromAPI.map(inc => ({
          ID: inc.ID,
          EmpleadoID: inc.EmpleadoID,
          EmpleadoNombre: inc.EmpleadoNombre,
          EmpleadoCorreo: inc.EmpleadoCorreo,
          TipoIncidenciaID: inc.TipoIncidenciaID,
          TipoIncidenciaNombre: inc.TipoIncidenciaNombre,
          Descripcion: inc.Descripcion,
          FechaIncidencia: inc.FechaIncidencia,
          HoraIncidencia: inc.HoraIncidencia,
          Observaciones: inc.Observaciones,
          activo: inc.Activo === 1,
          CreadoPor: inc.CreadoPor,
          CreadorEmail: inc.CreadoPorUsuario,
          FechaCreacion: inc.createdAt
        }));
        
        setIncidencias(mappedIncidencias);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Error cargando incidencias');
        setIncidencias([]);
      }
    } catch (error: unknown) {
      console.error('Error cargando incidencias:', error);
      setError('Error cargando incidencias');
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterEmpleado, filterTipo, filterFechaDesde, filterFechaHasta, canViewAll]);

  // Función para cargar mis incidencias (employee)
  const loadMisIncidencias = useCallback(async () => {
    if (!isEmployee) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/incidencias/mis-incidencias');
      
      if (response.data.success) {
        const misIncidenciasFromAPI: MisIncidenciaFromAPI[] = response.data.data || [];
        
        const mappedMisIncidencias: Incidencia[] = misIncidenciasFromAPI.map(inc => ({
          ID: inc.ID,
          EmpleadoID: inc.EmpleadoID,
          EmpleadoNombre: inc.EmpleadoNombre,
          EmpleadoCorreo: inc.EmpleadoCorreo,
          TipoIncidenciaID: inc.TipoIncidenciaID,
          TipoIncidenciaNombre: inc.TipoIncidenciaNombre,
          Descripcion: inc.Descripcion,
          FechaIncidencia: inc.FechaIncidencia,
          HoraIncidencia: inc.HoraIncidencia,
          Observaciones: inc.Observaciones,
          activo: inc.Activo === 1,
          CreadoPor: inc.CreadoPor,
          CreadorEmail: inc.CreadoPorUsuario,
          FechaCreacion: inc.createdAt,
          TipoSolicitud: inc.TipoSolicitud,
          EstadoSolicitud: inc.EstadoSolicitud
        }));
        
        setMisIncidencias(mappedMisIncidencias);
      } else {
        setError(response.data.message || 'Error cargando tus incidencias');
        setMisIncidencias([]);
      }
    } catch (error: unknown) {
      console.error('Error cargando mis incidencias:', error);
      setError('Error cargando tus incidencias');
      setMisIncidencias([]);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  // Función para cargar tipos de incidencia
  const loadTiposIncidencia = useCallback(async () => {
    if (!canViewTipos) return;
    
    try {
      setLoadingTipos(true);
      setError('');
      
      const response = await api.get('/incidencias/tipos');
      
      if (response.data.success) {
        setTiposIncidencia(response.data.data || []);
      } else {
        setError(response.data.message || 'Error cargando tipos de incidencia');
      }
    } catch (error: unknown) {
      console.error('Error cargando tipos:', error);
      setError('Error cargando tipos de incidencia');
    } finally {
      setLoadingTipos(false);
    }
  }, [canViewTipos]);

  // Función para cargar empleados supervisados
  const loadEmpleadosSupervisados = useCallback(async () => {
    if (!canCreate) return;
    
    try {
      const response = await api.get('/incidencias/empleados/supervisados');
      
      if (response.data.success) {
        setEmpleadosSupervisados(response.data.data || []);
      }
    } catch (error: unknown) {
      console.error('Error cargando empleados supervisados:', error);
    }
  }, [canCreate]);

  // Efecto principal
  useEffect(() => {
    if (canViewTipos) {
      loadTiposIncidencia();
    }
    
    if (canCreate) {
      loadEmpleadosSupervisados();
    }
    
    if (activeTab === 'incidencias') {
      if (canViewAll) {
        loadIncidencias();
      } else if (isEmployee) {
        loadMisIncidencias();
      }
    }
  }, [
    activeTab, 
    currentPage, 
    filterEmpleado, 
    filterTipo, 
    filterFechaDesde, 
    filterFechaHasta,
    canViewAll,
    isEmployee,
    canViewTipos,
    canCreate,
    loadIncidencias,
    loadMisIncidencias,
    loadTiposIncidencia,
    loadEmpleadosSupervisados
  ]);

  // Función para crear incidencia
  const handleCreateIncidencia = async () => {
    if (!canCreate) {
      setError('No tienes permisos para crear incidencias');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const requiredFields = ['empleadoId', 'tipoIncidenciaId', 'descripcion', 'fechaIncidencia'];
      const missingFields = requiredFields.filter(field => !createData[field as keyof CreateIncidenciaData]);
      
      if (missingFields.length > 0) {
        setError(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        return;
      }

      const response = await api.post('/incidencias', createData);
      
      if (response.data.success) {
        setSuccess('Incidencia creada exitosamente');
        setShowCreateModal(false);
        resetCreateForm();
        if (activeTab === 'incidencias') {
          if (canViewAll) {
            loadIncidencias();
          } else {
            loadMisIncidencias();
          }
        }
      } else {
        setError(response.data.message || 'Error creando incidencia');
      }
    } catch (error: unknown) {
      console.error('Error creando incidencia:', error);
      setError('Error creando incidencia');
    }
  };

  // Función para actualizar incidencia
  const handleUpdateIncidencia = async () => {
    if (!selectedIncidencia || !canEdit) return;
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.put(`/incidencias/${selectedIncidencia.ID}`, editData);
      
      if (response.data.success) {
        setSuccess('Incidencia actualizada exitosamente');
        setShowEditModal(false);
        if (canViewAll) {
          loadIncidencias();
        } else {
          loadMisIncidencias();
        }
      } else {
        setError(response.data.message || 'Error actualizando incidencia');
      }
    } catch (error: unknown) {
      console.error('Error actualizando incidencia:', error);
      setError('Error actualizando incidencia');
    }
  };

  // Función para eliminar incidencia
  const handleDeleteIncidencia = async () => {
    if (!selectedIncidencia || !canDelete) return;
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.delete(`/incidencias/${selectedIncidencia.ID}`);
      
      if (response.data.success) {
        setSuccess('Incidencia eliminada exitosamente');
        setShowDeleteModal(false);
        if (canViewAll) {
          loadIncidencias();
        } else {
          loadMisIncidencias();
        }
      } else {
        setError(response.data.message || 'Error eliminando incidencia');
      }
    } catch (error: unknown) {
      console.error('Error eliminando incidencia:', error);
      setError('Error eliminando incidencia');
    }
  };

  // Función para cambiar estado de incidencia (activar/desactivar)
  const handleToggleStatusIncidencia = async (incidencia: Incidencia) => {
    if (!canChangeStatus) {
      setError('No tienes permisos para cambiar el estado de incidencias');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de ${incidencia.activo ? 'desactivar' : 'activar'} esta incidencia?`)) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.patch(`/incidencias/${incidencia.ID}/estado`, {
        activo: !incidencia.activo
      });
      
      if (response.data.success) {
        setSuccess(`Incidencia ${incidencia.activo ? 'desactivada' : 'activada'} exitosamente`);
        if (canViewAll) {
          loadIncidencias();
        } else {
          loadMisIncidencias();
        }
      } else {
        setError(response.data.message || 'Error cambiando estado');
      }
    } catch (error: unknown) {
      console.error('Error cambiando estado:', error);
      setError('Error cambiando estado');
    }
  };

  // Función para crear tipo de incidencia
  const handleCreateTipo = async () => {
    if (!canManageTipos) {
      setError('Solo administradores pueden crear tipos de incidencia');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      if (!tipoData.nombre.trim()) {
        setError('El nombre del tipo es requerido');
        return;
      }

      const response = await api.post('/incidencias/tipos', tipoData);
      
      if (response.data.success) {
        setSuccess('Tipo de incidencia creado exitosamente');
        setShowCreateTipoModal(false);
        setTipoData({ nombre: '', descripcion: '' });
        loadTiposIncidencia();
      } else {
        setError(response.data.message || 'Error creando tipo de incidencia');
      }
    } catch (error: unknown) {
      console.error('Error creando tipo:', error);
      setError('Error creando tipo de incidencia');
    }
  };

  // Función para actualizar tipo de incidencia
  const handleUpdateTipo = async () => {
    if (!selectedTipo || !canManageTipos) return;
    
    try {
      setError('');
      setSuccess('');
      
      if (!editTipoData.nombre.trim()) {
        setError('El nombre del tipo es requerido');
        return;
      }

      const response = await api.put(`/incidencias/tipos/${selectedTipo.ID}`, editTipoData);
      
      if (response.data.success) {
        setSuccess('Tipo de incidencia actualizado exitosamente');
        setShowEditTipoModal(false);
        loadTiposIncidencia();
      } else {
        setError(response.data.message || 'Error actualizando tipo de incidencia');
      }
    } catch (error: unknown) {
      console.error('Error actualizando tipo:', error);
      setError('Error actualizando tipo de incidencia');
    }
  };

  // Función para cambiar estado de tipo de incidencia
  const handleToggleStatusTipo = async (tipo: TipoIncidencia) => {
    if (!canManageTipos) {
      setError('Solo administradores pueden cambiar el estado de tipos');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de ${tipo.Activo ? 'desactivar' : 'activar'} este tipo de incidencia?`)) {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.patch(`/incidencias/tipos/${tipo.ID}/estado`, {
        activo: !tipo.Activo
      });
      
      if (response.data.success) {
        setSuccess(`Tipo de incidencia ${tipo.Activo ? 'desactivado' : 'activado'} exitosamente`);
        loadTiposIncidencia();
      } else {
        setError(response.data.message || 'Error cambiando estado del tipo');
      }
    } catch (error: unknown) {
      console.error('Error cambiando estado tipo:', error);
      setError('Error cambiando estado del tipo');
    }
  };

  // Función para resetear formulario de creación
  const resetCreateForm = () => {
    setCreateData({
      empleadoId: empleadosSupervisados.length > 0 ? empleadosSupervisados[0].ID : 0,
      tipoIncidenciaId: tiposIncidencia.length > 0 ? tiposIncidencia[0].ID : 0,
      descripcion: '',
      fechaIncidencia: new Date().toISOString().split('T')[0],
      horaIncidencia: ''
    });
  };

  // Función para abrir modal de creación
  const openCreateModal = () => {
    if (!canCreate) {
      setError('No tienes permisos para crear incidencias');
      return;
    }
    
    if (tiposIncidencia.length === 0) {
      setError('No hay tipos de incidencia disponibles. Crea primero un tipo.');
      return;
    }
    
    if (empleadosSupervisados.length === 0) {
      setError('No tienes empleados supervisados para asignar incidencias');
      return;
    }
    
    resetCreateForm();
    setShowCreateModal(true);
  };

  // Función para abrir modal de vista
  const openViewModal = (incidencia: Incidencia) => {
    setSelectedIncidencia(incidencia);
    setShowViewModal(true);
  };

  // Función para abrir modal de edición
  const openEditModal = (incidencia: Incidencia) => {
    if (!canEdit) {
      setError('No tienes permisos para editar incidencias');
      return;
    }
    
    setSelectedIncidencia(incidencia);
    setEditData({
      tipoIncidenciaId: incidencia.TipoIncidenciaID,
      descripcion: incidencia.Descripcion,
      fechaIncidencia: incidencia.FechaIncidencia,
      horaIncidencia: incidencia.HoraIncidencia || '',
      observaciones: incidencia.Observaciones || ''
    });
    setShowEditModal(true);
  };

  // Función para abrir modal de eliminación
  const openDeleteModal = (incidencia: Incidencia) => {
    if (!canDelete) {
      setError('Solo administradores pueden eliminar incidencias');
      return;
    }
    
    setSelectedIncidencia(incidencia);
    setShowDeleteModal(true);
  };

  // Función para abrir modal de edición de tipo
  const openEditTipoModal = (tipo: TipoIncidencia) => {
    if (!canManageTipos) {
      setError('Solo administradores pueden editar tipos de incidencia');
      return;
    }
    
    setSelectedTipo(tipo);
    setEditTipoData({
      nombre: tipo.Nombre,
      descripcion: tipo.Descripcion || ''
    });
    setShowEditTipoModal(true);
  };

  // Función para obtener badge de activo/inactivo
  const getActivoBadge = (activo: boolean) => {
    return activo ? (
      <Badge bg="success">Activo</Badge>
    ) : (
      <Badge bg="secondary">Inactivo</Badge>
    );
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  // Función para renderizar acciones de incidencia
  const renderAccionesIncidencia = (incidencia: Incidencia) => {
    return (
      <ButtonGroup size="sm">
        <Button
          variant="outline-primary"
          onClick={() => openViewModal(incidencia)}
          title="Ver detalles"
        >
          <FontAwesomeIcon icon={faEye} />
        </Button>
        
        {canEdit && (
          <Button
            variant="outline-warning"
            onClick={() => openEditModal(incidencia)}
            title="Editar"
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="outline-danger"
            onClick={() => openDeleteModal(incidencia)}
            title="Eliminar"
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
        
        {canChangeStatus && (
          <Button
            variant={incidencia.activo ? "outline-danger" : "outline-success"}
            onClick={() => handleToggleStatusIncidencia(incidencia)}
            title={incidencia.activo ? "Desactivar" : "Activar"}
          >
            <FontAwesomeIcon icon={incidencia.activo ? faTimesCircle : faCheckCircle} />
          </Button>
        )}
      </ButtonGroup>
    );
  };

  // Función para renderizar acciones de tipo
  const renderAccionesTipo = (tipo: TipoIncidencia) => {
    return (
      <ButtonGroup size="sm">
        <Button
          variant="outline-primary"
          onClick={() => {
            setSelectedTipo(tipo);
            setShowViewModal(true);
          }}
          title="Ver detalles"
        >
          <FontAwesomeIcon icon={faEye} />
        </Button>
        
        {canManageTipos && (
          <Button
            variant="outline-warning"
            onClick={() => openEditTipoModal(tipo)}
            title="Editar"
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        )}
        
        {canManageTipos && (
          <Button
            variant={tipo.Activo ? "outline-danger" : "outline-success"}
            onClick={() => handleToggleStatusTipo(tipo)}
            title={tipo.Activo ? "Desactivar" : "Activar"}
          >
            <FontAwesomeIcon icon={tipo.Activo ? faTimesCircle : faCheckCircle} />
          </Button>
        )}
      </ButtonGroup>
    );
  };

  // Verificación de usuario
  if (!user) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="warning" />
          <p className="mt-3">Verificando permisos...</p>
        </div>
      </Container>
    );
  }

  // Verificación de permisos
  if (!canViewAll && !isEmployee) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <FontAwesomeIcon icon={faFileAlt} size="3x" className="text-warning mb-3" />
            <h3>Acceso Restringido</h3>
            <p className="text-muted">
              No tienes permisos para acceder a la gestión de incidencias.
              <br />
              Solo administradores y managers pueden ver esta sección.
            </p>
            <Badge bg={isAdmin ? 'danger' : isManager ? 'warning' : 'info'} 
              className="fs-6 p-2">
              Tu rol: {userRol?.toUpperCase() || 'NO DEFINIDO'}
            </Badge>
            <div className="mt-4">
              <Button variant="primary" onClick={() => window.history.back()}>
                Regresar
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FontAwesomeIcon icon={faFileAlt} className="me-2 text-warning" />
                Gestión de Incidencias
              </h2>
              <p className="text-muted mb-0">
                {isAdmin ? '🔐 Administrador - Gestión completa' : 
                 isManager ? '👨‍💼 Manager - Puede crear y ver incidencias de sus empleados' : 
                 '👤 Empleado - Solo puede ver sus propias incidencias'}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => {
                if (activeTab === 'incidencias') {
                  if (canViewAll) {
                    loadIncidencias();
                  } else {
                    loadMisIncidencias();
                  }
                } else {
                  loadTiposIncidencia();
                }
              }}>
                <FontAwesomeIcon icon={faSync} className="me-2" />
                Actualizar
              </Button>
              
              {activeTab === 'incidencias' && canCreate && (
                <Button variant="warning" onClick={openCreateModal}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Nueva Incidencia
                </Button>
              )}
              
              {activeTab === 'tipos' && canManageTipos && (
                <Button variant="warning" onClick={() => setShowCreateTipoModal(true)}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Nuevo Tipo
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Alertas */}
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

      {/* Tabs principales */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => {
          setActiveTab(k || 'incidencias');
          setCurrentPage(1);
          setSearchTerm('');
          setFilterEmpleado('');
          setFilterTipo('');
          setFilterActivo('');
          setFilterFechaDesde('');
          setFilterFechaHasta('');
        }}
        className="mb-4"
        fill
      >
        <Tab 
          eventKey="incidencias" 
          title={
            <span>
              <FontAwesomeIcon icon={faClipboardList} className="me-2" />
              Incidencias
              <Badge bg="warning" className="ms-2">
                {isEmployee ? misIncidencias.length : incidencias.length}
              </Badge>
            </span>
          }
        >
          {/* Filtros para incidencias (solo para admin/manager) */}
          {canViewAll && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-light">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Filtros de Búsqueda
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Empleado</Form.Label>
                      <Form.Select
                        value={filterEmpleado}
                        onChange={(e) => setFilterEmpleado(e.target.value)}
                      >
                        <option value="">Todos los empleados</option>
                        {empleadosSupervisados.map((emp) => (
                          <option key={emp.ID} value={emp.ID}>
                            {emp.NombreCompleto}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Tipo de Incidencia</Form.Label>
                      <Form.Select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                      >
                        <option value="">Todos los tipos</option>
                        {tiposIncidencia.filter(t => t.Activo === 1).map((tipo) => (
                          <option key={tipo.ID} value={tipo.ID}>
                            {tipo.Nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Estado</Form.Label>
                      <Form.Select
                        value={filterActivo}
                        onChange={(e) => setFilterActivo(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Fecha Desde</Form.Label>
                      <Form.Control
                        type="date"
                        value={filterFechaDesde}
                        onChange={(e) => setFilterFechaDesde(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mt-2">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Fecha Hasta</Form.Label>
                      <Form.Control
                        type="date"
                        value={filterFechaHasta}
                        onChange={(e) => setFilterFechaHasta(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Buscar</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FontAwesomeIcon icon={faSearch} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Buscar por descripción, empleado..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3} className="d-flex align-items-end">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setFilterEmpleado('');
                        setFilterTipo('');
                        setFilterActivo('');
                        setFilterFechaDesde('');
                        setFilterFechaHasta('');
                        setSearchTerm('');
                      }}
                      className="w-100"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                      Limpiar Filtros
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Estadísticas */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center shadow-sm border-warning">
                <Card.Body>
                  <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-warning mb-2" />
                  <h3>{isEmployee ? misIncidencias.length : incidencias.length}</h3>
                  <small className="text-muted">
                    {isEmployee ? 'Mis Incidencias' : 'Total Incidencias'}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-success">
                <Card.Body>
                  <FontAwesomeIcon icon={faCheckCircle} size="2x" className="text-success mb-2" />
                  <h3>{
                    (isEmployee ? misIncidencias : incidencias).filter(i => i.activo).length
                  }</h3>
                  <small className="text-muted">Activas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-secondary">
                <Card.Body>
                  <FontAwesomeIcon icon={faTimesCircle} size="2x" className="text-secondary mb-2" />
                  <h3>{
                    (isEmployee ? misIncidencias : incidencias).filter(i => !i.activo).length
                  }</h3>
                  <small className="text-muted">Inactivas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-info">
                <Card.Body>
                  <FontAwesomeIcon icon={faUser} size="2x" className="text-info mb-2" />
                  <h3>{empleadosSupervisados.length}</h3>
                  <small className="text-muted">Empleados</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabla de Incidencias */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="warning" />
                  <p className="mt-3">Cargando incidencias...</p>
                </div>
              ) : (isEmployee ? misIncidencias : incidencias).length === 0 ? (
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faFileAlt} size="3x" className="text-muted mb-3" />
                  <h5>No hay incidencias registradas</h5>
                  <p className="text-muted mb-4">
                    {searchTerm || filterEmpleado || filterTipo || filterActivo || filterFechaDesde || filterFechaHasta
                      ? 'Intenta con otros filtros de búsqueda'
                      : canCreate 
                        ? 'Comienza registrando una nueva incidencia' 
                        : 'No tienes incidencias registradas'}
                  </p>
                  {canCreate && (
                    <Button variant="warning" onClick={openCreateModal} className="mt-3">
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Registrar Primera Incidencia
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Incidencia</th>
                          <th>Empleado</th>
                          <th>Tipo</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                          {canViewAll && <th>Registrada Por</th>}
                          {(canEdit || canDelete || canChangeStatus) && <th className="text-end">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(isEmployee ? misIncidencias : incidencias).map((incidencia) => {
                          if (!incidencia) return null;
                          
                          return (
                            <tr key={incidencia.ID}>
                              <td>
                                <div>
                                  <strong className="d-block">
                                    {(incidencia.Descripcion || '').substring(0, 50)}
                                    {(incidencia.Descripcion || '').length > 50 ? '...' : ''}
                                  </strong>
                                  {incidencia.Observaciones && (
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faStickyNote} className="me-1" />
                                      {(incidencia.Observaciones || '').substring(0, 30)}
                                      {(incidencia.Observaciones || '').length > 30 ? '...' : ''}
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2" 
                                       style={{width: '30px', height: '30px'}}>
                                    <FontAwesomeIcon icon={faUserCircle} className="text-white" size="sm" />
                                  </div>
                                  <div>
                                    <div>{incidencia.EmpleadoNombre}</div>
                                    <small className="text-muted">ID: {incidencia.EmpleadoID}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="info">{incidencia.TipoIncidenciaNombre}</Badge>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <div>{formatFecha(incidencia.FechaIncidencia)}</div>
                                  {incidencia.HoraIncidencia && (
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faClock} className="me-1" />
                                      {incidencia.HoraIncidencia}
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>
                                {getActivoBadge(incidencia.activo)}
                              </td>
                              {canViewAll && (
                                <td>
                                  <div className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faUserShield} className="text-muted me-2" size="sm" />
                                    <small>{incidencia.CreadorEmail}</small>
                                  </div>
                                </td>
                              )}
                              {(canEdit || canDelete || canChangeStatus) && (
                                <td className="text-end">
                                  {renderAccionesIncidencia(incidencia)}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  
                  {/* Paginación solo para admin/manager */}
                  {canViewAll && totalPages > 1 && (
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
                          if (page <= totalPages && page >= 1) {
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
            </Card.Body>
          </Card>
        </Tab>
        
        {/* Tab de Tipos de Incidencia (solo admin/manager) */}
        {canViewTipos && (
          <Tab 
            eventKey="tipos" 
            title={
              <span>
                <FontAwesomeIcon icon={faListAlt} className="me-2" />
                Tipos de Incidencia
                <Badge bg="info" className="ms-2">{tiposIncidencia.length}</Badge>
              </span>
            }
          >
            <div className="mt-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <FontAwesomeIcon icon={faListAlt} className="me-2" />
                    Catálogo de Tipos de Incidencia
                  </div>
                  <Badge bg={isAdmin ? 'danger' : 'warning'}>
                    {isAdmin ? 'Administrador - Puede editar' : 'Manager - Solo lectura'}
                  </Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingTipos ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="info" />
                      <p className="mt-3">Cargando tipos de incidencia...</p>
                    </div>
                  ) : tiposIncidencia.length === 0 ? (
                    <div className="text-center py-5">
                      <FontAwesomeIcon icon={faListAlt} size="3x" className="text-muted mb-3" />
                      <h5>No hay tipos de incidencia registrados</h5>
                      <p className="text-muted mb-4">
                        Los tipos de incidencia definen las categorías de las incidencias que se pueden registrar.
                      </p>
                      {canManageTipos && (
                        <Button variant="info" onClick={() => setShowCreateTipoModal(true)} className="mt-3">
                          <FontAwesomeIcon icon={faPlus} className="me-2" />
                          Crear Primer Tipo
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            {canManageTipos && <th className="text-end">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {tiposIncidencia.map((tipo) => (
                            <tr key={tipo.ID}>
                              <td>
                                <strong>{tipo.Nombre}</strong>
                                <div className="small text-muted">ID: {tipo.ID}</div>
                              </td>
                              <td>
                                <div className="text-muted">
                                  {tipo.Descripcion || 'Sin descripción'}
                                </div>
                              </td>
                              <td>
                                {tipo.Activo === 1 ? (
                                  <Badge bg="success">Activo</Badge>
                                ) : (
                                  <Badge bg="secondary">Inactivo</Badge>
                                )}
                              </td>
                              {canManageTipos && (
                                <td className="text-end">
                                  {renderAccionesTipo(tipo)}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
                
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                      {isAdmin 
                        ? 'Administrador - Puede crear, editar y cambiar estado de tipos'
                        : 'Manager - Solo puede ver tipos'}
                    </small>
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faFileAlt} className="me-1" />
                      {tiposIncidencia.filter(t => t.Activo === 1).length} activos de {tiposIncidencia.length} total
                    </small>
                  </div>
                </Card.Footer>
              </Card>
            </div>
          </Tab>
        )}
      </Tabs>

      {/* Modal para Crear Incidencia */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Registrar Nueva Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                Empleado *
              </Form.Label>
              <Form.Select
                value={createData.empleadoId}
                onChange={(e) => setCreateData({...createData, empleadoId: parseInt(e.target.value)})}
                required
              >
                <option value="">Selecciona un empleado</option>
                {empleadosSupervisados.map((empleado) => (
                  <option key={empleado.ID} value={empleado.ID}>
                    {empleado.NombreCompleto} - {empleado.CorreoElectronico}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Solo puedes registrar incidencias para empleados que supervisas
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                Tipo de Incidencia *
              </Form.Label>
              <Form.Select
                value={createData.tipoIncidenciaId}
                onChange={(e) => setCreateData({...createData, tipoIncidenciaId: parseInt(e.target.value)})}
                required
              >
                <option value="">Selecciona un tipo</option>
                {tiposIncidencia.filter(t => t.Activo === 1).map((tipo) => (
                  <option key={tipo.ID} value={tipo.ID}>
                    {tipo.Nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                Descripción *
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={createData.descripcion}
                onChange={(e) => setCreateData({...createData, descripcion: e.target.value})}
                placeholder="Describe la incidencia en detalle..."
                required
              />
              <Form.Text className="text-muted">
                Proporciona una descripción clara y detallada de la incidencia
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                    Fecha de la Incidencia *
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createData.fechaIncidencia}
                    onChange={(e) => setCreateData({...createData, fechaIncidencia: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    Hora (Opcional)
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={createData.horaIncidencia}
                    onChange={(e) => setCreateData({...createData, horaIncidencia: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faStickyNote} className="me-2" />
                Observaciones Adicionales (Opcional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={createData.observaciones || ''}
                onChange={(e) => setCreateData({...createData, observaciones: e.target.value})}
                placeholder="Observaciones adicionales, contexto, etc."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleCreateIncidencia}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Registrar Incidencia
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Ver Incidencia */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEye} className="me-2" />
            Detalles de la Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIncidencia && (
            <div>
              <div className="text-center mb-4">
                <div className="rounded-circle bg-warning d-inline-flex align-items-center justify-content-center p-3 mb-3">
                  <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-white" />
                </div>
                <h4>Incidencia #{selectedIncidencia.ID}</h4>
                <div className="mb-3">
                  {getActivoBadge(selectedIncidencia.activo)}
                </div>
              </div>

              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Empleado:</strong></span>
                  <span>{selectedIncidencia.EmpleadoNombre}</span>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Tipo:</strong></span>
                  <Badge bg="info">{selectedIncidencia.TipoIncidenciaNombre}</Badge>
                </ListGroup.Item>
                
                <ListGroup.Item>
                  <strong>Descripción:</strong>
                  <p className="mt-2 text-muted">{selectedIncidencia.Descripcion}</p>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Fecha:</strong></span>
                  <span>{formatFecha(selectedIncidencia.FechaIncidencia)}</span>
                </ListGroup.Item>
                
                {selectedIncidencia.HoraIncidencia && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span><strong>Hora:</strong></span>
                    <span>{selectedIncidencia.HoraIncidencia}</span>
                  </ListGroup.Item>
                )}
                
                {selectedIncidencia.Observaciones && (
                  <ListGroup.Item>
                    <strong>Observaciones:</strong>
                    <p className="mt-2 text-muted">{selectedIncidencia.Observaciones}</p>
                  </ListGroup.Item>
                )}
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Registrada por:</strong></span>
                  <span>{selectedIncidencia.CreadorEmail}</span>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Fecha de registro:</strong></span>
                  <span>{formatFecha(selectedIncidencia.FechaCreacion)}</span>
                </ListGroup.Item>

                {selectedIncidencia.EstadoSolicitud && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span><strong>Estado de solicitud:</strong></span>
                    <Badge bg={
                      selectedIncidencia.EstadoSolicitud === 'aprobada' ? 'success' :
                      selectedIncidencia.EstadoSolicitud === 'pendiente' ? 'warning' : 'secondary'
                    }>
                      {selectedIncidencia.EstadoSolicitud}
                    </Badge>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <ButtonGroup>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
            {canEdit && (
              <Button variant="warning" onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedIncidencia!);
              }}>
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="outline-danger" onClick={() => {
                setShowViewModal(false);
                openDeleteModal(selectedIncidencia!);
              }}>
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Eliminar
              </Button>
            )}
          </ButtonGroup>
        </Modal.Footer>
      </Modal>

      {/* Modal para Editar Incidencia */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIncidencia && (
            <Form>
              <Alert variant="info" className="mb-4">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                <strong>Nota:</strong> Solo puedes editar ciertos campos de la incidencia.
                Para cambiar el empleado o activar/desactivar, usa las opciones correspondientes.
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Tipo de Incidencia</Form.Label>
                <Form.Select
                  value={editData.tipoIncidenciaId || selectedIncidencia.TipoIncidenciaID}
                  onChange={(e) => setEditData({...editData, tipoIncidenciaId: parseInt(e.target.value)})}
                >
                  {tiposIncidencia.filter(t => t.Activo === 1).map((tipo) => (
                    <option key={tipo.ID} value={tipo.ID}>
                      {tipo.Nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editData.descripcion || selectedIncidencia.Descripcion}
                  onChange={(e) => setEditData({...editData, descripcion: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha de la Incidencia</Form.Label>
                    <Form.Control
                      type="date"
                      value={editData.fechaIncidencia || selectedIncidencia.FechaIncidencia.split('T')[0]}
                      onChange={(e) => setEditData({...editData, fechaIncidencia: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hora</Form.Label>
                    <Form.Control
                      type="time"
                      value={editData.horaIncidencia || selectedIncidencia.HoraIncidencia || ''}
                      onChange={(e) => setEditData({...editData, horaIncidencia: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Observaciones</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={editData.observaciones || selectedIncidencia.Observaciones || ''}
                  onChange={(e) => setEditData({...editData, observaciones: e.target.value})}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleUpdateIncidencia}>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Eliminar Incidencia */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="text-danger">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Eliminar Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIncidencia && (
            <div className="text-center">
              <FontAwesomeIcon icon={faBan} size="3x" className="text-danger mb-3" />
              <h4>¿Estás seguro de eliminar esta incidencia?</h4>
              <p className="text-muted">
                Esta acción eliminará permanentemente la incidencia <strong>#{selectedIncidencia.ID}</strong> del sistema.
              </p>
              
              <Alert variant="danger" className="mt-3">
                <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. 
                Se perderán todos los datos relacionados con esta incidencia.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteIncidencia}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Sí, eliminar permanentemente
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Crear Tipo de Incidencia */}
      <Modal show={showCreateTipoModal} onHide={() => setShowCreateTipoModal(false)}>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Nuevo Tipo de Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Tipo *</Form.Label>
              <Form.Control
                type="text"
                value={tipoData.nombre}
                onChange={(e) => setTipoData({...tipoData, nombre: e.target.value})}
                placeholder="Ej: Retardo, Falta, Equipo dañado, etc."
                required
              />
              <Form.Text className="text-muted">
                Usa un nombre claro y descriptivo para el tipo de incidencia
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción (Opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tipoData.descripcion}
                onChange={(e) => setTipoData({...tipoData, descripcion: e.target.value})}
                placeholder="Describe este tipo de incidencia, ejemplos, etc."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateTipoModal(false)}>
            Cancelar
          </Button>
          <Button variant="info" onClick={handleCreateTipo}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Crear Tipo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Editar Tipo de Incidencia */}
      <Modal show={showEditTipoModal} onHide={() => setShowEditTipoModal(false)}>
        <Modal.Header closeButton className="bg-info">
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Tipo de Incidencia
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTipo && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Tipo *</Form.Label>
                <Form.Control
                  type="text"
                  value={editTipoData.nombre}
                  onChange={(e) => setEditTipoData({...editTipoData, nombre: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editTipoData.descripcion}
                  onChange={(e) => setEditTipoData({...editTipoData, descripcion: e.target.value})}
                />
              </Form.Group>

              <Alert variant="warning" className="mb-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <strong>Nota:</strong> Cambiar el nombre de un tipo puede afectar las incidencias existentes
              </Alert>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditTipoModal(false)}>
            Cancelar
          </Button>
          <Button variant="info" onClick={handleUpdateTipo}>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Incidencias;