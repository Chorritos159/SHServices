import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function Recepcion({ token }) {
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [equipo, setEquipo] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [fallas, setFallas] = useState('');
  const [monto, setMonto] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Operador', sede: 'Cargando...' });
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        setInfoLocal({
          usuario: payload.id_usuario,
          sede: payload.sede_asignada || payload.sede_assigned || 'PIURA'
        });
      } catch (error) {
        console.error("Error al decodificar el token.");
      }
    }
  }, [token]);

  const cargarTickets = useCallback(async () => {
    try {
      setCargandoTickets(true);
      const response = await axios.get('http://localhost:8000/api/v1/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTickets(response.data);
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
        equipo: equipo, caracteristicas: caracteristicas, fallas: fallas,
        monto_total: monto ? parseFloat(monto) : 0.0, sede: infoLocal.sede
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      setDocumento(''); setNombre(''); setEquipo(''); 
      setCaracteristicas(''); setFallas(''); setMonto('');
      cargarTickets();
    } catch (error) {
      alert(`⚠️ Error al generar el ticket: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN: ENTREGAR EQUIPO AL CLIENTE ---
  const handleEntregarTicket = async (id_ticket) => {
    if (!window.confirm(`¿El cliente ha venido a recoger el equipo ${id_ticket}?`)) return;
    try {
      await axios.patch(`http://localhost:8000/api/v1/tickets/${id_ticket}/entregar`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarTickets(); // Recargamos la tabla para ver el cambio
    } catch (error) {
      alert(`⚠️ Error al entregar el equipo: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (!token) return <div style={{ padding: '20px', textAlign: 'center' }}>Acceso Denegado. Inicie sesión.</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0052cc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#0052cc', margin: 0 }}>🏢 Panel de Recepción</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold', color: '#333' }}>Operador: {infoLocal.usuario}</span><br/>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#28a745', padding: '3px 8px', borderRadius: '12px' }}>
            Sede Activa: {infoLocal.sede}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📝 Nueva Orden de Servicio</h3>
          <form onSubmit={handleCrearTicket}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '15px' }}>
              <div><label style={labelStyle}>DNI / RUC</label><input type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Cliente</label><input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Equipo</label><input type="text" required value={equipo} onChange={(e) => setEquipo(e.target.value)} style={inputStyle} /></div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Características</label><textarea required value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} style={{...inputStyle, height: '40px'}} /></div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Falla Reportada</label><textarea required value={fallas} onChange={(e) => setFallas(e.target.value)} style={{...inputStyle, height: '40px'}} /></div>
            <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Adelanto (S/.)</label><input type="number" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} style={{...inputStyle, width: '50%'}} /></div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Generando...' : 'Generar Ticket'}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: GRILLA DINÁMICA CON BOTÓN DE ENTREGA */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📋 Historial de Tickets</h3>
          {cargandoTickets ? <p style={{ textAlign: 'center', marginTop: '50px' }}>⏳ Cargando...</p> : (
            <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Código</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Cliente</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Equipo</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Estado / Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id_ticket}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0052cc' }}>{t.id_ticket}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.nombre_cliente}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.equipo}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {t.estado === 'REPARADO' ? (
                          <button onClick={() => handleEntregarTicket(t.id_ticket)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            📦 Entregar Equipo
                          </button>
                        ) : (
                          <span style={{ 
                            background: t.estado === 'PENDIENTE' ? '#fff3cd' : t.estado === 'EN_PROCESO' ? '#cce5ff' : '#e2e3e5', 
                            color: t.estado === 'PENDIENTE' ? '#856404' : t.estado === 'EN_PROCESO' ? '#004085' : '#383d41', 
                            padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' 
                          }}>
                            {t.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '95%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' };

export default Recepcion;