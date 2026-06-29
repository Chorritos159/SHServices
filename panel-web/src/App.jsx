import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import Login from './pages/Login';
import Recepcion from './pages/Recepcion';
import Taller from './pages/Taller';
import Admin from './pages/Admin';

// Panel temporal de pruebas
function PanelPruebasSOA({ token, setToken }) {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Panel de Diagnóstico de Integración SOA</h2>
      <p>Pegue su token para habilitar los microservicios:</p>
      <textarea 
        rows="3" 
        style={{ width: '100%', marginBottom: '10px' }} 
        value={token} 
        onChange={(e) => setToken(e.target.value)} 
        placeholder="eyJhbGciOiJIUzI1Ni..."
      />
      {token && <p style={{ color: 'green' }}>✅ Token cargado en memoria.</p>}
    </div>
  );
}

// Componente de Navegación Condicional
function Navbar({ token, setToken }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    navigate('/login');
  };

  return (
    <nav style={{ background: '#0052cc', padding: '15px', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
      <strong style={{ marginRight: 'auto' }}>SHServices - Sede Piura</strong>
      
      {/* Solo mostramos el menú si hay un token válido en memoria */}
      {token && (
        <>
          <Link to="/recepcion" style={{ color: 'white', textDecoration: 'none' }}>🏢 Recepción</Link>
          <Link to="/taller" style={{ color: 'white', textDecoration: 'none' }}>🛠️ Taller Kanban</Link>
          <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>📊 Admin</Link>
          <Link to="/test" style={{ color: '#00ffcc', textDecoration: 'none' }}>⚙️ Diagnóstico</Link>
          <button 
            onClick={handleLogout} 
            style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginLeft: '15px' }}
          >
            Cerrar Sesión
          </button>
        </>
      )}
    </nav>
  );
}

function App() {
  const [token, setToken] = useState('');

  return (
    <Router>
      <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
        
        <Navbar token={token} setToken={setToken} />
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            
            {/* Módulos protegidos */}
            <Route path="/recepcion" element={<Recepcion token={token} />} />
            <Route path="/taller" element={<Taller token={token} />} />
            <Route path="/admin" element={<Admin token={token} />} />
            
            <Route path="/test" element={<PanelPruebasSOA token={token} setToken={setToken} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;