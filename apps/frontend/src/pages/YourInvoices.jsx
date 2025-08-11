import React from "react";
import BasicTable from "../component/BasicComponent";
import TenantSelectionPrompt from "../component/TenantSelectionPrompt";

const YourInvoices = () => {
  return (
    <TenantSelectionPrompt>
      <BasicTable />
    </TenantSelectionPrompt>
  );
};

export default YourInvoices;
