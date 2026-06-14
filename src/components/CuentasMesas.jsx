import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { styles as estilosBase } from '../styles/PanelEmpleadoStyles.js';

const CuentasMesas = () => {
  const navigate = useNavigate();
  
  // Estados para almacenar las cuentas y controlar la API
  const [cuentasMesas, setCuentasMesas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // 🔒 CORTAFUEGOS DE SEGURIDAD (Igual que en el panel principal)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'EMPLEADO') {
      console.warn("Acceso denegado. Se requiere cuenta de empleado.");
      localStorage.clear();
      navigate('/empleado');
    } else {
      cargarCuentasMesasActivas();
    }
  }, [navigate]);

  // 💰 PETICIÓN GET: Sincronizar con /mesas/cuentas
  const cargarCuentasMesasActivas = async () => {
    setCargando(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:8080/mesas/cuentasOcupadas', config);
      
      console.log("[DEBUG] Cuentas de mesas recibidas:", response.data);
      setCuentasMesas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error al recuperar las cuentas de las mesas:", err);
      if (err.response && err.response.status === 404) {
        // Tu servicio Java lanza excepción si no hay mesas ocupadas (404)
        setCuentasMesas([]);
      } else if (err.response) {
        setError(`Error (${err.response.status}): No se pudieron cargar las cuentas.`);
      } else {
        setError("Error de red: Revisa la conexión con el servidor Spring Boot.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilosBase.wrapper}>
      
      {/* BOTÓN VOLVER ATRÁS */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-start' }}>
        <button style={estilosBase.backBtn} onClick={() => navigate('/panel-empleado')}>
          ⬅️ Volver al Panel
        </button>
      </div>

      {/* HEADER DE LA SECCIÓN */}
      <div style={{ ...estilosBase.header, marginBottom: '30px' }}>
        <h2 style={estilosBase.title}>💰 Cuentas de Mesas Activas</h2>
        <p style={estilosBase.subtitle}>Control de importes acumulados en sala y estado de caja</p>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={styles.pantallaSeccion}>
        <div style={styles.cuentasHeader}>
          <h3 style={styles.cuentasSeccionTitle}>📍 Mesas Ocupadas en este instante</h3>
          <button style={styles.btnRefrescarCuentas} onClick={cargarCuentasMesasActivas} disabled={cargando}>
            {cargando ? '🔄 Sincronizando...' : '🔄 Actualizar Datos'}
          </button>
        </div>

        {error && <div style={styles.errorAlert}>🚨 {error}</div>}

        {cargando && !error && (
          <p style={styles.centerText}>Calculando balances y leyendo comandas activas...</p>
        )}

        {!cargando && !error && cuentasMesas.length === 0 && (
          <div style={styles.tarjetaVaciaCuentas}>
            🟢 Actualmente no hay mesas ocupadas ni cuentas pendientes de cobro en el sistema.
          </div>
        )}

        {!cargando && !error && cuentasMesas.length > 0 && (
          <div style={styles.cuentasGrid}>
            {cuentasMesas.map((item, idx) => {
              // Filtro defensivo para tolerar cualquier variación de nombres de variables en el JSON
              const codigo = item.codigoMesa || item.codigomesa || item.codigo_mesa || "N/A";
              const total = item.cuentaTotal !== undefined ? item.cuentaTotal : (item.cuentatotal || 0.0);

              return (
                <div key={idx} style={styles.tarjetaMesaCuenta}>
                  <div style={styles.iconoMesa}>🍽️</div>
                  <span style={styles.tarjetaMesaCodigo}>{codigo}</span>
                  <span style={styles.tarjetaMesaImporte}>{Number(total).toFixed(2)}€</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Estilos específicos para maquetar la nueva pantalla de cuentas
const styles = {
  pantallaSeccion: { width: '100%', maxWidth: '1000px', backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', boxSizing: 'border-box' },
  cuentasHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
  cuentasSeccionTitle: { margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700' },
  btnRefrescarCuentas: { backgroundColor: '#2563eb', border: 'none', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' },
  tarjetaVaciaCuentas: { backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', color: '#475569', borderRadius: '12px', padding: '30px', fontSize: '1rem', textAlign: 'center', fontWeight: '500' },
  cuentasGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', width: '100%' },
  tarjetaMesaCuenta: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px 16px', boxSizing: 'border-box', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } },
  iconoMesa: { fontSize: '1.8rem', marginBottom: '4px' },
  tarjetaMesaCodigo: { fontSize: '0.95rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  tarjetaMesaImporte: { fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '4px 12px', borderRadius: '8px', marginTop: '4px', minWidth: '80px' },
  errorAlert: { backgroundColor: '#f8d7da', color: '#721c24', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'left', marginBottom: '20px' },
  centerText: { color: '#64748b', textAlign: 'center', padding: '40px 0', fontSize: '0.95rem', fontWeight: '500' }
};

export default CuentasMesas;