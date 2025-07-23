import { useQuery } from '@tanstack/react-query';
import Subcategories from '../services/Subcategories';
import { useAuth } from '../context/AuthContext.jsx';

const useSubcategories = ({ categoryId, page = 1, limit = 10 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['subcategories', categoryId, page, limit, user?.storeId],
        queryFn: () =>
            Subcategories.getAll({ categoryId, storeId: user?.storeId, page, limit }),
        keepPreviousData: true,
        enabled: !!user?.storeId && !!categoryId
    });
};

export default useSubcategories;
