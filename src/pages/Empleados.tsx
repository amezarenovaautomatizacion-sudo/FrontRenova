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
  ButtonGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faPowerOff
} from '@fortawesome/free-solid-svg-icons';
import ReauthModal from '../components/ReauthModal';
import api from '../services/api';

// Interfaces basadas en la API
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

// Función auxiliar para formatear fechas en formato YYYY-MM-DD
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    // Si es timestamp o ISO string
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
  const [loading, setLoading] = useState(false);
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const itemsPerPage = 10;

  // ==================== FUNCIONES DE CARGA ====================

  const loadCatalogos = useCallback(async () => {
    if (!canCreate && !canEdit) return;
    
    try {
      console.log('Cargando catálogos...');
      const response = await api.get('/empleados/catalogos');
      console.log('Catálogos respuesta:', response.data);
      
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
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterRol) params.append('rol', filterRol);
      
      console.log('Cargando empleados con params:', params.toString());
      const response = await api.get(`/empleados/empleados?${params}`);
      console.log('Empleados respuesta:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        setEmpleados(data.empleados || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Error cargando empleados');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error cargando empleados:', apiError);
      if (apiError.response?.status === 403) {
        setError('No tienes permisos para acceder a esta sección');
        logout();
      } else {
        setError(apiError.response?.data?.message || 'Error cargando empleados');
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAll, currentPage, searchTerm, filterRol, itemsPerPage, logout]);

  // Función para cargar detalles completos del empleado (departamentos y jefes)
  const loadEmpleadoDetalles = async (empleadoId: number) => {
    try {
      setLoading(true);
      
      // Obtener información básica
      const response = await api.get(`/empleados/empleados/${empleadoId}`);
      console.log('Detalles empleado respuesta:', response.data);
      
      if (response.data.success) {
        const empleadoCompleto = response.data.data;
        setSelectedEmpleado(empleadoCompleto);
        
        // Obtener departamentos del empleado
        try {
          const deptosRes = await api.get(`/empleados/empleados/${empleadoId}/departamentos`);
          if (deptosRes.data.success) {
            setDepartamentosEmpleado(deptosRes.data.data || []);
          }
        } catch (error) {
          console.warn('No se pudieron cargar departamentos:', error);
          setDepartamentosEmpleado([]);
        }
        
        // Obtener jefes del empleado
        try {
          const jefesRes = await api.get(`/empleados/empleados/${empleadoId}/jefes`);
          if (jefesRes.data.success) {
            setJefesEmpleado(jefesRes.data.data || []);
          }
        } catch (error) {
          console.warn('No se pudieron cargar jefes:', error);
          setJefesEmpleado([]);
        }
        
        return empleadoCompleto;
      } else {
        throw new Error('Error al cargar información del empleado');
      }
    } catch (error) {
      console.error('Error cargando detalles del empleado:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, [loadEmpleados]);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  // ==================== FUNCIONES DE CRUD ====================

  const handleCreate = async () => {
    if (!canCreate) {
      setError('No tienes permisos para crear empleados');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Validaciones
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

      // Validar formato de fechas
      const fechaIngreso = new Date(createData.fechaIngreso);
      const fechaNacimiento = new Date(createData.fechaNacimiento);
      
      if (isNaN(fechaIngreso.getTime()) || isNaN(fechaNacimiento.getTime())) {
        setError('Formato de fecha inválido');
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
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

      console.log('Enviando datos de creación:', empleadoData);
      
      const response = await api.post('/empleados/empleados', empleadoData);
      
      if (response.data.success) {
        setSuccess('Empleado creado exitosamente');
        setShowCreateModal(false);
        resetCreateForm();
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error creando empleado');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error creando empleado:', apiError);
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
        setError(errorMsg || 'Error creando empleado');
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
      
      // Filtrar campos que realmente han cambiado
      const camposActualizados: UpdateEmpleadoData = {};
      
      if (editData.nombreCompleto && editData.nombreCompleto !== selectedEmpleado.NombreCompleto) {
        camposActualizados.nombreCompleto = editData.nombreCompleto;
      }
      
      if (editData.celular !== undefined && editData.celular !== selectedEmpleado.Celular) {
        camposActualizados.celular = editData.celular || null;
      }
      
      // Fecha de nacimiento
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
      
      if (isAdmin && editData.rolApp && editData.rolApp !== selectedEmpleado.RolApp) {
        camposActualizados.rolApp = editData.rolApp;
      }
      
      if (editData.puestoId !== selectedEmpleado.PuestoID) {
        camposActualizados.puestoId = editData.puestoId || null;
      }
      
      // Solo enviar departamentos y jefes si se han modificado
      if (editData.departamentos !== undefined) {
        camposActualizados.departamentos = editData.departamentos;
      }
      
      if (editData.jefes !== undefined) {
        camposActualizados.jefes = editData.jefes;
      }
      
      // Si no hay cambios, mostrar mensaje
      if (Object.keys(camposActualizados).length === 0) {
        setError('No se han realizado cambios');
        setLoading(false);
        return;
      }
      
      console.log('Enviando datos actualizados:', camposActualizados);
      
      const response = await api.put(`/empleados/empleados/${selectedEmpleado.ID}`, camposActualizados);
      
      if (response.data.success) {
        setSuccess('Empleado actualizado exitosamente');
        setShowEditModal(false);
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error actualizando empleado');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error actualizando empleado:', apiError);
      setError(apiError.response?.data?.message || 'Error actualizando empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (empleadoId: number, activo: boolean) => {
    if (!canChangeStatus) {
      setError('No tienes permisos para cambiar el estado de empleados');
      return;
    }
    
    const accion = activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} este empleado?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await api.patch(`/empleados/empleados/${empleadoId}/estado`, {
        activo: !activo
      });
      
      if (response.data.success) {
        setSuccess(`Empleado ${activo ? 'desactivado' : 'activado'} exitosamente`);
        loadEmpleados();
        
        // Si el modal de vista está abierto, actualizar también
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
        setSuccess('Empleado eliminado exitosamente');
        setShowDeleteModal(false);
        setSelectedEmpleado(null);
        loadEmpleados();
      } else {
        setError(response.data.message || 'Error eliminando empleado');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error eliminando empleado:', apiError);
      setError(apiError.response?.data?.message || 'Error eliminando empleado');
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
      setError('Error al cargar información del empleado');
    }
  };

  const openEditModal = async (empleado: Empleado) => {
    if (!canEdit) {
      setError('No tienes permisos para editar empleados');
      return;
    }
    
    try {
      await loadEmpleadoDetalles(empleado.ID);
      
      // Preparar datos para edición
      const fechaNacimientoFormateada = formatDateForInput(empleado.FechaNacimiento);
      
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
        departamentos: departamentosEmpleado.map(d => d.ID),
        jefes: jefesEmpleado.map(j => j.ID)
      });
      
      setShowEditModal(true);
    } catch (error) {
      setError('Error al cargar información del empleado');
    }
  };

  const openDeleteModal = (empleado: Empleado) => {
    if (!canDelete) {
      setError('Solo administradores pueden eliminar empleados');
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
      <Badge bg={colors[rol as keyof typeof colors] || 'secondary'}>
        {rol.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <Badge bg="success">Activo</Badge>
    ) : (
      <Badge bg="secondary">Inactivo</Badge>
    );
  };

  const renderAcciones = (empleado: Empleado) => {
    return (
      <ButtonGroup size="sm">
        <Button
          variant="outline-primary"
          onClick={() => openViewModal(empleado)}
          title="Ver detalles"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faEye} />
        </Button>
        
        {canEdit && (
          <Button
            variant="outline-warning"
            onClick={() => openEditModal(empleado)}
            title="Editar"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : <FontAwesomeIcon icon={faEdit} />}
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="outline-danger"
            onClick={() => openDeleteModal(empleado)}
            title="Eliminar"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
        
        {canChangeStatus && (
          <Button
            variant={empleado.UsuarioActivo ? "outline-secondary" : "outline-success"}
            onClick={() => handleToggleStatus(empleado.ID, empleado.UsuarioActivo)}
            title={empleado.UsuarioActivo ? "Desactivar" : "Activar"}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPowerOff} />
          </Button>
        )}
      </ButtonGroup>
    );
  };

  // ==================== RENDERIZADO ====================

  if (!canViewAll) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <FontAwesomeIcon icon={faUserShield} size="3x" className="text-warning mb-3" />
            <h3>Acceso Restringido</h3>
            <p className="text-muted">
              No tienes permisos para acceder a la gestión de empleados.
              <br />
              Solo administradores y managers pueden ver esta sección.
            </p>
            <Badge bg={isAdmin ? 'danger' : 'warning'} 
              className="fs-6 p-2">
              Tu rol: {userRol?.toUpperCase()}
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
                <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                Gestión de Empleados
              </h2>
            </div>
            
            <ButtonGroup>
              <Button variant="outline-primary" onClick={loadEmpleados} disabled={loading}>
                <FontAwesomeIcon icon={faSync} className="me-2" />
                Actualizar
              </Button>
              {canCreate && (
                <Button variant="primary" onClick={() => setShowCreateModal(true)} disabled={loading}>
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  Nuevo Empleado
                </Button>
              )}
            </ButtonGroup>
          </div>
        </Col>
      </Row>

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

      {/* Filtros y Búsqueda */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={faSearch} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Select
                  value={filterRol}
                  onChange={(e) => {
                    setFilterRol(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de Empleados */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading && empleados.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando empleados...</p>
            </div>
          ) : empleados.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
              <h5>No hay empleados registrados</h5>
              <p className="text-muted">
                {searchTerm || filterRol ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo empleado'}
              </p>
              {canCreate && !searchTerm && !filterRol && (
                <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-3">
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  Crear Primer Empleado
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Empleado</th>
                      <th>Contacto</th>
                      <th>Rol</th>
                      <th>Antigüedad</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((empleado) => (
                      <tr key={empleado.ID}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" 
                                 style={{width: '40px', height: '40px'}}>
                              <FontAwesomeIcon icon={faUserCircle} className="text-white" />
                            </div>
                            <div>
                              <strong>{empleado.NombreCompleto}</strong>
                              {empleado.PuestoNombre && (
                                <div className="small text-muted">
                                  <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                                  {empleado.PuestoNombre}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <div className="d-flex align-items-center mb-1">
                              <FontAwesomeIcon icon={faEnvelope} className="text-muted me-2" size="sm" />
                              <small>{empleado.CorreoElectronico}</small>
                            </div>
                            {empleado.Celular && (
                              <div className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faPhone} className="text-muted me-2" size="sm" />
                                <small>{empleado.Celular}</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{getRolBadge(empleado.RolApp)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faCalendar} className="text-muted me-2" />
                            <div>
                              <div>{formatDateDisplay(empleado.FechaIngreso)}</div>
                              <small className="text-muted">
                                {Math.floor((new Date().getTime() - new Date(empleado.FechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(empleado.UsuarioActivo)}
                        </td>
                        <td className="text-end">
                          {renderAcciones(empleado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Paginación */}
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
                      let page = currentPage - 2 + idx;
                      if (page < 1) page = 1 + idx;
                      if (page > totalPages) page = totalPages - (4 - idx);
                      if (page < 1) page = 1;
                      
                      return (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      );
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
        
        <Card.Footer className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <FontAwesomeIcon icon={faUsers} className="me-1" />
              Mostrando {empleados.length} empleados
            </small>
            <small className="text-muted">
              <FontAwesomeIcon icon={faChartLine} className="me-1" />
              Página {currentPage} de {totalPages}
            </small>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal de Creación */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" scrollable>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Nuevo Empleado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="basic" className="mb-3" fill>
            <Tab eventKey="basic" title="Información Básica">
              <div className="mt-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Completo *</Form.Label>
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
                      <Form.Label>Correo Electrónico *</Form.Label>
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
                      <Form.Label>Contraseña *</Form.Label>
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
                        <Form.Label>Rol en el Sistema *</Form.Label>
                        <Form.Select
                          value={createData.rolApp}
                          onChange={(e) => setCreateData({...createData, rolApp: e.target.value})}
                        >
                          <option value="employee">Employee (Empleado)</option>
                          <option value="manager">Manager (Gerente)</option>
                          <option value="admin">Administrador</option>
                        </Form.Select>
                      </Form.Group>
                    )}
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Ingreso *</Form.Label>
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
                      <Form.Label>Fecha de Nacimiento *</Form.Label>
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
                      <Form.Label>Celular</Form.Label>
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
                      <Form.Label>Teléfono de Emergencia</Form.Label>
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
                  <Form.Label>Dirección</Form.Label>
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
                      <Form.Label>NSS (Número de Seguro Social)</Form.Label>
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
                      <Form.Label>RFC</Form.Label>
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
                      <Form.Label>CURP</Form.Label>
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
                      <Form.Label>Puesto</Form.Label>
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
                  <Form.Label>Departamentos</Form.Label>
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
                  <Form.Label>Jefes Directos</Form.Label>
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
                        {emp.NombreCompleto} ({emp.RolApp})
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={loading}>
            {loading ? <Spinner size="sm" className="me-2" /> : <FontAwesomeIcon icon={faUserPlus} className="me-2" />}
            Crear Empleado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Visualización */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faUserCircle} className="me-2" />
            Información del Empleado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmpleado && (
            <>
              <div className="text-center mb-4">
                <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center p-3 mb-3">
                  <FontAwesomeIcon icon={faUserCircle} size="3x" className="text-white" />
                </div>
                <h4>{selectedEmpleado.NombreCompleto}</h4>
                <div className="mb-3">
                  {getRolBadge(selectedEmpleado.RolApp)}
                  {' '}
                  {getStatusBadge(selectedEmpleado.UsuarioActivo)}
                </div>
              </div>
              
              <Tabs defaultActiveKey="general" className="mb-3" fill>
                <Tab eventKey="general" title="Información General">
                  <div className="mt-3">
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong><FontAwesomeIcon icon={faEnvelope} className="me-2" /> Correo:</strong>
                          <p className="text-muted">{selectedEmpleado.CorreoElectronico}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong><FontAwesomeIcon icon={faPhone} className="me-2" /> Celular:</strong>
                          <p className="text-muted">{selectedEmpleado.Celular || 'No especificado'}</p>
                        </div>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong><FontAwesomeIcon icon={faCalendar} className="me-2" /> Fecha de Ingreso:</strong>
                          <p className="text-muted">{formatDateDisplay(selectedEmpleado.FechaIngreso)}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong><FontAwesomeIcon icon={faBirthdayCake} className="me-2" /> Fecha de Nacimiento:</strong>
                          <p className="text-muted">{formatDateDisplay(selectedEmpleado.FechaNacimiento)}</p>
                        </div>
                      </Col>
                    </Row>
                    
                    {selectedEmpleado.PuestoNombre && (
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <strong><FontAwesomeIcon icon={faBriefcase} className="me-2" /> Puesto:</strong>
                            <p className="text-muted">{selectedEmpleado.PuestoNombre}</p>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="additional" title="Información Adicional">
                  <div className="mt-3">
                    {selectedEmpleado.Direccion && (
                      <div className="mb-3">
                        <strong><FontAwesomeIcon icon={faHome} className="me-2" /> Dirección:</strong>
                        <p className="text-muted">{selectedEmpleado.Direccion}</p>
                      </div>
                    )}
                    
                    {selectedEmpleado.TelefonoEmergencia && (
                      <div className="mb-3">
                        <strong><FontAwesomeIcon icon={faPhoneAlt} className="me-2" /> Teléfono de Emergencia:</strong>
                        <p className="text-muted">{selectedEmpleado.TelefonoEmergencia}</p>
                      </div>
                    )}
                    
                    <Row>
                      {selectedEmpleado.NSS && (
                        <Col md={6}>
                          <div className="mb-3">
                            <strong><FontAwesomeIcon icon={faIdCard} className="me-2" /> NSS:</strong>
                            <p className="text-muted">{selectedEmpleado.NSS}</p>
                          </div>
                        </Col>
                      )}
                      {selectedEmpleado.RFC && (
                        <Col md={6}>
                          <div className="mb-3">
                            <strong><FontAwesomeIcon icon={faFileContract} className="me-2" /> RFC:</strong>
                            <p className="text-muted">{selectedEmpleado.RFC}</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                    
                    {selectedEmpleado.CURP && (
                      <div className="mb-3">
                        <strong><FontAwesomeIcon icon={faIdCard} className="me-2" /> CURP:</strong>
                        <p className="text-muted">{selectedEmpleado.CURP}</p>
                      </div>
                    )}
                    
                    {/* Departamentos */}
                    {departamentosEmpleado.length > 0 && (
                      <div className="mb-3">
                        <strong><FontAwesomeIcon icon={faHome} className="me-2" /> Departamentos:</strong>
                        <div className="mt-2">
                          {departamentosEmpleado.map(depto => (
                            <Badge key={depto.ID} bg="secondary" className="me-2 mb-2 p-2">
                              {depto.Nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Jefes */}
                    {jefesEmpleado.length > 0 && (
                      <div className="mb-3">
                        <strong><FontAwesomeIcon icon={faUserShield} className="me-2" /> Jefes Directos:</strong>
                        <div className="mt-2">
                          {jefesEmpleado.map(jefe => (
                            <Badge key={jefe.ID} bg="info" className="me-2 mb-2 p-2">
                              {jefe.NombreCompleto} ({jefe.RolApp})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <ButtonGroup>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
            {canEdit && (
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedEmpleado!);
                }}
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
              >
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Eliminar
              </Button>
            )}
          </ButtonGroup>
        </Modal.Footer>
      </Modal>

      {/* Modal de Edición */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Editar Empleado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="basic" className="mb-3" fill>
            <Tab eventKey="basic" title="Información Básica">
              <div className="mt-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Completo *</Form.Label>
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
                      <Form.Label>Correo Electrónico</Form.Label>
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
                      <Form.Label>Celular</Form.Label>
                      <Form.Control
                        type="tel"
                        value={editData.celular || selectedEmpleado?.Celular || ''}
                        onChange={(e) => setEditData({...editData, celular: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Nacimiento *</Form.Label>
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
                    <Form.Label>Rol en el Sistema</Form.Label>
                    <Form.Select
                      value={editData.rolApp || selectedEmpleado?.RolApp || 'employee'}
                      onChange={(e) => setEditData({...editData, rolApp: e.target.value})}
                    >
                      <option value="employee">Employee (Empleado)</option>
                      <option value="manager">Manager (Gerente)</option>
                      <option value="admin">Administrador</option>
                    </Form.Select>
                  </Form.Group>
                )}
                
                {catalogos && (
                  <Form.Group className="mb-3">
                    <Form.Label>Puesto</Form.Label>
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
                  <Form.Label>Fecha de Ingreso</Form.Label>
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
                  <Form.Label>Dirección</Form.Label>
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
                      <Form.Label>NSS (Número de Seguro Social)</Form.Label>
                      <Form.Control
                        type="text"
                        value={editData.nss || selectedEmpleado?.NSS || ''}
                        onChange={(e) => setEditData({...editData, nss: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>RFC</Form.Label>
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
                      <Form.Label>CURP</Form.Label>
                      <Form.Control
                        type="text"
                        value={editData.curp || selectedEmpleado?.CURP || ''}
                        onChange={(e) => setEditData({...editData, curp: e.target.value.toUpperCase()})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono de Emergencia</Form.Label>
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
                    <Form.Group className="mb-3">
                      <Form.Label>Departamentos</Form.Label>
                      <Form.Select
                        multiple
                        value={(editData.departamentos || departamentosEmpleado.map(d => d.ID)).map(d => d.toString())}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setEditData({...editData, departamentos: selected});
                        }}
                        size={3}
                      >
                        {catalogos.departamentos.map((depto) => (
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
                      <Form.Label>Jefes Directos</Form.Label>
                      <Form.Select
                        multiple
                        value={(editData.jefes || jefesEmpleado.map(j => j.ID)).map(j => j.toString())}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setEditData({...editData, jefes: selected});
                        }}
                        size={3}
                      >
                        {catalogos.empleados.filter(emp => emp.RolApp === 'manager' || emp.RolApp === 'admin').map((emp) => (
                          <option key={emp.ID} value={emp.ID}>
                            {emp.NombreCompleto} ({emp.RolApp})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Mantén presionado Ctrl para seleccionar múltiples
                      </Form.Text>
                    </Form.Group>
                  </>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={loading}>
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
            Eliminar Empleado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FontAwesomeIcon icon={faBan} size="3x" className="text-danger mb-3" />
            <h4>¿Estás seguro de eliminar este empleado?</h4>
            <p className="text-muted">
              Esta acción eliminará permanentemente al empleado <strong>{selectedEmpleado?.NombreCompleto}</strong> del sistema.
            </p>
            <Alert variant="danger" className="mt-3">
              <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. Se perderán todos los datos del empleado.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
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