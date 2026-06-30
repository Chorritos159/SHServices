import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Recepcion from './pages/Recepcion';
import Taller from './pages/Taller';
import Clientes from './pages/Clientes';
import AlmacenRepuestos from './pages/AlmacenRepuestos';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';

function PanelPruebasSOA({ token, setToken }) {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Panel de Diagnóstico de Integración SOA</h2>
      <p>Pegue su token para habilitar los microservicios:</p>
      <textarea
        rows="3"
        style={{ width: '100%', marginBottom: '10px' }}
        value={token || ''}
        onChange={(e) => setToken(e.target.value)}
        placeholder="eyJhbGciOiJIUzI1Ni..."
      />
      {token && <p style={{ color: 'green' }}>✅ Token cargado en memoria.</p>}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const handleLogin = (nuevoToken) => {
    localStorage.setItem('token', nuevoToken);
    setToken(nuevoToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
        <Navbar token={token} onLogout={handleLogout} />

        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Login setToken={handleLogin} />} />
            <Route path="/recepcion" element={token ? <Recepcion token={token} /> : <Navigate to="/" />} />
            <Route path="/taller" element={token ? <Taller token={token} /> : <Navigate to="/" />} />
            <Route path="/clientes" element={token ? <Clientes token={token} /> : <Navigate to="/" />} />
            <Route path="/almacen-repuestos" element={token ? <AlmacenRepuestos token={token} /> : <Navigate to="/" />} />
            <Route path="/admin" element={token ? <Admin token={token} /> : <Navigate to="/" />} />
            <Route path="/test" element={token ? <PanelPruebasSOA token={token} setToken={handleLogin} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;