import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Apuntamos al Gateway, nuestro único punto de entrada expuesto
const GATEWAY_URL = 'http://localhost:8000/api/v1';

function Login({ setToken }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Petición POST real a tu arquitectura SOA
      const response = await axios.post(`${GATEWAY_URL}/auth/login`, { 
        usuario, 
        password 
      });
      
      // Extraemos los datos cifrados que nos devuelve el backend
      const { access_token, rol } = response.data;
      
      // Guardamos el token en la memoria de la aplicación
      setToken(access_token);
      
      // Enrutamiento inteligente basado en el Rol real validado por la Base de Datos
      if (rol === 'RECEPCIONISTA') navigate('/recepcion');
      else if (rol === 'TECNICO') navigate('/taller');
      else if (rol === 'ADMIN') navigate('/admin');
      else navigate('/test');

    } catch (err) {
      // Capturamos el mensaje de error exacto que programamos en FastAPI
      const errorMsg = err.response?.data?.detail || 'Error de conexión con el servidor SOA.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '80vh', backgroundColor: '#f4f6f9' 
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '10px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#0052cc', margin: '0 0 10px 0' }}>SHServices</h2>
          <p style={{ color: '#666', margin: 0 }}>Acceso al Sistema Corporativo</p>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Usuario</label>
            <input 
              type="text" 
              required
              placeholder="Ej: AdminMaster"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{ width: '94%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Contraseña</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '94%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '14px' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '12px', background: loading ? '#ccc' : '#0052cc', 
              color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', 
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background 0.3s'
            }}
          >
            {loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;