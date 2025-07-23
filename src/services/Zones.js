import instance from '../apis/app';

class ZonesService {
    getAll = (params) => instance.get('/store/zones', { params });
    create = (data) => instance.post('/store/zones', data);
    edit = (id, data) => instance.put(`/store/zones/${id}`, data);
    delete = (id) => instance.delete(`/store/zones/${id}`);
}

const Zones = new ZonesService();
export default Zones;