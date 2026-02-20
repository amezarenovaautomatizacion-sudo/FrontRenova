import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUser, faLock } from '@fortawesome/free-solid-svg-icons';

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // USAR SESSIONSTORAGE COMO FUENTE PRINCIPAL
  const from = sessionStorage.getItem('redirectAfterLogin') || 
               location.state?.from?.pathname || 
               "/dashboard";

  console.log('Login - from:', from);
  console.log('Login - location.state:', location.state);
  console.log('Login - sessionStorage:', sessionStorage.getItem('redirectAfterLogin'));

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
      
      // Obtener la ruta de destino
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 
                         location.state?.from?.pathname || 
                         '/dashboard';
      
      console.log('Login exitoso, redirigiendo a:', redirectTo);
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('redirectAfterLogin');
      
      // Pequeño timeout para asegurar que todo esté listo
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setUsuario(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0 rounded-3">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div className="bg-primary rounded-circle p-3 d-inline-block mb-3">
                  <FontAwesomeIcon 
                    icon={faSignInAlt} 
                    size="3x" 
                    className="text-white"
                  />
                </div>
                <h2 className="fw-bold text-primary">RENOVA</h2>
                <p className="text-muted">Sistema de Gestión de Recursos Humanos</p>
              </div>

              <Form onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Usuario / Correo
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    disabled={loading}
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={contrasenia}
                    onChange={(e) => setContrasenia(e.target.value)}
                    required
                    disabled={loading}
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    label="Recordarme"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-100 py-2 fw-medium"
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
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;