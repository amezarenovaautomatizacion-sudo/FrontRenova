export const formatDateDisplay = (dateString?: string | null): string => {
  if (!dateString) return 'No disponible';
  
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    if (dateString.includes('T')) {
      const [datePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Error en fecha';
  }
};

export const formatDateTimeDisplay = (dateString?: string | null): string => {
  if (!dateString) return 'No disponible';
  
  try {
    if (dateString.includes('T')) {
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Error en fecha';
  }
};

export const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return '';
  
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export const calcularEdad = (fechaNacimiento?: string | null): number | null => {
  if (!fechaNacimiento) return null;
  
  try {
    let fecha: Date;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
      const [year, month, day] = fechaNacimiento.split('-').map(Number);
      fecha = new Date(year, month - 1, day);
    } else {
      fecha = new Date(fechaNacimiento);
    }
    
    if (isNaN(fecha.getTime())) return null;
    
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    
    return edad;
  } catch {
    return null;
  }
};

export const calcularAntiguedad = (fechaIngreso?: string | null): { years: number; months: number } => {
  if (!fechaIngreso) return { years: 0, months: 0 };
  
  try {
    let fecha: Date;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso)) {
      const [year, month, day] = fechaIngreso.split('-').map(Number);
      fecha = new Date(year, month - 1, day);
    } else {
      fecha = new Date(fechaIngreso);
    }
    
    if (isNaN(fecha.getTime())) return { years: 0, months: 0 };
    
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fecha.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    return { years, months };
  } catch {
    return { years: 0, months: 0 };
  }
};