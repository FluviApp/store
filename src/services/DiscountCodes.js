// src/services/DiscountCodes.js
import instance from '../apis/app'; // instancia de Axios configurada

class DiscountCodesService {
    getAll = (params) => instance.get('/store/discount-codes', { params });

    create = (data) => instance.post('/store/discount-codes', data);

    edit = (id, data) => instance.put(`/store/discount-codes/${id}`, data);

    delete = (id) => instance.delete(`/store/discount-codes/${id}`);
}

const DiscountCodes = new DiscountCodesService();
export default DiscountCodes;
