import React from 'react';

function Taller({ token }) {
  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
        <h2>Acceso Restringido al Taller</h2>
        <p>Por favor, ingrese su Token JWT en el módulo de Diagnóstico.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#ff8c00' }}>🛠️ Tablero de Soporte Técnico (Kanban)</h2>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#777' }}>
          Aquí construiremos las 3 columnas: Pendientes, En Proceso y Terminados.
          Al hacer clic en una tarjeta, se abrirá el detalle de la falla y el descuento de repuestos.
        </p>
      </div>
    </div>
  );
}

export default Taller;