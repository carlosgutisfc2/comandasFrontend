import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { styles } from '../styles/CartaStyles.js';

// =========================================================================
// 🛠️ FUNCIONES UTILERÍA (Fuera del componente para optimizar rendimiento)
// =========================================================================

// Asigna un emoji visual según el texto de la categoría
const obtenerEmojiPorCategoria = (categoria) => {
  if (!categoria) return "🍽️";
  const cat = categoria.toLowerCase();
  if (cat.includes("bebida")) return "🥤";
  if (cat.includes("hamburguesa")) return "🍔";
  if (cat.includes("entrantes")) return "🥗";
  if (cat.includes("postre")) return "🍰";
  return "🍽️";
};

// Controla el orden de aparición de los platos en la carta
const obtenerPrioridadCategoria = (categoria) => {
  if (!categoria) return 5;
  const cat = categoria.toLowerCase();
  if (cat.includes("bebida")) return 1;
  if (cat.includes("entrante")) return 2;
  if (cat.includes("hamburguesa")) return 3;
  if (cat.includes("postre")) return 4;
  return 5;
};

// Evita que descripciones muy largas rompan la maquetación de las tarjetas
const truncarTexto = (texto, limite = 60) => {
  if (!texto) return '';
  return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
};


// =========================================================================
// ⚛️ COMPONENTE PRINCIPAL
// =========================================================================
const Carta = () => {
  const navigate = useNavigate(); 
  
  // Estados de la aplicación
  const [mensaje, setMensaje] = useState('');
  const [carrito, setCarrito] = useState([]); 
  const [productosMenu, setProductosMenu] = useState([]); 
  const [totalMesa, setTotalMesa] = useState(0);
  const [pedidosRealizados, setPedidosRealizados] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  
  // Estados de control de visibilidad (Modales/Desplegables)
  const [cartOpen, setCartOpen] = useState(false); 
  const [ordersOpen, setOrdersOpen] = useState(false);

  // Estados de carga y validación de seguridad
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [cargandoMesa, setCargandoMesa] = useState(true);
  const [mesaValida, setMesaValida] = useState(true);
  const [mensajeMesaError, setMensajeMesaError] = useState('');

  // Control de diseño responsivo
  const [anchoVentana, setAnchoVentana] = useState(window.innerWidth);

  // Datos de sesión local
  const numMesa = localStorage.getItem('numMesa');
  const token = localStorage.getItem('token');
  const esEmpleado = localStorage.getItem('role') === 'EMPLEADO';

  // Manejador del tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setAnchoVentana(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Petición al endpoint para obtener el total acumulado real en la base de datos
  const cargarTotalMesa = async () => {
    if (!numMesa || !token) return;
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`http://localhost:8080/mesas/${numMesa}/total`, config);
      setTotalMesa(typeof response.data === 'number' ? response.data : 0); //Al hacer la peticion, si el backend responde con un número, lo asignamos. Si no, ponemos 0 para evitar errores de NaN.
    } catch (err) {
      console.error("Error al recuperar el importe total de la mesa:", err);
    }
  };

  // Inicialización: Validar mesa activa y descargar la lista de productos
  useEffect(() => {
    const inicializarCarta = async () => {
      if (!token) return;
      try {
        setCargandoMesa(true); //Hace que el componente muestre un mensaje de validación mientras se verifica la mesa y se cargan los productos, evitando mostrar la carta vacía o con errores.
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        setMesaValida(true); //Si la petición es exitosa, la mesa es válida y podemos mostrar la carta. Si no, se lanzará un error.
        // 2. Cargamos el subtotal de consumo
        await cargarTotalMesa();

        // 3. Obtenemos los productos disponibles del catálogo
        const response = await axios.get('http://localhost:8080/productos?disponibilidad=true', config);
        setProductosMenu(Array.isArray(response.data) ? response.data : []);

      } catch (err) {
        console.error("Error en la inicialización:", err);
        if (err.response && [400, 403, 404].includes(err.response.status)) {
          setMesaValida(false);
          setMensajeMesaError('La mesa seleccionada no existe o se encuentra cerrada actualmente.');
        } else {
          setMensaje('❌ No se pudo cargar la carta desde el servidor.');
        }
      } finally {
        setCargandoProductos(false); //Dependiendo del valor que tenga mostrara un texto de carga o la carta con los productos, evitando mostrar una carta vacía mientras se hace la petición.
        setCargandoMesa(false); //Dependiendo del valor que tenga mostrara un texto de validación o la carta con los productos, evitando mostrar la carta mientras se valida la mesa.
      }
    };

    inicializarCarta();
  }, [token, numMesa]); //Se dispara solo si el token o el número de mesa cambian (no debería ocurrir durante la sesión)

  // Sincronización pasiva (Polling): Actualiza el subtotal cada 8 segundos por si hay cambios del camarero
  useEffect(() => {
    if (!token || !mesaValida) return;

    const intervaloMesa = setInterval(() => {
      cargarTotalMesa();
    }, 8000);

    return () => clearInterval(intervaloMesa);
  }, [token, mesaValida, numMesa]);

  // Generación dinámica de la barra de categorías filtradas
  const categoriesDisponibles = [
    'TODOS', 
    ...new Set(productosMenu.map(p => p.categoria).filter(Boolean)) //El set se encarga de eliminar categorías duplicadas, y el filter(Boolean) elimina cualquier categoría que sea null, undefined o vacía. Y los ... convierte el Set en un array.
  ];

  // Filtrado y ordenación inteligente del catálogo en pantalla
  const productosFiltrados = productosMenu
    .filter(p => categoriaSeleccionada === 'TODOS' || p.categoria === categoriaSeleccionada) //Si la categoria es "TODOS", se muestran todos los productos y si no se filtran por la categoria.
    .sort((a, b) => obtenerPrioridadCategoria(a.categoria) - obtenerPrioridadCategoria(b.categoria)); //El sort ordena los productos por la prioridad que pusimos al principio
  // El método sort ordena los productos basándose en la prioridad asignada a su categoría, asegurando que siempre se muestren en el mismo orden lógico (bebidas primero, luego entrantes, etc.) independientemente del orden en que el backend los devuelva.

  // =========================================================================
  // 🛒 GESTIÓN DEL CARRITO DE COMPRAS LOCAL
  // =========================================================================

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => { //Coge el carrito como estaba antes de cambiar nada
      const existe = prev.find(item => item.id === producto.id); //Si el producto ya existe en el carrito, devuelve el producto, si no devuelve undefined
      if (existe) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item); //Se mapea el carrito y se suma 1 la cantidad del producto que coincide con el id, y el resto de productos se dejan igual (notas, etc).
      }
      return [...prev, { ...producto, cantidad: 1, notas: "" }]; // Si no existe entonces se añade el producto al carrito (prev) con cantidad 1 y sin notas.
    });
  };

  const restarDelCarrito = (productoId) => {
    setCarrito((prev) => {
      const existe = prev.find(item => item.id === productoId);
      if (!existe) return prev;
      if (existe.cantidad === 1) {
        return prev.filter(item => item.id !== productoId); //Crea un array nuevo con los valores que no coincidan con el id del producto.
      }
      return prev.map(item => item.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item); //Recorre el carrito y le resta 1 a la cantidad del producto que coincide con el id
    });
  };

  const cambiarNotas = (productoId, texto) => {
    setCarrito((prev) => prev.map(item => item.id === productoId ? { ...item, notas: texto } : item)); //Recorre el carrito y cambia las notas del producto que coincide con el id
  };

  // Cálculos reactivos basados en el estado del carrito
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0); //Suma la cantidad de cada producto del carrito
  const precioTotalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0); //Suma el precio de cada producto multiplicado por su cantidad


  // =========================================================================
  // 🚀 INTERFACES DE COMUNICACIÓN CON EL BACKEND (POST / GET)
  // =========================================================================

  const handleEnviarPedidoGlobal = async () => {
  if (carrito.length === 0) return;

  setMensaje('Enviando comanda a la cocina...');
  
  const pedidoData = { //Coge el número de mesa y el carrito para enviarlo al backend para hacer el pedido
    codigo_mesa: numMesa,
    detalles: carrito.map(item => ({
      productoId: item.id,   
      cantidad: item.cantidad, 
      notas: item.notas || "Sin notas" /*Si no tiene notas se enviara "Sin notas" */
    }))
  };

  try {
    const config = { headers: { 'Authorization': `Bearer ${token}` } };
    const url = `http://localhost:8080/pedido/${numMesa}/pedidos`;

    const response = await axios.post(url, pedidoData, config); 
    if (response.status === 200 || response.status === 201) {
      setMensaje('✅ ¡Tu pedido ha sido enviado con éxito!');
      setCarrito([]); //Vacia el carrito
      setCartOpen(false); //Cierra la ventana del carrito
      await cargarTotalMesa(); 
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
      setPedidosRealizados([]); //Si la mesa se cierra mientras estoy viendo el historial, se vacía para que no se vea información de la mesa que tenian.
    } finally {
      setCargandoHistorial(false);
    }
  };

  // =========================================================================
  // 🖥️ CONTROL DE RENDERIZADOS Y CORTAFUEGOS DE SEGURIDAD
  // =========================================================================

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
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180&auto=format&fit=crop&q=60" alt="Logo" style={styles.logoImg} />
          {anchoVentana > 540 && <h1 style={styles.restaurantName}>Gourmet App</h1>} {/* Por si la pantalla es muy chica */}
        </div>
        
        <div style={styles.headerRight}>
          <button style={ordersOpen ? styles.historyIconBtnActive : styles.historyIconBtn} onClick={() => { setOrdersOpen(!ordersOpen); setCartOpen(false); if (!ordersOpen) handleVerMisPedidos(); }}> {/*Cierra el carrito y abre los pedidos*/}
            ⏱️ Mis Pedidos
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '600', color: '#475569', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', userSelect: 'none', whiteSpace: 'nowrap' }}>
            📋 Subtotal: <span style={{ color: '#28a745', fontWeight: '800', marginLeft: '4px' }}>{totalMesa.toFixed(2)}€</span> {/*2 decimales */}
          </div>

          <button style={cartOpen ? styles.cartIconBtnActive : styles.cartIconBtn} onClick={() => { setCartOpen(!cartOpen); setOrdersOpen(false); }}>
            🛒 <span style={styles.badgeCount}>{totalItems}</span>
          </button>
          
          <button style={styles.logoutBtn} onClick={() => { if (esEmpleado) { navigate('/panel-empleado'); } else { localStorage.clear(); window.location.href = '/'; } }}> {/*Si eres empleado te lleva al panel, si eres cliente cierra sesión y te lleva al login pero tambien te borra el JWT y numerod de mesa */}
            {esEmpleado ? 'Volver al Panel' : 'Salir'}
          </button>
        </div>
      </header>

      {/* DESPLEGABLE: CARRITO */}
      {/*No pongo pantallas de carga porque los elementos se cargan rápidamente desde el navegador */}
      {cartOpen  && (
        <div style={{ ...styles.cartDropdown, right: anchoVentana > 540 ? '40px' : '4%', width: anchoVentana > 540 ? '340px' : '92%' }}> {/*Pongo los 3 puntos para meter todos los estilos, si no los pongo da error */}
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
                      <span>{(item.precio * item.cantidad).toFixed(2)}€</span> {/*Precio por cantidad con 2 decimales */}
                    </div>
                    <div style={styles.quantityControls}>
                      <button style={styles.btnMinus} onClick={() => restarDelCarrito(item.id)}>-</button>
                      <span style={{ fontWeight: '700' }}>{item.cantidad}</span>
                      <button style={styles.btnPlus} onClick={() => agregarAlCarrito(item)}>+</button>
                    </div>
                    <input type="text" placeholder="Notas para cocina..." value={item.notas || ""} onChange={(e) => cambiarNotas(item.id, e.target.value)} style={styles.inputNotas} /> {/*Si no hay notas entonces muestra un string vacio. Envia a cambiarNotas el id y las notas */}
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
                    <span><strong>Comanda #{pedido.numeroPedido}</strong></span>
                    <span style={styles.estadoBadge}>{pedido.estado}</span>
                  </div>
                  <ul style={styles.orderHistoryLines}>
                    {pedido.detalles?.map((det, i) => (
                      <li key={i} style={{ marginBottom: '4px', listStyleType: 'none' }}> {/*El key se usa para identificar cada elemento de la lista */}
                        <b style={{ color: '#007bff' }}>{det.cantidad}x</b> {det.nombreProducto}
                        {det.notas && det.notas !== "Sin notas" && <div style={styles.historyNotasLine}>✏️ {det.notas}</div>} {/*Si hay notas y no son "Sin notas" las muestra debajo*/}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <button style={styles.btnRefreshHistory} onClick={() => { handleVerMisPedidos(true); cargarTotalMesa(); }}> {/*Al hacer click actualiza el historial y el total de la mesa */}
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
              <button key={cat} onClick={() => setCategoriaSeleccionada(cat)} style={{ ...styles.categoryBtn, backgroundColor: esActivo ? '#1a1a1a' : '#f1f3f5', color: esActivo ? '#fff' : '#495057', fontWeight: esActivo ? '700' : '500' }}>
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* LISTADO DE PRODUCTOS */}
      <div style={styles.menuLayoutBody}>
        <h3 style={styles.sectionTitle}>
          {categoriaSeleccionada === 'TODOS' ? 'Nuestra Carta' : categoriaSeleccionada} {/*Al haber cambiado el estado de la categoría seleccionada filtra por uno u otro*/}
        </h3>
        
        {cargandoProductos ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Cargando menú...</p>
        ) : (
          <div style={styles.grid}>
            {productosFiltrados.map((p) => {
              const enCarrito = carrito.find(item => item.id === p.id);
              const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;

              return (
                <div key={p.id} style={styles.productCard}> {/*key es el identificador */}
                  <div style={styles.prodImageWrapper}>
                    <span style={styles.prodEmojiLarge}>{obtenerEmojiPorCategoria(p.categoria)}</span>
                  </div>
                  
                  <div style={styles.prodContentBody}>
                    <span style={styles.prodCategoria}>{p.categoria}</span>
                    <h4 style={styles.prodNombre}>{p.nombre}</h4>
                    <p style={styles.prodDescripcion}>{truncarTexto(p.descripcion)}</p>
                  </div>

                  <div style={styles.rightActionContainer}>
                    <span style={styles.prodPrecio}>{p.precio.toFixed(2)}€</span>
                    
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