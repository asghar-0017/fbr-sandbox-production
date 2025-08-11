import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../API/Api";
import Swal from "sweetalert2";

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [isTenantAuthenticated, setIsTenantAuthenticated] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenant, setTenant] = useState(null);

  const navigate = useNavigate();

  const tenantLogin = async (sellerNtnCnic, password) => {
    try {
      setTenantLoading(true);
      
      const response = await api.post('/tenant-auth/login', {
        sellerNTNCNIC: sellerNtnCnic,
        password
      });

      if (response.data.success) {
        const { token, tenant: tenantData } = response.data.data;
        
        // Store tenant authentication data
        localStorage.setItem('tenantToken', token);
        localStorage.setItem('tenantId', tenantData.tenant_id);
        localStorage.setItem('tenantData', JSON.stringify(tenantData));
        
        setTenant(tenantData);
        setIsTenantAuthenticated(true);
        
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome ${tenantData.sellerBusinessName}`,
          timer: 2000,
          showConfirmButton: false
        });

        navigate("/buyers");
        
        // Reload the screen after successful tenant login
        setTimeout(() => {
          window.location.reload();
        }, 100);
        
        return true;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      console.error('Company login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
      
      throw new Error(errorMessage);
    } finally {
      setTenantLoading(false);
    }
  };

  const tenantLogout = () => {
    // Clear tenant data
    localStorage.removeItem('tenantToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenantData');
    
    setIsTenantAuthenticated(false);
    setTenant(null);
    
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have been successfully logged out',
      timer: 2000,
      showConfirmButton: false
    });
    
    navigate("/tenant-login");
    
    // Reload the screen after tenant logout
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const verifyTenantToken = async () => {
    try {
      const token = localStorage.getItem('tenantToken');
      const tenantData = localStorage.getItem('tenantData');
      
      if (!token || !tenantData) {
        setIsTenantAuthenticated(false);
        setTenant(null);
        setTenantLoading(false);
        return false;
      }

      const response = await api.get('/tenant-auth/verify-token');

      if (response.data.success) {
        const tenant = JSON.parse(tenantData);
        setTenant(tenant);
        setIsTenantAuthenticated(true);
        return true;
      } else {
        // Token is invalid
        localStorage.removeItem('tenantToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantData');
        setIsTenantAuthenticated(false);
        setTenant(null);
        return false;
      }
    } catch (error) {
      console.error('Tenant token verification error:', error);
      localStorage.removeItem('tenantToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantData');
      setIsTenantAuthenticated(false);
      setTenant(null);
      return false;
    }
  };

  useEffect(() => {
    const initializeTenantAuth = async () => {
      try {
        setTenantLoading(true);
        
        const storedTenant = localStorage.getItem('tenantData');
        const token = localStorage.getItem('tenantToken');
        
        if (token && storedTenant) {
          // Verify token with server
          const isValid = await verifyTenantToken();
          
          if (!isValid) {
            // Token is invalid, clear everything
            localStorage.removeItem('tenantToken');
            localStorage.removeItem('tenantId');
            localStorage.removeItem('tenantData');
            setIsTenantAuthenticated(false);
            setTenant(null);
          }
        } else {
          // No stored data
          setIsTenantAuthenticated(false);
          setTenant(null);
        }
      } catch (error) {
        console.error('Company auth initialization error:', error);
        localStorage.removeItem('tenantToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantData');
        setIsTenantAuthenticated(false);
        setTenant(null);
      } finally {
        setTenantLoading(false);
      }
    };

    initializeTenantAuth();
  }, []);

  return (
    <TenantContext.Provider
      value={{ 
        isTenantAuthenticated, 
        tenant,
        tenantLogin, 
        tenantLogout, 
        tenantLoading,
        verifyTenantToken
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext); 