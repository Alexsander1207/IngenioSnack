import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import AdminPortal from './pages/AdminPortal';
import { ToastContainer } from './components/Toast';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/" />;
  if (role && user.rol !== role) return <Navigate to="/" />;
  return children;
};

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/estudiante/*" element={<PrivateRoute role="estudiante"><StudentPortal /></PrivateRoute>} />
        <Route path="/admin/*" element={<PrivateRoute role="vendedor"><AdminPortal /></PrivateRoute>} />
      </Routes>
      <ToastContainer />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
