// useAllDealers.js
import { useQuery } from '@tanstack/react-query';
import Dealers from '../services/Dealers';
import { useAuth } from '../context/AuthContext.jsx';

const useAllDealers = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['all-dealers', user?.storeId],
        queryFn: () => Dealers.getByStore(user?.storeId),
        enabled: !!user?.storeId
    });
};

export default useAllDealers;
