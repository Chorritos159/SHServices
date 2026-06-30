import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Clientes({ token }) {
  const [busqueda, setBusqueda] = useState('');
  const [ticketsFiltrados, setTicketsFiltrados] = useState([]);
  const [todosLosTickets, setTodosLosTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) cargarHistorial();
  }, [token]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/v1/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historial = res.data.filter(t => t.estado === 'REPARADO' || t.estado === 'ENTREGADO');
      setTodosLosTickets(historial);
      setTicketsFiltrados(historial);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    const termino = e.target.value.toLowerCase();
    setBusqueda(termino);
    
    if (termino === '') {
      setTicketsFiltrados(todosLosTickets);
    } else {
      const filtrados = todosLosTickets.filter(t => 
        t.nombre_cliente.toLowerCase().includes(termino) || 
        t.documento_cliente.includes(termino) ||
        t.id_ticket.toLowerCase().includes(termino)
      );
      setTicketsFiltrados(filtrados);
    }
  };

  // --- LÓGICA DINÁMICA DE GARANTÍA (Cero impacto en el servidor) ---
  const evaluarGarantia = (fechaEntrega) => {
    if (!fechaEntrega) return { estado: 'SIN INICIAR', color: '#6c757d', icono: '⏳' };
    
    const fechaInicio = new Date(fechaEntrega);
    const fechaLimite = new Date(fechaInicio);
    fechaLimite.setDate(fechaLimite.getDate() + 90); // +3 meses
    
    const hoy = new Date();
    
    if (hoy <= fechaLimite) {
      return { estado: 'GARANTÍA VIGENTE', color: '#28a745', icono: '🛡️' };
    } else {
      return { estado: 'GARANTÍA EXPIRADA', color: '#dc3545', icono: '❌' };
    }
  };

  const procesarGarantia = (ticket) => {
    const infoGarantia = evaluarGarantia(ticket.fecha_entrega);
    if (infoGarantia.estado === 'GARANTÍA EXPIRADA') {
      alert("La garantía de 3 meses ha expirado para este equipo. Se debe generar una nueva Orden de Servicio con costo.");
    } else {
      alert(`Iniciando proceso de garantía válido para el ticket: ${ticket.id_ticket}`);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0052cc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#0052cc', margin: 0 }}>👥 Directorio de Clientes y Garantías</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar por DNI, Nombre o Código de Orden..." 
          value={busqueda}
          onChange={handleBuscar}
          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', fontSize: '15px' }}
        />
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {loading ? <p>Cargando base de datos de clientes...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>DNI/RUC</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Cliente</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Orden Original</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Equipo</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'center' }}>Cobertura</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.length > 0 ? ticketsFiltrados.map(t => {
                const garantia = evaluarGarantia(t.fecha_entrega);
                return (
                  <tr key={t.id_ticket} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{t.documento_cliente}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{t.nombre_cliente}</td>
                    <td style={{ padding: '12px', color: '#0052cc', fontWeight: 'bold' }}>{t.id_ticket}</td>
                    <td style={{ padding: '12px' }}>{t.equipo}</td>
                    
                    {/* COLUMNA DE COBERTURA DINÁMICA */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        backgroundColor: t.estado === 'ENTREGADO' ? garantia.color : '#6c757d', 
                        color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' 
                      }}>
                        {t.estado === 'ENTREGADO' ? `${garantia.icono} ${garantia.estado}` : '⏳ ESPERANDO ENTREGA'}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => procesarGarantia(t)} 
                        disabled={t.estado !== 'ENTREGADO'}
                        style={{ backgroundColor: t.estado === 'ENTREGADO' ? '#17a2b8' : '#e9ecef', color: t.estado === 'ENTREGADO' ? 'white' : '#a1a1a1', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: t.estado === 'ENTREGADO' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                      >
                        📄 Detalles de Orden
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Clientes;