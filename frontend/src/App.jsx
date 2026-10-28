import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminPanel from './pages/admin/AdminPanel.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminAddProduct from './pages/admin/AdminAddProduct.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/administracion" element={<AdminLayout />}>
            <Route index element={<AdminPanel />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="productos/nuevo" element={<AdminAddProduct />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
