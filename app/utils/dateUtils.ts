/**
 * Retorna la fecha en formato ISO ajustada a la zona horaria local.
 * Útil para enviar fechas a SQLite o backend sin que JavaScript
 * las convierta a UTC y sume las 5 horas de diferencia (GMT-5).
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
  // Retorna "YYYY-MM-DDTHH:mm:ss.sss"
  return localISOTime;
};

/**
 * Retorna solo la fecha local (YYYY-MM-DD).
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  return getLocalISOString(date).split("T")[0];
};

/**
 * Recibe un ISO string (ej. "2026-09-06T15:52:09") y lo formatea a fecha local
 * sin usar el parseo de zona horaria de new Date()
 */
export const formatLocalDate = (isoString: string | null): string => {
  if (!isoString) return "N/A";
  try {
    const cleanString = isoString.split('.')[0].replace('Z', '');
    
    let dateSegment = cleanString;
    let timeSegment = '';
    
    if (cleanString.includes('T')) {
      [dateSegment, timeSegment] = cleanString.split('T');
    } else if (cleanString.includes(' ')) {
      [dateSegment, timeSegment] = cleanString.split(' ');
    }
    
    const [year, month, day] = dateSegment.split('-');
    
    if (!year || !month || !day) return isoString;
    
    const datePart = `${day}/${month}/${year}`;
    
    // Si la cadena incluía tiempo, lo mostramos primero
    if (timeSegment) {
      return `${timeSegment} - ${datePart}`;
    }
    
    return datePart;
  } catch {
    return isoString;
  }
};

/**
 * Recibe un ISO string y lo formatea a fecha y hora
 */
export const formatLocalDatetime = (isoString: string | null): string => {
  // Ahora formatLocalDate ya maneja la hora si está presente
  return formatLocalDate(isoString);
};
