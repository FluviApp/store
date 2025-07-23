import { useQuery } from '@tanstack/react-query';
import Notifications from '../services/Notifications';
import { useAuth } from '../context/AuthContext.jsx';

const useNotifications = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications', user?.storeId],
        queryFn: () =>
            Notifications.getAll({
                storeId: user?.storeId,
            }),
        enabled: !!user?.storeId,
    });
};

export default useNotifications;
