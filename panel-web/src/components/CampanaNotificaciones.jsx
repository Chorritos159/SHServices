import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// 👇 1. Recibimos el token por props
function CampanaNotificaciones({ token }) { 
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      // Si por alguna razón no hay token, no hacemos la petición
      if (!token) return; 
      
      try {
        // 👇 2. Enviamos el token al Gateway para que nos identifique
        const res = await axios.get('http://localhost:8000/api/v1/notificaciones', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotificaciones(res.data);
      } catch (error) {
        console.error("Silencio en el canal de notificaciones");
      }
    };
    
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 5000);
    return () => clearInterval(interval);
  }, [token]); // Añadimos token a las dependencias

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMostrarNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  const toggleNotificaciones = async () => {
    setMostrarNotif(!mostrarNotif);
    if (!mostrarNotif && noLeidas > 0) {
      try {
        // 👇 3. También enviamos el token al marcar como leídas
        await axios.post('http://localhost:8000/api/v1/notificaciones/marcar-leidas', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotificaciones(notificaciones.map(n => ({ ...n, leido: true })));
      } catch (error) {
        console.error("Error al marcar leídas");
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={menuRef}>
      
      <button 
        onClick={toggleNotificaciones}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', position: 'relative', color: 'white', padding: '0 5px', marginRight: '10px' }}
      >
        🔔
        {noLeidas > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-2px', background: '#dc3545', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', border: '2px solid #0052cc' }}>
            {noLeidas}
          </span>
        )}
      </button>

      {mostrarNotif && (
        <div style={{ position: 'absolute', top: '45px', right: '0', width: '320px', backgroundColor: 'white', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', borderRadius: '8px', zIndex: 1000, overflow: 'hidden', color: '#333' }}>
          <div style={{ backgroundColor: '#f8f9fa', color: '#0052cc', padding: '12px', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
            📡 Centro de Notificaciones
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px' }}>
            {notificaciones.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#777', fontSize: '14px', margin: '20px 0' }}>No hay eventos recientes.</p>
            ) : (
              notificaciones.map(n => (
                <div key={n.id} style={{ borderBottom: '1px solid #eee', padding: '10px 5px', fontSize: '13px' }}>
                  <strong style={{ color: n.tipo === 'NUEVO_INGRESO' ? '#d97706' : '#16a34a', display: 'block', marginBottom: '3px' }}>
                    {n.tipo === 'NUEVO_INGRESO' ? '📦 NUEVO INGRESO:' : '✅ EQUIPO LISTO:'}
                  </strong>
                  <span style={{ color: '#444' }}>{n.mensaje}</span>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '6px', textAlign: 'right' }}>Hoy a las {n.hora}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CampanaNotificaciones;