import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin({ token }) {
  // Estados para el formulario de registro
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('RECEPCIONISTA');
  const [sede, setSede] = useState('PIURA');
  
  // Estados para notificaciones
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Ahora la lista nace vacía y se llenará desde la base de datos
  const [personal, setPersonal] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);

  // useEffect se ejecuta automáticamente al abrir la página Admin
  useEffect(() => {
    const obtenerPersonal = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/auth/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPersonal(response.data);
      } catch (error) {
        console.error("Error al cargar el personal:", error);
      } finally {
        setCargandoLista(false); // Apagamos el indicador de carga
      }
    };

    if (token) {
      obtenerPersonal();
    }
  }, [token]);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setLoading(true);

    try {
      // Petición POST al Gateway enviando el Token de Admin en la cabecera
      const response = await axios.post(
        'http://localhost:8000/api/v1/auth/registro',
        { usuario, password, rol, sede },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setMensaje(response.data.mensaje);
      // Limpiamos el formulario tras el éxito
      setUsuario('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error de conexión con el servidor SOA.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Acceso Denegado.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#d32f2f', borderBottom: '2px solid #d32f2f', paddingBottom: '10px' }}>
        📊 Consola de Administración Central
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* COLUMNA IZQUIERDA: Formulario de Alta de Personal */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Registrar Nuevo Empleado</h3>
          
          {mensaje && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>✅ {mensaje}</div>}
          {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>⚠️ {error}</div>}

          <form onSubmit={handleRegistro}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Usuario:</label>
              <input type="text" required value={usuario} onChange={(e) => setUsuario(e.target.value)} style={{ width: '92%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Contraseña Temporal:</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '92%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Rol en el Sistema:</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ width: '98%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="RECEPCIONISTA">Recepcionista</option>
                <option value="TECNICO">Soporte Técnico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Sede Asignada:</label>
              <select value={sede} onChange={(e) => setSede(e.target.value)} style={{ width: '98%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="PIURA">Piura (Principal)</option>
                <option value="TALARA">Talara</option>
              </select>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? 'Procesando...' : '+ Crear Usuario'}
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Lista de Personal Actual */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Directorio de Personal</h3>
          {cargandoLista ? <p style={{color: '#666'}}>⏳ Cargando datos desde PostgreSQL...</p> : null}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Usuario</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Rol</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Sede</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{p.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.rol}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.sede}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Activo</span>
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

export default Admin;