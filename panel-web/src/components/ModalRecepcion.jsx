import React from 'react';

function ModalRecepcion({ isOpen, ticket, onClose, onEntregar }) {
  if (!isOpen || !ticket) return null;

  const esReparado = ticket.estado === 'REPARADO';
  const esEntregado = ticket.estado === 'ENTREGADO';
  const saldoPendiente = parseFloat(ticket.monto_total_final || ticket.monto_total) - parseFloat(ticket.monto_total);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Cabecera del Documento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #0052cc', paddingBottom: '10px', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#0052cc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛠️ Orden de Servicio: {ticket.id_ticket}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#555' }}>✖</button>
        </div>

        {/* Sección 1: Datos del Cliente y Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
          <div>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}><strong>Cliente:</strong> <span style={{ color: '#000' }}>{ticket.nombre_cliente}</span></p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}><strong>Teléfono:</strong> <span style={{ color: '#000' }}>{ticket.telefono_cliente}</span></p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}><strong>Sede Operativa:</strong> <span style={{ color: '#000' }}>{ticket.sede}</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>Estado Actual:</strong> <span style={{ background: esReparado ? '#d4edda' : esEntregado ? '#e2e3e5' : '#fff3cd', color: esReparado ? '#155724' : '#333', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{ticket.estado}</span>
            </p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}><strong>Fecha Ingreso:</strong> <span style={{ color: '#000' }}>{new Date(ticket.fecha_creacion).toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Sección 2: Detalles Técnicos del Equipo */}
        <div style={{ border: '1px solid #e9ecef', borderRadius: '6px', overflow: 'hidden', marginBottom: '15px' }}>
          <div style={{ backgroundColor: '#e9ecef', padding: '10px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
            💻 Información del Equipo
          </div>
          <div style={{ padding: '15px', display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '14px' }}><strong>Equipo Registrado:</strong> {ticket.equipo}</p>
            <p style={{ margin: 0, fontSize: '14px' }}><strong>Fallas Reportadas:</strong> <span style={{ color: '#dc3545' }}>{ticket.fallas}</span></p>
            <p style={{ margin: 0, fontSize: '14px' }}><strong>Características / Partes:</strong> {ticket.caracteristicas}</p>
          </div>
        </div>

        {/* Sección 3: Dictamen del Taller (Solo visible si pasó por el técnico) */}
        {(esReparado || esEntregado) && ticket.notas_tecnico && (
          <div style={{ backgroundColor: '#e6f2ff', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #0052cc', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#0052cc' }}>👨‍🔧 Dictamen del Técnico</h4>
            <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic' }}>"{ticket.notas_tecnico}"</p>
          </div>
        )}

        {/* Sección 4: Finanzas y Cobranza */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #eee', paddingTop: '15px' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
              <span>Adelanto Dejado:</span>
              <strong>S/. {parseFloat(ticket.monto_total).toFixed(2)}</strong>
            </div>
            {(esReparado || esEntregado) && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                  <span>Costo Total Reparación:</span>
                  <strong>S/. {parseFloat(ticket.monto_total_final).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '16px', color: saldoPendiente > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                  <span>{esEntregado ? 'SALDO PAGADO:' : 'SALDO A COBRAR:'}</span>
                  <span>S/. {Math.max(0, saldoPendiente).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar
          </button>
          
          {esReparado && (
            <button 
              onClick={() => onEntregar(ticket.id_ticket)} 
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              💰 Cobrar y Entregar Equipo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '600px', maxWidth: '95%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };

export default ModalRecepcion;