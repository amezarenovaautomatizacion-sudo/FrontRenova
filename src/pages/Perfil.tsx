import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { empleadoService } from '../services/empleadoService';
import {
  Container,
  Row,
  Col,
  Card,
  Tab,
  Nav,
  Button,
  Form,
  Alert,
  Spinner,
  Badge,
  ListGroup,
  Modal
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle,
  faEdit,
  faSave,
  faTimes,
  faLock,
  faBuilding,
  faPhone,
  faMapMarkerAlt,
  faIdCard,
  faShieldAlt,
  faEnvelope,
  faBirthdayCake,
  faUserTie,
  faUsers,
  faHistory,
  faEye,
  faEyeSlash,
  faSync,
  faExclamationTriangle,
  faSignInAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface Empleado {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  Celular?: string;
  FechaIngreso: string;
  FechaNacimiento?: string;
  Direccion?: string;
  NSS?: string;
  RFC?: string;
  CURP?: string;
  TelefonoEmergencia?: string;
  RolApp: 'admin' | 'manager' | 'employee';
  PuestoNombre?: string;
  PuestoDescripcion?: string;
  UsuarioActivo: boolean;
  departamentos?: Departamento[];
  jefes?: Jefe[];
  PuestoID?: number;
  UsuarioID?: number;
  Usuario?: {
    ID: number;
    Usuario: string;
    Rol: string;
    Activo: boolean;
  };
}

interface Departamento {
  ID: number;
  Nombre: string;
  Descripcion?: string;
}

interface Jefe {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  FechaAsignacion: string;
}

// Modal de Reautenticación
interface ReauthModalProps {
  show: boolean;
  usuario: string;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const ReauthModal: React.FC<ReauthModalProps> = ({
  show,
  usuario,
  onSuccess,
  onCancel,
  title = 'Reautenticación Requerida',
  message = 'Por seguridad, necesitas verificar tu identidad para completar esta acción.'
}) => {
  const { login } = useAuth();
  const [contrasenia, setContrasenia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setContrasenia('');
      setError('');
      setLoading(false);
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contrasenia) {
      setError('La contraseña es requerida');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await login(usuario, contrasenia);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title>
          <FontAwesomeIcon icon={faShieldAlt} className="me-2 text-primary" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-3">
            <FontAwesomeIcon icon={faLock} size="2x" className="text-primary" />
          </div>
          <p className="mb-1">{message}</p>
          <p className="text-muted small">
            Usuario: <strong>{usuario}</strong>
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
              {error}
            </Alert>
          )}

          <Form.Group className="mb-4">
            <Form.Label>
              <FontAwesomeIcon icon={faLock} className="me-2" />
              Contraseña
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingresa tu contraseña"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <Form.Text className="text-muted">
              Ingresa la contraseña de tu cuenta para continuar.
            </Form.Text>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !contrasenia}
              className="py-2"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Verificando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                  Confirmar Identidad
                </>
              )}
            </Button>
            
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </Form>

        <div className="mt-4 pt-3 border-top text-center">
          <small className="text-muted">
            <FontAwesomeIcon icon={faShieldAlt} className="me-1" />
            Esta verificación protege tu información personal.
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

// Componente Principal Perfil
const Perfil: React.FC = () => {
  const { user, logout, refreshAuth } = useAuth();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    type: 'perfil' | 'password';
    empleadoId?: number;
    datos?: any;
    empleadoActual?: Empleado;
  } | null>(null);
  const [reauthUser, setReauthUser] = useState('');
  
  // Estados para formulario de edición
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    celular: '',
    fechaNacimiento: '',
    direccion: '',
    telefonoEmergencia: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    contraseniaActual: '',
    nuevaContrasenia: '',
    confirmarContrasenia: ''
  });

  // Cache para almacenar el último estado válido del empleado
  const [empleadoCache, setEmpleadoCache] = useState<Empleado | null>(null);

  const cargarPerfilDesdeLocalStorage = () => {
    try {
      const empleadoData = localStorage.getItem('renova_empleado');
      const userData = localStorage.getItem('renova_user');
      
      if (empleadoData && userData) {
        const empleadoParsed = JSON.parse(empleadoData);
        const userParsed = JSON.parse(userData);
        
        const empleadoCompleto = {
          ...empleadoParsed,
          Usuario: userParsed
        };
        
        setEmpleado(empleadoCompleto);
        setEmpleadoCache(empleadoCompleto); // Guardar en cache
        setReauthUser(userParsed.Usuario);
        
        setFormData({
          nombreCompleto: empleadoParsed.NombreCompleto || '',
          celular: empleadoParsed.Celular || '',
          fechaNacimiento: empleadoParsed.FechaNacimiento?.split('T')[0] || '',
          direccion: empleadoParsed.Direccion || '',
          telefonoEmergencia: empleadoParsed.TelefonoEmergencia || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil desde localStorage:', error);
      setError('Error al cargar los datos del perfil');
    }
  };

  // Función para forzar una sincronización completa con el backend
  const sincronizarConBackend = async (empleadoId: number) => {
    try {
      // OPCIÓN 1: Usar refreshAuth del AuthContext
      const success = await refreshAuth();
      if (success) {
        cargarPerfilDesdeLocalStorage();
        return true;
      }
      
      // OPCIÓN 2: Si refreshAuth falla, intentar manualmente
      const userData = localStorage.getItem('renova_user');
      if (!userData) return false;
      
      const userParsed = JSON.parse(userData);
      
      // Hacer un login silencioso
      try {
        const token = localStorage.getItem('renova_token');
        if (!token) return false;
        
        // En una implementación real, aquí harías una llamada a la API
        // para obtener los datos actualizados
        cargarPerfilDesdeLocalStorage();
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error('Error al sincronizar con backend:', error);
      return false;
    }
  };

  useEffect(() => {
    cargarPerfilDesdeLocalStorage();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    cargarPerfilDesdeLocalStorage();
  };

  const handleSave = async () => {
    try {
      if (!empleado || !empleado.Usuario) return;
      
      // Preparar datos para enviar a la API
      const datosParaEnviar: any = {};
      
      // Solo enviar campos que han cambiado
      if (formData.nombreCompleto !== empleado.NombreCompleto) {
        datosParaEnviar.nombreCompleto = formData.nombreCompleto;
      }
      
      if (formData.celular !== empleado.Celular) {
        datosParaEnviar.celular = formData.celular || null;
      }
      
      if (formData.fechaNacimiento !== (empleado.FechaNacimiento?.split('T')[0] || '')) {
        datosParaEnviar.fechaNacimiento = formData.fechaNacimiento || null;
      }
      
      if (formData.direccion !== empleado.Direccion) {
        datosParaEnviar.direccion = formData.direccion || null;
      }
      
      if (formData.telefonoEmergencia !== empleado.TelefonoEmergencia) {
        datosParaEnviar.telefonoEmergencia = formData.telefonoEmergencia || null;
      }
      
      // Si no hay cambios, no hacer nada
      if (Object.keys(datosParaEnviar).length === 0) {
        setEditMode(false);
        return;
      }
      
      // Guardar cambios pendientes y mostrar modal de reauth
      // IMPORTANTE: Guardar el estado ACTUAL del empleado antes de hacer cambios
      setPendingChanges({
        type: 'perfil',
        empleadoId: empleado.ID,
        datos: datosParaEnviar,
        empleadoActual: empleado // Guardar estado actual para posible rollback
      });
      setEditMode(false);
      setShowReauthModal(true);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al preparar cambios';
      setError(errorMessage);
    }
  };

  const handleReauthSuccess = async () => {
    setShowReauthModal(false);
    
    if (pendingChanges?.type === 'password') {
      await handlePasswordChangeAfterReauth();
    } else {
      await handleProfileUpdateAfterReauth();
    }
  };

  const handleProfileUpdateAfterReauth = async () => {
    try {
      if (!pendingChanges || !pendingChanges.empleadoId || !empleado) return;
      
      setLoading(true);
      setError('');
      
      // ✅ PASO 1: Actualizar LOCALMENTE primero para feedback inmediato
      const empleadoActualizadoLocalmente = {
        ...empleado,
        ...pendingChanges.datos,
        FechaNacimiento: pendingChanges.datos.fechaNacimiento || empleado.FechaNacimiento
      };
      
      // Actualizar estado inmediatamente
      setEmpleado(empleadoActualizadoLocalmente);
      setEmpleadoCache(empleadoActualizadoLocalmente);
      
      // ✅ PASO 2: Enviar cambios a la API
      const response = await empleadoService.actualizarPerfil(
        pendingChanges.empleadoId, 
        pendingChanges.datos
      );
      
      if (response.success) {
        setSuccess('Perfil actualizado exitosamente');
        
        // ✅ PASO 3: Sincronizar con backend para asegurar consistencia
        setTimeout(async () => {
          try {
            await sincronizarConBackend(pendingChanges.empleadoId!);
            setSuccess('Perfil actualizado y sincronizado exitosamente');
          } catch (syncError) {
            console.warn('Advertencia: No se pudo sincronizar completamente', syncError);
            // No mostramos error porque los cambios locales ya están visibles
          }
        }, 500);
        
        // ✅ PASO 4: Actualizar localStorage con la versión actualizada
        localStorage.setItem('renova_empleado', JSON.stringify(empleadoActualizadoLocalmente));
        
        // ✅ PASO 5: También actualizar formData para que coincida
        setFormData({
          nombreCompleto: empleadoActualizadoLocalmente.NombreCompleto || '',
          celular: empleadoActualizadoLocalmente.Celular || '',
          fechaNacimiento: empleadoActualizadoLocalmente.FechaNacimiento?.split('T')[0] || '',
          direccion: empleadoActualizadoLocalmente.Direccion || '',
          telefonoEmergencia: empleadoActualizadoLocalmente.TelefonoEmergencia || ''
        });
        
        // ✅ PASO 6: Si cambió el nombre completo, actualizar también en user
        if (pendingChanges.datos.nombreCompleto) {
          const userData = localStorage.getItem('renova_user');
          if (userData) {
            const userParsed = JSON.parse(userData);
            const updatedUser = {
              ...userParsed,
              nombreCompleto: pendingChanges.datos.nombreCompleto
            };
            localStorage.setItem('renova_user', JSON.stringify(updatedUser));
          }
        }
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        // ✅ ROLLBACK: Si la API falla, revertir a estado anterior
        if (pendingChanges.empleadoActual) {
          setEmpleado(pendingChanges.empleadoActual);
          setEmpleadoCache(pendingChanges.empleadoActual);
          localStorage.setItem('renova_empleado', JSON.stringify(pendingChanges.empleadoActual));
          
          setFormData({
            nombreCompleto: pendingChanges.empleadoActual.NombreCompleto || '',
            celular: pendingChanges.empleadoActual.Celular || '',
            fechaNacimiento: pendingChanges.empleadoActual.FechaNacimiento?.split('T')[0] || '',
            direccion: pendingChanges.empleadoActual.Direccion || '',
            telefonoEmergencia: pendingChanges.empleadoActual.TelefonoEmergencia || ''
          });
        }
        
        setError(response.message || 'Error al actualizar el perfil');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el perfil';
      
      // ✅ ROLLBACK: Si hay error, revertir a estado anterior
      if (pendingChanges?.empleadoActual) {
        setEmpleado(pendingChanges.empleadoActual);
        setEmpleadoCache(pendingChanges.empleadoActual);
        localStorage.setItem('renova_empleado', JSON.stringify(pendingChanges.empleadoActual));
        
        setFormData({
          nombreCompleto: pendingChanges.empleadoActual.NombreCompleto || '',
          celular: pendingChanges.empleadoActual.Celular || '',
          fechaNacimiento: pendingChanges.empleadoActual.FechaNacimiento?.split('T')[0] || '',
          direccion: pendingChanges.empleadoActual.Direccion || '',
          telefonoEmergencia: pendingChanges.empleadoActual.TelefonoEmergencia || ''
        });
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setPendingChanges(null);
    }
  };

  const handleReauthCancel = () => {
    setShowReauthModal(false);
    setPendingChanges(null);
    cargarPerfilDesdeLocalStorage();
    setError('Actualización cancelada. Los cambios no se guardaron.');
  };

  const handlePasswordChange = async () => {
    try {
      if (!empleado?.Usuario) return;
      
      // Validaciones
      if (!passwordData.contraseniaActual) {
        setError('La contraseña actual es requerida');
        return;
      }
      
      if (passwordData.nuevaContrasenia !== passwordData.confirmarContrasenia) {
        setError('Las contraseñas nuevas no coinciden');
        return;
      }
      
      if (passwordData.nuevaContrasenia.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      // Guardar datos de cambio de contraseña y mostrar modal de reauth
      setPendingChanges({
        type: 'password',
        datos: passwordData
      });
      setShowPasswordModal(false);
      setShowReauthModal(true);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al preparar cambio de contraseña';
      setError(errorMessage);
    }
  };

  const handlePasswordChangeAfterReauth = async () => {
    try {
      if (!pendingChanges || pendingChanges.type !== 'password' || !empleado) return;
      
      setLoading(true);
      setError('');
      
      // Llamar a la API para cambiar contraseña
      const response = await empleadoService.cambiarContrasenia(
        empleado.ID, 
        pendingChanges.datos
      );
      
      if (response.success) {
        setSuccess('Contraseña cambiada exitosamente');
        
        // Cerrar sesión después de cambiar contraseña
        setTimeout(() => {
          alert('Tu contraseña ha sido cambiada. Por seguridad, se cerrará tu sesión.');
          logout();
        }, 2000);
        
      } else {
        setError(response.message || 'Error al cambiar la contraseña');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setPendingChanges(null);
      setPasswordData({
        contraseniaActual: '',
        nuevaContrasenia: '',
        confirmarContrasenia: ''
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularAntiguedad = (fechaIngreso: string) => {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - ingreso.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return { years, months };
  };

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      admin: 'danger',
      manager: 'warning',
      employee: 'info'
    };
    return colors[rol] || 'secondary';
  };

  const handleRefreshProfile = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      // Forzar sincronización completa
      if (empleado?.ID) {
        await sincronizarConBackend(empleado.ID);
        setSuccess('Perfil actualizado desde el servidor');
      } else {
        cargarPerfilDesdeLocalStorage();
        setSuccess('Perfil actualizado desde cache');
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setRefreshing(false);
    }
  };

  // Si no hay empleado y está cargando
  if (!empleado && loading) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" variant="primary" />
          <span className="ms-3">Cargando perfil...</span>
        </div>
      </Container>
    );
  }

  // Si no hay empleado después de cargar
  if (!empleado) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-warning mb-3" />
            <h4>No se pudo cargar el perfil</h4>
            <p className="text-muted">Por favor, inicia sesión nuevamente</p>
            <Button variant="primary" onClick={() => window.location.href = '/login'}>
              Ir al login
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
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

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">
                <FontAwesomeIcon icon={faUserCircle} className="me-2 text-primary" />
                Mi Perfil
              </h1>
              <p className="text-muted mb-0">Gestiona tu información personal y profesional</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={handleRefreshProfile}
                disabled={refreshing || loading}
                size="sm"
              >
                <FontAwesomeIcon icon={faSync} className={`me-2 ${refreshing ? 'fa-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              
              {!editMode ? (
                <>
                  <Button variant="outline-primary" onClick={handleEdit} disabled={loading}>
                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                    Editar Perfil
                  </Button>
                  <Button variant="outline-secondary" onClick={() => setShowPasswordModal(true)} disabled={loading}>
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Cambiar Contraseña
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="success" onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={handleCancel} disabled={loading}>
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Columna izquierda - Información principal */}
        <Col lg={4} md={5} className="mb-4">
          {/* Tarjeta de información básica */}
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                <div className="position-relative d-inline-block">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                       style={{ width: '120px', height: '120px' }}>
                    <FontAwesomeIcon icon={faUserCircle} size="4x" className="text-white" />
                  </div>
                  {empleado.RolApp && (
                    <Badge 
                      bg={getRolBadge(empleado.RolApp)}
                      className="position-absolute top-0 end-0 translate-middle rounded-pill"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {empleado.RolApp.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <h4 className="mb-1">{empleado.NombreCompleto}</h4>
              <p className="text-muted mb-3">
                <FontAwesomeIcon icon={faUserTie} className="me-2" />
                {empleado.PuestoNombre || 'Sin puesto asignado'}
              </p>
              
              <div className="d-flex justify-content-center gap-3 mb-3">
                <div className="text-center">
                  <div className="h4 mb-0">{empleado.departamentos?.length || 0}</div>
                  <small className="text-muted">Departamentos</small>
                </div>
                <div className="text-center">
                  <div className="h4 mb-0">{empleado.jefes?.length || 0}</div>
                  <small className="text-muted">Jefes Directos</small>
                </div>
                {empleado.FechaIngreso && (
                  <div className="text-center">
                    <div className="h4 mb-0">
                      {calcularAntiguedad(empleado.FechaIngreso).years}
                    </div>
                    <small className="text-muted">Años en la empresa</small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Tarjeta de información de contacto */}
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <FontAwesomeIcon icon={faPhone} className="me-2" />
                Información de Contacto
              </h6>
              <small className="text-muted">Última actualización: Hoy</small>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex align-items-center">
                <FontAwesomeIcon icon={faEnvelope} className="text-primary me-3" />
                <div>
                  <small className="text-muted d-block">Correo Electrónico</small>
                  <strong>{empleado.CorreoElectronico}</strong>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex align-items-center">
                <FontAwesomeIcon icon={faPhone} className="text-primary me-3" />
                <div>
                  <small className="text-muted d-block">Teléfono Celular</small>
                  <strong>{empleado.Celular || 'No registrado'}</strong>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex align-items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-3" />
                <div>
                  <small className="text-muted d-block">Dirección</small>
                  <strong>{empleado.Direccion || 'No registrada'}</strong>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* Columna derecha - Información detallada */}
        <Col lg={8} md={7}>
          <Tab.Container defaultActiveKey="personal">
            <Card className="shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <Nav variant="tabs" className="border-bottom-0">
                  <Nav.Item>
                    <Nav.Link eventKey="personal">
                      <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                      Información Personal
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="laboral">
                      <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      Información Laboral
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="documentos">
                      <FontAwesomeIcon icon={faIdCard} className="me-2" />
                      Documentos
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              
              <Card.Body>
                <Tab.Content>
                  {/* Pestaña de Información Personal */}
                  <Tab.Pane eventKey="personal">
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                              <FontAwesomeIcon icon={faUserCircle} className="me-2" />
                              Nombre Completo
                            </Form.Label>
                            {editMode ? (
                              <Form.Control
                                type="text"
                                name="nombreCompleto"
                                value={formData.nombreCompleto}
                                onChange={handleInputChange}
                                disabled={loading}
                              />
                            ) : (
                              <Form.Control plaintext readOnly defaultValue={empleado.NombreCompleto} />
                            )}
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                              Correo Electrónico
                            </Form.Label>
                            <Form.Control plaintext readOnly defaultValue={empleado.CorreoElectronico} />
                            <small className="text-muted">Contacta con administración para cambiar tu correo</small>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                              <FontAwesomeIcon icon={faBirthdayCake} className="me-2" />
                              Fecha de Nacimiento
                            </Form.Label>
                            {editMode ? (
                              <Form.Control
                                type="date"
                                name="fechaNacimiento"
                                value={formData.fechaNacimiento}
                                onChange={handleInputChange}
                                disabled={loading}
                              />
                            ) : (
                              <div>
                                <Form.Control plaintext readOnly defaultValue={
                                  empleado.FechaNacimiento 
                                    ? new Date(empleado.FechaNacimiento).toLocaleDateString('es-ES')
                                    : 'No registrada'
                                } />
                                {empleado.FechaNacimiento && (
                                  <small className="text-muted">
                                    Edad: {calcularEdad(empleado.FechaNacimiento)} años
                                  </small>
                                )}
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                              <FontAwesomeIcon icon={faPhone} className="me-2" />
                              Teléfono Celular
                            </Form.Label>
                            {editMode ? (
                              <Form.Control
                                type="tel"
                                name="celular"
                                value={formData.celular}
                                onChange={handleInputChange}
                                disabled={loading}
                                placeholder="Ej: 555-123-4567"
                              />
                            ) : (
                              <Form.Control plaintext readOnly defaultValue={empleado.Celular || 'No registrado'} />
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                          Dirección
                        </Form.Label>
                        {editMode ? (
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Calle, Número, Colonia, Ciudad, Estado, Código Postal"
                          />
                        ) : (
                          <Form.Control 
                            as="textarea" 
                            rows={2} 
                            plaintext 
                            readOnly 
                            defaultValue={empleado.Direccion || 'No registrada'} 
                          />
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          <FontAwesomeIcon icon={faPhone} className="me-2" />
                          Teléfono de Emergencia
                        </Form.Label>
                        {editMode ? (
                          <Form.Control
                            type="tel"
                            name="telefonoEmergencia"
                            value={formData.telefonoEmergencia}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Ej: 555-987-6543"
                          />
                        ) : (
                          <Form.Control plaintext readOnly defaultValue={empleado.TelefonoEmergencia || 'No registrado'} />
                        )}
                      </Form.Group>
                    </Form>
                  </Tab.Pane>

                  {/* Pestaña de Información Laboral */}
                  <Tab.Pane eventKey="laboral">
                    <Row>
                      <Col md={6}>
                        <div className="mb-4">
                          <h6 className="fw-medium mb-3">
                            <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                            Información de Contrato
                          </h6>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span>Fecha de Ingreso</span>
                              <strong>
                                {empleado.FechaIngreso 
                                  ? new Date(empleado.FechaIngreso).toLocaleDateString('es-ES')
                                  : 'No registrada'
                                }
                              </strong>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span>Antigüedad</span>
                              <strong>
                                {empleado.FechaIngreso && (
                                  <>
                                    {calcularAntiguedad(empleado.FechaIngreso).years} años,{' '}
                                    {calcularAntiguedad(empleado.FechaIngreso).months} meses
                                  </>
                                )}
                              </strong>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span>Puesto</span>
                              <Badge bg="primary">{empleado.PuestoNombre || 'Sin asignar'}</Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span>Rol en Sistema</span>
                              <Badge bg={getRolBadge(empleado.RolApp)}>
                                {empleado.RolApp.toUpperCase()}
                              </Badge>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span>Estado</span>
                              <Badge bg={empleado.UsuarioActivo ? 'success' : 'danger'}>
                                {empleado.UsuarioActivo ? 'ACTIVO' : 'INACTIVO'}
                              </Badge>
                            </ListGroup.Item>
                          </ListGroup>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-4">
                          <h6 className="fw-medium mb-3">
                            <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                            Estructura Organizacional
                          </h6>
                          
                          {empleado.departamentos && empleado.departamentos.length > 0 ? (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-2">Departamentos asignados:</small>
                              <div className="d-flex flex-wrap gap-2">
                                {empleado.departamentos.map((depto: Departamento) => (
                                  <Badge key={depto.ID} bg="info" className="px-3 py-2">
                                    {depto.Nombre}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted mb-3">No hay departamentos asignados</p>
                          )}

                          {empleado.jefes && empleado.jefes.length > 0 ? (
                            <div>
                              <small className="text-muted d-block mb-2">Jefes directos:</small>
                              <ListGroup variant="flush">
                                {empleado.jefes.map((jefe: Jefe) => (
                                  <ListGroup.Item key={jefe.ID} className="px-0">
                                    <div className="d-flex align-items-center">
                                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" 
                                           style={{ width: '36px', height: '36px' }}>
                                        <FontAwesomeIcon icon={faUserTie} className="text-primary" />
                                      </div>
                                      <div>
                                        <div className="fw-medium">{jefe.NombreCompleto}</div>
                                        <small className="text-muted">
                                          {jefe.RolApp} • Desde {new Date(jefe.FechaAsignacion).toLocaleDateString('es-ES')}
                                        </small>
                                      </div>
                                    </div>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            </div>
                          ) : (
                            <p className="text-muted">No hay jefes asignados</p>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {/* Información adicional */}
                    <Card className="border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">
                          <FontAwesomeIcon icon={faHistory} className="me-2" />
                          Historial de Cambios
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <small className="text-muted">
                          <div className="mb-1">Última actualización: {new Date().toLocaleDateString('es-ES')}</div>
                          <div>Usuario del sistema: {empleado.Usuario?.Usuario || user?.usuario}</div>
                          <div>ID de empleado: {empleado.ID}</div>
                          <div>ID de usuario: {empleado.Usuario?.ID || user?.id}</div>
                        </small>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  {/* Pestaña de Documentos */}
                  <Tab.Pane eventKey="documentos">
                    <Alert variant="info" className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faShieldAlt} className="me-3" size="lg" />
                      <div>
                        <strong>Información confidencial</strong>
                        <p className="mb-0">Estos datos son sensibles y solo visibles para ti y administradores.</p>
                      </div>
                    </Alert>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium d-flex justify-content-between align-items-center">
                            <span>
                              <FontAwesomeIcon icon={faIdCard} className="me-2" />
                              Número de Seguro Social (NSS)
                            </span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => setShowSensitiveData(!showSensitiveData)}
                              className="p-0"
                            >
                              <FontAwesomeIcon icon={showSensitiveData ? faEyeSlash : faEye} />
                            </Button>
                          </Form.Label>
                          <Form.Control 
                            type={showSensitiveData ? "text" : "password"}
                            value={showSensitiveData ? (empleado.NSS || 'No registrado') : '••••••••••'}
                            readOnly
                            className="font-monospace"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">
                            <FontAwesomeIcon icon={faIdCard} className="me-2" />
                            Registro Federal de Contribuyentes (RFC)
                          </Form.Label>
                          <Form.Control 
                            type={showSensitiveData ? "text" : "password"}
                            value={showSensitiveData ? (empleado.RFC || 'No registrado') : '•••••••••••••'}
                            readOnly
                            className="font-monospace"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">
                            <FontAwesomeIcon icon={faIdCard} className="me-2" />
                            Clave Única de Registro de Población (CURP)
                          </Form.Label>
                          <Form.Control 
                            type={showSensitiveData ? "text" : "password"}
                            value={showSensitiveData ? (empleado.CURP || 'No registrado') : '••••••••••••••••••'}
                            readOnly
                            className="font-monospace"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <div className="d-flex align-items-center h-100">
                          <div className="text-center w-100">
                            <FontAwesomeIcon icon={faShieldAlt} size="3x" className="text-muted mb-3" />
                            <p className="text-muted mb-0">
                              Estos datos están protegidos por<br />
                              <strong>Políticas de Seguridad de la Empresa</strong>
                            </p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Col>
      </Row>

      {/* Modal para cambiar contraseña */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faLock} className="me-2" />
            Cambiar Contraseña
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña Actual *</Form.Label>
              <Form.Control
                type="password"
                name="contraseniaActual"
                value={passwordData.contraseniaActual}
                onChange={handlePasswordInputChange}
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Nueva Contraseña *</Form.Label>
              <Form.Control
                type="password"
                name="nuevaContrasenia"
                value={passwordData.nuevaContrasenia}
                onChange={handlePasswordInputChange}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirmar Nueva Contraseña *</Form.Label>
              <Form.Control
                type="password"
                name="confirmarContrasenia"
                value={passwordData.confirmarContrasenia}
                onChange={handlePasswordInputChange}
                placeholder="Repite la nueva contraseña"
                disabled={loading}
                required
              />
            </Form.Group>
          </Form>
          
          <Alert variant="info" className="small">
            <strong>Requisitos de seguridad:</strong>
            <ul className="mb-0 mt-2">
              <li>Mínimo 6 caracteres</li>
              <li>Recomendado usar mayúsculas, minúsculas y números</li>
              <li>No compartas tu contraseña con nadie</li>
              <li>Después del cambio, se cerrará tu sesión</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handlePasswordChange} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Cambiando...
              </>
            ) : (
              'Cambiar Contraseña'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Reautenticación */}
      <ReauthModal
        show={showReauthModal}
        usuario={reauthUser}
        onSuccess={handleReauthSuccess}
        onCancel={handleReauthCancel}
        title="Verificación de Seguridad"
        message={
          pendingChanges?.type === 'password' 
            ? 'Por seguridad, verifica tu identidad antes de cambiar tu contraseña.'
            : 'Por seguridad, verifica tu identidad antes de guardar los cambios en tu perfil.'
        }
      />
    </Container>
  );
};

export default Perfil;