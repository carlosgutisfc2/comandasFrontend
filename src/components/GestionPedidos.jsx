import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GestionPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorStatus, setErrorStatus] = useState('');

  // Estados para controlar el modal de confirmación dinámico
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  // Control del filtro activo (TODOS, PREPARACION, ENVIADO)
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('TODOS');

  // 1. 🔒 CORTAFUEGOS DE SEGURIDAD
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'EMPLEADO') {
      console.warn("Acceso denegado por role o token");
      localStorage.clear();
      navigate('/empleado');
    }
  }, [navigate]);

  // 2. 📋 PETICIÓN HTTP: Sincronización del monitor de cocina
  const cargarDatosCocina = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const resPedidos = await axios.get('http://localhost:8080/pedido/pedidos', config);
      if (resPedidos.data) {
        setPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : [resPedidos.data]);
      }

      setErrorStatus('');
    } catch (err) {
      console.error("Error en la sincronización:", err);
      setErrorStatus('Error de sincronización con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Cada 5 segundos se recargan los pedidos
  useEffect(() => {
    cargarDatosCocina();
    const intervaloActividad = setInterval(() => {
      cargarDatosCocina();
    }, 5000);
    return () => clearInterval(intervaloActividad);
  }, []);

  // 🚀 PETICIÓN REST DINÁMICA
  const handleCambiarEstadoPedido = async () => {
    if (!pedidoSeleccionado) return;
    
    const token = localStorage.getItem('token');
    const mesaCodigo = pedidoSeleccionado.codigo_mesa;
    const numeroPedidoId = pedidoSeleccionado.numeroPedido;

    const esEnviadoActual = pedidoSeleccionado.estado && pedidoSeleccionado.estado.toLowerCase() === 'enviado';
    const subRutaAccion = esEnviadoActual ? 'preparacion' : 'enviado'; 

    setCargandoAccion(true);
    try {
      const url = `http://localhost:8080/pedido/${encodeURIComponent(mesaCodigo)}/pedidos/${numeroPedidoId}`;
      const config = { 
        headers: { 'Authorization': `Bearer ${token}` },
        params: { estado: subRutaAccion } 
      };
      
      await axios.put(url, {}, config); 
      
      setMostrarModalEstado(false);
      setPedidoSeleccionado(null);
      await cargarDatosCocina(); 
    } catch (err) {
      console.error("Error al modificar el estado del pedido:", err);
      alert("Error en el servidor al procesar la transición de estado.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleAbrirModal = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalEstado(true);
  };

  // Filtrado de comandas en el navegador
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroSeleccionado === 'TODOS') return true;
    if (!p.estado) return false;
    return p.estado.toLowerCase() === filtroSeleccionado.toLowerCase();
  });

  const esModalEnviado = pedidoSeleccionado?.estado && pedidoSeleccionado.estado.toLowerCase() === 'enviado';

  return (
    <div style={styles.wrapper}>
      
      {/* BARRA SUPERIOR */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/panel-empleado')}>
          ⬅️ Volver al Panel
        </button>
        <span style={styles.liveIndicator}>🟢 Monitor en tiempo real</span>
      </div>

      <h2 style={{ color: '#333' }}>📋 Monitor de Control de Comandas</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Pulsa sobre cualquier comanda para alternar su estado entre Cocina y Sala de forma interactiva.
      </p>

      {/* BARRA DE FILTRADO */}
      <div style={styles.filterBarContainer}>
        {['TODOS', 'PREPARACION', 'ENVIADO'].map((filtro) => {
          const esActivo = filtroSeleccionado === filtro;
          return (
            <button
              key={filtro}
              onClick={() => setFiltroSeleccionado(filtro)}
              style={{
                ...styles.filterSelectorBtn,
                backgroundColor: esActivo ? '#212529' : '#fff',
                color: esActivo ? '#fff' : '#495057',
                borderColor: esActivo ? '#212529' : '#ced4da',
                fontWeight: esActivo ? '700' : '500'
              }}
            >
              {filtro}
            </button>
          );
        })}
      </div>

      {errorStatus && <div style={styles.errorAlert}>🚨 {errorStatus}</div>}

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Sincronizando base de datos...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={styles.emptyCard}>
          <span style={{ fontSize: '2.5rem' }}>👨‍🍳</span>
          <p style={{ margin: '10px 0 0 0', fontWeight: '600', color: '#868e96' }}>
            No hay ningún pedido en el estado "{filtroSeleccionado.toLowerCase()}"
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {pedidosFiltrados.map((pedido, index) => {
            const esEnviado = pedido.estado && pedido.estado.toLowerCase() === 'enviado';
            
            return (
              <div 
                key={pedido.id || index} 
                style={{
                  ...styles.orderCard,
                  cursor: 'pointer',
                  opacity: esEnviado ? 0.8 : 1
                }} 
                onClick={() => handleAbrirModal(pedido)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.tableBadge}>
                    📍 Mesa: {pedido.codigo_mesa || 'N/A'}
                  </span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: esEnviado ? '#d4edda' : '#fff3cd',
                    color: esEnviado ? '#155724' : '#856404'
                  }}>
                    {pedido.estado || 'preparacion'}
                  </span>
                </div>
                
                <div style={styles.divider} />
                
                <ul style={{ paddingLeft: '0', margin: 0, listStyleType: 'none', flexGrow: 1 }}>
                  {(pedido.detalles || []).map((linea, i) => (
                    <li key={i} style={{ marginBottom: '8px', textAlign: 'left', fontSize: '0.92rem' }}>
                      <strong style={{ color: '#28a745', marginRight: '6px' }}>{linea.cantidad}x</strong> 
                      <span style={{ fontWeight: '600', color: '#333' }}>{linea.nombreProducto}</span>
                      {/* 🛠️ PREVISUALIZACIÓN CON CORTE LIMPIO (...) */}
                      {linea.notas && linea.notas !== "Sin notas" && (
                        <div style={styles.notes} title={linea.notas}>✏️ {linea.notas}</div>
                      )}
                    </li>
                  ))}
                </ul>
                
                <div style={{ marginTop: '15px', fontSize: '0.72rem', color: '#adb5bd', textAlign: 'right', borderTop: '1px dashed #f1f3f5', paddingTop: '8px' }}>
                  🔢 Pedido Nº: {pedido.numeroPedido}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EMERGENTE DINÁMICO */}
      {mostrarModalEstado && pedidoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
              {esModalEnviado ? '🔄' : '🛎️'}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#212529' }}>
              {esModalEnviado ? 'Reabrir Comanda' : 'Despachar Comanda'}
            </h3>
            
            <p style={{ fontSize: '0.9rem', color: '#495057', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              {esModalEnviado ? (
                <>¿Confirmar el retorno a cocina de la <b>Mesa {pedidoSeleccionado.codigo_mesa}</b> para volver a prepararla?</>
              ) : (
                <>¿Confirmar el envío a sala de la <b>Mesa {pedidoSeleccionado.codigo_mesa}</b> correspondiente a su <b>Pedido Nº {pedidoSeleccionado.numeroPedido}</b>?</>
              )}
            </p>

            <div style={styles.modalSummaryBox}>
              <ul style={{ margin: 0, padding: 0, listStyleType: 'none', textAlign: 'left', fontSize: '0.85rem' }}>
                {(pedidoSeleccionado.detalles || []).map((linea, i) => (
                  <li key={i} style={{ marginBottom: '8px', color: '#495057' }}>
                    <b>{linea.cantidad}x</b> {linea.nombreProducto}
                    {/* 🛠️ DETALLE COMPLETO EN EL MODAL (Rompe hacia abajo elásticamente) */}
                    {linea.notas && linea.notas !== "Sin notas" && (
                      <div style={styles.modalNotes}>✏️ {linea.notas}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelarBtn} onClick={() => { setMostrarModalEstado(false); setPedidoSeleccionado(null); }} disabled={cargandoAccion}>
                Cancelar
              </button>
              
              <button 
                onClick={handleCambiarEstadoPedido} 
                disabled={cargandoAccion}
                style={{
                  ...styles.confirmarBtn,
                  backgroundColor: esModalEnviado ? '#ffc107' : '#28a745',
                  color: esModalEnviado ? '#212529' : '#fff'
                }}
              >
                {cargandoAccion ? 'Procesando...' : esModalEnviado ? 'Devolver a PREPARACIÓN' : 'Marcar como ENVIADO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px 4%', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto 20px auto' },
  backBtn: { padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#495057' },
  liveIndicator: { fontSize: '0.82rem', fontWeight: '700', color: '#2b8a3e', backgroundColor: '#ebfbee', padding: '6px 12px', borderRadius: '20px' },
  filterBarContainer: { display: 'flex', gap: '10px', maxWidth: '1200px', margin: '0 auto 24px auto', justifyContent: 'flex-start' },
  filterSelectorBtn: { padding: '8px 16px', border: '1px solid', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.15s ease' },
  errorAlert: { padding: '14px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '10px', border: '1px solid #f5c6cb', fontWeight: '600', marginBottom: '20px', textAlign: 'left' },
  emptyCard: { backgroundColor: '#fff', border: '1px dashed #ced4da', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '450px', margin: '6px auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' },
  orderCard: { backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', overflow: 'hidden' },
  tableBadge: { backgroundColor: '#e7f5ff', color: '#007bff', padding: '5px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem' },
  statusBadge: { padding: '5px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' },
  divider: { height: '1px', backgroundColor: '#f1f3f5', margin: '14px 0' },
  
  // 🎯 MODIFICADO: Estilo para la previsualización (Recorte en 1 sola línea)
  notes: { 
    fontSize: '0.78rem', 
    color: '#6c757d', 
    backgroundColor: '#f8f9fa', 
    padding: '6px 10px', 
    borderRadius: '6px', 
    marginTop: '4px', 
    fontStyle: 'italic', 
    borderLeft: '3px solid #ced4da',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  },
  
  // 🎯 NUEVO: Estilo elástico para el interior del Modal (Rompe palabras infinitas y salta de línea)
  modalNotes: {
    fontSize: '0.78rem', 
    color: '#6c757d', 
    backgroundColor: '#f8f9fa', 
    padding: '6px 10px', 
    borderRadius: '6px', 
    marginTop: '4px', 
    fontStyle: 'italic', 
    borderLeft: '3px solid #ced4da',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    textAlign: 'left'
  },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(2px)' },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '90%', maxWidth: '380px', textAlign: 'center', boxSizing: 'border-box' },
  modalSummaryBox: { backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '12px', margin: '12px 0 20px 0', maxHeight: '180px', overflowY: 'auto' },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'center' },
  cancelarBtn: { padding: '10px 16px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', flex: 1 },
  confirmarBtn: { padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', flex: 2 }
};

export default GestionPedidos;