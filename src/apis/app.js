import createInstance from '../libs/axios'
const instance = createInstance(import.meta.env.VITE_API_APP)


export default instance