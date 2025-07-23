import { useQuery } from '@tanstack/react-query';
import Products from '../services/Products';
import { useAuth } from '../context/AuthContext.jsx';

const useAllProducts = ({ page = 1, limit = 10, search = '' }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['all-products', page, limit, search, user?.storeId],
        queryFn: () => Products.getAllUnfiltered({ page, limit, search, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId,
    });
};

export default useAllProducts;
