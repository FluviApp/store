import { useQuery } from '@tanstack/react-query';
import Orders from '../services/Orders';
import { useAuth } from '../context/AuthContext';

const useOrders = (params = {}) => {
    const { page = 1, limit = 50, startDate, endDate, status, transferPay, deliveryType } = params;
    const { user } = useAuth();

    // Limpiar parámetros undefined para que no se envíen como "undefined" string
    const cleanParams = {
        page,
        limit,
        storeId: user?.storeId,
    };
    
    if (startDate) cleanParams.startDate = startDate;
    if (endDate) cleanParams.endDate = endDate;
    if (status) cleanParams.status = status;
    if (typeof transferPay !== 'undefined' && transferPay !== null) cleanParams.transferPay = transferPay;
    if (deliveryType) cleanParams.deliveryType = deliveryType;

    console.log('🔍 useOrders - Params limpios:', cleanParams);

    return useQuery({
        queryKey: [
            'orders',
            page,
            limit,
            user?.storeId,
            startDate,
            endDate,
            status,
            transferPay,
            deliveryType
        ],
        queryFn: () => Orders.getAll(cleanParams),
        keepPreviousData: true,
        enabled: !!user?.storeId,
    });
};

export default useOrders;
