import { useQuery } from '@tanstack/react-query';
import Hero from '../services/Hero';
import { useAuth } from '../context/AuthContext';

const useHero = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['hero', user?.storeId],
        queryFn: () => Hero.get({ storeId: user?.storeId }),
        enabled: !!user?.storeId,
    });
};

export default useHero;
