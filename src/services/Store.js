import instance from '../apis/app';

class StoresService {
    getOne = (params) => instance.get('/store/info', { params });
    updateInfo = (storeId, data) => instance.put('/store/info', data, { params: { storeId } });
}

const Stores = new StoresService();
export default Stores;
