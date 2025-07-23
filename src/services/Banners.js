import instance from '../apis/app';

class BannersService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    getAll = (params) => instance.get('/store/banners', { params });
    create = (data) => instance.post('/store/banners', data, this.axiosConfigFiles);
    edit = (id, data) => instance.put(`/store/banners/${id}`, data, this.axiosConfigFiles);
    delete = (id) => instance.delete(`/store/banners/${id}`);
}

const Banners = new BannersService();
export default Banners;
