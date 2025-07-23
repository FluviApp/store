import { useQuery } from '@tanstack/react-query';
import Zones from '../services/Zones';
import { useAuth } from '../context/AuthContext';

const useZones = ({ page = 1, limit = 50 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['zones', page, limit, user?.storeId],
        queryFn: () => Zones.getAll({ page, limit, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId,
    });
};

export default useZones;