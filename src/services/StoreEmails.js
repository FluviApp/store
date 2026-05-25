import instance from '../apis/app';

class StoreEmailsService {
    getAll = (params) => instance.get('/store/emails', { params });
    send = (data) => instance.post('/store/emails/send', data);
    sendMultiple = (data) => instance.post('/store/emails/send-multiple', data);
    delete = (id) => instance.delete(`/store/emails/${id}`);
}

const StoreEmails = new StoreEmailsService();
export default StoreEmails;
