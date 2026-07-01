import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ModalRecepcion from '../components/ModalRecepcion';
import ModalDetalleVenta from '../components/ModalDetalleVenta';
import FormularioVentaDirecta from '../components/FormularioVentaDirecta';
import TablaHistorialRecepcion from '../components/TablaHistorialRecepcion';

function Recepcion({ token }) {
  // Estados de catálogo y carrito para Ventas Directas
  const [productosAlmacen, setProductosAlmacen] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [carritoVenta, setCarritoVenta] = useState([]);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0);
  
  // Estados compartidos del formulario de registro
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('ORDEN_SERVICIO');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState(''); 
  
  // Estados específicos para Órdenes de Servicio (Taller)
  const [equipo, setEquipo] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [fallas, setFallas] = useState('');
  const [monto, setMonto] = useState('');
  
  // Control de concurrencia y carga de datos
  const [idempotencyKey, setIdempotencyKey] = useState(crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Operador', sede: 'Cargando...' });
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);

  // Control independiente de ventanas modales (Arquitectura desacoplada)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  // Decodificación del contexto del usuario autenticado
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setInfoLocal({ 
          usuario: payload.id_usuario, 
          sede: payload.sede_asignada || payload.sede_assigned || 'PIURA' 
        });
      } catch (error) { 
        console.error("Error al decodificar el token de seguridad."); 
      }
    }
  }, [token]);

  // Consultas asíncronas hacia el backend corporativo
  const cargarTickets = useCallback(async () => {
    try {
      setCargandoTickets(true);
      const res = await axios.get('http://localhost:8000/api/v1/tickets', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setTickets(res.data);
    } catch (error) { 
      console.error("Error al sincronizar el historial:", error); 
    } finally { 
      setCargandoTickets(false); 
    }
  }, [token]);

  const cargarCatalogo = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/almacen/productos', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      // Filtrado del catálogo según el dominio operativo del POS
      setProductosAlmacen(res.data.filter(p => p.categoria.includes('VENTA') || p.categoria === 'AMBOS'));    } catch (error) { 
      console.error("Error al indexar inventario:", error); 
    }
  }, [token]);

  useEffect(() => {
    if (token) { 
      cargarTickets(); 
      cargarCatalogo(); 
    }
  }, [token, cargarTickets, cargarCatalogo]);

  // Cálculos reactivos del carrito comercial
  const subtotalCarrito = carritoVenta.reduce((sum, p) => sum + (parseFloat(p.precio_unitario || 0) * (p.cantidad || 1)), 0);  const montoDescuento = subtotalCarrito * (porcentajeDescuento / 100);
  const totalConDescuento = subtotalCarrito - montoDescuento;

  // Lógica de despacho y envío asíncrono
  const handleCrearTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const detalleVenta = carritoVenta.map(p => p.nombre).join(", ");
      
      // Mapeo milimétrico de datos para cumplir las restricciones del esquema de validación Pydantic
      const detallesFormateados = carritoVenta.map(prod => ({
        sku_producto: prod.id_producto,
        cantidad: prod.cantidad || 1, // 👇 ¡Ahora envía la cantidad correcta!
        precio_unitario: parseFloat(prod.precio_unitario),
        nombre_producto: prod.nombre
      }));
      
      const payloadTicket = {
        tipo_documento: tipoDocumento,
        documento_cliente: documento, 
        nombre_cliente: nombre, 
        telefono_cliente: telefono || '0',
        equipo: tipoDocumento === 'NOTA_VENTA' ? `VENTA: ${detalleVenta}` : equipo,
        caracteristicas: tipoDocumento === 'ORDEN_SERVICIO' ? caracteristicas : 'N/A',
        fallas: tipoDocumento === 'ORDEN_SERVICIO' ? fallas : 'N/A',
        
        
        monto_total: tipoDocumento === 'NOTA_VENTA' ? 0.0 : (monto ? parseFloat(monto) : 0.0),
        
        sede: infoLocal.sede,
        detalles: tipoDocumento === 'NOTA_VENTA' ? detallesFormateados : []
      };

      
      console.log("🚀 ENVIANDO AL BACKEND:", payloadTicket);

      await axios.post('http://localhost:8000/api/v1/tickets', payloadTicket, { 
        headers: { 'Authorization': `Bearer ${token}`, 'Idempotency-Key': idempotencyKey } 
      });
      
      // Limpieza atómica de los estados al procesar con éxito
      setDocumento(''); setNombre(''); setTelefono(''); setEquipo(''); setCaracteristicas(''); setFallas(''); setMonto('');
      setCarritoVenta([]); setPorcentajeDescuento(0); setProductoSeleccionado('');
      setIdempotencyKey(crypto.randomUUID()); // Rotación obligatoria de la llave de idempotencia
      cargarTickets();
      
    } catch (error) {
      let errorMsg = error.response?.data?.detail || error.message;
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg, null, 2); 
      }
      alert(`⚠️ Petición rechazada por el servidor:\n${errorMsg}`);
    } finally { 
      setLoading(false); 
    }
  };

  // Gestión del Carrito Temporal
  const agregarAlCarrito = () => {
    const prod = productosAlmacen.find(p => p.id_producto === productoSeleccionado);
    
    if (prod) {
      const index = carritoVenta.findIndex(item => item.id_producto === prod.id_producto);
      
      if (index !== -1) {
        // Si ya existe, le sumamos 1 a su cantidad
        const nuevoCarrito = [...carritoVenta];
        nuevoCarrito[index].cantidad = (nuevoCarrito[index].cantidad || 1) + 1;
        setCarritoVenta(nuevoCarrito);
      } else {
        // Si es nuevo, entra con cantidad 1
        setCarritoVenta([...carritoVenta, { ...prod, cantidad: 1 }]);
      }
      setProductoSeleccionado(''); // Limpiamos el buscador
    }
  };

  const quitarDelCarrito = (index) => {
    const nuevos = [...carritoVenta]; 
    nuevos.splice(index, 1); 
    setCarritoVenta(nuevos);
  };

  // Enrutador inteligente de modales según el tipo de operación
  const abrirModalInteligente = (ticket) => {
    setTicketSeleccionado(ticket);
    if (ticket.id_ticket.startsWith('VEN') || ticket.tipo_documento === 'NOTA_VENTA') {
      setModalVentaAbierto(true);
    } else {
      setModalAbierto(true);
    }
  };

  if (!token) return null;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      {/* Barra de Contexto de Operación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0052cc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#0052cc', margin: 0 }}>🏢 Panel de Recepción</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold' }}>Operador: {infoLocal.usuario}</span><br/>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#28a745', padding: '3px 8px', borderRadius: '12px' }}>Sede Activa: {infoLocal.sede}</span>
        </div>
      </div>

      {/* Panel Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        
        {/* Formulario Unificado de Entrada */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: 0 }}>📄 Nuevo Registro</h3>
          <form onSubmit={handleCrearTicket}>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Tipo de Operación</label>
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontWeight: 'bold', color: tipoDocumento === 'ORDEN_SERVICIO' ? '#0052cc' : '#28a745' }}>
                <option value="ORDEN_SERVICIO">🛠️ Orden de Servicio (Reparación)</option>
                <option value="NOTA_VENTA">🛒 Nota de Venta (Directa)</option>
              </select>
            </div>

            {/* Identificación del Cliente (Estructura de Tres Columnas) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div><label style={labelStyle}>DNI / RUC</label><input type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Cliente</label><input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Teléfono</label><input type="text" required value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} placeholder="Celular" /></div>
            </div>
            
            {/* Carga Dinámica de Interfaz según el Tipo de Operación */}
            {tipoDocumento === 'ORDEN_SERVICIO' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <div><label style={labelStyle}>Equipo</label><input type="text" value={equipo} onChange={(e) => setEquipo(e.target.value)} style={inputStyle} required /></div>
                <div><label style={labelStyle}>Fallas Reportadas</label><input type="text" value={fallas} onChange={(e) => setFallas(e.target.value)} style={inputStyle} required /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Características Visuales / Componentes</label><input type="text" value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} style={inputStyle} /></div>
              </div>
            ) : (
              <FormularioVentaDirecta 
                productosAlmacen={productosAlmacen} productoSeleccionado={productoSeleccionado} setProductoSeleccionado={setProductoSeleccionado}
                agregarAlCarrito={agregarAlCarrito} carritoVenta={carritoVenta} quitarDelCarrito={quitarDelCarrito}
                porcentajeDescuento={porcentajeDescuento} setPorcentajeDescuento={setPorcentajeDescuento}
                subtotalCarrito={subtotalCarrito} montoDescuento={montoDescuento} totalConDescuento={totalConDescuento}
              />
            )}
            
            {tipoDocumento === 'ORDEN_SERVICIO' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>💰 Adelanto de Revisión (S/.)</label>
                <input type="number" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            )}
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', marginTop: '10px' }}>
              {loading ? 'Generando Registro...' : 'Generar Documento'}
            </button>
          </form>
        </div>

        {/* Tabla Modular de Historial de Operaciones */}
        <TablaHistorialRecepcion 
          tickets={tickets} 
          cargandoTickets={cargandoTickets} 
          abrirModal={abrirModalInteligente} 
        />
      </div>

      {/* Capa de Modales Desacoplados de Negocio */}
      <ModalRecepcion 
        isOpen={modalAbierto} 
        ticket={ticketSeleccionado} 
        onClose={() => setModalAbierto(false)} 
        onEntregar={async (id) => { 
          await axios.patch(`http://localhost:8000/api/v1/tickets/${id}/entregar`, {}, { headers: { 'Authorization': `Bearer ${token}` } }); 
          setModalAbierto(false); 
          cargarTickets(); 
        }} 
      />

      <ModalDetalleVenta 
        isOpen={modalVentaAbierto} 
        ticket={ticketSeleccionado} 
        onClose={() => setModalVentaAbierto(false)} 
      />
    </div>
  );
}

// Estilos encapsulados con herencia de caja limpia
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' };

export default Recepcion;