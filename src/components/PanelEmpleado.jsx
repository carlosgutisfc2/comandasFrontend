import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { styles as estilosBase } from '../styles/PanelEmpleadoStyles.js';

const PanelEmpleado = () => {
  const navigate = useNavigate();
  
  // Estados de control de flujo
  const [vista, setVista] = useState('menu'); // 'menu' o 'formulario'
  const [tipoAccion, setTipoAccion] = useState(''); // 'comandar', 'abrir', 'cerrar'
  const [codigoMesa, setCodigoMesa] = useState('');
  
  // Estados para los Modales de Confirmación y API
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [cargandoApi, setCargandoApi] = useState(false);

  // Estados para abrir mesa
  const [mostrarModalContrasena, setMostrarModalContrasena] = useState(false);
  const [contrasenaRecibida, setContrasenaRecibida] = useState('');

  // Estados para visualizar contraseñas de mesas ocupadas
  const [mostrarModalMesasClaves, setMostrarModalMesasClaves] = useState(false);
  const [mesasAbiertasYClaves, setMesasAbiertasYClaves] = useState([]);
  const [cargandoMesasClaves, setCargandoMesasClaves] = useState(false);
  const [errorMesasClaves, setErrorMesasClaves] = useState('');

  // 1. 🔒 CORTAFUEGOS DE SEGURIDAD
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'EMPLEADO') {
      console.warn("Acceso denegado. Se requiere cuenta de empleado.");
      localStorage.clear();
      navigate('/empleado');
    }
  }, [navigate]);

  const handleSeleccionarAccion = (accion) => {
    setTipoAccion(accion);
    setCodigoMesa('');
    setMensajeFeedback('');
    setVista('formulario');
  };

  const handleProcesarFormulario = (e) => {
    e.preventDefault();
    if (!codigoMesa.trim()) return;

    if (tipoAccion === 'comandar') {
      localStorage.setItem('numMesa', codigoMesa.trim().toUpperCase());
      navigate('/carta');
    } else {
      setMostrarModal(true);
    }
  };

  // 🚀 PETICIÓN POST: Gestión de Apertura/Cierre de Mesas
  const handleConfirmarAccionBackend = async () => {
    const token = localStorage.getItem('token');
    const mesaFormateada = codigoMesa.trim().toUpperCase();
    const endpoint = tipoAccion === 'abrir' ? 'crear' : 'cerrar';
    
    setMostrarModal(false);
    setCargandoApi(true);
    setMensajeFeedback('');

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const url = `http://localhost:8080/mesas/${mesaFormateada}/${endpoint}`;
      
      const response = await axios.post(url, {}, config);

      if (response.status === 200 || response.status === 201) {
        if (tipoAccion === 'abrir') {
          setContrasenaRecibida(response.data);
          setMostrarModalContrasena(true);
        } else {
          setMensajeFeedback(`✅ ¡Mesa ${mesaFormateada} cerrada con éxito!`);
          setCodigoMesa('');
          setTimeout(() => setVista('menu'), 2000); 
          setCargandoApi(false);
        }
      }
    } catch (err) {
      console.error(`Error al ejecutar ${endpoint} mesa:`, err);
      setCargandoApi(false);
      if (!err.response) {
        setMensajeFeedback(`❌ Error de Red: Revisa que Spring Boot esté encendido.`);
      } else {
        setMensajeFeedback(
          `❌ Error ${err.response.status}: ${err.response.data?.mensaje || 'No se pudo realizar la acción.'}`
        );
      }
    }
  };

  // 📋 GET: Llama al controlador de contraseñas con traza de depuración
  const handleCargarMesasYContrasenas = async () => {
    setMostrarModalMesasClaves(true);
    setCargandoMesasClaves(true);
    setErrorMesasClaves('');
    
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:8080/mesas/abiertas-contrasenas', config);
      
      // 🎯 LOG DE DEPURACIÓN CRÍTICO: Abre la consola del navegador (F12) para ver qué llega aquí
      console.log("[DEBUG] Array recibido de Spring Boot:", response.data);
      
      setMesasAbiertasYClaves(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error al recuperar credenciales de mesas:", err);
      if (err.response) {
        const mensajeServidor = err.response.data?.message || err.response.data?.error || 'Acceso denegado';
        setErrorMesasClaves(`Error del servidor (${err.response.status}): ${mensajeServidor}`);
      } else {
        setErrorMesasClaves("Error de red: El servidor Spring Boot está apagado o hay un problema de CORS.");
      }
    } finally {
      setCargandoMesasClaves(false);
    }
  };

  return (
    <div style={estilosBase.wrapper}>
      
      {/* HEADER */}
      <div style={estilosBase.header}>
        <h2 style={estilosBase.title}>Panel de Control</h2>
        <p style={estilosBase.subtitle}>Gestión operativa para el personal de servicio</p>
      </div>

      {/* ALERTAS */}
      {mensajeFeedback && (
        <div style={{
          ...estilosBase.tableCard, 
          padding: '14px', 
          marginBottom: '20px', 
          backgroundColor: mensajeFeedback.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensajeFeedback.includes('✅') ? '#155724' : '#721c24',
          borderColor: mensajeFeedback.includes('✅') ? '#c3e6cb' : '#f5c6cb',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <strong>{mensajeFeedback}</strong>
        </div>
      )}

      {/* REJILLA (5 BOTONES) */}
      {vista === 'menu' ? (
        <div style={{ ...estilosBase.gridMenu, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', maxWidth: '1000px' }}>
          
          <div style={estilosBase.menuSquare} onClick={() => handleSeleccionarAccion('comandar')}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#e7f5ff' }}>🍽️</div>
            <h3 style={estilosBase.squareTitle}>Comandar Mesa</h3>
            <p style={estilosBase.squareDesc}>Abrir la carta digital para marchar comandas de platos.</p>
          </div>

          <div style={estilosBase.menuSquare} onClick={() => navigate('/gestion-pedidos')}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#f4fce3' }}>📋</div>
            <h3 style={estilosBase.squareTitle}>Pedidos Globales</h3>
            <p style={estilosBase.squareDesc}>Monitor de cocina para ver el estado de todas las mesas.</p>
          </div>

          <div style={estilosBase.menuSquare} onClick={() => handleSeleccionarAccion('abrir')}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#ebfbee' }}>🟢</div>
            <h3 style={estilosBase.squareTitle}>Abrir Mesa</h3>
            <p style={estilosBase.squareDesc}>Habilitar e inicializar sesión para una nueva mesa física.</p>
          </div>

          <div style={estilosBase.menuSquare} onClick={() => handleSeleccionarAccion('cerrar')}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#fff5f5' }}>🔴</div>
            <h3 style={estilosBase.squareTitle}>Cerrar Mesa</h3>
            <p style={estilosBase.squareDesc}>Finalizar cuenta y liberar el estado ocupado de la mesa.</p>
          </div>

          <div style={estilosBase.menuSquare} onClick={handleCargarMesasYContrasenas}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#f3e8ff' }}>🔑</div>
            <h3 style={estilosBase.squareTitle}>Ver Claves</h3>
            <p style={estilosBase.squareDesc}>Consultar contraseñas de acceso de todas las mesas abiertas.</p>
          </div>

        </div>
      ) : (
        /* FORMULARIO */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button style={estilosBase.backBtn} onClick={() => setVista('menu')} disabled={cargandoApi}>
            ⬅️ Volver al panel
          </button>
          
          <div style={estilosBase.tableCard}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
              {tipoAccion === 'comandar' ? '📝' : tipoAccion === 'abrir' ? '🔓' : '🔒'}
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#212529', textTransform: 'capitalize' }}>
              {tipoAccion === 'comandar' ? 'Asignar Comanda' : `${tipoAccion} mesa`}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>
              Introduce el identificador de la mesa sobre la que deseas operar
            </p>
            
            <form onSubmit={handleProcesarFormulario}>
              <input
                type="text"
                placeholder="Código de Mesa (Ej: MESA1)"
                value={codigoMesa}
                onChange={(e) => setCodigoMesa(e.target.value)}
                required
                style={estilosBase.inputMesa}
                disabled={cargandoApi}
                autoFocus
              />
              <button 
                type="submit" 
                style={{
                  ...estilosBase.submitMesaBtn,
                  backgroundColor: tipoAccion === 'cerrar' ? '#fa5252' : tipoAccion === 'abrir' ? '#2b8a3e' : '#007bff'
                }}
                disabled={cargandoApi}
              >
                {cargandoApi ? 'Procesando...' : 'Continuar Acción'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.25rem', color: '#212529' }}>⚠️ Confirmación Requerida</h3>
            <p style={{ fontSize: '0.95rem', color: '#495057', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              ¿Estás seguro de que deseas {' '}
              {tipoAccion === 'cerrar' ? <span style={styles.badgeCerrar}>CERRAR</span> : <span style={styles.badgeAbrir}>ABRIR</span>}
              {' '} la mesa <strong>{codigoMesa.toUpperCase()}</strong>?
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelarBtn} onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button style={{ ...styles.confirmarBtn, backgroundColor: tipoAccion === 'cerrar' ? '#e03131' : '#234e23' }} onClick={handleConfirmarAccionBackend}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APERTURA INDIVIDUAL */}
      {mostrarModalContrasena && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔑</div>
            <h3>Mesa Inicializada</h3>
            <div style={styles.passwordContainer}>{contrasenaRecibida}</div>
            <button style={styles.btnCerrarPassword} onClick={() => { setMostrarModalContrasena(false); setVista('menu'); setCargandoApi(false); }}>
              Cerrar y Finalizar
            </button>
          </div>
        </div>
      )}

      {/* 🔑 MODAL HISTORIAL DE CLAVES (ACTUALIZADO CON RENDERIZADO DEFENSIVO TOLERANTE) */}
      {mostrarModalMesasClaves && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#212529', fontSize: '1.2rem' }}>🔑 Contraseñas de Mesas</h3>
              <button style={styles.closeModalCross} onClick={() => setMostrarModalMesasClaves(false)}>✕</button>
            </div>
            
            <div style={styles.divider} />

            {cargandoMesasClaves ? (
              <p style={styles.centerText}>Sincronizando base de datos...</p>
            ) : errorMesasClaves ? (
              <div style={styles.errorAlert}>🚨 {errorMesasClaves}</div>
            ) : mesasAbiertasYClaves.length === 0 ? (
              <p style={styles.centerText}>No hay ninguna mesa activa (ocupada) en este momento.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>📍 Mesa</th>
                      <th style={styles.th}>🔑 Contraseña</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesasAbiertasYClaves.map((mesa, index) => {
                      // 🛡️ FILTRO DEFENSIVO: Mapea correctamente sea cual sea el formato que use Jackson
                      const identificador = mesa.codigoMesa || mesa.codigomesa || mesa.codigo_mesa || "N/A";
                      const claveDescifrada = mesa.contrasena || mesa.contraseñanormal || "Error";

                      return (
                        <tr key={index} style={index % 2 === 0 ? {} : styles.altRow}>
                          <td style={styles.td}><b>{identificador}</b></td>
                          <td style={styles.td}><code style={styles.codeStyle}>{claveDescifrada}</code></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button style={styles.closeModalBtn} onClick={() => setMostrarModalMesasClaves(false)}>
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
      
      {vista === 'menu' && (
        <button 
          style={{ marginTop: '40px', padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #ffe3e3', color: '#fa5252', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
          onClick={() => { localStorage.clear(); navigate('/empleado'); }}
        >
          🚪 Cerrar Sesión de Empleado
        </button>
      )}
    </div>
  );
};

const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(2px)' },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '90%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box', border: '1px solid #e9ecef' },
  badgeCerrar: { backgroundColor: '#fa5252', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '800', fontSize: '0.9rem', display: 'inline-block' },
  badgeAbrir: { backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '800', fontSize: '0.9rem', display: 'inline-block' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' },
  cancelarBtn: { padding: '10px 18px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' },
  confirmarBtn: { padding: '10px 18px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' },
  passwordContainer: { backgroundColor: '#f1f3f5', border: '2px dashed #ced4da', borderRadius: '12px', padding: '14px 20px', fontSize: '1.6rem', fontWeight: '800', color: '#1c7ed6', letterSpacing: '2px', margin: '10px 0', fontFamily: 'monospace, Courier' },
  btnCerrarPassword: { width: '100%', padding: '12px', backgroundColor: '#212529', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' },
  closeModalCross: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' },
  divider: { height: '1px', backgroundColor: '#e2e8f0', margin: '12px 0 16px 0' },
  centerText: { color: '#64748b', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' },
  errorAlert: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left', lineHeight: '1.4' },
  tableWrapper: { maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
  th: { backgroundColor: '#f8fafc', padding: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  altRow: { backgroundColor: '#f8fafc' },
  codeStyle: { backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#0f172a', fontWeight: '700', fontFamily: 'monospace', fontSize: '0.95rem' },
  closeModalBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }
};

export default PanelEmpleado;