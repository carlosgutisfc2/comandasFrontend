// src/styles/CartaStyles.js

export const styles = {
  // RECONSTRUIDO: Añadido padding-top de 85px para que la carta no se meta debajo del header fixed
  container: { 
    width: '100%', 
    minHeight: '100vh', 
    backgroundColor: '#fff', 
    padding: '85px 0 40px 0', 
    margin: 0, 
    fontFamily: 'system-ui, -apple-system, sans-serif', 
    boxSizing: 'border-box'
  },
  
  // CORREGIDO: Fixed ultra-compatible con aceleración por hardware (translateZ) para suavidad 60fps
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px 4%', 
    borderBottom: '1px solid #eaeaea', 
    width: '100%',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    position: 'fixed', // 👈 Vuelve a fixed para asegurar compatibilidad universal
    top: 0,
    left: 0,
    zIndex: 1000,
    transform: 'translateZ(0)', // 👈 Activa la GPU del móvil eliminando cualquier lag o flickeo
    WebkitTransform: 'translateZ(0)'
  },
  
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoImg: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' },
  restaurantName: { fontSize: '1.15rem', fontWeight: '800', color: '#111', margin: 0, whiteSpace: 'nowrap' },
  
  headerRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  
  cartIconBtn: { position: 'relative', fontSize: '1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', padding: '8px 12px' },
  cartIconBtnActive: { position: 'relative', fontSize: '1rem', background: '#e7f5ff', border: '1px solid #74c0fc', borderRadius: '10px', cursor: 'pointer', padding: '8px 12px' },
  historyIconBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: '#333', whiteSpace: 'nowrap' },
  historyIconBtnActive: { background: '#f4fce3', border: '1px solid #94d82d', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: '#5c940d', whiteSpace: 'nowrap' },
  badgeCount: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '0.6rem', fontWeight: '700' },
  logoutBtn: { padding: '8px 12px', backgroundColor: '#fff', color: '#fa5252', border: '1px solid #ffe3e3', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' },
  
  categoryContainer: { 
    display: 'flex', 
    justifyContent: 'center', 
    flexWrap: 'wrap', 
    gap: '8px', 
    padding: '10px 4%', 
    margin: '15px 0 25px 0', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  categoryBtn: { padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'all 0.15s ease' },

  menuLayoutBody: { maxWidth: '1200px', margin: '0 auto', padding: '0 4%', boxSizing: 'border-box', width: '100%' },

  // Desplegables sincronizados con la altura fija del nuevo header
  cartDropdown: { 
    position: 'fixed', 
    top: '70px', 
    backgroundColor: '#fff', 
    border: '1px solid #ccc', 
    borderRadius: '14px', 
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
    padding: '16px', 
    zIndex: 1010, 
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '55vh' 
  },
  dropdownTitle: { margin: '0 0 12px 0', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px', fontSize: '1rem', fontWeight: '700', flexShrink: 0 },
  emptyText: { color: '#888', fontSize: '0.85rem', textAlign: 'center', margin: '20px 0' },
  dropdownScrollList: { overflowY: 'auto', flexGrow: 1, marginBottom: '12px', paddingRight: '4px' },
  
  itemRow: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  itemInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  quantityControls: { display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-end', marginTop: '-10px', backgroundColor: '#f5f5f5', padding: '2px 8px', borderRadius: '20px' },
  btnMinus: { border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#888' },
  btnPlus: { border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#007bff' },
  inputNotas: { width: '100%', padding: '6px 10px', marginTop: '4px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
  
  cartTotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', margin: '12px 0', borderTop: '1px solid #eee', paddingTop: '10px', flexShrink: 0 },
  cartTotalAmount: { fontSize: '1.15rem', fontWeight: '700' },
  btnEnviarCocina: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: 0 },
  
  orderHistoryBlock: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '10px', marginBottom: '10px', border: '1px solid #eee' },
  orderHistoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem' },
  orderHistoryLines: { margin: 0, padding: 0, fontSize: '0.85rem' },
  historyNotasLine: { fontSize: '0.75rem', color: '#888', fontStyle: 'italic', marginTop: '2px' },
  estadoBadge: { backgroundColor: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' },
  btnRefreshHistory: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', flexShrink: 0 },
  mensajeFeed: { padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '10px', textAlign: 'center', margin: '12px 0', fontWeight: '600', fontSize: '0.85rem' },
  
  sectionTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', textAlign: 'left' },
  grid: { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' },
  
  productCard: { 
    border: '1px solid #e9ecef', 
    borderRadius: '16px', 
    backgroundColor: '#fff', 
    display: 'flex', 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.02)', 
    boxSizing: 'border-box', 
    width: '100%',
    padding: '14px',
    gap: '12px'
  },
  prodImageWrapper: { width: '65px', height: '65px', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 },
  prodEmojiLarge: { fontSize: '2rem' },
  
  prodContentBody: { display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'left', minWidth: 0 },
  prodCategoria: { color: '#868e96', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' },
  prodNombre: { fontSize: '1.05rem', fontWeight: '700', color: '#212529', margin: '0 0 2px 0' },
  prodDescripcion: { fontSize: '0.85rem', color: '#6c757d', margin: 0, lineHeight: '1.35' },
  
  rightActionContainer: { display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 },
  prodPrecio: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', whiteSpace: 'nowrap' },
  
  btnAnadirRight: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' },
  cardQuantityRowRight: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: '8px', padding: '5px 0', width: '95px', justifyContent: 'space-between' },
  btnCardMinus: { border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', color: '#495057', width: '30px', textAlign: 'center' },
  cardQuantityNumber: { fontWeight: '700', fontSize: '0.9rem', color: '#212529' },
  btnCardPlus: { border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', color: '#007bff', width: '30px', textAlign: 'center' }
};