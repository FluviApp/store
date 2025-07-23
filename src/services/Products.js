import instance from '../apis/app';

class ProductsService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    getAll = (params) => instance.get('/store/products', { params });
    getAllUnfiltered = (params) => instance.get('/store/products/all', { params });
    getAllForSelect = (params) => instance.get('/store/products/select', { params });
    createSimple = (data) => instance.post('/store/products/simple', data, this.axiosConfigFiles);
    createWithVariants = (data) => instance.post('/store/products/variant', data, this.axiosConfigFiles);
    editSimple = (id, data) => instance.put(`/store/products/simple/${id}`, data, this.axiosConfigFiles);
    editWithVariants = (id, data) => instance.put(`/store/products/variant/${id}`, data, this.axiosConfigFiles);
    delete = (id) => instance.delete(`/store/products/${id}`);
    addCategoryToProduct = (productId, categoryId) => instance.put(`/store/products/${productId}/add-category`, { categoryId });
    addSubcategoryToProduct = (id, subcategoryId) => instance.put(`/store/products/${id}/add-subcategory`, { subcategoryId });

}

const Products = new ProductsService();
export default Products;
