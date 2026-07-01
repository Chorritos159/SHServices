import React from 'react';

function TablaHistorialRecepcion({ tickets, cargandoTickets, abrirModal }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>📋 Historial de Tickets</h3>
      {cargandoTickets ? <p>⏳ Cargando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Código</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Cliente</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Equipo / Venta</th>
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
  );
}

export default TablaHistorialRecepcion;