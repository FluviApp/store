import instance from '../apis/app';

class PacksService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }
    getAll = (params) => instance.get('/store/packs', { params });
    create = (data) => instance.post('/store/packs', data, this.axiosConfigFiles);
    edit = (id, data) => instance.put(`/store/packs/${id}`, data, this.axiosConfigFiles);
    delete = (id) => instance.delete(`/store/packs/${id}`);
}

const Packs = new PacksService();
export default Packs;
