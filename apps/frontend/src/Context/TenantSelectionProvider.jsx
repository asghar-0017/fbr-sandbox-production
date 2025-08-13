import { createContext, useContext, useState, useEffect } from "react";
import { updateTokenManager, api } from "../API/Api";

const TenantSelectionContext = createContext();

export const TenantSelectionProvider = ({ children }) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Debug effect to track tokensLoaded changes
  useEffect(() => {
    console.log(
      "TenantSelectionProvider: tokensLoaded changed to:",
      tokensLoaded,
      "Selected tenant:",
      selectedTenant ? selectedTenant.sellerBusinessName : "None",
      "Token available:",
      selectedTenant?.sandboxProductionToken ? "Yes" : "No"
    );
  }, [tokensLoaded, selectedTenant]);

  useEffect(() => {
    const loadStoredTenant = async () => {
      const storedTenant = localStorage.getItem("selectedTenant");
      console.log(
        "Loading stored tenant from localStorage:",
        storedTenant ? "Found" : "Not found"
      );

      if (storedTenant) {
        try {
          const tenant = JSON.parse(storedTenant);
          console.log("Parsed tenant data:", {
            name: tenant.sellerBusinessName,
            hasToken: !!tenant.sandboxProductionToken,
            tokenLength: tenant.sandboxProductionToken?.length || 0,
          });

          setSelectedTenant(tenant);

          // Check if the tenant has a token
          if (tenant.sandboxProductionToken) {
            console.log(
              "Token found in stored tenant, setting tokensLoaded to true"
            );
            setTokensLoaded(true);
          } else {
            // Check fallback location
            const fallbackToken = localStorage.getItem(
              "sandboxProductionToken"
            );
            if (fallbackToken) {
              console.log(
                "Token found in fallback location, updating tenant and setting tokensLoaded to true"
              );
              tenant.sandboxProductionToken = fallbackToken;
              setSelectedTenant(tenant);
              setTokensLoaded(true);
            } else {
              console.log(
                "No token found in stored tenant or fallback, setting tokensLoaded to false"
              );
              setTokensLoaded(false);

              // Try to fetch tokens from server
              try {
                const response = await api.get(
                  `/admin/tenants/${tenant.tenant_id}`
                );

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
                console.error(
                  "Error fetching tokens for stored Company:",
                  error
                );
                setTokensLoaded(false);
                setTimeout(() => {
                  setTokensLoaded(true);
                }, 5000); // 5 seconds fallback
              }
            }
          }
        } catch (error) {
          console.error("Error parsing stored Company:", error);
          localStorage.removeItem("selectedTenant");
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
      // Store the complete tenant data including the token
      localStorage.setItem("selectedTenant", JSON.stringify(selectedTenant));

      // Also store the token separately as a fallback
      if (selectedTenant.sandboxProductionToken) {
        localStorage.setItem(
          "sandboxProductionToken",
          selectedTenant.sandboxProductionToken
        );
      } else {
        localStorage.removeItem("sandboxProductionToken");
      }
    } else {
      localStorage.removeItem("selectedTenant");
      localStorage.removeItem("sandboxProductionToken");
    }
  }, [selectedTenant]);

  const getSandboxToken = () => {
    // First try to get token from selectedTenant
    let token = selectedTenant?.sandboxProductionToken || null;

    // Fallback: check if token is stored separately in localStorage
    if (!token) {
      const storedToken = localStorage.getItem("sandboxProductionToken");
      if (storedToken) {
        console.log("Found token in localStorage fallback");
        token = storedToken;
      }
    }

    return token;
  };

  const getProductionToken = () => {
    // Use the same token for both sandbox and production
    return getSandboxToken();
  };

  const getCurrentToken = (environment = "sandbox") => {
    const token = getSandboxToken();
    return token;
  };

  useEffect(() => {
    if (selectedTenant && tokensLoaded) {
      setTimeout(() => {
        updateTokenManager({
          getSandboxToken,
          getProductionToken,
          getCurrentToken,
        });
      }, 50);
    } else if (selectedTenant && !tokensLoaded) {
      // If we have a tenant but tokens are not loaded, try to fetch them
      const fetchTokensIfNeeded = async () => {
        if (!selectedTenant.sandboxProductionToken) {
          console.log(
            "Attempting to fetch tokens for tenant:",
            selectedTenant.sellerBusinessName
          );
          await retryTokenFetch();
        }
      };

      // Add a small delay before retrying to avoid immediate retries
      setTimeout(fetchTokensIfNeeded, 1000);

      // Update with null token getters when tokens are not loaded
      updateTokenManager({
        getSandboxToken: () => null,
        getProductionToken: () => null,
        getCurrentToken: () => null,
      });
    } else {
      // Update with null token getters when no tenant is selected
      updateTokenManager({
        getSandboxToken: () => null,
        getProductionToken: () => null,
        getCurrentToken: () => null,
      });
    }
  }, [selectedTenant, tokensLoaded]);

  const selectTenant = async (tenant) => {
    try {
      setTokensLoaded(false);

      if (!tenant.sandboxProductionToken) {
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
      console.error("Error fetching tenant tokens:", error);
      setSelectedTenant(tenant);
      setTokensLoaded(false);
      setTimeout(() => {
        setTokensLoaded(true);
      }, 5000); // 5 seconds fallback
    }
  };

  const retryTokenFetch = async () => {
    if (!selectedTenant) {
      console.warn("No tenant selected, cannot retry token fetch");
      return false;
    }

    try {
      setTokensLoaded(false);
      const response = await api.get(
        `/admin/tenants/${selectedTenant.tenant_id}`
      );
      if (response.data.success) {
        const tenantWithTokens = response.data.data;
        setSelectedTenant(tenantWithTokens);
        setTokensLoaded(true);
        console.log(
          "Successfully fetched and updated tokens for tenant:",
          tenantWithTokens.sellerBusinessName
        );
        return true;
      } else {
        console.log("TenantSelectionProvider: Failed to fetch tokens on retry");
        setTokensLoaded(false);
        return false;
      }
    } catch (error) {
      console.error("Error fetching tenant tokens on retry:", error);
      setTokensLoaded(false);
      return false;
    }
  };

  // Function to validate and refresh token if needed
  const validateAndRefreshToken = async () => {
    if (!selectedTenant?.sandboxProductionToken) {
      console.log("No token available, attempting to fetch...");
      return await retryTokenFetch();
    }

    // For now, we'll assume the token is valid if it exists
    // In a real implementation, you might want to validate the token with FBR API
    console.log("Token validation: Token exists, assuming valid");
    return true;
  };

  const clearSelectedTenant = () => {
    setSelectedTenant(null);
    setTokensLoaded(false);
    localStorage.removeItem("selectedTenant");
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
        retryTokenFetch,
        validateAndRefreshToken,
      }}
    >
      {children}
    </TenantSelectionContext.Provider>
  );
};

export const useTenantSelection = () => {
  const context = useContext(TenantSelectionContext);
  if (!context) {
    throw new Error(
      "useTenantSelection must be used within a TenantSelectionProvider"
    );
  }
  return context;
};
