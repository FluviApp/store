import instance from '../apis/app';

class CategoriesService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }

    getAll = (params) => instance.get('/store/categories', { params });

    create = (data) => instance.post('/store/categories', data, this.axiosConfigFiles);

    edit = (id, data) => instance.put(`/store/categories/${id}`, data, this.axiosConfigFiles);

    delete = (id) => instance.delete(`/store/categories/${id}`);
}

const Categories = new CategoriesService();
export default Categories;
