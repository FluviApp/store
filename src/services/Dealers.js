// src/services/Dealers.js
import instance from '../apis/app';

class DealersService {
    getAll = (params) => instance.get('/store/dealers', { params });
    getByStore = (storeId) => instance.get('/store/dealers/all', { params: { storeId } });
    create = (data) => instance.post('/store/dealers', data);
    edit = (id, data) => instance.put(`/store/dealers/${id}`, data);
    delete = (id) => instance.delete(`/store/dealers/${id}`);
}

const Dealers = new DealersService();
export default Dealers;
