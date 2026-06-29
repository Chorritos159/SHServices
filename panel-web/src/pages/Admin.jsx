import React, { useState, useEffect } from 'react';

function Admin({ token }) {
  // En un sistema real, aquí harías un GET a /api/v1/admin/usuarios
  const [personal] = useState([
    { id: 'Yassir', rol: 'ADMIN', sede: 'PIURA' },
    { id: 'Diego', rol: 'ADMIN', sede: 'PIURA' },
    { id: 'Frank', rol: 'ADMIN', sede: 'PIURA' }
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#d32f2f' }}>📊 Consola de Administración</h2>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>Personal Registrado</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Usuario</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Rol</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #eee' }}>Sede</th>
            </tr>
          </thead>
          <tbody>
            {personal.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{p.id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{p.rol}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{p.sede}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button style={{ marginTop: '20px', padding: '10px 20px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + Registrar Nuevo Personal
        </button>
      </div>
    </div>
  );
}

export default Admin;