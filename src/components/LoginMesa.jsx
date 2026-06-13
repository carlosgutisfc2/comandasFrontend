import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginMesa = () => {
  // Estado para capturar los datos del formulario
  const [formData, setFormData] = useState({ mesa: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Función para manejar los cambios en los inputs
  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { mesa, password } = formData;

    try {
      // LLAMADA AL BACKEND:
      const response = await axios.post(
        `http://localhost:8080/mesas/${mesa}/token`, 
        { password: password }
      );

      if (response.data && response.data.token) {
        // Guardamos el token y el código de mesa para usarlo en la carta
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('numMesa', mesa);
        
        console.log("Login exitoso. Token guardado.");
        navigate('/carta'); 
      } else {
        setError('La contraseña introducida no es correcta.');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`La mesa "${mesa}" no existe en el sistema.`);
      } else {
        setError('No se pudo conectar con el servidor. Verifica el CORS.');
      }
      console.error("Error en el login:", err);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>Acceso Clientes</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Introduce el código de tu mesa</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="mesa"
            placeholder="Código de Mesa (Ej: MESA123)"
            value={formData.mesa}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña de la mesa"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          
          {error && <div style={styles.errorBox}>{error}</div>}
          
          <button type="submit" style={styles.button}>
            Entrar a la Carta
          </button>
        </form>
      </div>
    </div>
  );
};

// --- OBJETO DE ESTILOS ÚNICO Y SIN ERRORES DE SINTAXIS ---
const styles = {
  wrapper: { 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0f2f5',
    overflowY: 'auto',
    padding: '20px',      
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch'
  },
  card: { 
    padding: '2.5rem', 
    backgroundColor: '#fff', 
    borderRadius: '15px', 
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)', 
    textAlign: 'center', 
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { 
    padding: '14px', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: { 
    padding: '14px', 
    backgroundColor: '#28a745', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '1rem', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    marginTop: '10px'
  },
  errorBox: { 
    color: '#721c24', 
    backgroundColor: '#f8d7da', 
    padding: '10px', 
    borderRadius: '5px', 
    fontSize: '0.9rem',
    border: '1px solid #f5c6cb'
  }
};

export default LoginMesa;