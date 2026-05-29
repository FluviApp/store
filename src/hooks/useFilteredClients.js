import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const useFilteredClients = () => {
    const { user } = useAuth();
    const [filteredClients, setFilteredClients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getFilteredClients = useCallback(async (filters) => {
        console.log('🔍 [Hook] getFilteredClients llamado con filters:', filters);

        if (!user?.storeId) {
            console.error('❌ [Hook] No storeId available');
            setError('No storeId available');
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({ storeId: user.storeId });

            if (filters.zones && filters.zones.length > 0) {
                params.append('zones', filters.zones.join(','));
            }

            if (filters.inactivityDays !== null && filters.inactivityDays !== undefined) {
                params.append('inactivityDays', filters.inactivityDays);
            }

            if (filters.registrationDateFrom) {
                params.append('registrationDateFrom', filters.registrationDateFrom);
            }

            if (filters.registrationDateTo) {
                params.append('registrationDateTo', filters.registrationDateTo);
            }

            if (filters.minSpent !== null && filters.minSpent !== undefined) {
                params.append('minSpent', filters.minSpent);
            }

            if (filters.maxSpent !== null && filters.maxSpent !== undefined) {
                params.append('maxSpent', filters.maxSpent);
            }

            const url = `/api/store/clients/filter?${params.toString()}`;
            console.log('📡 [Hook] URL de request:', url);

            const response = await axios.get(url);
            console.log('✅ [Hook] Response recibido:', response.data);

            if (response.data?.success) {
                const clientsCount = (response.data.data || []).length;
                console.log('🎯 [Hook] Clientes encontrados:', clientsCount);
                setFilteredClients(response.data.data || []);
                return response.data.data || [];
            } else {
                const errorMsg = response.data?.message || 'Error filtering clients';
                console.error('❌ [Hook] Error en response:', errorMsg);
                setError(errorMsg);
                return null;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error filtering clients';
            console.error('❌ [Hook] Error en request:', errorMessage, err);
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [user?.storeId]);

    return {
        filteredClients,
        isLoading,
        error,
        getFilteredClients,
        reset: () => {
            setFilteredClients([]);
            setError(null);
        }
    };
};

export default useFilteredClients;
