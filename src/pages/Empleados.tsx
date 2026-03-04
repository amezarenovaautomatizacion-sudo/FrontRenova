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
  ButtonGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DataTable from 'react-data-table-component';
import {
  faUsers,
  faUserPlus,
  faEye,
  faEdit,
  faTrash,
  faSearch,
  faEnvelope,
  faPhone,
  faCalendar,
  faIdCard,
  faUserShield,
  faUserCircle,
  faSync,
  faHome,
  faPhoneAlt,
  faBirthdayCake,
  faBriefcase,
  faFileContract,
  faBan,
  faCheckCircle,
  faTimesCircle,
  faChartLine,
  faPowerOff,
  faFilter,
  faSort,
  faDownload,
  faPrint,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import ReauthModal from '../components/ReauthModal';
import api from '../services/api';

// Interfaces basadas en la API (mantener nombres originales)
interface User {
  id: number;
  usuario: string;
  rol: string;
  activo: boolean;
}

interface Empleado {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  Celular?: string;
  RolApp: string;
  FechaIngreso: string;
  FechaNacimiento?: string;
  PuestoNombre?: string;
  UsuarioActivo: boolean;
  Direccion?: string;
  NSS?: string;
  RFC?: string;
  CURP?: string;
  TelefonoEmergencia?: string;
  PuestoID?: number;
  departamentos?: Departamento[];
  jefes?: EmpleadoSelect[];
}

interface Puesto {
  ID: number;
  Nombre: string;
  Descripcion?: string;
}

interface Departamento {
  ID: number;
  Nombre: string;
}

interface EmpleadoSelect {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  PuestoNombre?: string;
}

interface Catalogo {
  puestos: Puesto[];
  departamentos: Departamento[];
  empleados: EmpleadoSelect[];
}

interface CreateEmpleadoData {
  nombreCompleto: string;
  correoElectronico: string;
  contrasenia: string;
  fechaIngreso: string;
  fechaNacimiento: string;
  celular?: string;
  direccion?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp: string;
  departamentos: number[];
  jefes: number[];
}

interface UpdateEmpleadoData {
  nombreCompleto?: string;
  celular?: string;
  fechaNacimiento?: string;
  direccion?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp?: string;
  departamentos?: number[];
  jefes?: number[];
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
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

// Función auxiliar para formatear fechas en formato YYYY-MM-DD
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
};

// Función para formatear fecha para mostrar
const formatDateDisplay = (dateString?: string): string => {
  if (!dateString) return 'No especificada';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
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
        placeholder={placeholder || "Buscar colaborador..."}
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

const Empleados: React.FC = () => {
  const { user, logout } = useAuth();
  
  const getUserRol = () => {
    if (!user) return null;
    return user.rol || 'employee';
  };
  
  const userRol = getUserRol();
  
  const isAdmin = userRol === 'admin';
  const isManager = userRol === 'manager';
  
  const canViewAll = isAdmin || isManager;
  const canCreate = isAdmin;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;
  const canChangeStatus = isAdmin;
  
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [catalogos, setCatalogos] = useState<Catalogo | null>(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [departamentosEmpleado, setDepartamentosEmpleado] = useState<Departamento[]>([]);
  const [jefesEmpleado, setJefesEmpleado] = useState<EmpleadoSelect[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  
  const [createData, setCreateData] = useState<CreateEmpleadoData>({
    nombreCompleto: '',
    correoElectronico: '',
    contrasenia: 'Password123',
    fechaIngreso: new Date().toISOString().split('T')[0],
    fechaNacimiento: '',
    rolApp: 'employee',
    departamentos: [],
    jefes: [],
  });
  
  const [editData, setEditData] = useState<UpdateEmpleadoData>({});
  
  // Estados para DataTable
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Empleado[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [perPage, setPerPage] = useState(10);

  // ==================== FUNCIONES DE CARGA ====================

  const loadCatalogos = useCallback(async () => {
    if (!canCreate && !canEdit) return;
    
    try {
      const response = await api.get('/empleados/catalogos');
      
      if (response.data.success) {
        setCatalogos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  }, [canCreate, canEdit]);

  const loadEmpleados = useCallback(async () => {
    if (!canViewAll) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/empleados/empleados?limit=100');
      
      if (response.data.success) {
        const data = response.data.data;
        const empleadosList = data.empleados || [];
        setEmpleados(empleadosList);
        setFilteredEmpleados(empleadosList);
      } else {
        setError(response.data.message || 'Error cargando colaboradores');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('❌ Error cargando colaboradores:', apiError);
      if (apiError.response?.status === 403) {
        setError('No tienes permisos para acceder a esta sección');
        logout();
      } else {
        setError(apiError.response?.data?.message || 'Error cargando colaboradores');
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAll, logout]);

  // Función para cargar detalles completos del colaborador - OPTIMIZADA
  const loadEmpleadoDetalles = async (empleadoId: number) => {
    try {
      setLoadingDetalles(true);
      
      // Cargar información básica (YA INCLUYE departamentos y jefes según tu controlador)
      const response = await api.get(`/empleados/empleados/${empleadoId}`);
      
      if (response.data.success) {
        const empleadoCompleto = response.data.data;
        
        // Establecer el colaborador seleccionado
        setSelectedEmpleado(empleadoCompleto);
        
        // Establecer departamentos (vienen en la respuesta principal)
        if (empleadoCompleto.departamentos && Array.isArray(empleadoCompleto.departamentos)) {
          setDepartamentosEmpleado(empleadoCompleto.departamentos);
        } else {
          setDepartamentosEmpleado([]);
        }
        
        // Establecer jefes (vienen en la respuesta principal)
        if (empleadoCompleto.jefes && Array.isArray(empleadoCompleto.jefes)) {
          setJefesEmpleado(empleadoCompleto.jefes);
        } else {
          setJefesEmpleado([]);
        }
        
        return empleadoCompleto;
      } else {
        throw new Error('Error al cargar información del colaborador');
      }
    } catch (error) {
      console.error('❌ Error cargando detalles del colaborador:', error);
      throw error;
    } finally {
      setLoadingDetalles(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, [loadEmpleados]);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  // Filtrado en tiempo real
  useEffect(() => {
    if (!filterText) {
      setFilteredEmpleados(empleados);
    } else {
      const filtered = empleados.filter(empleado => {
        const searchTerm = filterText.toLowerCase();
        return (
          empleado.NombreCompleto.toLowerCase().includes(searchTerm) ||
          empleado.CorreoElectronico.toLowerCase().includes(searchTerm) ||
          (empleado.Celular && empleado.Celular.toLowerCase().includes(searchTerm)) ||
          (empleado.PuestoNombre && empleado.PuestoNombre.toLowerCase().includes(searchTerm)) ||
          empleado.RolApp.toLowerCase().includes(searchTerm) ||
          (empleado.UsuarioActivo ? 'activo' : 'inactivo').includes(searchTerm)
        );
      });
      setFilteredEmpleados(filtered);
    }
  }, [filterText, empleados]);

  // ==================== FUNCIONES DE CRUD ====================

  const handleCreate = async () => {
    if (!canCreate) {
      setError('No tienes permisos para crear colaboradores');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const requiredFields = ['nombreCompleto', 'correoElectronico', 'contrasenia', 'fechaIngreso', 'fechaNacimiento'];
      const missingFields = requiredFields.filter(field => !createData[field as keyof CreateEmpleadoData]);
      
      if (missingFields.length > 0) {
        setError(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      if (createData.contrasenia.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      const fechaIngreso = new Date(createData.fechaIngreso);
      const fechaNacimiento = new Date(createData.fechaNacimiento);
      
      if (isNaN(fechaIngreso.getTime()) || isNaN(fechaNacimiento.getTime())) {
        setError('Formato de fecha inválido');
        setLoading(false);
        return;
      }

      const empleadoData = {
        ...createData,
        fechaIngreso: fechaIngreso.toISOString().split('T')[0],
        fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
        celular: createData.celular || null,
        direccion: createData.direccion || null,
        nss: createData.nss || null,
        rfc: createData.rfc?.toUpperCase() || null,
        curp: createData.curp?.toUpperCase() || null,
        telefonoEmergencia: createData.telefonoEmergencia || null,
        puestoId: createData.puestoId || null,
        departamentos: createData.departamentos || [],
        jefes: createData.jefes || []
      };

      const response = await api.post('/empleados/empleados', empleadoData);
      
      if (response.data.success) {
        setSuccess('Colaborador creado exitosamente');
        setShowCreateModal(false);
        resetCreateForm();
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error creando colaborador');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creando colaborador:', apiError);
      const errorMsg = apiError.response?.data?.message || '';
      
      if (errorMsg.includes('CorreoElectronico') || errorMsg.includes('correo electrónico')) {
        setError('El correo electrónico ya está registrado');
      } else if (errorMsg.includes('NSS')) {
        setError('El NSS ya está registrado');
      } else if (errorMsg.includes('RFC')) {
        setError('El RFC ya está registrado');
      } else if (errorMsg.includes('CURP')) {
        setError('El CURP ya está registrado');
      } else {
        setError(errorMsg || 'Error creando colaborador');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEmpleado || !canEdit) return;
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const camposActualizados: UpdateEmpleadoData = {};
      
      // Campos básicos
      if (editData.nombreCompleto && editData.nombreCompleto !== selectedEmpleado.NombreCompleto) {
        camposActualizados.nombreCompleto = editData.nombreCompleto;
      }
      
      if (editData.celular !== undefined && editData.celular !== selectedEmpleado.Celular) {
        camposActualizados.celular = editData.celular || null;
      }
      
      if (editData.fechaNacimiento) {
        const fechaNueva = new Date(editData.fechaNacimiento);
        if (!isNaN(fechaNueva.getTime())) {
          const fechaFormateada = fechaNueva.toISOString().split('T')[0];
          if (fechaFormateada !== selectedEmpleado.FechaNacimiento) {
            camposActualizados.fechaNacimiento = fechaFormateada;
          }
        }
      }
      
      if (editData.direccion !== undefined && editData.direccion !== selectedEmpleado.Direccion) {
        camposActualizados.direccion = editData.direccion || null;
      }
      
      if (editData.nss !== undefined && editData.nss !== selectedEmpleado.NSS) {
        camposActualizados.nss = editData.nss || null;
      }
      
      if (editData.rfc !== undefined && editData.rfc !== selectedEmpleado.RFC) {
        camposActualizados.rfc = editData.rfc?.toUpperCase() || null;
      }
      
      if (editData.curp !== undefined && editData.curp !== selectedEmpleado.CURP) {
        camposActualizados.curp = editData.curp?.toUpperCase() || null;
      }
      
      if (editData.telefonoEmergencia !== undefined && editData.telefonoEmergencia !== selectedEmpleado.TelefonoEmergencia) {
        camposActualizados.telefonoEmergencia = editData.telefonoEmergencia || null;
      }
      
      if (isAdmin) {
        if (editData.rolApp && editData.rolApp !== selectedEmpleado.RolApp) {
          camposActualizados.rolApp = editData.rolApp;
        }
      }
      
      if (editData.puestoId !== selectedEmpleado.PuestoID) {
        camposActualizados.puestoId = editData.puestoId || null;
      }
      
      if (editData.departamentos !== undefined) {
        camposActualizados.departamentos = editData.departamentos;
      }
      
      if (editData.jefes !== undefined) {
        camposActualizados.jefes = editData.jefes;
      }
      
      if (Object.keys(camposActualizados).length === 0) {
        setError('No se han realizado cambios');
        setLoading(false);
        return;
      }
      
      const response = await api.put(`/empleados/empleados/${selectedEmpleado.ID}`, camposActualizados);
      
      if (response.data.success) {
        setSuccess('Colaborador actualizado exitosamente');
        setShowEditModal(false);
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error actualizando colaborador');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('❌ Error actualizando colaborador:', apiError);
      setError(apiError.response?.data?.message || 'Error actualizando colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (empleadoId: number, activo: boolean) => {
    if (!canChangeStatus) {
      setError('No tienes permisos para cambiar el estado de colaboradores');
      return;
    }
    
    const accion = activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} este colaborador?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.patch(`/empleados/empleados/${empleadoId}/estado`, {
        activo: !activo
      });
      
      if (response.data.success) {
        setSuccess(`Colaborador ${activo ? 'desactivado' : 'activado'} exitosamente`);
        loadEmpleados();
        
        if (selectedEmpleado && selectedEmpleado.ID === empleadoId) {
          setSelectedEmpleado({
            ...selectedEmpleado,
            UsuarioActivo: !activo
          });
        }
      } else {
        setError(response.data.message || 'Error cambiando estado');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error cambiando estado:', apiError);
      setError(apiError.response?.data?.message || 'Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmpleado || !canDelete) return;
    
    try {
      setError('');
      setLoading(true);
      
      const response = await api.delete(`/empleados/empleados/${selectedEmpleado.ID}`);
      
      if (response.data.success) {
        setSuccess('Colaborador eliminado exitosamente');
        setShowDeleteModal(false);
        setSelectedEmpleado(null);
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error eliminando colaborador');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error eliminando colaborador:', apiError);
      setError(apiError.response?.data?.message || 'Error eliminando colaborador');
    } finally {
      setLoading(false);
    }
  };
  // ==================== FUNCIONES AUXILIARES ====================

  const resetCreateForm = () => {
    setCreateData({
      nombreCompleto: '',
      correoElectronico: '',
      contrasenia: 'Password123',
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaNacimiento: '',
      rolApp: 'employee',
      departamentos: [],
      jefes: [],
    });
  };

  const openViewModal = async (empleado: Empleado) => {
    try {
      await loadEmpleadoDetalles(empleado.ID);
      setShowViewModal(true);
    } catch (error) {
      setError('Error al cargar información del colaborador');
    }
  };

  const openEditModal = async (empleado: Empleado) => {
    if (!canEdit) {
      setError('No tienes permisos para editar colaboradores');
      return;
    }
    
    try {
      setEditData({});
      
      await loadEmpleadoDetalles(empleado.ID);
      
      setTimeout(() => {
        const fechaNacimientoFormateada = formatDateForInput(empleado.FechaNacimiento);
        
        const deptosIds = departamentosEmpleado.map(d => d.ID);
        const jefesIds = jefesEmpleado.map(j => j.ID);
        
        if (catalogos) {
          const deptosValidos = deptosIds.filter(id => 
            catalogos.departamentos.some(d => d.ID === id)
          );
          const jefesValidos = jefesIds.filter(id => 
            catalogos.empleados.some(e => e.ID === id)
          );
          
        }
        
        setEditData({
          nombreCompleto: empleado.NombreCompleto,
          celular: empleado.Celular || '',
          fechaNacimiento: fechaNacimientoFormateada,
          direccion: empleado.Direccion || '',
          nss: empleado.NSS || '',
          rfc: empleado.RFC || '',
          curp: empleado.CURP || '',
          telefonoEmergencia: empleado.TelefonoEmergencia || '',
          rolApp: empleado.RolApp,
          puestoId: empleado.PuestoID,
          departamentos: deptosIds,
          jefes: jefesIds
        });
        
        setShowEditModal(true);
      }, 100);
    } catch (error) {
      setError('Error al cargar información del colaborador');
    }
  };

  const openDeleteModal = (empleado: Empleado) => {
    if (!canDelete) {
      setError('Solo administradores pueden eliminar colaboradores');
      return;
    }
    
    setSelectedEmpleado(empleado);
    setShowDeleteModal(true);
  };

  const getRolBadge = (rol: string) => {
    const colors = {
      admin: 'danger',
      manager: 'warning',
      employee: 'info'
    };
    return (
      <Badge bg={colors[rol as keyof typeof colors] || 'secondary'} className="px-3 py-2">
        {rol === 'admin' ? 'Administrador' : rol === 'manager' ? 'Gerente' : 'Colaborador'}
      </Badge>
    );
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <Badge bg="success" className="px-3 py-2">
        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
        Activo
      </Badge>
    ) : (
      <Badge bg="secondary" className="px-3 py-2">
        <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
        Inactivo
      </Badge>
    );
  };

  // Definición de columnas para DataTable
  const columns = [
    {
      name: 'Colaborador',
      selector: (row: Empleado) => row.NombreCompleto,
      sortable: true,
      cell: (row: Empleado) => (
        <div className="d-flex align-items-center">
          <div className="avatar-circle bg-primary me-3">
            <FontAwesomeIcon icon={faUserCircle} className="text-white" />
          </div>
          <div>
            <strong className="text-primary">{row.NombreCompleto}</strong>
            {row.PuestoNombre && (
              <div className="small text-muted">
                <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                {row.PuestoNombre}
              </div>
            )}
          </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Contacto',
      selector: (row: Empleado) => row.CorreoElectronico,
      sortable: true,
      cell: (row: Empleado) => (
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center mb-1">
            <FontAwesomeIcon icon={faEnvelope} className="text-muted me-2" size="sm" />
            <small className="text-truncate" style={{ maxWidth: '200px' }}>{row.CorreoElectronico}</small>
          </div>
          {row.Celular && (
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faPhone} className="text-muted me-2" size="sm" />
              <small>{row.Celular}</small>
            </div>
          )}
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Rol',
      selector: (row: Empleado) => row.RolApp,
      sortable: true,
      cell: (row: Empleado) => getRolBadge(row.RolApp),
    },
    {
      name: 'Antigüedad',
      selector: (row: Empleado) => row.FechaIngreso,
      sortable: true,
      cell: (row: Empleado) => (
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCalendar} className="text-muted me-2" />
          <div>
            <div>{formatDateDisplay(row.FechaIngreso)}</div>
            <small className="text-muted">
              {Math.floor((new Date().getTime() - new Date(row.FechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses
            </small>
          </div>
        </div>
      ),
    },
    {
      name: 'Estado',
      selector: (row: Empleado) => row.UsuarioActivo ? 'Activo' : 'Inactivo',
      sortable: true,
      cell: (row: Empleado) => getStatusBadge(row.UsuarioActivo),
    },
    {
      name: 'Acciones',
      cell: (row: Empleado) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              openViewModal(row);
            }}
            title="Ver detalles"
            disabled={loading || loadingDetalles}
            className="hover-bg-soft"
          >
            <FontAwesomeIcon icon={faEye} />
          </Button>
          
          {canEdit && (
            <Button
              variant="outline-warning"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(row);
              }}
              title="Editar"
              disabled={loading || loadingDetalles}
              className="hover-bg-soft"
            >
              {loadingDetalles ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faEdit} />}
            </Button>
          )}
          {canChangeStatus && (
            <Button
              variant={row.UsuarioActivo ? "outline-danger" : "outline-success"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(row.ID, row.UsuarioActivo);
              }}
              title={row.UsuarioActivo ? "Desactivar" : "Activar"}
              disabled={loading}
              className="hover-bg-soft"
            >
              <FontAwesomeIcon icon={faPowerOff} />
            </Button>
          )}
        </ButtonGroup>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  const handleClearFilter = () => {
    setFilterText('');
    setResetPaginationToggle(!resetPaginationToggle);
  };

  const handleRowSelected = (state: { selectedRows: Empleado[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleRowClicked = (row: Empleado) => {
    openViewModal(row);
  };

  const handleClearSelected = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  const handlePerRowsChange = async (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
  };

  // ==================== RENDERIZADO ====================

  if (!canViewAll) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <div className="avatar-circle bg-warning mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
              <FontAwesomeIcon icon={faUserShield} size="3x" className="text-white" />
            </div>
            <h3 className="text-primary">Acceso Restringido</h3>
            <p className="text-muted">
              No tienes permisos para acceder a la gestión de colaboradores.
              <br />
              Solo administradores y managers pueden ver esta sección.
            </p>
            <Badge bg={isAdmin ? 'danger' : 'warning'} className="fs-6 p-2 mb-4">
              Tu rol: {userRol === 'admin' ? 'Administrador' : userRol === 'manager' ? 'Gerente' : userRol?.toUpperCase()}
            </Badge>
            <div>
              <Button variant="primary" onClick={() => window.history.back()} className="px-4">
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
              <h2 className="mb-0 text-primary">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Gestión de Colaboradores
              </h2>
              <p className="text-muted mb-0">
                <FontAwesomeIcon icon={faChartLine} className="me-1" />
                Total: {empleados.length} colaboradores | Mostrando: {filteredEmpleados.length}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              
              <ButtonGroup className="shadow-sm">
                <Button 
                  variant="outline-primary" 
                  onClick={loadEmpleados} 
                  disabled={loading}
                  className="hover-bg-soft"
                >
                  <FontAwesomeIcon icon={faSync} className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                  Actualizar
                </Button>
                {canCreate && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateModal(true)} 
                    disabled={loading}
                    className="bg-gradient-primary"
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Nuevo Colaborador
                  </Button>
                )}
              </ButtonGroup>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alertas */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm">
          <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="shadow-sm">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
          {success}
        </Alert>
      )}

      {/* Barra de filtros y selección */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="bg-gradient-primary-light">
          <Row>
            <Col md={6}>
              <FilterComponent
                filterText={filterText}
                onFilter={handleFilter}
                onClear={handleClearFilter}
                placeholder="Buscar colaborador por nombre, correo, rol, puesto..."
              />
            </Col>
            <Col md={6} className="d-flex justify-content-end align-items-center">
              {selectedRows.length > 0 && (
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="info" className="p-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                    {selectedRows.length} colaboradores seleccionados
                  </Badge>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearSelected} className="hover-bg-soft">
                    Limpiar selección
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* DataTable */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading && empleados.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando colaboradores...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredEmpleados}
              pagination
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50, 100]}
              onChangeRowsPerPage={handlePerRowsChange}
              highlightOnHover
              pointerOnHover
              selectableRows
              selectableRowsHighlight
              onSelectedRowsChange={handleRowSelected}
              clearSelectedRows={toggleCleared}
              onRowClicked={handleRowClicked}
              responsive
              subHeaderComponent={
                <div className="w-100 d-flex justify-content-between align-items-center py-2 px-3">
                  <div className="text-muted">
                    {filterText && (
                      <span>
                        <FontAwesomeIcon icon={faFilter} className="me-2" />
                        Filtrado: {filteredEmpleados.length} colaboradores
                      </span>
                    )}
                  </div>
                </div>
              }
              noDataComponent={
                <div className="text-center py-5">
                  <div className="avatar-circle bg-soft mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                    <FontAwesomeIcon icon={faUsers} size="3x" className="text-primary" />
                  </div>
                  <h5 className="text-primary">No hay colaboradores para mostrar</h5>
                  <p className="text-muted">
                    {filterText ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo colaborador'}
                  </p>
                  {canCreate && !filterText && (
                    <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-3 px-4 bg-gradient-primary">
                      <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                      Crear Primer Colaborador
                    </Button>
                  )}
                </div>
              }
              customStyles={customStyles}
              progressPending={loading}
              progressComponent={
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando datos...</p>
                </div>
              }
              sortIcon={
                <FontAwesomeIcon icon={faSort} className="ms-2 text-muted" />
              }
            />
          )}
        </Card.Body>
        
        <Card.Footer className="bg-light border-top">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <FontAwesomeIcon icon={faUsers} className="me-1" />
              Total: {empleados.length} colaboradores
            </small>
            <small className="text-muted">
              <FontAwesomeIcon icon={faChartLine} className="me-1" />
              {selectedRows.length > 0 ? `${selectedRows.length} colaboradores seleccionados` : 'Ninguno seleccionado'}
            </small>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal de Creación */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" scrollable centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Nuevo Colaborador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          <Tabs defaultActiveKey="basic" className="mb-3 nav-pills" fill>
            <Tab eventKey="basic" title="Información Básica">
              <div className="mt-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Nombre Completo *</Form.Label>
                      <Form.Control
                        type="text"
                        value={createData.nombreCompleto}
                        onChange={(e) => setCreateData({...createData, nombreCompleto: e.target.value})}
                        placeholder="Juan Pérez López"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Correo Electrónico *</Form.Label>
                      <Form.Control
                        type="email"
                        value={createData.correoElectronico}
                        onChange={(e) => setCreateData({...createData, correoElectronico: e.target.value})}
                        placeholder="juan.perez@empresa.com"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Contraseña *</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          value={createData.contrasenia}
                          onChange={(e) => setCreateData({...createData, contrasenia: e.target.value})}
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setCreateData({...createData, contrasenia: 'Password' + Math.floor(Math.random() * 1000)})}
                          className="hover-bg-soft"
                        >
                          Generar
                        </Button>
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Mínimo 6 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    {isAdmin && (
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Rol en el Sistema *</Form.Label>
                        <Form.Select
                          value={createData.rolApp}
                          onChange={(e) => setCreateData({...createData, rolApp: e.target.value})}
                        >
                          <option value="employee">Colaborador</option>
                          <option value="manager">Gerente</option>
                          <option value="admin">Administrador</option>
                        </Form.Select>
                      </Form.Group>
                    )}
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Fecha de Ingreso *</Form.Label>
                      <Form.Control
                        type="date"
                        value={createData.fechaIngreso}
                        onChange={(e) => setCreateData({...createData, fechaIngreso: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Fecha de Nacimiento *</Form.Label>
                      <Form.Control
                        type="date"
                        value={createData.fechaNacimiento}
                        onChange={(e) => setCreateData({...createData, fechaNacimiento: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Celular</Form.Label>
                      <Form.Control
                        type="tel"
                        value={createData.celular || ''}
                        onChange={(e) => setCreateData({...createData, celular: e.target.value})}
                        placeholder="+52 55 1234 5678"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Teléfono de Emergencia</Form.Label>
                      <Form.Control
                        type="tel"
                        value={createData.telefonoEmergencia || ''}
                        onChange={(e) => setCreateData({...createData, telefonoEmergencia: e.target.value})}
                        placeholder="+52 55 8765 4321"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Tab>
            
            <Tab eventKey="additional" title="Información Adicional">
              <div className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary fw-semibold">Dirección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={createData.direccion || ''}
                    onChange={(e) => setCreateData({...createData, direccion: e.target.value})}
                    placeholder="Calle, Número, Colonia, Ciudad, Estado"
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">NSS</Form.Label>
                      <Form.Control
                        type="text"
                        value={createData.nss || ''}
                        onChange={(e) => setCreateData({...createData, nss: e.target.value})}
                        placeholder="12345678901"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">RFC</Form.Label>
                      <Form.Control
                        type="text"
                        value={createData.rfc || ''}
                        onChange={(e) => setCreateData({...createData, rfc: e.target.value.toUpperCase()})}
                        placeholder="PEPJ800101ABC"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">CURP</Form.Label>
                      <Form.Control
                        type="text"
                        value={createData.curp || ''}
                        onChange={(e) => setCreateData({...createData, curp: e.target.value.toUpperCase()})}
                        placeholder="PEPJ800101HDFLRN01"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Puesto</Form.Label>
                      <Form.Select
                        value={createData.puestoId || ''}
                        onChange={(e) => setCreateData({...createData, puestoId: e.target.value ? parseInt(e.target.value) : undefined})}
                      >
                        <option value="">Seleccionar puesto</option>
                        {catalogos?.puestos?.map((puesto) => (
                          <option key={puesto.ID} value={puesto.ID}>
                            {puesto.Nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary fw-semibold">Departamentos</Form.Label>
                  <Form.Select
                    multiple
                    value={createData.departamentos.map(d => d.toString())}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setCreateData({...createData, departamentos: selected});
                    }}
                    size={3}
                  >
                    {catalogos?.departamentos?.map((depto) => (
                      <option key={depto.ID} value={depto.ID}>
                        {depto.Nombre}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Mantén presionado Ctrl para seleccionar múltiples
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary fw-semibold">Jefes Directos</Form.Label>
                  <Form.Select
                    multiple
                    value={createData.jefes.map(j => j.toString())}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setCreateData({...createData, jefes: selected});
                    }}
                    size={3}
                  >
                    {catalogos?.empleados?.filter(emp => emp.RolApp === 'manager' || emp.RolApp === 'admin').map((emp) => (
                      <option key={emp.ID} value={emp.ID}>
                        {emp.NombreCompleto} ({emp.RolApp === 'admin' ? 'Administrador' : 'Gerente'})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Mantén presionado Ctrl para seleccionar múltiples
                  </Form.Text>
                </Form.Group>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="hover-bg-soft">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={loading} className="bg-gradient-primary px-4">
            {loading ? <Spinner size="sm" className="me-2" /> : <FontAwesomeIcon icon={faUserPlus} className="me-2" />}
            Crear Colaborador
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Visualización - VERSIÓN MEJORADA */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserCircle} className="me-2" />
            Información del Colaborador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          {selectedEmpleado && (
            <>
              <div className="text-center mb-4">
                <div className="avatar-circle bg-primary mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                  <FontAwesomeIcon icon={faUserCircle} size="3x" className="text-white" />
                </div>
                <h4 className="text-primary">{selectedEmpleado.NombreCompleto}</h4>
                <div className="mb-3">
                  {getRolBadge(selectedEmpleado.RolApp)}
                  {' '}
                  {getStatusBadge(selectedEmpleado.UsuarioActivo)}
                </div>
              </div>
              
              <Tabs defaultActiveKey="general" className="mb-3 nav-pills" fill>
                <Tab eventKey="general" title="Información General">
                  <div className="mt-3">
                    <Row>
                      <Col md={6}>
                        <div className="mb-3 p-3 bg-soft rounded">
                          <strong className="text-primary d-block mb-2">
                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                            Correo Electrónico
                          </strong>
                          <p className="text-muted mb-0">{selectedEmpleado.CorreoElectronico}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3 p-3 bg-soft rounded">
                          <strong className="text-primary d-block mb-2">
                            <FontAwesomeIcon icon={faPhone} className="me-2" />
                            Celular
                          </strong>
                          <p className="text-muted mb-0">{selectedEmpleado.Celular || 'No especificado'}</p>
                        </div>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <div className="mb-3 p-3 bg-soft rounded">
                          <strong className="text-primary d-block mb-2">
                            <FontAwesomeIcon icon={faCalendar} className="me-2" />
                            Fecha de Ingreso
                          </strong>
                          <p className="text-muted mb-0">{formatDateDisplay(selectedEmpleado.FechaIngreso)}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3 p-3 bg-soft rounded">
                          <strong className="text-primary d-block mb-2">
                            <FontAwesomeIcon icon={faBirthdayCake} className="me-2" />
                            Fecha de Nacimiento
                          </strong>
                          <p className="text-muted mb-0">{formatDateDisplay(selectedEmpleado.FechaNacimiento)}</p>
                        </div>
                      </Col>
                    </Row>
                    
                    {selectedEmpleado.PuestoNombre && (
                      <Row>
                        <Col md={6}>
                          <div className="mb-3 p-3 bg-soft rounded">
                            <strong className="text-primary d-block mb-2">
                              <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                              Puesto
                            </strong>
                            <p className="text-muted mb-0">{selectedEmpleado.PuestoNombre}</p>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="additional" title="Información Adicional">
                  <div className="mt-3">
                    {selectedEmpleado.Direccion && (
                      <div className="mb-3 p-3 bg-soft rounded">
                        <strong className="text-primary d-block mb-2">
                          <FontAwesomeIcon icon={faHome} className="me-2" />
                          Dirección
                        </strong>
                        <p className="text-muted mb-0">{selectedEmpleado.Direccion}</p>
                      </div>
                    )}
                    
                    {selectedEmpleado.TelefonoEmergencia && (
                      <div className="mb-3 p-3 bg-soft rounded">
                        <strong className="text-primary d-block mb-2">
                          <FontAwesomeIcon icon={faPhoneAlt} className="me-2" />
                          Teléfono de Emergencia
                        </strong>
                        <p className="text-muted mb-0">{selectedEmpleado.TelefonoEmergencia}</p>
                      </div>
                    )}
                    
                    <Row>
                      {selectedEmpleado.NSS && (
                        <Col md={6}>
                          <div className="mb-3 p-3 bg-soft rounded">
                            <strong className="text-primary d-block mb-2">
                              <FontAwesomeIcon icon={faIdCard} className="me-2" />
                              NSS
                            </strong>
                            <p className="text-muted mb-0">{selectedEmpleado.NSS}</p>
                          </div>
                        </Col>
                      )}
                      {selectedEmpleado.RFC && (
                        <Col md={6}>
                          <div className="mb-3 p-3 bg-soft rounded">
                            <strong className="text-primary d-block mb-2">
                              <FontAwesomeIcon icon={faFileContract} className="me-2" />
                              RFC
                            </strong>
                            <p className="text-muted mb-0">{selectedEmpleado.RFC}</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                    
                    {selectedEmpleado.CURP && (
                      <div className="mb-3 p-3 bg-soft rounded">
                        <strong className="text-primary d-block mb-2">
                          <FontAwesomeIcon icon={faIdCard} className="me-2" />
                          CURP
                        </strong>
                        <p className="text-muted mb-0">{selectedEmpleado.CURP}</p>
                      </div>
                    )}
                  </div>
                </Tab>
                
                {/* TAB DE DEPARTAMENTOS Y JEFES - AHORA FUNCIONAL */}
                <Tab eventKey="deptos-jefes" title="Departamentos y Jefes">
                  <div className="mt-3">
                    {/* Departamentos */}
                    <div className="mb-4">
                      <h5 className="text-primary mb-3">
                        <FontAwesomeIcon icon={faHome} className="me-2" />
                        Departamentos Asignados
                      </h5>
                      {departamentosEmpleado && departamentosEmpleado.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {departamentosEmpleado.map(depto => (
                            <Badge 
                              key={depto.ID} 
                              bg="primary" 
                              className="p-3 fs-6"
                              style={{ fontSize: '1rem' }}
                            >
                              <FontAwesomeIcon icon={faHome} className="me-2" />
                              {depto.Nombre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-soft rounded">
                          <FontAwesomeIcon icon={faHome} size="2x" className="text-muted mb-2" />
                          <p className="text-muted mb-0">No tiene departamentos asignados</p>
                        </div>
                      )}
                    </div>

                    {/* Jefes Directos */}
                    <div className="mb-4">
                      <h5 className="text-primary mb-3">
                        <FontAwesomeIcon icon={faUserShield} className="me-2" />
                        Jefes Directos
                      </h5>
                      {jefesEmpleado && jefesEmpleado.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {jefesEmpleado.map(jefe => (
                            <Card key={jefe.ID} className="border-0 shadow-sm">
                              <Card.Body className="d-flex align-items-center">
                                <div className="avatar-circle bg-info me-3" style={{ width: '50px', height: '50px' }}>
                                  <FontAwesomeIcon icon={faUserCircle} className="text-white" size="lg" />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 text-primary fw-bold">{jefe.NombreCompleto}</h6>
                                  <div className="d-flex flex-wrap align-items-center gap-2">
                                    <Badge bg={jefe.RolApp === 'admin' ? 'danger' : 'warning'}>
                                      {jefe.RolApp === 'admin' ? 'Administrador' : 'Gerente'}
                                    </Badge>
                                    <small className="text-muted">
                                      <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                      {jefe.CorreoElectronico}
                                    </small>
                                    {jefe.PuestoNombre && (
                                      <small className="text-muted">
                                        <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                                        {jefe.PuestoNombre}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-soft rounded">
                          <FontAwesomeIcon icon={faUserShield} size="2x" className="text-muted mb-2" />
                          <p className="text-muted mb-0">No tiene jefes directos asignados</p>
                        </div>
                      )}
                    </div>

                    {/* Resumen de asignaciones */}
                    {(departamentosEmpleado?.length > 0 || jefesEmpleado?.length > 0) && (
                      <div className="bg-light p-3 rounded mt-3">
                        <h6 className="text-primary mb-2">Resumen de Asignaciones:</h6>
                        <ul className="list-unstyled mb-0">
                          {departamentosEmpleado?.length > 0 && (
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                              <strong>{departamentosEmpleado.length}</strong> departamento(s) asignado(s)
                            </li>
                          )}
                          {jefesEmpleado?.length > 0 && (
                            <li className="mb-1">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                              <strong>{jefesEmpleado.length}</strong> jefe(s) directo(s)
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <ButtonGroup>
            <Button variant="secondary" onClick={() => setShowViewModal(false)} className="hover-bg-soft">
              Cerrar
            </Button>
            {canEdit && (
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedEmpleado!);
                }}
                className="bg-gradient-primary"
              >
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Editar
              </Button>
            )}
            {canChangeStatus && selectedEmpleado && (
              <Button 
                variant={selectedEmpleado.UsuarioActivo ? 'danger' : 'success'}
                onClick={() => {
                  handleToggleStatus(selectedEmpleado.ID, selectedEmpleado.UsuarioActivo);
                  setShowViewModal(false);
                }}
              >
                <FontAwesomeIcon icon={selectedEmpleado.UsuarioActivo ? faTimesCircle : faCheckCircle} className="me-2" />
                {selectedEmpleado.UsuarioActivo ? 'Desactivar' : 'Activar'}
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="outline-danger"
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteModal(selectedEmpleado!);
                }}
                className="hover-bg-soft"
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Eliminar
              </Button>
            )}
          </ButtonGroup>
        </Modal.Footer>
      </Modal>

      {/* Modal de Edición - VERSIÓN CORREGIDA CON SELECTS VISIBLES */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" scrollable centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Colaborador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white">
          {loadingDetalles ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Cargando información del colaborador...</p>
            </div>
          ) : (
            <Tabs defaultActiveKey="basic" className="mb-3 nav-pills" fill>
              <Tab eventKey="basic" title="Información Básica">
                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Nombre Completo *</Form.Label>
                        <Form.Control
                          type="text"
                          value={editData.nombreCompleto || selectedEmpleado?.NombreCompleto || ''}
                          onChange={(e) => setEditData({...editData, nombreCompleto: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Correo Electrónico</Form.Label>
                        <Form.Control
                          type="email"
                          value={selectedEmpleado?.CorreoElectronico || ''}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          El correo no se puede modificar por seguridad
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Celular</Form.Label>
                        <Form.Control
                          type="tel"
                          value={editData.celular || selectedEmpleado?.Celular || ''}
                          onChange={(e) => setEditData({...editData, celular: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Fecha de Nacimiento *</Form.Label>
                        <Form.Control
                          type="date"
                          value={editData.fechaNacimiento || formatDateForInput(selectedEmpleado?.FechaNacimiento) || ''}
                          onChange={(e) => setEditData({...editData, fechaNacimiento: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {isAdmin && (
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Rol en el Sistema</Form.Label>
                      <Form.Select
                        value={editData.rolApp || selectedEmpleado?.RolApp || 'employee'}
                        onChange={(e) => setEditData({...editData, rolApp: e.target.value})}
                      >
                        <option value="employee">Colaborador</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                      </Form.Select>
                    </Form.Group>
                  )}
                  
                  {catalogos && (
                    <Form.Group className="mb-3">
                      <Form.Label className="text-primary fw-semibold">Puesto</Form.Label>
                      <Form.Select
                        value={editData.puestoId?.toString() || selectedEmpleado?.PuestoID?.toString() || ''}
                        onChange={(e) => setEditData({
                          ...editData, 
                          puestoId: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      >
                        <option value="">Seleccionar puesto</option>
                        {catalogos.puestos.map((puesto) => (
                          <option key={puesto.ID} value={puesto.ID}>
                            {puesto.Nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label className="text-primary fw-semibold">Fecha de Ingreso</Form.Label>
                    <Form.Control
                      type="date"
                      value={formatDateForInput(selectedEmpleado?.FechaIngreso)}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      La fecha de ingreso no se puede modificar
                    </Form.Text>
                  </Form.Group>
                </div>
              </Tab>
              
              <Tab eventKey="additional" title="Información Adicional">
                <div className="mt-3">
                  <Form.Group className="mb-3">
                    <Form.Label className="text-primary fw-semibold">Dirección</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={editData.direccion || selectedEmpleado?.Direccion || ''}
                      onChange={(e) => setEditData({...editData, direccion: e.target.value})}
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">NSS</Form.Label>
                        <Form.Control
                          type="text"
                          value={editData.nss || selectedEmpleado?.NSS || ''}
                          onChange={(e) => setEditData({...editData, nss: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">RFC</Form.Label>
                        <Form.Control
                          type="text"
                          value={editData.rfc || selectedEmpleado?.RFC || ''}
                          onChange={(e) => setEditData({...editData, rfc: e.target.value.toUpperCase()})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">CURP</Form.Label>
                        <Form.Control
                          type="text"
                          value={editData.curp || selectedEmpleado?.CURP || ''}
                          onChange={(e) => setEditData({...editData, curp: e.target.value.toUpperCase()})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Teléfono de Emergencia</Form.Label>
                        <Form.Control
                          type="tel"
                          value={editData.telefonoEmergencia || selectedEmpleado?.TelefonoEmergencia || ''}
                          onChange={(e) => setEditData({...editData, telefonoEmergencia: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {catalogos && (
                    <>
                      {/* DEPARTAMENTOS - VERSIÓN CORREGIDA */}
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Departamentos</Form.Label>
                        <Form.Select
                          multiple
                          value={(editData.departamentos || []).map(d => d.toString())}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions);
                            const selectedValues = selectedOptions.map(option => parseInt(option.value));
                            setEditData({...editData, departamentos: selectedValues});
                          }}
                          size={3}
                          key={`deptos-${JSON.stringify(editData.departamentos)}`}
                        >
                          {catalogos.departamentos.map((depto) => {
                            const isSelected = (editData.departamentos || []).includes(depto.ID);
                            return (
                              <option 
                                key={depto.ID} 
                                value={depto.ID}
                                style={isSelected ? { backgroundColor: '#e3f2fd', fontWeight: 'bold' } : {}}
                              >
                                {depto.Nombre} {isSelected ? '✓' : ''}
                              </option>
                            );
                          })}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Mantén presionado Ctrl para seleccionar/deseleccionar múltiples. 
                          <strong> Seleccionados: {(editData.departamentos || []).length} departamentos</strong>
                        </Form.Text>
                      </Form.Group>
                      
                      {/* JEFES DIRECTOS - VERSIÓN CORREGIDA */}
                      <Form.Group className="mb-3">
                        <Form.Label className="text-primary fw-semibold">Jefes Directos</Form.Label>
                        <Form.Select
                          multiple
                          value={(editData.jefes || []).map(j => j.toString())}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions);
                            const selectedValues = selectedOptions.map(option => parseInt(option.value));
                            setEditData({...editData, jefes: selectedValues});
                          }}
                          size={3}
                          key={`jefes-${JSON.stringify(editData.jefes)}`}
                        >
                          {catalogos.empleados
                            .filter(emp => emp.RolApp === 'manager' || emp.RolApp === 'admin')
                            .map((emp) => {
                              const isSelected = (editData.jefes || []).includes(emp.ID);
                              return (
                                <option 
                                  key={emp.ID} 
                                  value={emp.ID}
                                  style={isSelected ? { backgroundColor: '#e3f2fd', fontWeight: 'bold' } : {}}
                                >
                                  {emp.NombreCompleto} ({emp.RolApp === 'admin' ? 'Administrador' : 'Gerente'}) {isSelected ? '✓' : ''}
                                </option>
                              );
                            })}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Mantén presionado Ctrl para seleccionar/deseleccionar múltiples.
                          <strong> Seleccionados: {(editData.jefes || []).length} jefes</strong>
                        </Form.Text>
                      </Form.Group>
                    </>
                  )}
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="hover-bg-soft">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading || loadingDetalles} className="bg-gradient-primary px-4">
            {loading ? <Spinner size="sm" className="me-2" /> : <FontAwesomeIcon icon={faEdit} className="me-2" />}
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="text-danger">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Eliminar Colaborador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FontAwesomeIcon icon={faBan} size="3x" className="text-danger mb-3" />
            <h4 className="text-primary">¿Estás seguro de eliminar este colaborador?</h4>
            <p className="text-muted">
              Esta acción eliminará permanentemente al colaborador <strong className="text-primary">{selectedEmpleado?.NombreCompleto}</strong> del sistema.
            </p>
            <Alert variant="danger" className="mt-3">
              <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. Se perderán todos los datos del colaborador.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="hover-bg-soft">
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading} className="px-4">
            {loading ? <Spinner size="sm" className="me-2" /> : <FontAwesomeIcon icon={faTrash} className="me-2" />}
            Sí, eliminar permanentemente
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Reautenticación */}
      {user && (
        <ReauthModal
          show={showReauthModal}
          usuario={user.usuario}
          onSuccess={() => {
            setShowReauthModal(false);
          }}
          onCancel={() => setShowReauthModal(false)}
          title="Verificación de Seguridad"
          message="Para acceder a información sensible, necesitas verificar tu identidad como administrador."
        />
      )}
    </Container>
  );
};

export default Empleados;