import React from 'react';

function FormularioVentaDirecta({ 
  productosAlmacen, 
  productoSeleccionado, setProductoSeleccionado, 
  agregarAlCarrito, carritoVenta, quitarDelCarrito, 
  porcentajeDescuento, setPorcentajeDescuento, 
  subtotalCarrito, montoDescuento, totalConDescuento 
}) {
  return (
    <div style={{ marginBottom: '15px', backgroundColor: '#e9ecef', padding: '15px', borderRadius: '6px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>🛒 Punto de Venta (POS)</label>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {/* Barra de Búsqueda Inteligente */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            list="catalogo-productos"
            placeholder="🔍 Escribe para buscar un producto..."
            value={productoSeleccionado}
            onChange={(e) => setProductoSeleccionado(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '4px', border: '1px solid #0052cc', outline: 'none', fontWeight: 'bold' }}
          />
          <datalist id="catalogo-productos">
            {productosAlmacen.map(p => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre} — S/. {p.precio_unitario} (Stock: {p.stock})
              </option>
            ))}
          </datalist>
        </div>
        
        <button type="button" onClick={agregarAlCarrito} style={{ padding: '10px 20px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
          + Agregar
        </button>
      </div>

      {carritoVenta.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', fontSize: '13px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
          {carritoVenta.map((p, index) => (
            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #ccc' }}>
              <span>{p.nombre}</span>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>S/. {p.precio_unitario}</span>
                <button type="button" onClick={() => quitarDelCarrito(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #ccc', paddingTop: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Descuento Autorizado (%): </label>
          <input 
            type="number" min="0" max="100" 
            value={porcentajeDescuento}
            onChange={(e) => setPorcentajeDescuento(e.target.value)}
            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#777' }}>Subtotal: S/. {subtotalCarrito.toFixed(2)}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>TOTAL: S/. {totalConDescuento.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default FormularioVentaDirecta;