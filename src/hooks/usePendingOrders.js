import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Orders from '../services/Orders';
import { useAuth } from '../context/AuthContext';

const usePendingOrders = ({ datePreset = 'today' } = {}) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['pendingOrders', user?.storeId, datePreset],
        queryFn: () =>
            Orders.getPending({
                storeId: user?.storeId,
                datePreset,
            }),
        placeholderData: keepPreviousData,
        enabled: !!user?.storeId,
    });
};

export default usePendingOrders;
