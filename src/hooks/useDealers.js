// useDealers.js
import { useQuery } from '@tanstack/react-query';
import Dealers from '../services/Dealers';
import { useAuth } from '../context/AuthContext.jsx';

const useDealers = ({ page = 1, limit = 10 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['dealers', page, limit, user?.storeId],
        queryFn: () => Dealers.getAll({ page, limit, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId
    });
};

export default useDealers;
