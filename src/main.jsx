import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor for Debugging (Requests and Responses)
const originalFetch = window.fetch;
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
    headers: config?.headers,
    body: requestBody
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
