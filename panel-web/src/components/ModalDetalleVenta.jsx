import React from 'react';

function ModalDetalleVenta({ isOpen, ticket, onClose }) {
  if (!isOpen || !ticket) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #28a745', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#28a745' }}>🛒 Comprobante de Venta: {ticket.id_ticket}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✖</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Cliente:</strong> {ticket.nombre_cliente}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Teléfono:</strong> {ticket.telefono_cliente}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Estado:</strong> <span style={{ background: '#d4edda', padding: '3px 8px', borderRadius: '12px', color: '#155724', fontWeight: 'bold' }}>PAGADO</span></p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Sede:</strong> {ticket.sede}</p>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Detalle de los Productos</h4>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
            {ticket.equipo.replace('VENTA: ', '')}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #eee', paddingTop: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#28a745' }}>TOTAL PAGADO: S/. {parseFloat(ticket.monto_total).toFixed(2)}</h2>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '500px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };

export default ModalDetalleVenta;