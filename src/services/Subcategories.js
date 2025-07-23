import instance from '../apis/app';

class SubcategoriesService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    getAll = (params) => instance.get('/store/subcategories', { params });

    create = (data) => instance.post('/store/subcategories', data, this.axiosConfigFiles);

    edit = (id, data) => instance.put(`/store/subcategories/${id}`, data, this.axiosConfigFiles);

    delete = (id) => instance.delete(`/store/subcategories/${id}`);
}

const Subcategories = new SubcategoriesService();
export default Subcategories;
