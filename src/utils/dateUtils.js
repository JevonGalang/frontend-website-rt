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
