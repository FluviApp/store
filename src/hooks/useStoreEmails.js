import { useQuery } from '@tanstack/react-query';
import StoreEmails from '../services/StoreEmails';
import { useAuth } from '../context/AuthContext.jsx';

const useStoreEmails = (page = 1, limit = 10) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['storeEmails', user?.storeId, page, limit],
        queryFn: () =>
            StoreEmails.getAll({
                storeId: user?.storeId,
                page,
                limit,
            }),
        enabled: !!user?.storeId,
    });
};

export default useStoreEmails;
