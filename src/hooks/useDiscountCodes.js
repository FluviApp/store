// src/hooks/useDiscountCodes.js
import { useQuery } from '@tanstack/react-query';
import DiscountCodes from '../services/DiscountCodes.js';
import { useAuth } from '../context/AuthContext.jsx';

const useDiscountCodes = ({ page = 1, limit = 10 }) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['discountCodes', page, limit, user?.storeId],
        queryFn: () => DiscountCodes.getAll({ page, limit, storeId: user?.storeId }),
        keepPreviousData: true,
        enabled: !!user?.storeId
    });
};

export default useDiscountCodes;
