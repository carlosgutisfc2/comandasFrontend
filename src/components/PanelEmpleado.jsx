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

  // 🪑 ESTADOS PARA EL LISTADO DINÁMICO DE MESAS DISPONIBLES
  const [mesasFiltradas, setMesasFiltradas] = useState([]);
  const [cargandoMesasFiltro, setCargandoMesasFiltro] = useState(false);
  const [errorMesasFiltro, setErrorMesasFiltro] = useState('');

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

  // 📥 PETICIÓN GET: Carga las mesas según la acción seleccionada
  const handleSeleccionarAccion = async (accion) => {
    setTipoAccion(accion);
    setCodigoMesa('');
    setMensajeFeedback('');
    setMesasFiltradas([]);
    setErrorMesasFiltro('');
    setVista('formulario');
    setCargandoMesasFiltro(true);

    const token = localStorage.getItem('token');
    // Si queremos abrir una mesa, llamamos a libres. Si es para cerrar o comandar, a ocupadas.
    const endpoint = accion === 'abrir' ? 'cuentasLibres' : 'cuentasOcupadas';

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`http://localhost:8080/mesas/${endpoint}`, config);
      
      console.log(`[DEBUG] Mesas para ${accion}:`, response.data);
      setMesasFiltradas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error al recuperar el listado de mesas:", err);
      if (err.response && err.response.status === 404) {
        setMesasFiltradas([]); // El servicio devuelve 404 controlado si la lista está vacía
      } else if (err.response) {
        setErrorMesasFiltro(`Error (${err.response.status}): No se pudo sincronizar el mapa de mesas.`);
      } else {
        setErrorMesasFiltro("Error de red: El servidor Spring Boot está inaccesible.");
      }
    } finally {
      setCargandoMesasFiltro(false);
    }
  };

  // 🔀 CONTROL DE SELECCIÓN DE MESA EN LA REJILLA
  const handleSeleccionarMesaFisica = (codigo) => {
    if (!codigo) return;
    setCodigoMesa(codigo);

    if (tipoAccion === 'comandar') {
      // Flujo directo a la comanda sin pasar por modal de confirmación
      localStorage.setItem('numMesa', codigo.toUpperCase());
      navigate('/carta');
    } else {
      // Abrir o Cerrar requiere confirmación de seguridad en Modal
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

  // 📋 GET: Llama al controlador de contraseñas
  const handleCargarMesasYContrasenas = async () => {
    setMostrarModalMesasClaves(true);
    setCargandoMesasClaves(true);
    setErrorMesasClaves('');
    
    const token = localStorage.getItem('token');
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:8080/mesas/ocupadas-contrasenas', config);
      
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

      {/* REJILLA PRINCIPAL (6 BOTONES) */}
      {vista === 'menu' ? (
        <div style={{ ...estilosBase.gridMenu, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', maxWidth: '1000px', width: '100%' }}>
          
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
            <p style={estilosBase.squareDesc}>Consultar contraseñas de acceso de todas las mesas ocupadas.</p>
          </div>

          <div style={estilosBase.menuSquare} onClick={() => navigate('/cuentas-mesas')}>
            <div style={{ ...estilosBase.iconWrapper, backgroundColor: '#fef3c7' }}>💰</div>
            <h3 style={estilosBase.squareTitle}>Cuentas Activas</h3>
            <p style={estilosBase.squareDesc}>Revisar de forma centralizada la cuenta total de las mesas ocupadas.</p>
          </div>

        </div>
      ) : (
        /* MAPA INTERACTIVO DE SELECCIÓN DE MESAS (REEMPLAZA AL VIEJO INPUT MANAL) */
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button style={estilosBase.backBtn} onClick={() => setVista('menu')} disabled={cargandoApi}>
            ⬅️ Volver al panel
          </button>
          
          <div style={{ ...estilosBase.tableCard, maxWidth: '800px', width: '100%', padding: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              {tipoAccion === 'comandar' ? '📝' : tipoAccion === 'abrir' ? '🔓' : '🔒'}
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#212529', textTransform: 'capitalize' }}>
              Seleccionar Mesa para {tipoAccion === 'comandar' ? 'Asignar Comanda' : `${tipoAccion} sesión`}
            </h3>
            <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#6c757d' }}>
              {tipoAccion === 'abrir' 
                ? 'Listado de mesas disponibles en estado LIBRE' 
                : 'Listado de mesas activas con comanda en estado OCUPADA'}
            </p>

            {/* Renderizado condicional según estado de la API de filtros */}
            {cargandoMesasFiltro && <p style={styles.centerText}>Sincronizando plano del restaurante...</p>}
            
            {errorMesasFiltro && <div style={styles.errorAlert}>{errorMesasFiltro}</div>}

            {!cargandoMesasFiltro && !errorMesasFiltro && mesasFiltradas.length === 0 && (
              <div style={styles.alertaVaciaPlano}>
                {tipoAccion === 'abrir' 
                  ? '🛑 El restaurante está lleno. No quedan mesas libres para inicializar.' 
                  : '🍽️ No hay ninguna mesa ocupada actualmente en sala.'}
              </div>
            )}

            {!cargandoMesasFiltro && !errorMesasFiltro && mesasFiltradas.length > 0 && (
              <div style={styles.planoMesasGrid}>
                {mesasFiltradas.map((mesaItem, index) => {
                  const codigo = mesaItem.codigoMesa || mesaItem.codigomesa || "N/A";
                  const cuenta = mesaItem.cuentaTotal !== undefined ? mesaItem.cuentaTotal : (mesaItem.cuentatotal || 0.0);

                  return (
                    <div 
                      key={index} 
                      style={{
                        ...styles.bloqueMesaSeleccionable,
                        borderBorderColor: tipoAccion === 'cerrar' ? '#fcc419' : '#a6a7a8',
                        ':hover': { transform: 'scale(1.03)' }
                      }}
                      onClick={() => handleSeleccionarMesaFisica(codigo)}
                    >
                      <span style={styles.bloqueMesaIcono}>📍</span>
                      <span style={styles.bloqueMesaCodigo}>{codigo}</span>
                      {tipoAccion !== 'abrir' && (
                        <span style={styles.bloqueMesaImporte}>{Number(cuenta).toFixed(2)}€</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ACCIÓN */}
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

      {/* 🔑 MODAL HISTORIAL DE CLAVES */}
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
  errorAlert: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left', lineHeight: '1.4', marginBottom: '15px' },
  tableWrapper: { maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
  th: { backgroundColor: '#f8fafc', padding: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  altRow: { backgroundColor: '#f8fafc' },
  codeStyle: { backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#0f172a', fontWeight: '700', fontFamily: 'monospace', fontSize: '0.95rem' },
  closeModalBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },

  // 🎨 ESTILOS PARA EL MAPA INTERACTIVO DE NUEVAS SELECCIONES VÍA GET
  planoMesasGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px', width: '100%', marginTop: '10px' },
  bloqueMesaSeleccionable: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px 10px', cursor: 'pointer', boxSizing: 'border-box', transition: 'all 0.2s' },
  bloqueMesaIcono: { fontSize: '1.4rem' },
  bloqueMesaCodigo: { fontWeight: '800', color: '#334155', fontSize: '0.95rem', textTransform: 'uppercase' },
  bloqueMesaImporte: { fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '6px', marginTop: '2px', fontFamily: 'monospace' },
  alertaVaciaPlano: { width: '100%', padding: '20px', border: '1px dashed #ced4da', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#495057', fontSize: '0.95rem', fontWeight: '600', textAlign: 'center' }
};

export default PanelEmpleado;