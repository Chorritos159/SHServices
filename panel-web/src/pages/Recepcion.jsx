import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function Recepcion({ token }) {
  // --- 1. ESTADOS DEL FORMULARIO ---
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [equipo, setEquipo] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [fallas, setFallas] = useState('');
  const [monto, setMonto] = useState('');
  
  // --- 2. ESTADOS DE INTERFAZ Y DATOS ---
  const [loading, setLoading] = useState(false);
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Operador', sede: 'Cargando...' });
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);

  // --- 3. LECTURA DEL TOKEN JWT ---
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

  // --- 4. CARGAR TICKETS DESDE POSTGRESQL ---
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

  // --- 5. CREAR NUEVO TICKET ---
  const handleCrearTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/tickets',
        {
          tipo_documento: "ORDEN_SERVICIO",
          documento_cliente: documento,
          nombre_cliente: nombre,
          equipo: equipo,
          caracteristicas: caracteristicas,
          fallas: fallas,
          monto_total: monto ? parseFloat(monto) : 0.0,
          sede: infoLocal.sede
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Limpiamos el formulario tras el éxito
      setDocumento(''); setNombre(''); setEquipo(''); 
      setCaracteristicas(''); setFallas(''); setMonto('');
      
      // ¡Magia! Recargamos la tabla para mostrar el nuevo ticket
      cargarTickets();
      
    } catch (error) {
      alert(`⚠️ Error al generar el ticket: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
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
              <div>
                <label style={labelStyle}>DNI / RUC</label>
                <input type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} placeholder="Ej: 72000000" />
              </div>
              <div>
                <label style={labelStyle}>Nombre del Cliente</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Equipo Ingresado</label>
              <input type="text" required value={equipo} onChange={(e) => setEquipo(e.target.value)} style={inputStyle} placeholder="Ej: Laptop Lenovo ThinkPad L15" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Características (Cargador, golpes...)</label>
              <textarea required value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} style={{...inputStyle, height: '50px'}} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Falla Reportada</label>
              <textarea required value={fallas} onChange={(e) => setFallas(e.target.value)} style={{...inputStyle, height: '50px'}} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Monto Adelanto (S/.) - Opcional</label>
              <input type="number" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} style={{...inputStyle, width: '50%'}} placeholder="0.00" />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Generando Orden...' : 'Generar Ticket de Servicio'}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: GRILLA DINÁMICA */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📋 Tickets en Sede: {infoLocal.sede}</h3>
          
          {cargandoTickets ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>⏳ Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>No hay tickets registrados hoy en esta sede.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
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
                    <tr key={t.id_ticket}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0052cc' }}>{t.id_ticket}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.nombre_cliente}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.equipo}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <span style={{ 
                          background: t.estado === 'PENDIENTE' ? '#fff3cd' : '#e8f5e9', 
                          color: t.estado === 'PENDIENTE' ? '#856404' : '#2e7d32', 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
                        }}>
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
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '95%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', fontFamily: 'inherit' };

export default Recepcion;