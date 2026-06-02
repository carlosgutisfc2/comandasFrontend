// src/styles/PanelEmpleadoStyles.js

export const styles = {
  wrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto',
    padding: '24px',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '20px',
    width: '100%',
    maxWidth: '600px'
  },
  title: { fontSize: '1.6rem', fontWeight: '800', color: '#212529', margin: '0 0 6px 0' },
  subtitle: { fontSize: '0.95rem', color: '#6c757d', margin: 0 },
  
  // Rejilla elástica para los dos bloques grandes
  gridMenu: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    width: '100%',
    maxWidth: '600px',
    boxSizing: 'border-box'
  },
  
  // Estilo para las opciones cuadradas gigantes
  menuSquare: {
    backgroundColor: '#fff',
    border: '1px solid #e9ecef',
    borderRadius: '20px',
    padding: '35px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    outline: 'none'
  },
  iconWrapper: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    fontSize: '2.4rem'
  },
  squareTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#212529', margin: '0 0 8px 0', textAlign: 'center' },
  squareDesc: { fontSize: '0.85rem', color: '#868e96', margin: 0, textAlign: 'center', lineHeight: '1.4' },

  // Vista secundaria: Selección de mesa
  backBtn: {
    alignSelf: 'flex-start',
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ced4da',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.88rem',
    color: '#495057',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  tableCard: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    boxSizing: 'border-box',
    border: '1px solid #e9ecef'
  },
  inputMesa: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #ced4da',
    fontSize: '1rem',
    textAlign: 'center',
    margin: '18px 0',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  submitMesaBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer'
  }
};