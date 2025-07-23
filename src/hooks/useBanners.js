import { useQuery } from '@tanstack/react-query';
import Banners from '../services/Banners';
import { useAuth } from '../context/AuthContext.jsx';

const useBanners = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['banners', user?.storeId],
        queryFn: () =>
            Banners.getAll({
                storeId: user?.storeId,
            }),
        enabled: !!user?.storeId,
    });
};

export default useBanners;
