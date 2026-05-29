import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const useFilteredClients = () => {
    const { user } = useAuth();
    const [filteredClients, setFilteredClients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getFilteredClients = useCallback(async (filters) => {
        if (!user?.storeId) {
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

            const response = await axios.get(`/store/clients/filter?${params.toString()}`);

            if (response.data?.success) {
                setFilteredClients(response.data.data || []);
                return response.data.data || [];
            } else {
                setError(response.data?.message || 'Error filtering clients');
                return null;
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error filtering clients';
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
