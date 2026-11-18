import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { RequireAdmin, RequireAuth } from './components/RouteGuards.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminPanel from './pages/admin/AdminPanel.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminProductForm from './pages/admin/AdminProductForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminAddCategory from './pages/admin/AdminAddCategory.jsx';
import AdminFeatures from './pages/admin/AdminFeatures.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mi-cuenta" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/administracion" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminPanel />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="productos/nuevo" element={<AdminProductForm />} />
            <Route path="productos/:id/editar" element={<AdminProductForm />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="categorias/nueva" element={<AdminAddCategory />} />
            <Route path="caracteristicas" element={<AdminFeatures />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
