// src/services/Clients.js
import instance from '../apis/app'; // 👈 tu configuración base de axios

class ClientsService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }

    getAll = (params) => instance.get('/store/clients', { params }); // 👈 ahora igual que tus otros servicios
    getFiltered = (params) => instance.get('/store/clients/filter', { params });
    create = (data) => instance.post('/store/clients', data);
    edit = (id, data) => instance.put(`/store/clients/${id}`, data);
    delete = (id) => instance.delete(`/store/clients/${id}`);
}

const Clients = new ClientsService();
export default Clients;

