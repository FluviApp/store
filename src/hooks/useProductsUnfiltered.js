import { useQuery } from '@tanstack/react-query';
import Products from '../services/Products';

const useProductsUnfiltered = ({ page = 1, limit = 10, storeId, search = '' }) => {
    const enabled = !!storeId;
    const params = { page, limit, storeId, search };
    return useQuery({
        queryKey: ['products-unfiltered', params],
        queryFn: () => Products.getAllUnfiltered(params),
        keepPreviousData: true,
        enabled,
    });
};

export default useProductsUnfiltered;


