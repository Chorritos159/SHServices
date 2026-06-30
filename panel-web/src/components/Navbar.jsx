// Ubicación: src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar({ token, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber en qué página estamos
  
  let rol = '';
  let sede = '';
  let nombreUsuario = '';

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      rol = payload.rol;
      sede = payload.sede_asignada || payload.sede_assigned || 'PIURA';
      nombreUsuario = payload.id_usuario;
    } catch (e) {
      console.error("Error leyendo token en Navbar");
    }
  }

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Si no hay token o estamos en la pantalla de login, no mostramos la barra
  if (!token || location.pathname === '/') return null; 

  return (
    <nav style={{ backgroundColor: '#0052cc', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      
      {/* LOGO INTERACTIVO -> Lleva al inicio según el rol */}
      <Link to={rol === 'ADMIN' ? "/admin" : rol === 'RECEPCIONISTA' ? "/recepcion" : "/taller"} style={{ textDecoration: 'none', color: 'white' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
          SHServices <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>- Sede {sede}</span>
        </h2>
      </Link>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        
        {/* RECEPCIÓN Y ADMIN */}
        {(rol === 'RECEPCIONISTA' || rol === 'ADMIN') && (
          <Link to="/recepcion" style={linkStyle}>🏢 Recepción</Link>
        )}

        {/* TÉCNICO Y ADMIN */}
        {(rol === 'TECNICO' || rol === 'ADMIN') && (
          <Link to="/taller" style={linkStyle}>🛠️ Taller</Link>
        )}

        {/* SOLO ADMIN */}
        {rol === 'ADMIN' && (
          <Link to="/admin" style={linkStyle}>📊 Consola Admin</Link>
        )}

        {/* PERFIL Y LOGOUT */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{nombreUsuario} ({rol})</span>
          <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

const linkStyle = { color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: '4px', fontWeight: '500' };

export default Navbar;