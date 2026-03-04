import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container, Row, Col, Card, Form,
  Button, Alert, Spinner
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faLock, faEye, faEyeSlash,
  faArrowRight, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    sessionStorage.getItem('redirectAfterLogin') ||
    location.state?.from?.pathname ||
    '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usuario, contrasenia);

      if (rememberMe) {
        localStorage.setItem('rememberedUser', usuario);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo, { replace: true });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
      setUsuario(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <Container 
      fluid 
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{
        background: 'linear-gradient(135deg, #27ae60 0%, #1f5326 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Elementos decorativos de fondo */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1
      }} />

      <Row className="w-100 justify-content-center" style={{ zIndex: 2 }}>
        <Col xs={12} sm={10} md={8} lg={6} xl={5} xxl={4}>
          <Card 
            className="shadow-lg border-0"
            style={{
              background: 'var(--bg-primary)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              overflow: 'hidden'
            }}
          >
            {/* Barra superior decorativa */}
            <div 
              style={{
                height: '5px',
                background: 'linear-gradient(90deg, var(--primary-main), var(--primary-dark), var(--primary-main))',
                width: '100%'
              }}
            />

            <Card.Body className="p-4 p-sm-5">
              
              {/* Logo y título - AHORA USA VITE.SVG */}
              <div className="text-center mb-4">
                <div 
                  className="d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%)',
                    borderRadius: '20px',
                    transform: 'rotate(45deg)',
                    marginBottom: '20px',
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src="/vite.svg" 
                    alt="Logo RENOVA" 
                    style={{ 
                      transform: 'rotate(-45deg) scale(0.8)',
                      width: '60px',
                      height: '60px',
                      filter: 'brightness(0) invert(1)' // Hace el SVG blanco
                    }} 
                  />
                </div>
                <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  RENOVA
                </h3>
                <p className="text-secondary mb-0">
                  Gestión de Recursos Humanos
                </p>
                <div className="d-flex align-items-center justify-content-center mt-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-success me-2" size="sm" />
                  <small className="text-secondary">Acceso seguro</small>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>

                {error && (
                  <Alert 
                    variant="danger" 
                    dismissible 
                    onClose={() => setError('')}
                    className="d-flex align-items-center"
                    style={{
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      color: 'var(--danger-color)'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <span className="fw-bold me-2">¡Error!</span>
                      {error}
                    </div>
                  </Alert>
                )}

                {/* Usuario */}
                <Form.Group className="mb-4">
                  <Form.Label className="text-secondary fw-medium mb-2">
                    Usuario o correo electrónico
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={usuario}
                      onChange={e => setUsuario(e.target.value)}
                      onFocus={() => setFocusedField('usuario')}
                      onBlur={() => setFocusedField(null)}
                      required
                      disabled={loading}
                      autoComplete="username"
                      className="bg-white"
                      style={{
                        padding: '12px 20px 12px 45px',
                        borderRadius: '12px',
                        border: focusedField === 'usuario' 
                          ? '2px solid var(--primary-main)' 
                          : '1px solid var(--border-color)',
                        boxShadow: focusedField === 'usuario' 
                          ? '0 4px 10px var(--shadow-hover-color)' 
                          : 'none',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{
                        position: 'absolute',
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: focusedField === 'usuario' ? 'var(--primary-main)' : 'var(--text-muted)',
                        transition: 'color 0.3s ease'
                      }}
                    />
                  </div>
                </Form.Group>

                {/* Contraseña */}
                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <Form.Label className="text-secondary fw-medium">
                      Contraseña
                    </Form.Label>
                  </div>
                  
                  <div className="position-relative">
                    <Form.Control
                      type={showPass ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={contrasenia}
                      onChange={e => setContrasenia(e.target.value)}
                      onFocus={() => setFocusedField('contrasenia')}
                      onBlur={() => setFocusedField(null)}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      style={{
                        padding: '12px 45px 12px 45px',
                        borderRadius: '12px',
                        border: focusedField === 'contrasenia' 
                          ? '2px solid var(--primary-main)' 
                          : '1px solid var(--border-color)',
                        boxShadow: focusedField === 'contrasenia' 
                          ? '0 4px 10px var(--shadow-hover-color)' 
                          : 'none',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />

                    <FontAwesomeIcon
                      icon={faLock}
                      style={{
                        position: 'absolute',
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: focusedField === 'contrasenia' ? 'var(--primary-main)' : 'var(--text-muted)',
                        transition: 'color 0.3s ease'
                      }}
                    />

                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowPass(!showPass)}
                      disabled={loading}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        padding: '5px'
                      }}
                    >
                      <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                    </Button>
                  </div>
                </Form.Group>

                {/* Botón */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary border-0 w-100"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%)',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 15px var(--shadow-hover-color)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px var(--shadow-hover-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px var(--shadow-hover-color)';
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner
                        size="sm"
                        animation="border"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                    </>
                  )}
                </Button>

                {/* Footer */}
                <div className="text-center mt-4">
                  <small className="text-muted">
                    © 2026 RENOVA - Todos los derechos reservados
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;