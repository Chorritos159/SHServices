// Ubicación: src/components/ModalGestionTicket.jsx
import React from 'react';

function ModalGestionTicket({ ticket, onClose, onCambiarEstado }) {
  if (!ticket) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        
        {/* CABECERA DEL MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Gestión de Equipo: <span style={{ color: '#0052cc' }}>{ticket.id_ticket}</span></h3>
          <button onClick={onClose} style={btnCerrarModalStyle}>✖</button>
        </div>
        
        {/* DETALLES DEL TICKET */}
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>
          <p><strong>Cliente:</strong> {ticket.nombre_cliente}</p>
          <p><strong>Equipo:</strong> {ticket.equipo}</p>
          <p><strong>Falla Reportada:</strong> {ticket.fallas}</p>
          <p><strong>Características:</strong> {ticket.caracteristicas || 'N/A'}</p>
          <p>
            <strong>Estado Actual:</strong> 
            <span style={{ marginLeft: '10px', padding: '3px 8px', borderRadius: '12px', backgroundColor: ticket.estado === 'PENDIENTE' ? '#ffc107' : '#17a2b8', color: '#fff', fontWeight: 'bold' }}>
              {ticket.estado}
            </span>
          </p>
        </div>

        {/* ZONA DE REPUESTOS (Solo visible si está En Proceso) */}
        {ticket.estado === 'EN_PROCESO' && (
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px dashed #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>📦 Repuestos Utilizados</h4>
            <p style={{ fontSize: '13px', color: '#777', margin: 0 }}>
              (Aquí integraremos el buscador de inventario en el siguiente paso para descontar stock).
            </p>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {ticket.estado === 'PENDIENTE' && (
            <button onClick={() => onCambiarEstado(ticket.id_ticket, 'EN_PROCESO')} style={{ ...btnAccionStyle, backgroundColor: '#0052cc' }}>
              ▶️ Iniciar Reparación
            </button>
          )}
          
          {ticket.estado === 'EN_PROCESO' && (
            <button onClick={() => onCambiarEstado(ticket.id_ticket, 'REPARADO')} style={{ ...btnAccionStyle, backgroundColor: '#28a745' }}>
              ✅ Finalizar Reparación
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// Estilos encapsulados
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const btnCerrarModalStyle = { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' };
const btnAccionStyle = { padding: '10px 20px', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default ModalGestionTicket;