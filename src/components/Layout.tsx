import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Navbar,
  Nav,
  Badge,
  Button,
  Row,
  Col,
  Offcanvas
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignOutAlt,
  faUserCircle,
  faBars,
  faHome,
  faBell,
  faUser,
  faUsers,
  faCalendarAlt,
  faProjectDiagram,
  faFileAlt,
  faUserShield,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  path: string;
  title: string;
  icon: any;
  roles: string[];
  children?: MenuItem[];
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const empleado = JSON.parse(localStorage.getItem('Recursos Humanos_empleado') || '{}');

  // Definir menú según rol del usuario
  const menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      title: 'Dashboard',
      icon: faHome,
      roles: ['admin', 'manager', 'employee']
    },
    {
      path: '/empleados',
      title: 'Empleados',
      icon: faUsers,
      roles: ['admin', 'manager']
    },
    {
      path: '/solicitudes',
      title: 'Solicitudes',
      icon: faCalendarAlt,
      roles: ['admin', 'manager', 'employee']
    },
    {
      path: '/proyectos',
      title: 'Proyectos',
      icon: faProjectDiagram,
      roles: ['admin', 'manager', 'employee']
    },
    {
      path: '/incidencias',
      title: 'Incidencias',
      icon: faFileAlt,
      roles: ['admin', 'manager', 'employee']
    },
    {
      path: '/notificaciones',
      title: 'Notificaciones',
      icon: faBell,
      roles: ['admin', 'manager', 'employee']
    },
    // 👇 NUEVA OPCIÓN DE REPORTES - SOLO ADMIN Y MANAGER
    {
      path: '/reportes',
      title: 'Reportes',
      icon: faChartBar,
      roles: ['admin', 'manager']
    }
  ];

  // Solo para admin - agregar Aprobadores al menú
  const adminMenuItems: MenuItem[] = [
    {
      path: '/aprobadores',
      title: 'Aprobadores',
      icon: faUserShield,
      roles: ['admin']
    }
  ];

  // Filtrar menú según rol
  const getFilteredMenu = () => {
    const allItems = user?.rol === 'admin' 
      ? [...menuItems, ...adminMenuItems]
      : menuItems;
    
    return allItems.filter(item => 
      item.roles.includes(user?.rol || '')
    );
  };

  const filteredMenu = getFilteredMenu();

  // Verificar si un item está activo
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Renderizar item del menú
  const renderMenuItem = (item: MenuItem) => {
    const isItemActive = isActive(item.path);

    return (
      <Nav.Item key={item.path}>
        <Nav.Link
          as={Link}
          to={item.path}
          className={`d-flex align-items-center py-2 px-3 ${isItemActive ? 'bg-primary text-white' : ''}`}
          onClick={() => setSidebarOpen(false)}
        >
          <FontAwesomeIcon 
            icon={item.icon} 
            className="me-3" 
            style={{ width: '20px', textAlign: 'center' }}
          />
          <span>{item.title}</span>
        </Nav.Link>
      </Nav.Item>
    );
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar para desktop */}
      <div className="d-none d-lg-flex flex-column bg-light border-end" style={{ width: '250px' }}>
        {/* Logo y usuario */}
        <div className="p-3 border-bottom">
          <div className="text-center mb-3">
            <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center p-3">
              <FontAwesomeIcon icon={faUserCircle} size="2x" className="text-white" />
            </div>
            <h5 className="mt-2 mb-1">Recursos Humanos</h5>
            <small className="text-muted">Sistema HR</small>
          </div>
          
          <div className="text-center">
            <small className="fw-bold">
              {(empleado?.NombreCompleto || user?.usuario)?.toUpperCase()}
            </small>

            <Badge
              bg={
                user?.rol === 'admin'
                  ? 'danger'
                  : user?.rol === 'manager'
                  ? 'warning'
                  : 'info'
              }
              className="ms-2"
            >
              {user?.rol?.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Menú */}
        <div className="flex-grow-1 overflow-auto py-3">
          <Nav className="flex-column">
            {filteredMenu.map(item => renderMenuItem(item))}
          </Nav>
        </div>

        {/* Footer del sidebar */}
        <div className="p-3 border-top">
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/perfil" className="d-flex align-items-center py-2">
              <FontAwesomeIcon icon={faUser} className="me-3" />
              <span>Mi Perfil</span>
            </Nav.Link>
          </Nav>
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="w-100 mt-2"
            onClick={logout}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Navbar para mobile */}
        <Navbar bg="primary" variant="dark" expand="lg" className="shadow d-lg-none">
          <Container fluid>
            <Button 
              variant="outline-light" 
              className="me-2"
              onClick={() => setSidebarOpen(true)}
            >
              <FontAwesomeIcon icon={faBars} />
            </Button>
            
            <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
              Recursos Humanos
            </Navbar.Brand>
            
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/notificaciones" className="text-white position-relative">
                <FontAwesomeIcon icon={faBell} />
                <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem' }}>
                  3
                </Badge>
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>

        {/* Sidebar para mobile (Offcanvas) */}
        <Offcanvas 
          show={sidebarOpen} 
          onHide={() => setSidebarOpen(false)}
          placement="start"
          className="d-lg-none"
          style={{ width: '280px' }}
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faUserCircle} className="me-2 text-primary" />
                <div>
                  <div className="fw-bold">Recursos Humanos</div>
                  <small className="text-muted">Menú Principal</small>
                </div>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <div className="p-3 border-bottom">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                  <FontAwesomeIcon icon={faUserCircle} className="text-white" />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                    {empleado?.NombreCompleto || user?.usuario}
                  </div>
                  <Badge 
                    bg={user?.rol === 'admin' ? 'danger' : user?.rol === 'manager' ? 'warning' : 'info'}
                    className="mt-1"
                  >
                    {user?.rol}
                  </Badge>
                </div>
              </div>
            </div>

            <Nav className="flex-column">
              {filteredMenu.map(item => renderMenuItem(item))}
              
              {/* Enlace a perfil en mobile */}
              <Nav.Item>
                <Nav.Link
                  as={Link}
                  to="/perfil"
                  className="d-flex align-items-center py-2 px-3"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={faUser} className="me-3" />
                  <span>Mi Perfil</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <div className="p-3 border-top">
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="w-100"
                onClick={() => {
                  setSidebarOpen(false);
                  logout();
                }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                Cerrar Sesión
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Contenido de la página */}
        <div className="flex-grow-1 overflow-auto">
          <Container fluid className="py-3 h-100">
            <Outlet />
          </Container>
        </div>

        {/* Footer */}
        <footer className="bg-light border-top py-3">
          <Container fluid>
            <Row className="align-items-center">
              <Col md={6}>
                <small className="text-muted">
                  Recursos Humanos HR System &copy; {new Date().getFullYear()} - v2.0.0
                </small>
              </Col>
              <Col md={6} className="text-end">
                <small className="text-muted">
                  {user?.rol === 'admin' ? 'Modo Administrador' : user?.rol === 'manager' ? 'Modo Manager' : 'Modo Empleado'}
                </small>
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    </div>
  );
};

export default Layout;