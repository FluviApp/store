import { useQuery } from '@tanstack/react-query';
import Orders from '../services/Orders';
import { useAuth } from '../context/AuthContext';

const usePendingOrders = (params) => {
    const { user } = useAuth(); // Obtenemos el storeId del usuario

    return useQuery({
        queryKey: ['pendingOrders', user?.storeId], // Clave para la caché de React Query
        queryFn: () =>
            Orders.getPending({
                storeId: user?.storeId, // Pasamos el storeId como parámetro
            }),
        keepPreviousData: true,
        enabled: !!user?.storeId, // Solo ejecutamos la query si tenemos el storeId
    });
};

export default usePendingOrders;
