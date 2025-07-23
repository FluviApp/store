import { useQuery } from '@tanstack/react-query';
import Clients from '../services/Clients';
import { useAuth } from '../context/AuthContext.jsx';

const useClients = ({ page = 1, limit = 10 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['clients', page, limit, user?.storeId],
        queryFn: () => Clients.getAll({ page, limit, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId
    });
};

export default useClients;

