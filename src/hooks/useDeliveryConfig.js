import { useQuery } from '@tanstack/react-query';
import DeliveryConfig from '../services/DeliveryConfig';
import { useAuth } from '../context/AuthContext.jsx';

const useDeliveryConfig = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['deliveryConfig', user?.storeId],
        queryFn: () => DeliveryConfig.get({ storeId: user?.storeId }),
        enabled: !!user?.storeId,
    });
};

export default useDeliveryConfig;
