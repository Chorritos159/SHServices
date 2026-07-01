import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ConsolaAdmin({ token }) {
  const [usuarios, setUsuarios] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del formulario para nuevo personal
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    rol: 'TECNICO',
    sede: 'PIURA'
  });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Ejecutamos ambas peticiones en paralelo para mayor rendimiento
        const [resUsuarios, resTickets] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/usuarios', { headers }),
          axios.get('http://localhost:8000/api/v1/tickets', { headers })
        ]);
        
        setUsuarios(resUsuarios.data);
        setTickets(resTickets.data);
      } catch (error) {
        console.error("Error cargando datos del admin", error);
        setMensaje({ texto: "Error de conexión con el servidor", tipo: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Manejador del formulario
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Creando...', tipo: 'info' });
    
    try {
      await axios.post('http://localhost:8000/api/v1/usuarios/registro', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMensaje({ texto: '✅ Empleado registrado exitosamente', tipo: 'exito' });
      
      // Recargar la lista de usuarios
      const res = await axios.get('http://localhost:8000/api/v1/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data);
      
      // Limpiar formulario
      setFormData({ usuario: '', password: '', rol: 'TECNICO', sede: 'PIURA' });
      
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.detail || '❌ Error al crear usuario. Verifica permisos.', 
        tipo: 'error' 
      });
    }
  };

  // --- CÁLCULO DE KPIs ---
  const ingresosTotales = tickets.reduce((sum, t) => sum + (parseFloat(t.monto_total_final || t.monto_total || 0)), 0);
  const equiposReparados = tickets.filter(t => t.estado === 'REPARADO' || t.estado === 'ENTREGADO').length;

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando Consola de Mando...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: '#0052cc', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        📊 Consola de Administración Global
      </h2>

      {/* --- SECCIÓN 1: KPIs GLOBALES --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px', marginTop: '20px' }}>
        <div style={kpiCardStyle}>
          <div style={kpiTitleStyle}>Total Operaciones</div>
          <div style={kpiValueStyle}>{tickets.length}</div>
          <div style={kpiSubStyle}>Tickets Registrados</div>
        </div>
        <div style={{...kpiCardStyle, borderLeft: '5px solid #28a745'}}>
          <div style={kpiTitleStyle}>Ingresos Brutos</div>
          <div style={kpiValueStyle}>S/. {ingresosTotales.toFixed(2)}</div>
          <div style={kpiSubStyle}>Moneda Local</div>
        </div>
        <div style={{...kpiCardStyle, borderLeft: '5px solid #17a2b8'}}>
          <div style={kpiTitleStyle}>Tasa de Resolución</div>
          <div style={kpiValueStyle}>{equiposReparados}</div>
          <div style={kpiSubStyle}>Equipos Procesados</div>
        </div>
        <div style={{...kpiCardStyle, borderLeft: '5px solid #6f42c1'}}>
          <div style={kpiTitleStyle}>Fuerza Laboral</div>
          <div style={kpiValueStyle}>{usuarios.length}</div>
          <div style={kpiSubStyle}>Empleados Activos</div>
        </div>
      </div>

      {/* --- SECCIÓN 2: GESTIÓN DE MULTITENENCIA Y PERSONAL --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Formulario de Alta */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>➕ Nuevo Empleado</h3>
          
          {mensaje.texto && (
            <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', backgroundColor: mensaje.tipo === 'error' ? '#f8d7da' : '#d4edda', color: mensaje.tipo === 'error' ? '#721c24' : '#155724' }}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Usuario (ID de acceso)</label>
              <input required type="text" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} style={inputStyle} placeholder="Ej. jperez" />
            </div>
            
            <div>
              <label style={labelStyle}>Contraseña Provisional</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
            </div>
            
            <div>
              <label style={labelStyle}>Rol Operativo</label>
              <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} style={inputStyle}>
                <option value="TECNICO">🛠️ Técnico de Taller</option>
                <option value="RECEPCIONISTA">🏢 Recepcionista</option>
                <option value="ADMIN">👑 Administrador</option>
              </select>
            </div>
            
            <div>
              <label style={labelStyle}>Base Operativa (Sede)</label>
              <select value={formData.sede} onChange={e => setFormData({...formData, sede: e.target.value})} style={inputStyle}>
                <option value="PIURA">Piura (Sede Principal)</option>
                <option value="CHICLAYO">Chiclayo</option>
                <option value="TRUJILLO">Trujillo</option>
                <option value="LIMA">Lima</option>
              </select>
            </div>

            <button type="submit" style={{ backgroundColor: '#0052cc', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              Registrar Empleado
            </button>
          </form>
        </div>

        {/* Tabla de Empleados */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>👥 Directorio de Personal</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={thStyle}>Usuario</th>
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Sede Asignada</th>
                <th style={thStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><strong>{u.id}</strong></td>
                  <td style={tdStyle}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.rol === 'ADMIN' ? '#cce5ff' : u.rol === 'TECNICO' ? '#fff3cd' : '#d4edda', color: u.rol === 'ADMIN' ? '#004085' : u.rol === 'TECNICO' ? '#856404' : '#155724' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={tdStyle}>{u.sede}</td>
                  <td style={tdStyle}>
                    {u.activo ? <span style={{color: 'green'}}>🟢 Activo</span> : <span style={{color: 'red'}}>🔴 Inactivo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

// Estilos limpios en línea para evitar dependencias CSS externas
const kpiCardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #0052cc' };
const kpiTitleStyle = { fontSize: '14px', color: '#6c757d', fontWeight: 'bold', textTransform: 'uppercase' };
const kpiValueStyle = { fontSize: '28px', fontWeight: 'bold', color: '#333', margin: '10px 0' };
const kpiSubStyle = { fontSize: '12px', color: '#999' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#555' };
const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const thStyle = { padding: '12px 10px', color: '#555' };
const tdStyle = { padding: '12px 10px', color: '#333' };

export default ConsolaAdmin;