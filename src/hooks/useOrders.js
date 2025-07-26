import { useQuery } from '@tanstack/react-query';
import Orders from '../services/Orders';
import { useAuth } from '../context/AuthContext';

const useOrders = (params = {}) => {
    const { page = 1, limit = 50, startDate, endDate, status, transferPay } = params;
    const { user } = useAuth();

    return useQuery({
        queryKey: [
            'orders',
            page,
            limit,
            user?.storeId,
            startDate,
            endDate,
            status,
            transferPay
        ],
        queryFn: () =>
            Orders.getAll({
                page,
                limit,
                storeId: user?.storeId,
                startDate,
                endDate,
                status,
                transferPay,
            }),
        keepPreviousData: true,
        enabled: !!user?.storeId,
    });
};

export default useOrders;
