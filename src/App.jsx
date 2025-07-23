import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/public/Login';
import PrivateRoute from './components/PrivateRoute';
// import Usuarios from './pages/private/Usuarios'
// import Locales from './pages/private/Locales';
import Metricas from '../src/pages/private/Metricas';
import Clientes from '../src/pages/private/Clientes';
import Categorias from '../src/pages/private/Categorias.jsx';
import Subcategorias from '../src/pages/private/Subcategorias.jsx';
import Productos from '../src/pages/private/Productos.jsx';
import Repartidores from '../src/pages/private/Repartidores.jsx'
import ZonasDespacho from '../src/pages/private/ZonasDespacho.jsx'
import Pedidos from '../src/pages/private/Pedidos.jsx'
import VentasPOS from '../src/pages/private/VentasPOS.jsx'
import HistorialVentas from '../src/pages/private/HistorialVentas.jsx';
import BannersPage from '../src/pages/private/Banners.jsx';
import Notificaciones from '../src/pages/private/Notificaciones.jsx';
import Paquetes from '../src/pages/private/Paquetes.jsx';
import CodigosDescuento from './pages/private/CodigosDescuento.jsx';
// import Reclamos from './pages/private/Reclamos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/pos" element={<VentasPOS />} />
          <Route path="/metricas" element={<Metricas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/repartidores" element={<Repartidores />} />
          <Route path="/zonasdespacho" element={<ZonasDespacho />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/historialventas" element={<HistorialVentas />} />
          <Route path="/banners" element={<BannersPage />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/paquetes" element={<Paquetes />} />
          <Route path="/codigosdescuento" element={<CodigosDescuento />} />



          <Route path="/categorias/:id/subcategorias" element={<Subcategorias />} />
          <Route path="/productos/:subcategoryId" element={<Productos />} />


          {/* <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/locales" element={<Locales />} />
          <Route path="/reclamos" element={<Reclamos />} />
          <Route path="/ajustes" element={<Ajustes />} /> */}

        </Route>
        <Route path="*" element={<Navigate to="/metricas" />} />
      </Routes>
    </Router>
  );
}

export default App;