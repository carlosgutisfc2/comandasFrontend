import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { styles } from '../styles/CartaStyles.js'; // Conexión al archivo modular de estilos

const Carta = () => {
  const navigate = useNavigate(); 
  const [mensaje, setMensaje] = useState('');
  const [carrito, setCarrito] = useState([]); 
  const [cartOpen, setCartOpen] = useState(false); 
  const [productosMenu, setProductosMenu] = useState([]); 
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [pedidosRealizados, setPedidosRealizados] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // 🎯 coste total de lo que lleva consumido la mesa
  const [totalMesa, setTotalMesa] = useState(0);

  // Estados de control de la mesa y restricciones de acceso
  const [mesaValida, setMesaValida] = useState(true);
  const [mensajeMesaError, setMensajeMesaError] = useState('');
  const [cargandoMesa, setCargandoMesa] = useState(true);

  // Captura el ancho de la pantalla actual del dispositivo
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);

  const numMesa = localStorage.getItem('numMesa');
  const token = localStorage.getItem('token');
  
  // Comprobamos si el usuario actual es un empleado
  const esEmpleado = localStorage.getItem('role') === 'EMPLEADO';

  // Escucha cuando la pantalla cambia de tamaño (Resize)
  useEffect(() => {
    const handleResize = () => setAnchoVentana(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 📋 ACTUALIZADO: Cambiada la ruta a /mesas/{codigoMesa}/total
  const cargarTotalMesa = async () => {
    if (!numMesa || !token) return;
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`http://localhost:8080/mesas/${numMesa}/total`, config);
      setTotalMesa(typeof response.data === 'number' ? response.data : 0);
    } catch (err) {
      console.error("Error al recuperar el importe total de la mesa:", err);
    }
  };

  // 🛠️ VALIDACIÓN DE MESA Y CARGA DE PRODUCTOS AL ARRANCAR
  useEffect(() => {
    const cargarContenidoYValidarMesa = async () => {
      try {
        setCargandoMesa(true);
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // 1. Forzamos la validación contra el endpoint blindado del backend
        await axios.get(`http://localhost:8080/pedido/${numMesa}/pedidos`, config);
        setMesaValida(true);

        // 2. Cargamos el total acumulado por primera vez
        await cargarTotalMesa();

        // 3. Descargamos los productos de la carta
        const response = await axios.get('http://localhost:8080/productos', config);
        
        if (response.data && Array.isArray(response.data)) {
          setProductosMenu(response.data);
        } else {
          setProductosMenu([]);
        }
      } catch (err) {
        console.error("Error en la inicialización y validación de mesa:", err);
        if (err.response && (err.response.status === 404 || err.response.status === 403 || err.response.status === 400)) {
          setMesaValida(false);
          setMensajeMesaError('La mesa seleccionada no existe o se encuentra cerrada actualmente.');
        } else {
          setMensaje('❌ No se pudo cargar la carta desde el servidor.');
        }
      } finally {
        setCargandoProductos(false);
        setCargandoMesa(false);
      }
    };

    if (token) {
      cargarContenidoYValidarMesa();
    }
  }, [token, numMesa]);

  // 🔄 Polling reactivo cada 8 segundos para capturar cambios (borrados/añadidos del camarero)
  useEffect(() => {
    if (!token || !mesaValida) return;

    const intervaloMesa = setInterval(() => {
      cargarTotalMesa();
    }, 8000);

    return () => clearInterval(intervaloMesa);
  }, [token, mesaValida, numMesa]);


  const categoriesDisponibles = [
    'TODOS', 
    ...new Set((Array.isArray(productosMenu) ? productosMenu : []).map(p => p.categoria).filter(Boolean))
  ];

  const productosFiltrados = (Array.isArray(productosMenu) ? productosMenu : [])
    .filter((p) => {
      if (categoriaSeleccionada === 'TODOS') return true;
      return p.categoria === categoriaSeleccionada;
    })
    .sort((a, b) => {
      const asignarPrioridad = (categoria) => {
        if (!categoria) return 99;
        const cat = categoria.toLowerCase();
        if (cat.includes("bebida") || cat.includes("refresco")) return 1;
        if (cat.includes("ensalada")) return 2;
        if (cat.includes("hamburguesa") || cat.includes("carne")) return 3;
        if (cat.includes("postre") || cat.includes("dulce")) return 4;
        return 5;
      };
      return asignarPrioridad(a.categoria) - asignarPrioridad(b.categoria);
    });

  const truncarTextoInteligente = (texto) => {
    if (!texto) return '';
    const palabras = texto.split(/\s+/); 
    let conteoSinEspacios = 0;
    let palabrasAcumuladas = [];
    let seHaTruncado = false;

    for (let i = 0; i < palabras.length; i++) {
      const palabra = palabras[i];
      conteoSinEspacios += palabra.length;
      palabrasAcumuladas.push(palabra);

      if (conteoSinEspacios >= 30) {
        if (i < palabras.length - 1) seHaTruncado = true;
        break;
      }
    }
    return palabrasAcumuladas.join(' ') + (seHaTruncado ? '...' : '');
  };

  const obtenerEmojiPorCategoria = (categoria) => {
    if (!categoria) return "🍽️";
    const cat = categoria.toLowerCase();
    if (cat.includes("bebida") || cat.includes("refresco") || cat.includes("coca")) return "🥤";
    if (cat.includes("hamburguesa") || cat.includes("carne") || cat.includes("principal")) return "🍔";
    if (cat.includes("entrante") || cat.includes("patatas") || cat.includes("racion")) return "🍟";
    if (cat.includes("ensalada")) return "🥗";
    if (cat.includes("postre") || cat.includes("tarta") || cat.includes("dulce")) return "🍰";
    return "🍽️";
  };

  const agregarAlCarrito = (producto) => {
    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.id === producto.id);
      if (existe) {
        return prevCarrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCarrito, { ...producto, cantidad: 1, notas: "" }];
    });
  };

  const restarDelCarrito = (productoId) => {
    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.id === productoId);
      if (!existe) return prevCarrito;
      if (existe.cantidad === 1) {
        return prevCarrito.filter((item) => item.id !== productoId);
      }
      return prevCarrito.map((item) =>
        item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item
      );
    });
  };

  const cambiarNotas = (productoId, texto) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.id === productoId ? { ...item, notas: texto } : item
      )
    );
  };

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const precioTotalCarrito = carrito.reduce((acc, item) => acc + ((item.precio ?? 0) * item.cantidad), 0);

  const handleEnviarPedidoGlobal = async () => {
    if (carrito.length === 0) return;

    setMensaje('Enviando comanda a la cocina...');
    const pedidoData = {
      detalles: carrito.map((item) => ({
        productoId: item.id,
        shadowId: item.id, 
        cantidad: item.cantidad,
        notes: item.notas || "Sin notas"
      }))
    };

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const url = `http://localhost:8080/pedido/${numMesa}/pedidos`;

      const response = await axios.post(url, pedidoData, config);
      if (response.status === 200 || response.status === 201) {
        setMensaje('✅ ¡Tu pedido ha sido enviado con éxito!');
        setCarrito([]); 
        setCartOpen(false); 
        await handleVerMisPedidos(false);
        await cargarTotalMesa(); // Sincroniza al instante tras realizar un pedido
      }
    } catch (err) {
      setMensaje('❌ Error al procesar el pedido.');
      console.error(err);
    }
  };

  const handleVerMisPedidos = async (mostrarCarga = true) => {
    if (mostrarCarga) setCargandoHistorial(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const url = `http://localhost:8080/pedido/${numMesa}/pedidos`;
      const response = await axios.get(url, config);
      setPedidosRealizados(Array.isArray(response.data) ? response.data : []); 
    } catch (err) {
      console.error("Error al obtener pedidos de la mesa:", err);
    } finally {
      if (mostrarCarga) setCargandoHistorial(false);
    }
  };

  const obtenerNombreProducto = (id) => {
    const prod = productosMenu.find(p => p.id === id);
    return prod ? prod.nombre : `Producto #${id}`;
  };

  if (cargandoMesa) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa' }}>
        <p style={{ color: '#666', fontWeight: '600' }}>Verificando validez y seguridad de la mesa...</p>
      </div>
    );
  }

  if (!mesaValida) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #dee2e6', textAlign: 'center', maxWidth: '380px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '3.5rem' }}>🪑❌</span>
          <h2 style={{ color: '#d9534f', margin: '15px 0 10px 0', fontSize: '1.4rem' }}>Mesa No Disponible</h2>
          <p style={{ color: '#555', marginBottom: '25px', fontSize: '0.92rem', lineHeight: '1.4' }}>{mensajeMesaError}</p>
          <button 
            style={{ padding: '10px 24px', cursor: 'pointer', backgroundColor: '#212529', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem' }} 
            onClick={() => { if (esEmpleado) { navigate('/panel-empleado'); } else { navigate(-1); } }}
          >
            ↩️ Volver Atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER PRINCIPAL */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180&auto=format&fit=crop&q=60" 
            alt="Logo" 
            style={styles.logoImg} 
          />
          {anchoVentana > 540 && <h1 style={styles.restaurantName}>Gourmet App</h1>}
        </div>
        
        <div style={styles.headerRight}>
          <button 
            style={ordersOpen ? styles.historyIconBtnActive : styles.historyIconBtn} 
            onClick={() => { setOrdersOpen(!ordersOpen); setCartOpen(false); if (!ordersOpen) handleVerMisPedidos(); }}
          >
            ⏱️ Mis Pedidos
          </button>

          {/* 🎯 BOTÓN/INDICADOR DE PRECIO TOTAL ACUMULADO */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.88rem',
            fontWeight: '600',
            color: '#475569',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}>
            📋 Subtotal: <span style={{ color: '#28a745', fontWeight: '800', marginLeft: '4px' }}>{totalMesa.toFixed(2)}€</span>
          </div>

          <button style={cartOpen ? styles.cartIconBtnActive : styles.cartIconBtn} onClick={() => { setCartOpen(!cartOpen); setOrdersOpen(false); }}>
            🛒 <span style={styles.badgeCount}>{totalItems}</span>
          </button>
          
          <button style={styles.logoutBtn} onClick={() => { if (esEmpleado) { navigate('/panel-empleado'); } else { localStorage.clear(); window.location.href = '/'; } }}>
            {esEmpleado ? 'Volver al Panel' : 'Salir'}
          </button>
        </div>
      </header>

      {/* DESPLEGABLE: CARRITO */}
      {cartOpen && (
        <div style={{ ...styles.cartDropdown, right: anchoVentana > 540 ? '40px' : '4%', width: anchoVentana > 540 ? '340px' : '92%' }}>
          <h4 style={styles.dropdownTitle}>🛒 Tu Pedido Actual</h4>
          {carrito.length === 0 ? (
            <p style={styles.emptyText}>El carrito está vacío.</p>
          ) : (
            <>
              <div style={styles.dropdownScrollList}>
                {carrito.map((item) => (
                  <div key={item.id} style={styles.itemRow}>
                    <div style={styles.itemInfo}>
                      <span><strong>{item.nombre}</strong></span>
                      <span>{((item.precio ?? 0) * item.cantidad).toFixed(2)}€</span>
                    </div>
                    <div style={styles.quantityControls}>
                      <button style={styles.btnMinus} onClick={() => restarDelCarrito(item.id)}>-</button>
                      <span style={{ fontWeight: '700' }}>{item.cantidad}</span>
                      <button style={styles.btnPlus} onClick={() => agregarAlCarrito(item)}>+</button>
                    </div>
                    <input
                      type="text"
                      placeholder="Notas para cocina..."
                      value={item.notes || ""} 
                      onChange={(e) => cambiarNotas(item.id, e.target.value)}
                      style={styles.inputNotas}
                    />
                  </div>
                ))}
              </div>
              <div style={styles.cartTotalRow}>
                <span>Total:</span>
                <strong>{precioTotalCarrito.toFixed(2)}€</strong>
              </div>
              <button style={styles.btnEnviarCocina} onClick={handleEnviarPedidoGlobal}>
                🚀 Enviar Pedido a Cocina
              </button>
            </>
          )}
        </div>
      )}

      {/* DESPLEGABLE: HISTORIAL */}
      {ordersOpen && (
        <div style={{ ...styles.cartDropdown, right: anchoVentana > 540 ? '160px' : '4%', width: anchoVentana > 540 ? '340px' : '92%' }}>
          <h4 style={styles.dropdownTitle}>⏱️ Comandas Enviadas</h4>
          {cargandoHistorial ? (
            <p style={styles.emptyText}>Consultando cocina...</p>
          ) : pedidosRealizados.length === 0 ? (
            <p style={styles.emptyText}>No has enviado pedidos.</p>
          ) : (
            <div style={styles.dropdownScrollList}>
              {pedidosRealizados.map((pedido, index) => (
                <div key={pedido.id || index} style={styles.orderHistoryBlock}>
                  <div style={styles.orderHistoryHeader}>
                    <span><strong>Comanda #{index + 1}</strong></span>
                    <span style={styles.estadoBadge}>{pedido.estado || 'En cocina'}</span>
                  </div>
                  <ul style={styles.orderHistoryLines}>
                    {pedido.detalles?.map((det, i) => (
                      <li key={i} style={{ marginBottom: '4px', listStyleType: 'none' }}>
                        <b style={{ color: '#007bff' }}>{det.cantidad}x</b> {obtenerNombreProducto(det.productoId)}
                        {det.notas && det.notas !== "Sin notas" && <div style={styles.historyNotasLine}>✏️ {det.notas}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <button style={styles.btnRefreshHistory} onClick={() => { handleVerMisPedidos(true); cargarTotalMesa(); }}>
            🔄 Actualizar Estados
          </button>
        </div>
      )}

      {mensaje && <p style={styles.mensajeFeed}>{mensaje}</p>}

      {/* BARRA DE CATEGORÍAS */}
      {!cargandoProductos && (
        <div style={styles.categoryContainer}>
          {categoriesDisponibles.map((cat) => {
            const esActivo = categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                style={{
                  ...styles.categoryBtn,
                  backgroundColor: esActivo ? '#1a1a1a' : '#f1f3f5',
                  color: esActivo ? '#fff' : '#495057',
                  fontWeight: esActivo ? '700' : '500',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* LISTADO DE PRODUCTOS */}
      <div style={styles.menuLayoutBody}>
        <h3 style={styles.sectionTitle}>
          {categoriaSeleccionada === 'TODOS' ? 'Nuestra Carta' : categoriaSeleccionada}
        </h3>
        
        {cargandoProductos ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Cargando menú...</p>
        ) : (
          <div style={styles.grid}>
            {productosFiltrados.map((p) => {
              const enCarrito = carrito.find((item) => item.id === p.id);
              const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;

              return (
                <div key={p.id} style={styles.productCard}>
                  <div style={styles.prodImageWrapper}>
                    <span style={styles.prodEmojiLarge}>{obtenerEmojiPorCategoria(p.categoria)}</span>
                  </div>
                  
                  <div style={styles.prodContentBody}>
                    <span style={styles.prodCategoria}>{p.categoria || 'General'}</span>
                    <h4 style={styles.prodNombre}>{p.nombre}</h4>
                    <p style={styles.prodDescripcion}>{truncarTextoInteligente(p.descripcion)}</p>
                  </div>

                  <div style={styles.rightActionContainer}>
                    <span style={styles.prodPrecio}>{((p.precio ?? 0)).toFixed(2)}€</span>
                    
                    {cantidadEnCarrito === 0 ? (
                      <button style={styles.btnAnadirRight} onClick={() => agregarAlCarrito(p)}>
                        + Añadir
                      </button>
                    ) : (
                      <div style={styles.cardQuantityRowRight}>
                        <button style={styles.btnCardMinus} onClick={() => restarDelCarrito(p.id)}>-</button>
                        <span style={styles.cardQuantityNumber}>{cantidadEnCarrito}</span>
                        <button style={styles.btnCardPlus} onClick={() => agregarAlCarrito(p)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Carta;