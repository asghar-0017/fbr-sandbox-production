import React from "react";
import { useTenantSelection } from "../Context/TenantSelectionProvider";

const TokenDebugger = () => {
  const {
    selectedTenant,
    tokensLoaded,
    getSandboxToken,
    getCurrentToken,
    retryTokenFetch,
  } = useTenantSelection();

  const token = getCurrentToken("sandbox");
  const storedToken = localStorage.getItem("sandboxProductionToken");
  const storedTenant = localStorage.getItem("selectedTenant");

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        fontSize: "12px",
        maxWidth: "300px",
        zIndex: 1000,
      }}
    >
      <h4>Token Debugger</h4>
      <div>
        <strong>Selected Tenant:</strong>{" "}
        {selectedTenant?.sellerBusinessName || "None"}
        <br />
        <strong>Tokens Loaded:</strong> {tokensLoaded ? "Yes" : "No"}
        <br />
        <strong>Current Token:</strong>{" "}
        {token ? `${token.substring(0, 10)}...` : "None"}
        <br />
        <strong>Stored Token:</strong>{" "}
        {storedToken ? `${storedToken.substring(0, 10)}...` : "None"}
        <br />
        <strong>Stored Tenant:</strong> {storedTenant ? "Yes" : "No"}
        <br />
        <button
          onClick={retryTokenFetch}
          style={{ marginTop: "5px", padding: "2px 5px" }}
        >
          Retry Token Fetch
        </button>
      </div>
    </div>
  );
};

export default TokenDebugger;
