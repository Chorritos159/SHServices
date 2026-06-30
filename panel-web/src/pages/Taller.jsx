// Ubicación: src/pages/Taller.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ModalGestionTicket from '../components/ModalGestionTicket'; // <-- Importamos el modal limpio

function Taller({ token }) {
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Técnico', idUsuario: '', sede: 'Cargando...' });
  const [tickets, setTickets] = useState({ pendientes: [], enProceso: [], reparados: [] });
  const [loading, setLoading] = useState(true);
  
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setInfoLocal({
          usuario: payload.id_usuario,
          idUsuario: payload.id_usuario,
          sede: payload.sede_asignada || payload.sede_assigned || 'PIURA'
        });
      } catch (error) {
        console.error("Error al decodificar el token.");
      }
    }
  }, [token]);

  const cargarTicketsTaller = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/v1/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setTickets({
        pendientes: res.data.filter(t => t.estado === 'PENDIENTE'),
        enProceso: res.data.filter(t => t.estado === 'EN_PROCESO'),
        reparados: res.data.filter(t => t.estado === 'REPARADO')
      });
    } catch (error) {
      console.error("Error al cargar tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) cargarTicketsTaller();
  }, [token, cargarTicketsTaller]);

  // --- FUNCIÓN REAL CONECTADA AL BACKEND ---
  const handleCambiarEstado = async (id_ticket, nuevoEstado) => {
    try {
      if (nuevoEstado === 'EN_PROCESO') {
        await axios.patch(
          `http://localhost:8000/api/v1/tickets/${id_ticket}/iniciar`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      } else if (nuevoEstado === 'REPARADO') {
        await axios.patch(
          `http://localhost:8000/api/v1/tickets/${id_ticket}/reparar`,
          {
            id_tecnico: infoLocal.idUsuario,
            repuestos_usados: []
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }

      setModalAbierto(false);
      setTicketSeleccionado(null);
      cargarTicketsTaller();
    } catch (error) {
      alert(`⚠️ Error al actualizar: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (!token) return <div style={{ textAlign: 'center', padding: '50px' }}>Acceso Restringido. Inicie sesión.</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e67e22', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e67e22', margin: 0 }}>🛠️ Taller Técnico</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold' }}>Técnico: {infoLocal.usuario}</span><br/>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#17a2b8', padding: '3px 8px', borderRadius: '12px' }}>
            Base Operativa: {infoLocal.sede}
          </span>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Cargando área de trabajo...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={columnaStyle}>
            <h3 style={{ ...headerColumnaStyle, backgroundColor: '#dc3545' }}>🔴 Pendientes ({tickets.pendientes.length})</h3>
            {tickets.pendientes.map(t => <TarjetaTicket key={t.id_ticket} ticket={t} onClick={() => { setTicketSeleccionado(t); setModalAbierto(true); }} />)}
          </div>
          <div style={columnaStyle}>
            <h3 style={{ ...headerColumnaStyle, backgroundColor: '#ffc107', color: '#333' }}>🟡 En Proceso ({tickets.enProceso.length})</h3>
            {tickets.enProceso.map(t => <TarjetaTicket key={t.id_ticket} ticket={t} onClick={() => { setTicketSeleccionado(t); setModalAbierto(true); }} />)}
          </div>
          <div style={columnaStyle}>
            <h3 style={{ ...headerColumnaStyle, backgroundColor: '#28a745' }}>🟢 Reparados ({tickets.reparados.length})</h3>
            {tickets.reparados.map(t => <TarjetaTicket key={t.id_ticket} ticket={t} onClick={() => { setTicketSeleccionado(t); setModalAbierto(true); }} />)}
          </div>
        </div>
      )}

      {/* RENDERIZAMOS EL MODAL EXTERNO */}
      {modalAbierto && ticketSeleccionado && (
        <ModalGestionTicket 
          ticket={ticketSeleccionado} 
          onClose={() => setModalAbierto(false)} 
          onCambiarEstado={handleCambiarEstado} 
        />
      )}
    </div>
  );
}

function TarjetaTicket({ ticket, onClick }) {
  return (
    <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '6px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong style={{ color: '#0052cc' }}>{ticket.id_ticket}</strong>
      </div>
      <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{ticket.equipo}</p>
      <button onClick={onClick} style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '4px', background: '#f0f0f0', cursor: 'pointer', fontWeight: 'bold' }}>
        ⚙️ Gestionar Equipo
      </button>
    </div>
  );
}

const columnaStyle = { background: '#e9ecef', borderRadius: '8px', padding: '15px', minHeight: '60vh' };
const headerColumnaStyle = { margin: '-15px -15px 15px -15px', padding: '15px', color: 'white', borderRadius: '8px 8px 0 0', textAlign: 'center', fontSize: '16px' };

export default Taller;