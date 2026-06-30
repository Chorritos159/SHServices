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
      // Filtramos solo los que ya fueron procesados o entregados (para garantías)
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

  const procesarGarantia = (id_ticket) => {
    // Aquí a futuro abriremos un modal para registrar el re-ingreso a costo cero
    alert(`Iniciando proceso de garantía para el ticket: ${id_ticket}. (Función en construcción)`);
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
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Estado</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.length > 0 ? ticketsFiltrados.map(t => (
                <tr key={t.id_ticket} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{t.documento_cliente}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{t.nombre_cliente}</td>
                  <td style={{ padding: '12px', color: '#0052cc', fontWeight: 'bold' }}>{t.id_ticket}</td>
                  <td style={{ padding: '12px' }}>{t.equipo}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: t.estado === 'ENTREGADO' ? '#28a745' : '#17a2b8', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                      {t.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => procesarGarantia(t.id_ticket)} style={{ backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      🛡️ Aplicar Garantía
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron registros de clientes o garantías.</td>
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