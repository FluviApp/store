import instance from '../apis/app';

class commerceService {
    axiosConfigFiles = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }

    login = (data) => instance.post('/store/login', data);

    checkCommerceStatus = (email) => instance.get(`/store/login/${encodeURIComponent(email)}`);
}

const Commerce = new commerceService();
export default Commerce;
