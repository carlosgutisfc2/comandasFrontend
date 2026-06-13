import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginEmpleado = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/empleados/login', formData);

      if (response.data && response.data.token) {
        // Almacenamos los datos de sesión esenciales
        localStorage.setItem('token', response.data.token); //Guarda en el navegador. Lo llama Token a lo que viene como dato de respuesta en lo que se llama Token
        localStorage.setItem('role', 'EMPLEADO'); // 👈 LÍNEA NUEVA: Guarda el rol del trabajador
        
        console.log("Login de empleado exitoso. Redirigiendo a la centralita...");
        navigate('/panel-empleado'); 
      } else {
        setError('Credenciales incorrectas o usuario no activo.');
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Error al conectar con la API de empleados. Revisa el backend.');
      }
      console.error("Error en login de empleado:", err);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>Acceso Empleados</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Introduce tus credenciales de trabajo</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="username"
            placeholder="Usuario o Código de Empleado"
            value={formData.username}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña Secreta"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          
          {error && <div style={styles.errorBox}>{error}</div>}
          
          <button type="submit" style={styles.button}>
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

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
    backgroundColor: '#343a40', 
    overflowY: 'auto',
    padding: '20px',      
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch'
  },
  card: { 
    padding: '2.5rem', 
    backgroundColor: '#fff', 
    borderRadius: '15px', 
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)', 
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
    backgroundColor: '#007bff', 
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

export default LoginEmpleado;