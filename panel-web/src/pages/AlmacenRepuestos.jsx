import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function AlmacenRepuestos({ token }) {
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('REPUESTO');
  const [stock, setStock] = useState('');
  const [precio, setPrecio] = useState('');

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [infoLocal, setInfoLocal] = useState({ usuario: '', sede: '' });

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setInfoLocal({ usuario: payload.id_usuario, sede: payload.sede_asignada || payload.sede_assigned || 'PIURA' });
      } catch (e) {
        console.error("Error decodificando token.");
      }
    }
  }, [token]);

  const cargarInventario = useCallback(async () => {
    setCargandoLista(true);
    try {
      const res = await axios.get('http://localhost:8000/api/v1/almacen/productos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setCargandoLista(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) cargarInventario();
  }, [token, cargarInventario]);

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/v1/almacen/productos', {
        nombre,
        descripcion,
        categoria,
        stock: parseInt(stock),
        precio_unitario: parseFloat(precio)
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      
      setNombre(''); setDescripcion(''); setStock(''); setPrecio('');
      cargarInventario();
    } catch (error) {
      alert(`⚠️ Error al registrar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '90vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #17a2b8', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#17a2b8', margin: 0 }}>⚙️ Gestión de Almacén y Repuestos</h2>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '14px', color: '#fff', backgroundColor: '#17a2b8', padding: '3px 8px', borderRadius: '12px' }}>
            Sede: {infoLocal.sede}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        
        {/* FORMULARIO */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📦 Registrar Nuevo Ítem</h3>
          <form onSubmit={handleCrearProducto}>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Nombre del Producto/Repuesto</label><input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} placeholder="Ej: Pantalla Lenovo 15.6" /></div>
            <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Descripción</label><input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={inputStyle} placeholder="Detalles técnicos..." /></div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                <option value="REPUESTO">Solo para Taller (Repuesto)</option>
                <option value="VENTA_PUBLICA">Solo para Venta Pública</option>
                <option value="AMBOS">Uso Mixto</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div><label style={labelStyle}>Stock Inicial</label><input type="number" required min="0" value={stock} onChange={e => setStock(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Precio (S/.)</label><input type="number" step="0.1" required min="0" value={precio} onChange={e => setPrecio(e.target.value)} style={inputStyle} /></div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar en Inventario'}
            </button>
          </form>
        </div>

        {/* TABLA DE INVENTARIO */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📊 Inventario Actual</h3>
          {cargandoLista ? <p>Cargando inventario...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Código</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Nombre</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Categoría</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Stock</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id_producto}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{p.id_producto}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{p.nombre}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{p.categoria}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: p.stock < 5 ? '#dc3545' : '#28a745' }}>{p.stock} und.</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>S/. {p.precio_unitario.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' };
const inputStyle = { width: '95%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' };

export default AlmacenRepuestos;