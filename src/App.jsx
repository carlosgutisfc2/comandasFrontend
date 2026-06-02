import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importación de todos tus componentes de la carpeta components/
import LoginMesa from './components/LoginMesa';
import LoginEmpleado from './components/LoginEmpleado';
import PanelEmpleado from './components/PanelEmpleado';
import Carta from './components/Carta';
import GestionPedidos from './components/GestionPedidos';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta 1: Acceso de clientes por código de mesa */}
        <Route path="/" element={<LoginMesa />} />

        {/* Ruta 2: Acceso privado para los empleados del restaurante */}
        <Route path="/empleado" element={<LoginEmpleado />} />

        {/* Ruta 3: NUEVA - Central de opciones intermedia para el empleado */}
        <Route path="/panel-empleado" element={<PanelEmpleado />} />

        {/* Ruta 4: La carta digital (común para clientes y empleados) */}
        <Route path="/carta" element={<Carta />} />

        {/* Ruta 5: Monitorización e historial global de todas las mesas */}
        <Route path="/gestion-pedidos" element={<GestionPedidos />} />
      </Routes>
    </Router>
  );
}

export default App;