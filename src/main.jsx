import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor for API request and response diagnostics.
const originalFetch = window.fetch;
const redact = (value) => {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    /password|token|authorization|otp/i.test(key) ? '[REDACTED]' : item,
  ]));
};

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource.url;
  const method = config?.method || 'GET';
  
  let requestBody = config?.body;
  if (typeof config?.body === 'string') {
    try {
      requestBody = JSON.parse(config.body);
    } catch (e) {}
  } else if (config?.body instanceof FormData) {
    requestBody = {};
    for (const [key, value] of config.body.entries()) {
      requestBody[key] = value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value;
    }
  }

  console.log(`%c[API Request] ${method} ${url}`, 'color: #3b82f6; font-weight: bold; font-size: 11px;', {
    url,
    method,
    headers: redact(config?.headers),
    body: redact(requestBody)
  });

  try {
    const response = await originalFetch(...args);
    const responseClone = response.clone();
    
    let responseBody = null;
    try {
      responseBody = await responseClone.json();
    } catch (e) {
      try {
        responseBody = await responseClone.text();
      } catch (err) {}
    }

    const logColor = response.ok ? '#10b981' : '#ef4444';
    console.log(`%c[API Response] ${response.status} ${response.statusText} - ${url}`, `color: ${logColor}; font-weight: bold; font-size: 11px;`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody
    });

    return response;
  } catch (error) {
    console.error(`%c[API Error] ${method} ${url}`, 'color: #ef4444; font-weight: bold; font-size: 11px;', error);
    throw error;
  }
};

// Global Input Character Limit Interceptor (Max 200 characters for non-numeric/non-date inputs and textareas)
const shouldExcludeFromLimit = (target) => {
  if (!target) return true;
  
  // Exclude all SweetAlert elements
  if (target.closest && (target.closest('.swal2-container') || target.closest('.swal2-popup') || target.closest('.swal2-modal'))) {
    return true;
  }
  if (target.classList && (target.classList.contains('swal2-input') || target.classList.contains('swal2-textarea') || target.classList.contains('swal2-select'))) {
    return true;
  }

  const name = (target.name || '').toLowerCase();
  const id = (target.id || '').toLowerCase();
  const placeholder = (target.placeholder || '').toLowerCase();
  const type = (target.type || '').toLowerCase();

  const parent = target.parentNode;
  const grandParent = parent ? parent.parentNode : null;
  const parentText = parent ? parent.textContent.toLowerCase() : '';
  const grandParentText = grandParent ? grandParent.textContent.toLowerCase() : '';
  const fullTextContext = `${name} ${id} ${placeholder} ${parentText} ${grandParentText}`;

  // Exclude date inputs (e.g. DD/MM/YYYY placeholder, native date type, name/id containing 'date' or 'tgl')
  if (placeholder.includes('dd/mm/yyyy') || type === 'date' || fullTextContext.includes('date') || fullTextContext.includes('tanggal') || fullTextContext.includes('tgl') || fullTextContext.includes('lahir')) {
    return true;
  }
  
  // Exclude numbers and critical numeric/phone/identity/OTP fields (NIK, KK, Phone, OTP, Amount, etc.)
  const numKeywords = [
    'nik', 'kk', 'nokk', 'kartu keluarga', 
    'phone', 'hp', 'telepon', 'telp', 'mobile',
    'otp', 'kode', 'digit', 'verifikasi', 'swal', 'alert', 'exit', 'keluar',
    'amount', 'nominal', 'harga', 'saldo', 'balance', 'jumlah', 'setor', 'uang', 'rupiah', 'rp',
    'usia', 'umur', 'tahun', 'year', 'month', 'bulan', 'no. kk', 'no kk', 'no.kk'
  ];
  if (type === 'number' || numKeywords.some(keyword => fullTextContext.includes(keyword))) {
    return true;
  }
  
  return false;
};

// Check if input is a descriptive field that should show the "limit 200 karakter" label
const shouldShowLimitWarning = (target) => {
  if (shouldExcludeFromLimit(target)) return false;
  
  const name = (target.name || '').toLowerCase();
  const id = (target.id || '').toLowerCase();
  const placeholder = (target.placeholder || '').toLowerCase();
  const type = (target.type || '').toLowerCase();

  const parent = target.parentNode;
  const grandParent = parent ? parent.parentNode : null;
  const parentText = parent ? parent.textContent.toLowerCase() : '';
  const grandParentText = grandParent ? grandParent.textContent.toLowerCase() : '';
  const fullTextContext = `${name} ${id} ${placeholder} ${parentText} ${grandParentText}`;
  
  // Exclude all search bars, search inputs, login inputs, OTP inputs, email inputs, titles, and headers
  const excludeWarningKeywords = [
    'search', 'cari', 'find', 'filter', // search/filter bars
    'username', 'password', 'email', 'login', 'pass', 'token', 'kredensial', // login
    'otp', 'kode', 'digit', 'verifikasi', 'swal', 'alert', 'exit', 'keluar', // OTP verification & alerts
    'judul pengumuman', 'judul', 'title', 'subject', 'tema', // announcement title / agenda title / etc.
    'nama lengkap kepala keluarga', 'kepala keluarga', 'nama kepala', // name of head of family
    'nomor kk', 'no kk', 'no. kk', 'nokk', // kk
    'hp aktif', 'no hp', 'nohp', 'no. hp', 'nomor hp', // phone number
    'alamat email', 'surel' // email
  ];
  
  if (
    type === 'password' || 
    type === 'email' ||
    excludeWarningKeywords.some(keyword => fullTextContext.includes(keyword))
  ) {
    return false;
  }
  
  return true;
};

// Helper to inject warning labels under matching inputs
const addLimitWarnings = () => {
  // Clean up any warnings inside SweetAlert modals
  document.querySelectorAll('.swal2-container .char-limit-warn, .swal2-popup .char-limit-warn').forEach(el => el.remove());

  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(target => {
    const textTypes = ['text', 'search', 'email', 'password', 'url', 'tel'];
    const isTextInput = target.tagName === 'TEXTAREA' || 
                        (target.tagName === 'INPUT' && (!target.type || textTypes.includes(target.type.toLowerCase())));
                        
    if (isTextInput && !target.readOnly && !target.disabled && shouldShowLimitWarning(target)) {
      const parent = target.parentNode;
      if (parent) {
        const alreadyHasWarn = parent.querySelector('.char-limit-warn');
        if (!alreadyHasWarn) {
          const warn = document.createElement('p');
          warn.className = 'char-limit-warn text-[10px] text-rose-500 dark:text-rose-450 font-bold mt-1 block';
          warn.innerText = 'limit 200 karakter';
          // Insert warning right after the input/textarea element
          target.parentNode.insertBefore(warn, target.nextSibling);
        }
      }
    } else {
      // Clean up warning if it shouldn't show (for exclusions)
      const parent = target.parentNode;
      if (parent) {
        let sibling = target.nextSibling;
        while (sibling) {
          if (sibling.classList && sibling.classList.contains('char-limit-warn')) {
            sibling.remove();
            break;
          }
          sibling = sibling.nextSibling;
        }
      }
    }
  });
};

// Watch for DOM changes to inject warnings dynamically on React tab changes/modal openings
const observer = new MutationObserver(() => {
  addLimitWarnings();
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('focusin', (e) => {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    const textTypes = ['text', 'search', 'email', 'password', 'url', 'tel'];
    const isTextInput = target.tagName === 'TEXTAREA' || 
                        (target.tagName === 'INPUT' && (!target.type || textTypes.includes(target.type.toLowerCase())));
                        
    if (isTextInput && !target.readOnly && !target.disabled && !shouldExcludeFromLimit(target)) {
      const currentMaxLength = target.maxLength;
      if (currentMaxLength === -1 || currentMaxLength > 200) {
        target.maxLength = 200;
      }
      addLimitWarnings();
    }
  }
}, true);

window.addEventListener('input', (e) => {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    const textTypes = ['text', 'search', 'email', 'password', 'url', 'tel'];
    const isTextInput = target.tagName === 'TEXTAREA' || 
                        (target.tagName === 'INPUT' && (!target.type || textTypes.includes(target.type.toLowerCase())));
                        
    if (isTextInput && !shouldExcludeFromLimit(target) && target.value && target.value.length > 200) {
      target.value = target.value.slice(0, 200);
    }
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
