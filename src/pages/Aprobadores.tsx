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
  ListGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserShield,
  faUserPlus,
  faUserMinus,
  faSearch,
  faEnvelope,
  faPhone,
  faCalendar,
  faBriefcase,
  faCheckCircle,
  faTimesCircle,
  faSync,
  faExclamationTriangle,
  faInfoCircle,
  faShieldAlt,
  faUserCheck,
  faUserXmark,
  faBuilding,
  faUserTie,
  faEye,
  faBan,
  faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import { formatDateDisplay } from '../utils/dateUtils';

interface EmpleadoSelect {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  PuestoNombre?: string;
}

interface Aprobador {
  id?: number;
  usuarioId: number;
  usuario: string;
  nombreCompleto: string;
  correoElectronico: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  puesto?: string;
}

interface VerificationResult {
  esAprobador: boolean;
  usuarioId: string;
}

const Aprobadores: React.FC = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.rol === 'admin';
  
  const [aprobadores, setAprobadores] = useState<Aprobador[]>([]);
  const [usuarios, setUsuarios] = useState<EmpleadoSelect[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [usuarioToRemove, setUsuarioToRemove] = useState<Aprobador | null>(null);
  const [usuarioToVerify, setUsuarioToVerify] = useState<Aprobador | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [quickVerifyId, setQuickVerifyId] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      loadAprobadores();
      loadUsuariosParaAprobador();
    }
  }, [isAdmin]);

  const loadAprobadores = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/aprobadores/activos');
      
      if (response.data.success) {
        const aprobadoresData = response.data.data || [];
        const formattedAprobadores = aprobadoresData.map((ap: any) => ({
          id: ap.id || ap.ID || 0,
          usuarioId: ap.usuarioId || ap.usuarioID || ap.ID || 0,
          usuario: ap.usuario || ap.Usuario || '',
          nombreCompleto: ap.nombreCompleto || ap.NombreCompleto || 'Nombre no disponible',
          correoElectronico: ap.correoElectronico || ap.CorreoElectronico || '',
          rol: ap.rol || ap.Rol || 'employee',
          activo: ap.activo !== undefined ? ap.activo : true,
          fechaCreacion: ap.fechaCreacion || ap.createdAt || new Date().toISOString(),
          puesto: ap.puesto || ap.PuestoNombre || ''
        }));
        
        setAprobadores(formattedAprobadores);
      } else {
        setError(response.data.message || 'Error cargando aprobadores');
      }
    } catch (error: any) {
      console.error('Error cargando aprobadores:', error);
      if (error.response?.status === 403) {
        setError('No tienes permisos para ver aprobadores');
      } else {
        setError(error.response?.data?.message || 'Error cargando aprobadores');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosParaAprobador = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingUsuarios(true);
      
      const catalogosResponse = await api.get('/empleados/catalogos');
      if (catalogosResponse.data.success) {
        const empleadosData = catalogosResponse.data.data.empleados || [];
        const usuariosFiltrados = empleadosData
          .filter((emp: EmpleadoSelect) => 
            emp.RolApp === 'manager' || emp.RolApp === 'admin'
          );
        setUsuarios(usuariosFiltrados);
      }
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleAddAprobador = async () => {
    if (!isAdmin || !selectedUsuario) {
      setError('Selecciona un usuario para agregar como aprobador');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.post('/aprobadores/agregar', {
        usuarioId: selectedUsuario
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Usuario agregado como aprobador exitosamente');
        setShowAddModal(false);
        setSelectedUsuario(null);
        loadAprobadores();
      } else {
        setError(response.data.message || 'Error agregando aprobador');
      }
    } catch (error: any) {
      console.error('Error agregando aprobador:', error);
      if (error.response?.data?.message?.includes('ya es un aprobador activo')) {
        setError('Este usuario ya es un aprobador activo');
      } else if (error.response?.data?.message?.includes('no tiene rol de admin/manager')) {
        setError('El usuario debe tener rol de administrador o manager para ser aprobador');
      } else {
        setError(error.response?.data?.message || 'Error agregando aprobador');
      }
    }
  };

  const handleRemoveAprobador = async () => {
    if (!isAdmin || !usuarioToRemove) return;
    
    try {
      setError('');
      setSuccess('');
      
      const response = await api.delete(`/aprobadores/quitar/${usuarioToRemove.usuarioId}`);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Usuario removido como aprobador exitosamente');
        setShowRemoveModal(false);
        setUsuarioToRemove(null);
        loadAprobadores();
      } else {
        setError(response.data.message || 'Error removiendo aprobador');
      }
    } catch (error: any) {
      console.error('Error removiendo aprobador:', error);
      if (error.response?.data?.message?.includes('no es un aprobador activo')) {
        setError('Este usuario no es un aprobador activo');
      } else {
        setError(error.response?.data?.message || 'Error removiendo aprobador');
      }
    }
  };

  const handleVerifyAprobador = async (usuarioId?: number) => {
    if (!isAdmin) return;
    
    const idToVerify = usuarioId || (usuarioToVerify?.usuarioId);
    if (!idToVerify) return;
    
    try {
      setVerificationLoading(true);
      setError('');
      setVerificationResult(null);
      
      const response = await api.get(`/aprobadores/verificar/${idToVerify}`);
      
      if (response.data.success) {
        setVerificationResult(response.data.data);
        if (!usuarioToVerify) {
          setShowVerifyModal(true);
        }
      } else {
        setError(response.data.message || 'Error verificando aprobador');
      }
    } catch (error: any) {
      console.error('Error verificando aprobador:', error);
      setError(error.response?.data?.message || 'Error verificando aprobador');
    } finally {
      setVerificationLoading(false);
    }
  };

  const getRolBadge = (rol: string) => {
    const colors = {
      admin: 'danger',
      manager: 'warning',
      employee: 'info'
    };
    
    const textoRol = {
      admin: 'ADMINISTRADOR',
      manager: 'GERENTE',
      employee: 'COLABORADOR'
    };
    
    return (
      <Badge bg={colors[rol as keyof typeof colors] || 'secondary'}>
        {textoRol[rol as keyof typeof textoRol] || rol.toUpperCase()}
      </Badge>
    );
  };

  const getAprobadorStatusBadge = (esAprobador: boolean) => {
    return esAprobador ? (
      <Badge bg="success" className="d-flex align-items-center">
        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
        Aprobador Activo
      </Badge>
    ) : (
      <Badge bg="secondary" className="d-flex align-items-center">
        <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
        No es Aprobador
      </Badge>
    );
  };

  const getUsuarioStatusBadge = (activo: boolean) => {
    return activo ? (
      <Badge bg="success">Activo</Badge>
    ) : (
      <Badge bg="secondary">Inactivo</Badge>
    );
  };

  const openRemoveModal = (aprobador: Aprobador) => {
    setUsuarioToRemove(aprobador);
    setShowRemoveModal(true);
  };

  const openVerifyModal = (aprobador: Aprobador) => {
    setUsuarioToVerify(aprobador);
    handleVerifyAprobador(aprobador.usuarioId);
  };

  const filteredAprobadores = aprobadores.filter(aprobador =>
    aprobador.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aprobador.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aprobador.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usuariosParaAgregar = usuarios.filter(usuario => 
    !aprobadores.some(aprobador => aprobador.usuarioId === usuario.ID)
  );

  if (!isAdmin) {
    return (
      <Container fluid className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <FontAwesomeIcon icon={faShieldAlt} size="3x" className="text-danger mb-3" />
            <h3>Acceso Restringido - Nivel Administrador</h3>
            <p className="text-muted">
              Solo los administradores pueden acceder a la gestión de aprobadores.
              <br />
              Esta funcionalidad requiere permisos de administrador completo.
            </p>
            <Badge bg={user?.rol === 'admin' ? 'danger' : user?.rol === 'manager' ? 'warning' : 'info'} 
              className="fs-6 p-2">
              Tu rol: {user?.rol === 'admin' ? 'ADMINISTRADOR' : user?.rol === 'manager' ? 'GERENTE' : 'COLABORADOR'}
            </Badge>
            <div className="mt-4">
              <Button variant="primary" onClick={() => window.history.back()}>
                Regresar al Dashboard
              </Button>
            </div>
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
                <FontAwesomeIcon icon={faUserShield} className="me-2 text-danger" />
                Gestión de Aprobadores
              </h2>
            </div>
            
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={loadAprobadores}>
                <FontAwesomeIcon icon={faSync} className="me-2" />
                Actualizar
              </Button>
              <Button variant="danger" onClick={() => setShowAddModal(true)}>
                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                Agregar Aprobador
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

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm border-danger">
            <Card.Body>
              <FontAwesomeIcon icon={faUserShield} size="2x" className="text-danger mb-2" />
              <h3>{aprobadores.length}</h3>
              <small className="text-muted">Aprobadores Activos</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-warning">
            <Card.Body>
              <FontAwesomeIcon icon={faUserTie} size="2x" className="text-warning mb-2" />
              <h3>{usuarios.filter(u => u.RolApp === 'manager').length}</h3>
              <small className="text-muted">Gerentes Disponibles</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-primary">
            <Card.Body>
              <FontAwesomeIcon icon={faUserCheck} size="2x" className="text-primary mb-2" />
              <h3>{aprobadores.filter(a => a.rol === 'manager').length}</h3>
              <small className="text-muted">Gerentes Aprobadores</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-dark">
            <Card.Body>
              <FontAwesomeIcon icon={faShieldAlt} size="2x" className="text-dark mb-2" />
              <h3>{aprobadores.filter(a => a.rol === 'admin').length}</h3>
              <small className="text-muted">Administradores Aprobadores</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                    placeholder="Buscar aprobador por nombre, usuario o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-center">
              <div className="ms-auto">
                <Badge bg="light" text="dark" className="border me-2">
                  <FontAwesomeIcon icon={faUserShield} className="me-1" />
                  {filteredAprobadores.length} aprobadores encontrados
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3">Cargando aprobadores...</p>
            </div>
          ) : filteredAprobadores.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon icon={faUserShield} size="3x" className="text-muted mb-3" />
              <h5>No hay aprobadores registrados</h5>
              <p className="text-muted mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo aprobador'}
              </p>
              <Button variant="danger" onClick={() => setShowAddModal(true)} className="mt-3">
                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                Agregar Primer Aprobador
              </Button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Aprobador</th>
                      <th>Información</th>
                      <th>Rol</th>
                      <th>Fecha Registro</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAprobadores.map((aprobador, index) => (
                      <tr key={aprobador.id || index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center me-3" 
                                 style={{width: '40px', height: '40px'}}>
                              <FontAwesomeIcon icon={faUserShield} className="text-white" />
                            </div>
                            <div>
                              <strong>{aprobador.nombreCompleto}</strong>
                              <div className="small text-muted">
                                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                {aprobador.correoElectronico}
                              </div>
                              <div className="small text-muted">
                                <FontAwesomeIcon icon={faUserShield} className="me-1" />
                                Usuario: {aprobador.usuario}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            {aprobador.puesto && (
                              <div className="d-flex align-items-center mb-1">
                                <FontAwesomeIcon icon={faBriefcase} className="text-muted me-2" size="sm" />
                                <small>{aprobador.puesto}</small>
                              </div>
                            )}
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faBuilding} className="text-muted me-2" size="sm" />
                              <small>ID: {aprobador.usuarioId}</small>
                            </div>
                          </div>
                        </td>
                        <td>{getRolBadge(aprobador.rol)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faCalendar} className="text-muted me-2" />
                            <div>
                              <div>{formatDateDisplay(aprobador.fechaCreacion)}</div>
                            </div>
                          </div>
                        </td>
                        <td>{getUsuarioStatusBadge(aprobador.activo)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openVerifyModal(aprobador)}
                              title="Verificar estado"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openRemoveModal(aprobador)}
                              title="Remover como aprobador"
                            >
                              <FontAwesomeIcon icon={faUserMinus} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
        
        <Card.Footer className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Los aprobadores pueden revisar y aprobar solicitudes de vacaciones, permisos y horas extras.
            </small>
            <small className="text-muted">
              <FontAwesomeIcon icon={faShieldAlt} className="me-1" />
              Nivel Administrador
            </small>
          </div>
        </Card.Footer>
      </Card>

      <Alert variant="info" className="mt-4">
        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
        <strong>Información Importante sobre Aprobadores:</strong>
        <ul className="mb-0 mt-2">
          <li>Solo usuarios con rol de <strong>Administrador</strong> o <strong>Gerente</strong> pueden ser aprobadores</li>
          <li>Los aprobadores pueden aprobar/rechazar solicitudes de sus subordinados directos</li>
          <li>Los administradores tienen acceso completo a todas las solicitudes</li>
          <li>Remover a un usuario como aprobador no afecta su rol ni estado en el sistema</li>
        </ul>
      </Alert>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Agregar Nuevo Aprobador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            <strong>Requisitos para ser aprobador:</strong>
            <ul className="mb-0 mt-2">
              <li>El usuario debe tener rol de <strong>Administrador</strong> o <strong>Gerente</strong></li>
              <li>Debe estar activo en el sistema</li>
              <li>No puede ya ser un aprobador activo</li>
            </ul>
          </Alert>

          {loadingUsuarios ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando usuarios disponibles...</p>
            </div>
          ) : usuariosParaAgregar.length === 0 ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faUserXmark} size="3x" className="text-muted mb-3" />
              <h5>No hay usuarios disponibles</h5>
              <p className="text-muted">
                Todos los usuarios con rol de administrador o gerente ya son aprobadores.
                <br />
                O no hay usuarios con los roles requeridos.
              </p>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faUserShield} className="me-2" />
                  Seleccionar Usuario *
                </Form.Label>
                <Form.Select
                  value={selectedUsuario || ''}
                  onChange={(e) => setSelectedUsuario(e.target.value ? parseInt(e.target.value) : null)}
                  size="lg"
                >
                  <option value="">Selecciona un usuario...</option>
                  {usuariosParaAgregar.map((usuario) => (
                    <option key={usuario.ID} value={usuario.ID}>
                      {usuario.NombreCompleto} - {usuario.CorreoElectronico} ({usuario.RolApp === 'admin' ? 'ADMINISTRADOR' : 'GERENTE'})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedUsuario && (
                <Card className="mt-4">
                  <Card.Body>
                    <h6 className="mb-3">
                      <FontAwesomeIcon icon={faUserCheck} className="me-2 text-success" />
                      Información del Usuario Seleccionado
                    </h6>
                    {usuariosParaAgregar
                      .filter(u => u.ID === selectedUsuario)
                      .map((usuario) => (
                        <ListGroup variant="flush" key={usuario.ID}>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <span><strong>Nombre:</strong></span>
                            <span>{usuario.NombreCompleto}</span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <span><strong>Correo:</strong></span>
                            <span>{usuario.CorreoElectronico}</span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <span><strong>Rol:</strong></span>
                            <span>{getRolBadge(usuario.RolApp)}</span>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <span><strong>Estado como Aprobador:</strong></span>
                            <Badge bg="warning">Pendiente de Agregar</Badge>
                          </ListGroup.Item>
                        </ListGroup>
                      ))}
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleAddAprobador}
            disabled={!selectedUsuario || loadingUsuarios}
          >
            <FontAwesomeIcon icon={faUserShield} className="me-2" />
            Agregar como Aprobador
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)} centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserMinus} className="me-2" />
            Remover Aprobador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioToRemove && (
            <div className="text-center">
              <div className="rounded-circle bg-warning d-inline-flex align-items-center justify-content-center p-3 mb-3">
                <FontAwesomeIcon icon={faUserShield} size="2x" className="text-white" />
              </div>
              <h4>¿Remover como aprobador?</h4>
              <p className="text-muted">
                Estás a punto de remover a <strong>{usuarioToRemove.nombreCompleto}</strong> como aprobador.
              </p>
              
              <ListGroup variant="flush" className="mb-4">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Usuario:</strong></span>
                  <span>{usuarioToRemove.usuario}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Rol:</strong></span>
                  <span>{getRolBadge(usuarioToRemove.rol)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Registrado desde:</strong></span>
                  <span>{formatDateDisplay(usuarioToRemove.fechaCreacion)}</span>
                </ListGroup.Item>
              </ListGroup>
              
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                <strong>Nota:</strong> Esta acción solo removerá sus permisos como aprobador.
                El usuario mantendrá su rol y acceso normal al sistema.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleRemoveAprobador}>
            <FontAwesomeIcon icon={faUserMinus} className="me-2" />
            Sí, Remover Aprobador
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faUserCheck} className="me-2" />
            Verificar Estado de Aprobador
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {verificationLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="info" />
              <p className="mt-3">Verificando estado...</p>
            </div>
          ) : verificationResult && usuarioToVerify ? (
            <div className="text-center">
              <div className={`rounded-circle ${verificationResult.esAprobador ? 'bg-success' : 'bg-secondary'} d-inline-flex align-items-center justify-content-center p-3 mb-3`}>
                <FontAwesomeIcon 
                  icon={verificationResult.esAprobador ? faUserShield : faUserXmark} 
                  size="2x" 
                  className="text-white" 
                />
              </div>
              
              <h4>{usuarioToVerify.nombreCompleto}</h4>
              <p className="text-muted mb-4">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                {usuarioToVerify.correoElectronico}
              </p>
              
              <div className="mb-4">
                <h3 className={verificationResult.esAprobador ? 'text-success' : 'text-secondary'}>
                  {verificationResult.esAprobador ? 'ES APROBADOR' : 'NO ES APROBADOR'}
                </h3>
                <p className={verificationResult.esAprobador ? 'text-success' : 'text-secondary'}>
                  {verificationResult.esAprobador 
                    ? '✓ Este usuario tiene permisos para aprobar solicitudes'
                    : '✗ Este usuario no puede aprobar solicitudes'}
                </p>
              </div>
              
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>ID Usuario:</strong></span>
                  <span>{verificationResult.usuarioId}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Rol del Usuario:</strong></span>
                  <span>{getRolBadge(usuarioToVerify.rol)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span><strong>Estado:</strong></span>
                  <span>{getAprobadorStatusBadge(verificationResult.esAprobador)}</span>
                </ListGroup.Item>
              </ListGroup>
            </div>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-warning mb-3" />
              <h5>No se pudo verificar el estado</h5>
              <p className="text-muted">Intenta nuevamente o selecciona otro usuario.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Cerrar
          </Button>
          {usuarioToVerify && (
            <Button 
              variant={verificationResult?.esAprobador ? "outline-danger" : "outline-success"}
              onClick={() => {
                setShowVerifyModal(false);
                if (verificationResult?.esAprobador) {
                  openRemoveModal(usuarioToVerify);
                } else {
                  setSelectedUsuario(usuarioToVerify.usuarioId);
                  setShowAddModal(true);
                }
              }}
            >
              <FontAwesomeIcon 
                icon={verificationResult?.esAprobador ? faUserMinus : faUserPlus} 
                className="me-2" 
              />
              {verificationResult?.esAprobador ? 'Remover Aprobador' : 'Agregar como Aprobador'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Aprobadores;