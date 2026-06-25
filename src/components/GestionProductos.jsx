import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// 🌟 Importamos directamente tus estilos reales de la carta para asegurar coherencia 100%
import { styles as estilosCarta } from '../styles/CartaStyles.js';
import { styles as estilosBase } from '../styles/PanelEmpleadoStyles.js';

// =========================================================================
// 🛠️ ALGORITMOS REUTILIZADOS COPIADOS DE CARTA.JSX (Misma coherencia TFG)
// =========================================================================

const obtenerEmojiPorCategoria = (categoria) => {
  if (!categoria) return "🍽️";
  const cat = categoria.toLowerCase();
  if (cat.includes("bebida")) return "🥤";
  if (cat.includes("hamburguesa")) return "🍔";
  if (cat.includes("entrantes")) return "🥗";
  if (cat.includes("postre")) return "🍰";
  return "🍽️";
};

const obtenerPrioridadCategoria = (categoria) => {
  if (!categoria) return 5;
  const cat = categoria.toLowerCase();
  if (cat.includes("bebida")) return 1;
  if (cat.includes("entrante")) return 2;
  if (cat.includes("hamburguesa")) return 3;
  if (cat.includes("postre")) return 4;
  return 5;
};

const truncarTexto = (texto, limite = 60) => {
  if (!texto) return '';
  return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
};

// =========================================================================
// ⚛️ COMPONENTE PRINCIPAL
// =========================================================================
const GestionProductos = () => {
  const navigate = useNavigate();

  // Estados de catálogo y filtros idénticos a la estructura de Carta.jsx
  const [productosMenu, setProductosMenu] = useState([]); 
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  // Estados de control para el Modal de confirmación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [nuevoEstadoObjetivo, setNuevoEstadoObjetivo] = useState(null);

  // Control de alertas de la API
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [cargandoApi, setCargandoApi] = useState(false);

  // 1. 🔒 CORTAFUEGOS DE SEGURIDAD OPERATIVA
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'EMPLEADO') {
      console.warn("Acceso denegado. Se requiere cuenta de empleado.");
      localStorage.clear();
      navigate('/empleado');
    } else {
      cargarCatalogoCompleto();
    }
  }, [navigate]);

  // 📥 PETICIÓN GET: Recupera el catálogo completo (URL actualizada a /catalogo)
  const cargarCatalogoCompleto = async () => {
    setCargandoProductos(true);
    setErrorCatalogo('');
    const token = localStorage.getItem('token');

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      // 🌟 URL Corregida e idéntica a tu especificación de Spring Boot
      const response = await axios.get('http://localhost:8080/productos/catalogo', config);
      setProductosMenu(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error al recuperar catálogo:", err);
      if (err.response) {
        setErrorCatalogo(`Error (${err.response.status}): No se pudo sincronizar el catálogo.`);
      } else {
        setErrorCatalogo("Error de red: Servidor Spring Boot inaccesible.");
      }
    } finally {
      setCargandoProductos(false);
    }
  };

  // ⚡ SELECCIÓN DEL PRODUCTO PARA MODAL
  const handlePrepararCambioDisponibilidad = (producto) => {
    if (!producto) return;
    setProductoSeleccionado(producto);
    setNuevoEstadoObjetivo(!producto.disponibilidad);
    setMostrarModal(true);
  };

  // 🚀 PUT AL BACKEND: Cambio de estado con la Opción B parametrizada
  const handleConfirmarCambioEstadoBackend = async () => {
    const token = localStorage.getItem('token');
    setMostrarModal(false);
    setCargandoApi(true);
    setMensajeFeedback('');

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const url = `http://localhost:8080/productos/${productoSeleccionado.id}/disponibilidad?disponible=${nuevoEstadoObjetivo}`;
      
      await axios.put(url, {}, config);

      setMensajeFeedback(`✅ Disponibilidad de "${productoSeleccionado.nombre}" cambiada a ${nuevoEstadoObjetivo ? 'DISPONIBLE' : 'AGOTADO'}`);
      await cargarCatalogoCompleto(); 
    } catch (err) {
      console.error("Error en la actualización de disponibilidad:", err);
      setMensajeFeedback(`❌ Error: No se pudo actualizar el estado del producto.`);
    } finally {
      setCargandoApi(false);
      setProductoSeleccionado(null);
    }
  };

  // =========================================================================
  // 🧮 PROCESAMIENTO REUTILIZADO DE CARTA.JSX
  // =========================================================================
  
  const categoriesDisponibles = [
    'TODOS', 
    ...new Set(productosMenu.map(p => p.categoria).filter(Boolean))
  ];

  const productosFiltrados = productosMenu
    .filter(p => categoriaSeleccionada === 'TODOS' || p.categoria === categoriaSeleccionada)
    .sort((a, b) => obtenerPrioridadCategoria(a.categoria) - obtenerPrioridadCategoria(b.categoria));

  return (
    // Reutilizamos el contenedor base del empleado pero aplicando la tipografía de la carta
    <div style={{ ...estilosBase.wrapper, fontFamily: estilosCarta.container.fontFamily }}>
      
      {/* HEADER */}
      <div style={estilosBase.header}>
        <h2 style={estilosBase.title}>Gestión de Productos</h2>
        <p style={estilosBase.subtitle}>Control de disponibilidad y catálogo activo de la carta</p>
      </div>

      <button style={estilosBase.backBtn} onClick={() => navigate('/panel-empleado')} disabled={cargandoApi}>
        ⬅️ Volver al panel operativo
      </button>

      {/* ALERTAS FEEDBACK */}
      {mensajeFeedback && (
        <div style={{
          ...styles.errorAlert,
          backgroundColor: mensajeFeedback.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensajeFeedback.includes('✅') ? '#155724' : '#721c24',
          borderColor: mensajeFeedback.includes('✅') ? '#c3e6cb' : '#f5c6cb',
          maxWidth: '500px',
          textAlign: 'center',
          margin: '0 auto 20px auto'
        }}>
          <strong>{mensajeFeedback}</strong>
        </div>
      )}

      {/* BARRA DE CATEGORÍAS (Estructura y Estilos 100% idénticos a tu CartaStyles) */}
      {!cargandoProductos && !errorCatalogo && (
        <div style={estilosCarta.categoryContainer}>
          {categoriesDisponibles.map((cat) => {
            const esActivo = categoriaSeleccionada === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setCategoriaSeleccionada(cat)} 
                style={{ 
                  ...estilosCarta.categoryBtn, 
                  backgroundColor: esActivo ? '#1a1a1a' : '#f1f3f5', 
                  color: esActivo ? '#fff' : '#495057', 
                  fontWeight: esActivo ? '700' : '500' 
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* CONTENEDOR DE PRODUCTOS FILTRADOS (Mismo cuerpo que Carta.jsx) */}
      <div style={estilosCarta.menuLayoutBody}>
        <h3 style={estilosCarta.sectionTitle}>
          {categoriaSeleccionada === 'TODOS' ? 'Catálogo General del Restaurante' : categoriaSeleccionada}
        </h3>
        
        {cargandoProductos ? (
          <p style={styles.centerText}>Sincronizando catálogo con cocina...</p>
        ) : errorCatalogo ? (
          <div style={styles.errorAlert}>{errorCatalogo}</div>
        ) : productosFiltrados.length === 0 ? (
          <div style={styles.alertaVaciaPlano}>
            🛑 No existen productos registrados en esta sección.
          </div>
        ) : (
          // Usamos la misma disposición vertical en fila de tu carta
          <div style={estilosCarta.grid}>
            {productosFiltrados.map((p) => {
              const estaDisponible = p.disponibilidad === true || p.disponibilidad === 1;

              return (
                <div
                  key={p.id}
                  style={{
                    ...estilosCarta.productCard,
                    // Si está agotado, aplicamos un color de fondo grisáceo muy suave de alerta y borde rojo
                    backgroundColor: estaDisponible ? '#fff' : '#fff5f5',
                    borderColor: estaDisponible ? '#e9ecef' : '#fa5252',
                    opacity: estaDisponible ? 1 : 0.9
                  }}
                  onClick={() => handlePrepararCambioDisponibilidad(p)}
                >
                  <div style={estilosCarta.prodImageWrapper}>
                    <span style={estilosCarta.prodEmojiLarge}>
                      {estaDisponible ? obtenerEmojiPorCategoria(p.categoria) : '🚫'}
                    </span>
                  </div>
                  
                  <div style={estilosCarta.prodContentBody}>
                    <span style={estilosCarta.prodCategoria}>{p.categoria}</span>
                    <h4 style={{ ...estilosCarta.prodNombre, color: estaDisponible ? '#212529' : '#c92a2a' }}>
                      {p.nombre}
                    </h4>
                    <p style={estilosCarta.prodDescripcion}>{truncarTexto(p.descripcion)}</p>
                  </div>

                  {/* Lado derecho adaptado para el botón dinámico de estado */}
                  <div style={estilosCarta.rightActionContainer}>
                    <span style={estilosCarta.prodPrecio}>{p.precio.toFixed(2)}€</span>
                    
                    <span style={{
                      ...styles.badgeEstado,
                      backgroundColor: estaDisponible ? '#e7f5ff' : '#ffe3e3',
                      color: estaDisponible ? '#007bff' : '#fa5252',
                      border: estaDisponible ? '1px solid #74c0fc' : '1px solid #ffa8a8'
                    }}>
                      {estaDisponible ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN (Estilo unificado de PanelEmpleado) */}
      {mostrarModal && productoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.25rem', color: '#212529' }}>⚠️ Confirmación de Catálogo</h3>
            <p style={{ fontSize: '0.95rem', color: '#495057', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              ¿Estás seguro de que deseas cambiar el estado de <strong>{productoSeleccionado.nombre}</strong> a {' '}
              {nuevoEstadoObjetivo ? <span style={styles.badgeAbrir}>DISPONIBLE</span> : <span style={styles.badgeCerrar}>AGOTADO</span>}?
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelarBtn} onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button 
                style={{ ...styles.confirmarBtn, backgroundColor: nuevoEstadoObjetivo ? '#28a745' : '#e03131' }} 
                onClick={handleConfirmarCambioEstadoBackend}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 🎨 HOJA DE ESTILOS DE SOPORTE PARA INTERFACES Y MODALES DEL EMPLEADO
// =========================================================================
const styles = {
  badgeEstado: { fontSize: '0.8rem', fontWeight: '700', padding: '6px 14px', borderRadius: '10px', whiteSpace: 'nowrap' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(2px)' },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '90%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' },
  badgeCerrar: { backgroundColor: '#fa5252', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '800', fontSize: '0.9rem' },
  badgeAbrir: { backgroundColor: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontWeight: '800', fontSize: '0.9rem' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '15px' },
  cancelarBtn: { padding: '10px 18px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  confirmarBtn: { padding: '10px 18px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  centerText: { color: '#64748b', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' },
  errorAlert: { padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '15px' },
  alertaVaciaPlano: { width: '100%', padding: '20px', border: '1px dashed #ced4da', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#495057', fontSize: '0.95rem', fontWeight: '600', textAlign: 'center' }
};

export default GestionProductos;