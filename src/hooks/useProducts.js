import { useQuery } from '@tanstack/react-query';
import Products from '../services/Products';
import { useAuth } from '../context/AuthContext.jsx';

const useProducts = ({ page = 1, limit = 10, storeId, categoryId, subcategoryId }) => {
    const enabled = !!storeId;

    // 🧼 Limpieza de parámetros antes de usarlos
    const queryParams = {
        page,
        limit,
        storeId,
        ...(categoryId ? { categoryId } : {}),
        ...(subcategoryId ? { subcategoryId } : {}),
    };

    return useQuery({
        queryKey: ['products', queryParams],
        queryFn: () => Products.getAll(queryParams),
        keepPreviousData: true,
        enabled,
    });
};

export default useProducts;
