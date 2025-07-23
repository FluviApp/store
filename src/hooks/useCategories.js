import { useQuery } from '@tanstack/react-query';
import Categories from '../services/Categories';
import { useAuth } from '../context/AuthContext.jsx';

const useCategories = ({ page = 1, limit = 10 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['categories', page, limit, user?.storeId],
        queryFn: () => Categories.getAll({ page, limit, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId
    });
};

export default useCategories;
