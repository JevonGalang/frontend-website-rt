import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

const DateInput = ({
  value,
  onChange,
  className = '',
  required = false,
  placeholder = 'DD/MM/YYYY',
  id,
  name,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef(null);
  const hiddenDateRef = useRef(null);

  // Sync external value (YYYY-MM-DD) to local display (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (formatted !== displayValue) {
          setDisplayValue(formatted);
        }
        return;
      }
    }
    // Only clear if not focused to avoid wiping out typed value
    if (document.activeElement !== inputRef.current) {
      setDisplayValue('');
    }
  }, [value]);

  const handleTextChange = (e) => {
    let inputVal = e.target.value;
    
    // Allow digits and slashes, strip everything else
    const cleanedVal = inputVal.replace(/[^\d/]/g, '');
    
    // Strip slashes for mask formatting
    const digits = cleanedVal.replace(/\D/g, '').slice(0, 8);
    
    let formatted = '';
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      }
    }
    
    setDisplayValue(formatted);

    // If complete date DDMMYYYY
    if (digits.length === 8) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      const dateStr = `${y}-${m}-${d}`;
      const parsedDate = new Date(dateStr);
      
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      
      if (
        !isNaN(parsedDate.getTime()) &&
        monthNum >= 1 && monthNum <= 12 &&
        dayNum >= 1 && dayNum <= 31 &&
        yearNum >= 1900 && yearNum <= 2100
      ) {
        onChange({ target: { name, value: dateStr } });
      }
    } else {
      // Trigger onChange with empty if incomplete
      if (value !== '') {
        onChange({ target: { name, value: '' } });
      }
    }
  };

  const handleBlur = () => {
    // On blur, if the display value is incomplete or invalid, clear it
    const digits = displayValue.replace(/\D/g, '');
    if (digits.length < 8) {
      setDisplayValue('');
      if (value !== '') {
        onChange({ target: { name, value: '' } });
      }
    } else {
      // Re-validate and sync
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      const dateStr = `${y}-${m}-${d}`;
      const parsedDate = new Date(dateStr);
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      
      if (
        isNaN(parsedDate.getTime()) ||
        monthNum < 1 || monthNum > 12 ||
        dayNum < 1 || dayNum > 31
      ) {
        setDisplayValue('');
        if (value !== '') {
          onChange({ target: { name, value: '' } });
        }
      }
    }
  };

  const handleIconClick = (e) => {
    e.preventDefault();
    if (hiddenDateRef.current) {
      try {
        // Modern browser showPicker API
        hiddenDateRef.current.showPicker();
      } catch (err) {
        // Fallback: click it
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      }
    }
  };

  const handleNativeDateChange = (e) => {
    const nativeVal = e.target.value; // YYYY-MM-DD
    if (nativeVal) {
      onChange({ target: { name, value: nativeVal } });
      const parts = nativeVal.split('-');
      setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
    } else {
      onChange({ target: { name, value: '' } });
      setDisplayValue('');
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {/* Visible formatted text input */}
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        required={required}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        className={`${className} pr-10`} // Make sure there is space for the calendar icon
      />
      
      {/* Calendar trigger icon */}
      <button
        type="button"
        onClick={handleIconClick}
        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none transition-colors cursor-pointer"
        title="Pilih Tanggal"
      >
        <Calendar className="w-5 h-5" />
      </button>

      {/* Hidden native date input to leverage browser's date picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value || ''}
        onChange={handleNativeDateChange}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};

export default DateInput;
