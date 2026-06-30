import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ModalGestionTicket({ ticket, token, onClose, onCambiarEstado }) {
  const [repuestosDisponibles, setRepuestosDisponibles] = useState([]);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState('');
  const [repuestosUsados, setRepuestosUsados] = useState([]);
  const [notas, setNotas] = useState('');
  const [precioFinal, setPrecioFinal] = useState('');

  // Cargar inventario cuando el modal se abre y el ticket está "En Proceso"
  useEffect(() => {
    if (ticket && ticket.estado === 'EN_PROCESO' && token) {
      cargarRepuestos();
    }
  }, [ticket, token]);

  const cargarRepuestos = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/almacen/productos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Filtramos para que el técnico no vea productos exclusivos de venta pública
      const soloRepuestos = res.data.filter(p => p.categoria === 'REPUESTO' || p.categoria === 'AMBOS');
      setRepuestosDisponibles(soloRepuestos);
    } catch (error) {
      console.error("Error al cargar repuestos del almacén:", error);
    }
  };

  const agregarRepuesto = () => {
    if (!repuestoSeleccionado) return;
    const repuesto = repuestosDisponibles.find(r => r.id_producto === repuestoSeleccionado);
    if (repuesto) {
      setRepuestosUsados([...repuestosUsados, repuesto]);
      setRepuestoSeleccionado(''); // Limpiar el selector
    }
  };

  const quitarRepuesto = (index) => {
    const nuevos = [...repuestosUsados];
    nuevos.splice(index, 1);
    setRepuestosUsados(nuevos);
  };

  if (!ticket) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        
        {/* CABECERA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Gestión de Equipo: <span style={{ color: '#0052cc' }}>{ticket.id_ticket}</span></h3>
          <button onClick={onClose} style={btnCerrarModalStyle}>✖</button>
        </div>
        
        {/* DETALLES DEL TICKET */}
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#555' }}>
          <p><strong>Cliente:</strong> {ticket.nombre_cliente}</p>
          <p><strong>Equipo:</strong> {ticket.equipo}</p>
          <p><strong>Falla Reportada:</strong> {ticket.fallas}</p>
          <p>
            <strong>Estado Actual:</strong> 
            <span style={{ marginLeft: '10px', padding: '3px 8px', borderRadius: '12px', backgroundColor: ticket.estado === 'PENDIENTE' ? '#ffc107' : '#17a2b8', color: '#fff', fontWeight: 'bold' }}>
              {ticket.estado}
            </span>
          </p>
        </div>

        {/* ZONA DE REPUESTOS (Solo visible si está En Proceso) */}
        {ticket.estado === 'EN_PROCESO' && (
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>📦 Añadir Repuestos</h4>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select 
                value={repuestoSeleccionado} 
                onChange={(e) => setRepuestoSeleccionado(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">-- Seleccionar repuesto --</option>
                {repuestosDisponibles.map(r => (
                  <option key={r.id_producto} value={r.id_producto} disabled={r.stock < 1}>
                    {r.nombre} (Stock: {r.stock}) - S/. {r.precio_unitario}
                  </option>
                ))}
              </select>
              <button onClick={agregarRepuesto} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Añadir
              </button>
            </div>

            {/* Lista de repuestos a utilizar */}
            {repuestosUsados.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                {repuestosUsados.map((r, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #ccc' }}>
                    <span>{r.nombre}</span>
                    <div>
                      <span style={{ fontWeight: 'bold', marginRight: '10px' }}>S/. {r.precio_unitario}</span>
                      <button onClick={() => quitarRepuesto(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>📝 Notas de la Reparación</label>
                  <textarea 
                    placeholder="Ej: Se instaló la nueva pantalla y se aplicó pasta térmica..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    style={{ width: '95%', height: '50px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>💰 Precio Total a Cobrar (Repuestos + Mano de Obra)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="S/. 0.00"
                    value={precioFinal}
                    onChange={(e) => setPrecioFinal(e.target.value)}
                    style={{ width: '50%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
              </div>
            </div>
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
            <button 
              onClick={() => onCambiarEstado(ticket.id_ticket, 'REPARADO', repuestosUsados, notas, parseFloat(precioFinal))} 
              style={{ ...btnAccionStyle, backgroundColor: '#28a745' }}
              disabled={!notas || !precioFinal}
            >
              ✅ Finalizar Reparación
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const btnCerrarModalStyle = { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' };
const btnAccionStyle = { padding: '10px 20px', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default ModalGestionTicket;