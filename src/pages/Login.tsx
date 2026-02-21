import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container, Row, Col, Card, Form,
  Button, Alert, Spinner, InputGroup
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faLock, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);

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

      rememberMe
        ? localStorage.setItem('rememberedUser', usuario)
        : localStorage.removeItem('rememberedUser');

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
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center">
        <Col xs={11} sm={8} md={6} lg={5} xl={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">

              <div className="text-center mb-4">
                <img src="/vite.svg" alt="Logo" width={60} className="mb-2" />
                <h5 className="fw-bold mb-1">RENOVA</h5>
                <small className="text-muted">Gestión de Recursos Humanos</small>
              </div>

              <Form onSubmit={handleSubmit}>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Usuario con form-floating */}
                <Form.Group className="form-floating mb-3">
                  <Form.Control
                    type="email"
                    id="usuario"
                    placeholder="Usuario / Correo"
                    value={usuario}
                    onChange={e => setUsuario(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                  <Form.Label htmlFor="usuario">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Usuario / Correo
                  </Form.Label>
                </Form.Group>

                {/* Contraseña con ojito y form-floating */}
                <Form.Group className="mb-3">
                  <InputGroup className="form-floating">
                    <Form.Control
                      type={showPass ? "text" : "password"}
                      id="contrasenia"
                      placeholder="Contraseña"
                      value={contrasenia}
                      onChange={e => setContrasenia(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <Form.Label htmlFor="contrasenia">
                      <FontAwesomeIcon icon={faLock} className="me-2" />
                      Contraseña
                    </Form.Label>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPass(!showPass)}
                      disabled={loading}
                      tabIndex={-1}
                      className="border-start-0"
                      style={{ zIndex: 100 }}
                    >
                      <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
                    </Button>
                  </InputGroup>
                </Form.Group>

                {/* Recordarme con mejor alineación */}
                <Form.Group className="mb-4 d-flex align-items-center">
                  <Form.Check
                    type="checkbox"
                    id="rememberMe"
                    label="Recordarme"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                </Form.Group>

                {/* Botón login */}
                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading
                    ? (
                      <>
                        <Spinner size="sm" animation="border" role="status" aria-hidden="true" className="me-2" />
                        Iniciando sesión...
                      </>
                    )
                    : "Iniciar Sesión"
                  }
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