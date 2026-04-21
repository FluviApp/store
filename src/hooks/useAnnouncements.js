import { useQuery } from '@tanstack/react-query';
import Announcements from '../services/Announcements';
import { useAuth } from '../context/AuthContext.jsx';

const useAnnouncements = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['announcements', user?.storeId],
        queryFn: () =>
            Announcements.getAll({
                storeId: user?.storeId,
            }),
        enabled: !!user?.storeId,
    });
};

export default useAnnouncements;
