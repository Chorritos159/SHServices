import React, { useState } from 'react';

function Recepcion({ token }) {
  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
        <h2>Acceso Restringido</h2>
        <p>Por favor, ingrese un Token JWT de Recepcionista en el módulo de <strong>⚙️ Diagnóstico</strong> antes de operar.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#0052cc' }}>Panel de Recepción</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Columna Izquierda: Formulario de Creación */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Nueva Operación</h3>
          <p style={{ color: '#777', fontSize: '14px' }}>Aquí construiremos el formulario completo (DNI, Nombre, Equipo, Características, Fallas).</p>
        </div>

        {/* Columna Derecha: Grilla de Tickets del Día y Tabla de Ventas */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>Visor de Actividad (Sede Actual)</h3>
          <p style={{ color: '#777', fontSize: '14px' }}>Aquí irá la tabla de Notas de Venta y el buscador rápido por DNI.</p>
        </div>

      </div>
    </div>
  );
}

export default Recepcion;