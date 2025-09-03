import instance from '../apis/app';

class StoresService {
    getOne = (params) => instance.get('/store/info', { params });
}

const Stores = new StoresService();
export default Stores;
