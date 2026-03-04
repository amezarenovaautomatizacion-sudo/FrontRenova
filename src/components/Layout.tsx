import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Container,
  Navbar,
  Nav,
  Badge,
  Button,
  Row,
  Col,
  Offcanvas,
  Dropdown,
  Stack
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
  faChartBar,
  faChevronRight,
  faMoon,
  faSun,
  faCog
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  path: string;
  title: string;
  icon: any;
  roles: string[];
  badge?: number;
  children?: MenuItem[];
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      title: 'Colaboradores',
      icon: faUsers,
      roles: ['admin', 'manager'],
      badge: 12
    },
    {
      path: '/solicitudes',
      title: 'Solicitudes',
      icon: faCalendarAlt,
      roles: ['admin', 'manager', 'employee'],
      badge: 5
    },
    {
      path: '/proyectos',
      title: 'Proyectos',
      icon: faProjectDiagram,
      roles: ['admin', 'manager', 'employee'],
      badge: 3
    },
    {
      path: '/incidencias',
      title: 'Incidencias',
      icon: faFileAlt,
      roles: ['admin', 'manager', 'employee'],
      badge: 2
    },
    {
      path: '/notificaciones',
      title: 'Notificaciones',
      icon: faBell,
      roles: ['admin', 'manager', 'employee'],
      badge: 8
    },
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

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (empleado?.NombreCompleto) {
      return empleado.NombreCompleto.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return user?.usuario?.substring(0, 2).toUpperCase() || 'RH';
  };

  // Renderizar item del menú
  const renderMenuItem = (item: MenuItem) => {
    const isItemActive = isActive(item.path);

    return (
      <Nav.Item key={item.path} className="mb-1">
        <Nav.Link
          as={Link}
          to={item.path}
          className={`d-flex align-items-center py-2 px-3 rounded-3 transition-all ${
            isItemActive 
              ? 'bg-primary text-white shadow-sm' 
              : theme === 'dark'
                ? 'text-secondary hover-bg-dark'
                : 'text-secondary hover-bg-light'
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <FontAwesomeIcon 
            icon={item.icon} 
            className={`me-3 ${isItemActive ? 'text-white' : 'text-primary'}`}
            style={{ width: '20px', textAlign: 'center' }}
          />
          <span className="flex-grow-1">{item.title}</span>
        </Nav.Link>
      </Nav.Item>
    );
  };

  // Función para obtener texto del rol en español
  const getRolTexto = (rol: string | undefined): string => {
    if (!rol) return 'SIN ROL';
    const roles: Record<string, string> = {
      admin: 'ADMINISTRADOR',
      manager: 'GERENTE',
      employee: 'COLABORADOR'
    };
    return roles[rol] || rol.toUpperCase();
  };

  return (
    <div className={`d-flex vh-100 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
      {/* Sidebar para desktop */}
      <div 
        className={`d-none d-lg-flex flex-column ${
          theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white'
        } shadow-sm`} 
        style={{ width: '280px' }}
      >
        {/* Logo y branding */}
        <div className={`p-4 border-bottom ${
          theme === 'dark' ? 'border-secondary bg-dark-gradient' : 'bg-gradient-primary-light'
        }`}>
          <div className="d-flex align-items-center">
            <div className="rounded-3 bg-primary p-2 me-3">
              <FontAwesomeIcon icon={faUserCircle} size="2x" className="text-white" />
            </div>
            <div>
              <h5 className={`mb-0 fw-bold ${
                theme === 'dark' ? 'text-light' : 'text-primary-dark'
              }`}>
                RH RENOVA
              </h5>
              <small className={theme === 'dark' ? 'text-secondary' : 'text-muted'}>
                Sistema de Gestión
              </small>
            </div>
          </div>
        </div>

        {/* Perfil del usuario */}
        <div className={`p-3 border-bottom ${
          theme === 'dark' ? 'border-secondary bg-darker' : 'bg-light'
        }`}>
          <div className="d-flex align-items-center">
            <div className="position-relative">
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                   style={{ width: '48px', height: '48px' }}>
                <span className="text-white fw-bold fs-6">{getUserInitials()}</span>
              </div>
              <span className="position-absolute bottom-0 end-0 bg-success rounded-circle p-1 border border-2 border-white"></span>
            </div>
            <div className="ms-3 flex-grow-1">
              <div className={`fw-bold text-truncate ${
                theme === 'dark' ? 'text-light' : ''
              }`} style={{ maxWidth: '160px' }}>
                {empleado?.NombreCompleto || user?.usuario}
              </div>
              <div className="d-flex align-items-center">
                <Badge 
                  bg={
                    user?.rol === 'admin' ? 'danger' :
                    user?.rol === 'manager' ? 'warning' : 'info'
                  }
                  className="rounded-pill px-2 py-1"
                  style={{ fontSize: '0.7rem' }}
                >
                  {getRolTexto(user?.rol)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Menú principal */}
        <div className="flex-grow-1 overflow-auto py-3 px-3">
          <div className={`small text-uppercase fw-bold mb-2 ps-3 ${
            theme === 'dark' ? 'text-secondary' : 'text-muted'
          }`}>
            Navegación
          </div>
          <Nav className="flex-column">
            {filteredMenu.map(item => renderMenuItem(item))}
          </Nav>
        </div>

        {/* Footer del sidebar */}
        <div className={`p-3 border-top ${
          theme === 'dark' ? 'border-secondary bg-darker' : 'bg-light'
        }`}>
          <Nav className="flex-column">
            <Nav.Link 
              as={Link} 
              to="/perfil" 
              className={`d-flex align-items-center py-2 px-3 rounded-3 mb-1 ${
                theme === 'dark' 
                  ? 'text-secondary hover-bg-dark' 
                  : 'text-secondary hover-bg-light'
              }`}
            >
              <FontAwesomeIcon icon={faUser} className="me-3 text-primary" style={{ width: '20px' }} />
              <span>Mi Perfil</span>
              <FontAwesomeIcon icon={faChevronRight} className="ms-auto text-muted" size="sm" />
            </Nav.Link>
          </Nav>

          <hr className={`my-2 ${theme === 'dark' ? 'bg-secondary' : ''}`} />

          <div className="d-flex align-items-center justify-content-between mt-2">
            <Button 
              variant="link" 
              className={`p-2 ${theme === 'dark' ? 'text-secondary' : 'text-muted'}`}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} size="lg" />
            </Button>

            <Button 
              variant="outline-danger" 
              size="sm" 
              className="rounded-pill px-3"
              onClick={logout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Navbar para mobile */}
        <Navbar 
          bg={theme === 'dark' ? 'dark' : 'white'} 
          variant={theme === 'dark' ? 'dark' : 'light'}
          expand="lg" 
          className="shadow-sm d-lg-none py-2"
        >
          <Container fluid>
            <Button 
              variant="link" 
              className={`p-0 me-2 ${theme === 'dark' ? 'text-secondary' : 'text-primary'}`}
              onClick={() => setSidebarOpen(true)}
            >
              <FontAwesomeIcon icon={faBars} size="lg" />
            </Button>
            
            <Navbar.Brand as={Link} to="/dashboard" className={`fw-bold ${
              theme === 'dark' ? 'text-light' : 'text-primary-dark'
            }`}>
              <span className="d-none d-sm-inline">RH RENOVA</span>
              <span className="d-sm-inline d-md-none">RH</span>
            </Navbar.Brand>
            
            <Stack direction="horizontal" gap={2} className="ms-auto">
              {/* Botón de tema en navbar mobile */}
              <Button 
                variant="link" 
                className={`p-0 ${theme === 'dark' ? 'text-secondary' : 'text-muted'}`}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} size="lg" />
              </Button>
              
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="link" 
                  className={`p-0 ${theme === 'dark' ? 'text-secondary' : 'text-muted'} border-0`}
                >
                  <div className="position-relative">
                    <FontAwesomeIcon icon={faBell} size="lg" />
                    <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle p-1 rounded-circle" style={{ fontSize: '0.5rem' }}>
                      3
                    </Badge>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className={`dropdown-menu-end p-0 ${
                  theme === 'dark' ? 'bg-dark border-secondary' : ''
                }`} style={{ width: '280px' }}>
                  <div className={`p-3 border-bottom ${
                    theme === 'dark' ? 'border-secondary' : ''
                  }`}>
                    <h6 className={`mb-0 ${theme === 'dark' ? 'text-light' : ''}`}>Notificaciones</h6>
                  </div>
                  <div className={`p-3 text-center ${
                    theme === 'dark' ? 'text-secondary' : 'text-muted'
                  }`}>
                    <small>No hay notificaciones nuevas</small>
                  </div>
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="p-0 border-0">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                       style={{ width: '32px', height: '32px' }}>
                    <span className="text-white fw-bold small">{getUserInitials()}</span>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className={`dropdown-menu-end ${
                  theme === 'dark' ? 'bg-dark border-secondary' : ''
                }`}>
                  <Dropdown.Item 
                    as={Link} 
                    to="/perfil"
                    className={theme === 'dark' ? 'text-light hover-bg-dark' : ''}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Mi Perfil
                  </Dropdown.Item>
                  <Dropdown.Item 
                    as={Link} 
                    to="/configuracion"
                    className={theme === 'dark' ? 'text-light hover-bg-dark' : ''}
                  >
                    <FontAwesomeIcon icon={faCog} className="me-2" />
                    Configuración
                  </Dropdown.Item>
                  <Dropdown.Divider className={theme === 'dark' ? 'bg-secondary' : ''} />
                  <Dropdown.Item 
                    onClick={logout} 
                    className={`text-danger ${theme === 'dark' ? 'hover-bg-dark' : ''}`}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                    Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Stack>
          </Container>
        </Navbar>

        {/* Sidebar para mobile (Offcanvas) */}
        <Offcanvas 
          show={sidebarOpen} 
          onHide={() => setSidebarOpen(false)}
          placement="start"
          className={`d-lg-none border-0 ${
            theme === 'dark' ? 'bg-dark' : ''
          }`}
          style={{ width: '300px' }}
        >
          <Offcanvas.Header 
            closeButton 
            closeVariant={theme === 'dark' ? 'white' : undefined}
            className={`border-bottom ${
              theme === 'dark' 
                ? 'bg-primary border-secondary' 
                : 'bg-primary text-white'
            }`}
          >
            <Offcanvas.Title>
              <div className="d-flex align-items-center">
                <div className="rounded-3 bg-white p-2 me-3">
                  <FontAwesomeIcon icon={faUserCircle} className="text-primary" size="lg" />
                </div>
                <div>
                  <div className="fw-bold text-white">RH RENOVA</div>
                  <small className="text-white-50">Sistema de Gestión</small>
                </div>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>
          
          <Offcanvas.Body className="p-0 d-flex flex-column">
            {/* Perfil usuario en mobile */}
            <div className={`p-3 border-bottom ${
              theme === 'dark' ? 'border-secondary bg-darker' : 'bg-light'
            }`}>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <span className="text-white fw-bold">{getUserInitials()}</span>
                </div>
                <div className="ms-3">
                  <div className={`fw-bold ${theme === 'dark' ? 'text-light' : ''}`}>
                    {empleado?.NombreCompleto || user?.usuario}
                  </div>
                  <Badge 
                    bg={user?.rol === 'admin' ? 'danger' : user?.rol === 'manager' ? 'warning' : 'info'}
                    className="rounded-pill"
                  >
                    {getRolTexto(user?.rol)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Menú mobile */}
            <div className="py-3 px-3 flex-grow-1">
              <div className={`small text-uppercase fw-bold mb-2 ps-3 ${
                theme === 'dark' ? 'text-secondary' : 'text-muted'
              }`}>
                Menú Principal
              </div>
              <Nav className="flex-column">
                {filteredMenu.map(item => renderMenuItem(item))}
              </Nav>

              <hr className={`my-3 ${theme === 'dark' ? 'bg-secondary' : ''}`} />

              <div className={`small text-uppercase fw-bold mb-2 ps-3 ${
                theme === 'dark' ? 'text-secondary' : 'text-muted'
              }`}>
                Cuenta
              </div>
              <Nav className="flex-column">
                <Nav.Link
                  as={Link}
                  to="/perfil"
                  className={`d-flex align-items-center py-2 px-3 rounded-3 ${
                    theme === 'dark' 
                      ? 'text-secondary hover-bg-dark' 
                      : 'hover-bg-light'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={faUser} className="me-3 text-primary" style={{ width: '20px' }} />
                  <span>Mi Perfil</span>
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/configuracion"
                  className={`d-flex align-items-center py-2 px-3 rounded-3 ${
                    theme === 'dark' 
                      ? 'text-secondary hover-bg-dark' 
                      : 'hover-bg-light'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={faCog} className="me-3 text-primary" style={{ width: '20px' }} />
                  <span>Configuración</span>
                </Nav.Link>
              </Nav>
            </div>

            {/* SECCIÓN DE ACCIONES */}
            <div className={`p-3 border-top ${
              theme === 'dark' ? 'border-secondary' : ''
            }`}>
              {/* Botón de cambio de tema */}
              <Button 
                variant={theme === 'dark' ? 'outline-light' : 'outline-primary'}
                className="w-100 rounded-pill mb-2 py-2 d-flex align-items-center justify-content-center"
                onClick={toggleTheme}
              >
                <FontAwesomeIcon 
                  icon={theme === 'dark' ? faSun : faMoon} 
                  className="me-2" 
                  size="lg"
                />
                <span className="fw-bold">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
              </Button>

              {/* Botón de cerrar sesión */}
              <Button 
                variant="outline-danger" 
                className="w-100 rounded-pill py-2 d-flex align-items-center justify-content-center"
                onClick={() => {
                  setSidebarOpen(false);
                  logout();
                }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                <span className="fw-bold">Cerrar Sesión</span>
              </Button>
              
              {/* Texto adicional */}
              <div className="text-center mt-2">
                <small className={theme === 'dark' ? 'text-secondary' : 'text-muted'}>
                  Personaliza tu experiencia
                </small>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Contenido de la página */}
        <div className={`flex-grow-1 overflow-auto ${
          theme === 'dark' ? 'bg-dark' : 'bg-light'
        }`}>
          <Container fluid className="py-4 px-4 h-100">
            <Outlet />
          </Container>
        </div>

        {/* Footer */}
        <footer className={`border-top py-3 mt-auto ${
          theme === 'dark' ? 'bg-darker border-secondary' : 'bg-white'
        }`}>
          <Container fluid className="px-4">
            <Row className="align-items-center">
              <Col xs={12} md={6} className="text-center text-md-start mb-2 mb-md-0">
                <small className={theme === 'dark' ? 'text-secondary' : 'text-muted'}>
                  <i className="bi bi-c-circle me-1"></i>
                  {new Date().getFullYear()} RH RENOVA. Todos los derechos reservados.
                </small>
              </Col>
              <Col xs={12} md={6} className="text-center text-md-end">
                <small className={theme === 'dark' ? 'text-secondary' : 'text-muted'}>
                  Versión 2.0.0 | 
                  <span className={`ms-2 badge ${
                    theme === 'dark' ? 'bg-secondary text-light' : 'bg-light text-dark'
                  }`}>
                    <FontAwesomeIcon icon={faUserShield} className="me-1" size="sm" />
                    {getRolTexto(user?.rol)}
                  </span>
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