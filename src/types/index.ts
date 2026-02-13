export interface User {
  ID: number;
  Usuario: string;
  Rol: string;
  Activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Empleado {
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
}

export interface Departamento {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Jefe {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  FechaAsignacion: string;
}

export interface Puesto {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasDashboard {
  totalEmpleados: number;
  solicitudesPendientes: number;
  totalProyectos: number;
  notificacionesSinLeer: number;
}

export interface SolicitudDashboard {
  ID: number;
  Tipo: string;
  Estado: string;
  FechaSolicitud: string;
  Motivo?: string;
  DiasSolicitados?: number;
}

export interface NotificacionDashboard {
  ID: number;
  Titulo: string;
  Mensaje: string;
  Estado: string;
  FechaCreacion: string;
  Importante: boolean;
}

export interface ProyectoDashboard {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  Estado: string;
  FechaInicio: string;
  Progreso?: number;
}

export interface Empleado {
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
  PuestoID?: number;
  UsuarioID?: number;
  departamentos?: Departamento[];
  jefes?: Jefe[];
}

export interface CrearEmpleadoData {
  nombreCompleto: string;
  correoElectronico: string;
  contrasenia: string;
  celular?: string;
  fechaIngreso: string;
  fechaNacimiento: string;
  direccion?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp: 'admin' | 'manager' | 'employee';
  departamentos?: number[];
  jefes?: number[];
}

export interface ActualizarEmpleadoData {
  nombreCompleto?: string;
  celular?: string;
  fechaNacimiento?: string;
  direccion?: string;
  nss?: string;
  rfc?: string;
  curp?: string;
  telefonoEmergencia?: string;
  puestoId?: number;
  rolApp?: 'admin' | 'manager' | 'employee';
  departamentos?: number[];
  jefes?: number[];
}

export interface Puesto {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Departamento {
  ID: number;
  Nombre: string;
  Descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Jefe {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
  FechaAsignacion: string;
}

export interface EmpleadoSelect {
  ID: number;
  NombreCompleto: string;
  CorreoElectronico: string;
  RolApp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EmpleadosResponse {
  empleados: Empleado[];
  pagination: Pagination;
}

export interface CatalogosResponse {
  puestos: Puesto[];
  departamentos: Departamento[];
  empleados: EmpleadoSelect[];
}