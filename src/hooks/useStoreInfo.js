import { useQuery } from '@tanstack/react-query';
import Stores from '../services/Store.js';
import { useAuth } from '../context/AuthContext.jsx';

const useStoreInfo = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['storeInfo', user?.storeId],
        queryFn: () => Stores.getOne({ storeId: user?.storeId }),
        enabled: !!user?.storeId,
    });
};

export default useStoreInfo;
