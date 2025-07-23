import { useQuery } from '@tanstack/react-query';
import Packs from '../services/Packs';
import { useAuth } from '../context/AuthContext.jsx';

const usePacks = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['packs', user?.storeId],
        queryFn: () =>
            Packs.getAll({
                storeId: user?.storeId,
            }),
        enabled: !!user?.storeId,
    });
};

export default usePacks;
