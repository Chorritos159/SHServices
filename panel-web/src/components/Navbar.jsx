import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CampanaNotificaciones from './CampanaNotificaciones'; // <-- IMPORTAMOS LA CAMPANITA

function Navbar({ token, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // Ocultar la barra en el login
  if (!token || location.pathname === '/') return null; 

  return (
    <nav style={{ backgroundColor: '#0052cc', padding: '12px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      
      {/* LOGO INTERACTIVO */}
      <Link to={rol === 'ADMIN' ? "/admin" : rol === 'RECEPCIONISTA' ? "/recepcion" : "/taller"} style={{ textDecoration: 'none', color: 'white' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
          SHServices <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>- Sede {sede}</span>
        </h2>
      </Link>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* MÓDULOS DE RECEPCIÓN */}
        {(rol === 'RECEPCIONISTA' || rol === 'ADMIN') && (
          <>
            <Link to="/recepcion" style={linkStyle}>🏢 Recepción</Link>
            <Link to="/clientes" style={linkStyle}>👥 Clientes</Link>
          </>
        )}

        {/* MÓDULOS DEL TÉCNICO */}
        {(rol === 'TECNICO' || rol === 'ADMIN') && (
          <>
            <Link to="/taller" style={linkStyle}>🛠️ Taller</Link>
            <Link to="/almacen-repuestos" style={linkStyle}>⚙️ Repuestos</Link>
          </>
        )}

        {/* MÓDULO EXCLUSIVO DEL ADMIN */}
        {rol === 'ADMIN' && (
          <Link to="/admin" style={{ ...linkStyle, backgroundColor: '#17a2b8', border: '1px solid #138496' }}>
            📊 Consola Admin
          </Link>
        )}

        {/* ZONA DE PERFIL CON LA CAMPANITA */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px', marginLeft: '5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          {/* AQUÍ INSERTAMOS EL COMPONENTE */}
          <CampanaNotificaciones token={token} />

          <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {nombreUsuario} <span style={{ opacity: 0.8 }}>({rol})</span>
          </span>
          <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

const linkStyle = { 
  color: 'white', textDecoration: 'none', padding: '6px 10px', 
  borderRadius: '4px', fontWeight: '500', fontSize: '13px',
  transition: 'background 0.2s' 
};

export default Navbar;