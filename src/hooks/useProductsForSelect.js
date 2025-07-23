import { useQuery } from '@tanstack/react-query';
import Products from '../services/Products';
import { useAuth } from '../context/AuthContext';

const useProductsForSelect = ({ storeId, search = '' }) => {
    return useQuery({
        queryKey: ['products-for-select', storeId, search],
        queryFn: () => Products.getAllForSelect({ storeId, search, limit: 50 }),
        enabled: !!storeId,
    });
};


export default useProductsForSelect;
