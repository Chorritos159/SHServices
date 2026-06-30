import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ModalRecepcion from '../components/ModalRecepcion'; // <-- Importación limpia y modular

function Recepcion({ token }) {
  // Estados del formulario
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState(''); 
  const [equipo, setEquipo] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [fallas, setFallas] = useState('');
  const [monto, setMonto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Operador', sede: 'Cargando...' });
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);

  // Estados del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setInfoLocal({ usuario: payload.id_usuario, sede: payload.sede_asignada || payload.sede_assigned || 'PIURA' });
      } catch (error) {
        console.error("Error al decodificar el token.");
      }
    }
  }, [token]);

  const cargarTickets = useCallback(async () => {
    try {
      setCargandoTickets(true);
      const res = await axios.get('http://localhost:8000/api/v1/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (error) {
      console.error("Error al cargar tickets:", error);
    } finally {
      setCargandoTickets(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) cargarTickets();
  }, [token, cargarTickets]);

  const handleCrearTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/v1/tickets', {
        tipo_documento: "ORDEN_SERVICIO", documento_cliente: documento, nombre_cliente: nombre,
        telefono_cliente: telefono, 
        equipo: equipo, caracteristicas: caracteristicas, fallas: fallas,
        monto_total: monto ? parseFloat(monto) : 0.0, sede: infoLocal.sede
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      setDocumento(''); setNombre(''); setTelefono(''); setEquipo(''); 
      setCaracteristicas(''); setFallas(''); setMonto('');
      cargarTickets();
    } catch (error) {
      alert(`⚠️ Error al generar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (ticket) => {
    setTicketSeleccionado(ticket);
    setModalAbierto(true);
  };

  const handleEntregarTicket = async (id_ticket) => {
    if (!window.confirm(`¿Confirmas el pago y la entrega del equipo ${id_ticket}?`)) return;
    try {
      await axios.patch(`http://localhost:8000/api/v1/tickets/${id_ticket}/entregar`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setModalAbierto(false);
      cargarTickets();
    } catch (error) {
      alert(`⚠️ Error al entregar: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (!token) return null;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0052cc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#0052cc', margin: 0 }}>🏢 Panel de Recepción</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold' }}>Operador: {infoLocal.usuario}</span><br/>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#28a745', padding: '3px 8px', borderRadius: '12px' }}>Sede Activa: {infoLocal.sede}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* FORMULARIO */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📝 Nueva Orden de Servicio</h3>
          <form onSubmit={handleCrearTicket}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '15px' }}>
              <div><label style={labelStyle}>DNI / RUC</label><input type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Cliente</label><input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} /></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div><label style={labelStyle}>Teléfono</label><input type="text" required value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} placeholder="Celular" /></div>
              <div><label style={labelStyle}>Adelanto (S/.)</label><input type="number" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} style={inputStyle} placeholder="Opcional" /></div>
            </div>

            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Equipo</label><input type="text" required value={equipo} onChange={(e) => setEquipo(e.target.value)} style={inputStyle} /></div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Características</label><textarea required value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} style={{...inputStyle, height: '40px'}} /></div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Falla Reportada</label><textarea required value={fallas} onChange={(e) => setFallas(e.target.value)} style={{...inputStyle, height: '40px'}} /></div>
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Generando...' : 'Generar Ticket'}
            </button>
          </form>
        </div>

        {/* TABLA DINÁMICA */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📋 Historial de Tickets</h3>
          {cargandoTickets ? <p>⏳ Cargando...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Código</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Cliente</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Equipo</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id_ticket} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => abrirModal(t)} onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0052cc' }}>{t.id_ticket}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.nombre_cliente}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.equipo}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <span style={{ background: t.estado === 'PENDIENTE' ? '#fff3cd' : t.estado === 'EN_PROCESO' ? '#cce5ff' : t.estado === 'REPARADO' ? '#d4edda' : '#e2e3e5', color: '#333', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px' }}>
                          {t.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZAMOS EL MODAL EXTERNO AQUÍ */}
      <ModalRecepcion 
        isOpen={modalAbierto} 
        ticket={ticketSeleccionado} 
        onClose={() => setModalAbierto(false)} 
        onEntregar={handleEntregarTicket} 
      />

    </div>
  );
}

// Estilos globales de los inputs que aún usamos en este archivo
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '95%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' };

export default Recepcion;