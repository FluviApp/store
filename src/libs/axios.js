import axios from 'axios'
//import { fetchAuthSession } from 'aws-amplify/auth'

// Función que crea una nueva instancia de Axios
const createInstance = baseURL => {

    const instance = axios.create({
        headers: { 'Content-Type': 'application/json' },
        baseURL,
    })

    // instance.interceptors.request.use(async config => {

    //     if (config.skipAuth) {
    //         return config
    //     }


    //     const { tokens } = await fetchAuthSession({ forceRefresh: true }).catch(() => ({}))
    //     const idToken = tokens?.idToken

    //     if (idToken) {
    //         config.headers.Authorization = `Bearer ${idToken.toString()}`
    //     }

    //     return config
    // })

    instance.interceptors.response.use(
        res => res.data,
        error => { throw error }
    )

    return instance
}

export default createInstance
