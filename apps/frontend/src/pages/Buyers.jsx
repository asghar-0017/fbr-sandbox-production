import React, { useEffect, useState } from 'react';
import { api } from '../API/Api';
import BuyerModal from '../component/BuyerModal';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import BuyerTable from '../component/BuyerTable';
import { Button } from '@mui/material';
import TenantSelectionPrompt from '../component/TenantSelectionPrompt';
import { useTenantSelection } from '../Context/TenantSelectionProvider';

const Buyers = () => {
  const { selectedTenant } = useTenantSelection();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [filter, setFilter] = useState('All'); 

  const openModal = (buyer = null) => {
    setSelectedBuyer(buyer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBuyer(null);
    setIsModalOpen(false);
  };

  const handleSave = async (buyerData) => {
    try {
      // Use the standardized field names directly
      const transformedData = {
        buyerNTNCNIC: buyerData.buyerNTNCNIC,
        buyerBusinessName: buyerData.buyerBusinessName,
        buyerProvince: buyerData.buyerProvince,
        buyerAddress: buyerData.buyerAddress,
        buyerRegistrationType: buyerData.buyerRegistrationType
      };

      if (selectedBuyer) {
        // Update existing buyer
        const response = await api.put(`/tenant/${selectedTenant.tenant_id}/buyers/${selectedBuyer.id}`, transformedData);
        setBuyers(buyers.map(b => b.id === selectedBuyer.id ? response.data.data : b));
        toast.success('Buyer updated successfully! The changes have been saved.');
      } else {
        // Create new buyer
        const response = await api.post(`/tenant/${selectedTenant.tenant_id}/buyers`, transformedData);
        setBuyers([...buyers, response.data.data]);
        toast.success('Buyer added successfully! The buyer has been added to your system.');
      }
      
      // Only close modal on success
      closeModal();
    } catch (error) {
      console.error('Error saving buyer:', error);
      
      // Handle specific error cases with human-readable messages
      let errorMessage = 'Error saving buyer.';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          if (data.message && data.message.includes("already exists")) {
            errorMessage = "A buyer with this NTN/CNIC already exists. Please use a different NTN/CNIC.";
          } else if (data.message && data.message.includes("validation")) {
            errorMessage = "Please check your input data. Some fields may be invalid or missing.";
          } else {
            errorMessage = data.message || "Invalid data provided. Please check all fields.";
          }
        } else if (status === 409) {
          errorMessage = "This buyer already exists in our system.";
        } else if (status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage = data.message || "An error occurred while saving the buyer.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error but don't close modal - let user fix the issue
      toast.error(errorMessage);
      // Don't close modal on error - let user fix the issue
    }
  };

  const handleDelete = async (buyerId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/tenant/${selectedTenant.tenant_id}/buyers/${buyerId}`);
          setBuyers(buyers.filter(b => b.id !== buyerId));
          toast.success('Buyer deleted successfully! The buyer has been removed from your system.');
        } catch (error) {
          console.error('Error deleting buyer:', error);
          toast.error('Error deleting buyer.');
        }
      }
    });
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      // Don't fetch if no tenant is selected
      if (!selectedTenant) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/tenant/${selectedTenant.tenant_id}/buyers`);
        setBuyers(response.data.data.buyers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching buyers:', error);
        setLoading(false);
      }
    };

    fetchBuyers();
  }, [selectedTenant]);

  const filteredBuyers = filter === 'All' ? buyers : buyers.filter(b => b.buyerRegistrationType === filter);

  return (
    <TenantSelectionPrompt>
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
         
        </div>
        {!selectedTenant ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <h3>No Tenant Selected</h3>
            <p>Please select a Company to manage buyers.</p>
          </div>
        ) : (
          <BuyerTable
            buyers={filteredBuyers}
            loading={loading}
            onEdit={openModal}
            onDelete={handleDelete}
            onAdd={openModal} 
          />
        )}
        <BuyerModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} buyer={selectedBuyer} />
      </div>
    </TenantSelectionPrompt>
  );
};

export default Buyers; 