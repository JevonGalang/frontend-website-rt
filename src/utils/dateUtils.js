export const formatDateToDDMMYYYY = (dateStrOrObj) => {
  if (!dateStrOrObj) return '-';
  try {
    const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(date.getTime())) {
      const parts = String(dateStrOrObj).split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return String(dateStrOrObj);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateStrOrObj);
  }
};

export const parseLocalDateString = (rawDate) => {
  if (!rawDate) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // If already pure YYYY-MM-DD
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    return rawDate.trim();
  }

  // If string contains date and time, e.g. "2026-09-03 09:30:00" or ISO "2026-09-03T..."
  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    // If it has timezone Z or offset, parse as Date object to accurately obtain local date
    if (trimmed.includes('T') || trimmed.includes('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    // If simple "YYYY-MM-DD ..." without timezone
    const isoPrefixMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoPrefixMatch) {
      return `${isoPrefixMatch[1]}-${isoPrefixMatch[2]}-${isoPrefixMatch[3]}`;
    }
    // If DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // Fallback to Date object parsing in local time
  try {
    const dateObj = new Date(rawDate);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}

  return String(rawDate).substring(0, 10);
};

export const getTodayDateLocal = () => parseLocalDateString(new Date());

