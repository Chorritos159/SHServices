// Ubicación: src/components/ModalRecepcion.jsx
import React from 'react';

function ModalRecepcion({ ticket, isOpen, onClose, onEntregar }) {
  if (!isOpen || !ticket) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Detalles de Orden: <span style={{ color: '#0052cc' }}>{ticket.id_ticket}</span></h3>
          <button onClick={onClose} style={btnCerrarModalStyle}>✖</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '14px' }}>
          <div>
            <p><strong>Cliente:</strong> {ticket.nombre_cliente}</p>
            <p><strong>Teléfono:</strong> {ticket.telefono_cliente}</p>
            <p><strong>Equipo:</strong> {ticket.equipo}</p>
          </div>
          <div>
            <p><strong>Estado:</strong> {ticket.estado}</p>
            <p><strong>Adelanto:</strong> S/. {ticket.monto_total}</p>
            <p><strong>Saldo a Pagar:</strong> <span style={{ color: '#dc3545', fontWeight: 'bold' }}>S/. {(ticket.monto_total_final || 0).toFixed(2)}</span></p>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>📝 Notas del Técnico</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{ticket.notas_tecnico}</p>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
          {ticket.estado === 'REPARADO' ? (
            <button onClick={() => onEntregar(ticket.id_ticket)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              📦 Registrar Pago y Entregar
            </button>
          ) : (
            <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Estilos encapsulados
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '550px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const btnCerrarModalStyle = { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' };

export default ModalRecepcion;