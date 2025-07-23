import instance from '../apis/app';

class NotificationsService {
    getAll = (params) => instance.get('/store/notifications', { params });
    create = (data) => instance.post('/store/notifications', data);
    edit = (id, data) => instance.put(`/store/notifications/${id}`, data);
    delete = (id) => instance.delete(`/store/notifications/${id}`);
}

const Notifications = new NotificationsService();
export default Notifications;
