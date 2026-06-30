import React from 'react';

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

export default TarjetaTicket;