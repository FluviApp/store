import instance from '../apis/app';

class AnnouncementsService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    getAll = (params) => instance.get('/store/announcements', { params });
    create = (data) => instance.post('/store/announcements', data, this.axiosConfigFiles);
    edit = (id, data) => instance.put(`/store/announcements/${id}`, data, this.axiosConfigFiles);
    delete = (id) => instance.delete(`/store/announcements/${id}`);
}

const Announcements = new AnnouncementsService();
export default Announcements;
