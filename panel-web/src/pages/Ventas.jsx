import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FormularioVentaDirecta from '../components/FormularioVentaDirecta';

function Ventas({ token }) {
  const [productosAlmacen, setProductosAlmacen] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [carritoVenta, setCarritoVenta] = useState([]);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0);
  
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(crypto.randomUUID());
  const [infoLocal, setInfoLocal] = useState({ usuario: 'Vendedor', sede: 'Cargando...' });

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setInfoLocal({ usuario: payload.id_usuario, sede: payload.sede_asignada || payload.sede_assigned || 'PIURA' });
      } catch (error) { console.error("Error en token"); }
    }
  }, [token]);

  const cargarCatalogo = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/almacen/productos', { headers: { 'Authorization': `Bearer ${token}` } });
      setProductosAlmacen(res.data.filter(p => p.categoria === 'VENTA' || p.categoria === 'AMBOS'));
    } catch (error) { console.error("Error", error); }
  }, [token]);

  useEffect(() => {
    if (token) cargarCatalogo();
  }, [token, cargarCatalogo]);

  const subtotalCarrito = carritoVenta.reduce((sum, p) => sum + parseFloat(p.precio_unitario || 0), 0);
  const montoDescuento = subtotalCarrito * (porcentajeDescuento / 100);
  const totalConDescuento = subtotalCarrito - montoDescuento;

  const handleCrearVenta = async (e) => {
    e.preventDefault();
    if (carritoVenta.length === 0) return alert("El carrito está vacío");

    try {
      const detalleVenta = carritoVenta.map(p => p.nombre).join(", ");
      const payloadVenta = {
        tipo_documento: 'NOTA_VENTA', 
        documento_cliente: documento || '00000000', // Cliente genérico si no pone DNI
        nombre_cliente: nombre || 'Cliente Mostrador', 
        telefono_cliente: '',
        equipo: `VENTA DIRECTA: ${detalleVenta}`,
        caracteristicas: '', fallas: '',
        monto_total: totalConDescuento,
        sede: infoLocal.sede
      };

      await axios.post('http://localhost:8000/api/v1/tickets', payloadVenta, { 
        headers: { 'Authorization': `Bearer ${token}`, 'Idempotency-Key': idempotencyKey } 
      });
      
      alert("✅ Venta registrada con éxito");
      setDocumento(''); setNombre(''); setCarritoVenta([]); setPorcentajeDescuento(0);
      setIdempotencyKey(crypto.randomUUID());
      // Aquí también deberías llamar a RabbitMQ o un endpoint para descontar la venta directa
    } catch (error) {
      alert(`⚠️ Error: ${error.message}`);
    }
  };

  const agregarAlCarrito = () => {
    const prod = productosAlmacen.find(p => p.id_producto === productoSeleccionado);
    if (prod) { setCarritoVenta([...carritoVenta, prod]); setProductoSeleccionado(''); }
  };

  if (!token) return null;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #28a745', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#28a745', margin: 0 }}>🛒 Punto de Venta (POS)</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 'bold' }}>Cajero: {infoLocal.usuario}</span><br/>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#28a745', padding: '3px 8px', borderRadius: '12px' }}>{infoLocal.sede}</span>
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleCrearVenta}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '15px' }}>
            <div><label style={labelStyle}>DNI (Opcional)</label><input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nombre del Cliente</label><input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} /></div>
          </div>
          
          <FormularioVentaDirecta 
            productosAlmacen={productosAlmacen} productoSeleccionado={productoSeleccionado} setProductoSeleccionado={setProductoSeleccionado}
            agregarAlCarrito={agregarAlCarrito} carritoVenta={carritoVenta} quitarDelCarrito={(i) => { const n = [...carritoVenta]; n.splice(i, 1); setCarritoVenta(n); }}
            porcentajeDescuento={porcentajeDescuento} setPorcentajeDescuento={setPorcentajeDescuento}
            subtotalCarrito={subtotalCarrito} montoDescuento={montoDescuento} totalConDescuento={totalConDescuento}
          />
          
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Facturar y Cobrar
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' };
export default Ventas;