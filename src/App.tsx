import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyCases from './pages/MyCases';
import IPCGuide from './pages/IPCGuide';
import BailApplication from './pages/BailApplication';
import MyDrafts from './pages/MyDrafts';
import CaseDetails from './pages/CaseDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="predict" element={<Predict />} />
            <Route path="ipc-guide" element={<IPCGuide />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route 
              path="my-cases" 
              element={
                <ProtectedRoute>
                  <MyCases />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="bail-application" 
              element={
                <ProtectedRoute>
                  <BailApplication />
                </ProtectedRoute>
              } 
            />
            <Route path="my-drafts" 
              element={<ProtectedRoute><MyDrafts /></ProtectedRoute>} 
            />
            <Route path="case/:id" element={<CaseDetails />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
