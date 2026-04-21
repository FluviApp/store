import instance from '../apis/app';

class DeliveryConfigService {
    get = (params) => instance.get('/store/delivery-config', { params });
    update = (data) => instance.put('/store/delivery-config', data);
}

const DeliveryConfig = new DeliveryConfigService();
export default DeliveryConfig;
