import instance from '../apis/app';

class HeroService {
    get = (params) => instance.get('/store/hero', { params });
    save = (data) => instance.put('/store/hero', data);
}

const Hero = new HeroService();
export default Hero;
