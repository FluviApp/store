import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Clients from '../services/Clients';

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

            const params = { storeId: user.storeId };

            if (filters.zones && filters.zones.length > 0) {
                params.zones = filters.zones.join(',');
            }

            if (filters.inactivityDays !== null && filters.inactivityDays !== undefined) {
                params.inactivityDays = filters.inactivityDays;
            }

            if (filters.registrationDateFrom) {
                params.registrationDateFrom = filters.registrationDateFrom;
            }

            if (filters.registrationDateTo) {
                params.registrationDateTo = filters.registrationDateTo;
            }

            if (filters.minSpent !== null && filters.minSpent !== undefined) {
                params.minSpent = filters.minSpent;
            }

            if (filters.maxSpent !== null && filters.maxSpent !== undefined) {
                params.maxSpent = filters.maxSpent;
            }

            // El interceptor de axios devuelve res.data directamente,
            // así que `result` ya es { success, message, data }
            const result = await Clients.getFiltered(params);

            if (result?.success) {
                setFilteredClients(result.data || []);
                return result.data || [];
            } else {
                setError(result?.message || 'Error filtering clients');
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
