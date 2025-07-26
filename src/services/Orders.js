import instance from '../apis/app';

class OrdersService {
    getAll = (params) => instance.get('/store/orders', { params });
    getPending = (params) => instance.get('/store/orders/pending', { params });
    create = (data) => instance.post('/store/orders', data);
    edit = (id, data) => instance.put(`/store/orders/${id}`, data);
    delete = (id) => instance.delete(`/store/orders/${id}`);
}

const Orders = new OrdersService();
export default Orders;
