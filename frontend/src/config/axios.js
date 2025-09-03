import axios from 'axios';


const axiosInstance = axios.create({
    // eslint-disable-next-line no-undef
    baseURL: String(`${import.meta.env.VITE_API_URL}`),
    headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
})


export default axiosInstance;  