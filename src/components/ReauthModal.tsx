import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSignInAlt, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

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
  const { loginWithUser } = useAuth();
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
      
      await loginWithUser(usuario, contrasenia);
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

export default ReauthModal;