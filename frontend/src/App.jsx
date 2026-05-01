import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home         from './pages/Home';
import Login        from './pages/Login';
import Signup       from './pages/Signup';
import Profile      from './pages/Profile';
import Dashboard    from './pages/Dashboard';
import RouteEnquiry from './pages/RouteEnquiry';
import FAQ          from './pages/FAQ';
import Blog         from './pages/Blog';

import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/login"     element={<Login />} />
              <Route path="/signup"    element={<Signup />} />
              <Route path="/faq"       element={<FAQ />} />
              <Route path="/blog"      element={<Blog />} />
              <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/route"     element={<ProtectedRoute><RouteEnquiry /></ProtectedRoute>} />
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🛡️</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>404 — Page Not Found</h2>
                  <a href="/" className="btn btn-primary" style={{ marginTop: 24, textDecoration: 'none', display: 'inline-flex' }}>Go Home</a>
                </div>
              } />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
