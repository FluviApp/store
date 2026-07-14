import instance from '../apis/app';

class ComunasService {
    // Catálogo de comunas (con su límite guardado una sola vez en el backend).
    getAll = () => instance.get('/store/comunas');
    getBySlug = (slug) => instance.get(`/store/comunas/${slug}`);
}

const Comunas = new ComunasService();
export default Comunas;
