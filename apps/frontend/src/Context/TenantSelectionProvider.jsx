import { createContext, useContext, useState, useEffect } from 'react';
import { updateTokenManager, api } from '../API/Api';

const TenantSelectionContext = createContext();

export const TenantSelectionProvider = ({ children }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Debug effect to track tokensLoaded changes
  useEffect(() => {
    console.log('TenantSelectionProvider: tokensLoaded changed to:', tokensLoaded);
  }, [tokensLoaded]);

  useEffect(() => {
    const loadStoredTenant = async () => {
      const storedTenant = localStorage.getItem('selectedTenant');
      
      if (storedTenant) {
        try {
          const tenant = JSON.parse(storedTenant);
                    setSelectedTenant({
            ...tenant,
            sandboxTestToken: null
          });
          setTokensLoaded(false);
          
          try {
            const response = await api.get(`/admin/tenants/${tenant.tenant_id}`);
            
            if (response.data.success) {
              const tenantWithTokens = response.data.data;
              setSelectedTenant(tenantWithTokens);
              setTokensLoaded(true);
            } else {
              setTokensLoaded(false);
 
              setTimeout(() => {
                setTokensLoaded(true);
              }, 5000); // 5 seconds fallback
            }
          } catch (error) {
            console.error('Error fetching tokens for stored Company:', error);
            // Keep the tenant without tokens if we can't fetch them
            setTokensLoaded(false);
            setTimeout(() => {
              setTokensLoaded(true);
            }, 5000); // 5 seconds fallback
          }
        } catch (error) {
          console.error('Error parsing stored Company:', error);
          localStorage.removeItem('selectedCompany');
          setTokensLoaded(false);
        }
      } else {
        setTokensLoaded(false);
      }
    };
    
    loadStoredTenant();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      const { sandboxTestToken, ...tenantData } = selectedTenant;
      localStorage.setItem('selectedTenant', JSON.stringify(tenantData));
    } else {
      localStorage.removeItem('selectedTenant');
    }
  }, [selectedTenant]);

  const getSandboxToken = () => {
    const token = selectedTenant?.sandboxTestToken || null;
    return token;
  };

  const getProductionToken = () => {
    const token = selectedTenant?.sandboxTestToken || null; // Use test token for both sandbox and production
    return token;
  };

  const getCurrentToken = (environment = 'sandbox') => {
    const token = getSandboxToken();
    return token;
  };

  useEffect(() => {

    if (selectedTenant && tokensLoaded) {
      setTimeout(() => {
        updateTokenManager({
          getSandboxToken,
          getProductionToken,
          getCurrentToken
        });
      }, 50);
    } else {
      // Update with null token getters when tokens are not loaded
      updateTokenManager({
        getSandboxToken: () => null,
        getProductionToken: () => null,
        getCurrentToken: () => null
      });
    }
  }, [selectedTenant, tokensLoaded]);

  const selectTenant = async (tenant) => {
    try {
      setTokensLoaded(false);
      
      if (!tenant.sandboxTestToken) {
        const response = await api.get(`/admin/tenants/${tenant.tenant_id}`);
        if (response.data.success) {
          const tenantWithTokens = response.data.data;
          setSelectedTenant(tenantWithTokens);
          setTokensLoaded(true);
        } else {
          setSelectedTenant(tenant);
          setTokensLoaded(false);
          setTimeout(() => {
            setTokensLoaded(true);
          }, 5000); // 5 seconds fallback
        }
      } else {
        setSelectedTenant(tenant);
        setTokensLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching tenant tokens:', error);
      setSelectedTenant(tenant);
      setTokensLoaded(false);
      setTimeout(() => {
        setTokensLoaded(true);
      }, 5000); // 5 seconds fallback
    }
  };

  const retryTokenFetch = async () => {
    if (!selectedTenant) {
      console.warn('No tenant selected, cannot retry token fetch');
      return false;
    }

    try {
      setTokensLoaded(false);
      const response = await api.get(`/admin/tenants/${selectedTenant.tenant_id}`);
      if (response.data.success) {
        const tenantWithTokens = response.data.data;
        setSelectedTenant(tenantWithTokens);
        setTokensLoaded(true);
        return true;
      } else {
        console.log('TenantSelectionProvider: Failed to fetch tokens on retry');
        setTokensLoaded(false);
        return false;
      }
    } catch (error) {
      console.error('Error fetching tenant tokens on retry:', error);
      setTokensLoaded(false);
      return false;
    }
  };

  const clearSelectedTenant = () => {
    setSelectedTenant(null);
    setTokensLoaded(false);
  };

  const isTenantSelected = () => {
    return selectedTenant !== null;
  };

  const getSelectedTenantId = () => {
    return selectedTenant?.tenant_id;
  };

  const getSelectedTenantName = () => {
    return selectedTenant?.sellerBusinessName;
  };

  return (
    <TenantSelectionContext.Provider
      value={{
        selectedTenant,
        selectTenant,
        clearSelectedTenant,
        isTenantSelected,
        getSelectedTenantId,
        getSelectedTenantName,
        getSandboxToken,
        getProductionToken,
        getCurrentToken,
        loading,
        setLoading,
        tokensLoaded,
        retryTokenFetch
      }}
    >
      {children}
    </TenantSelectionContext.Provider>
  );
};

export const useTenantSelection = () => {
  const context = useContext(TenantSelectionContext);
  if (!context) {
    throw new Error('useTenantSelection must be used within a TenantSelectionProvider');
  }
  return context;
}; 