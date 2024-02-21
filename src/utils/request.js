import axios from 'axios'

// const request = axios.create({
//     baseURL: "http://localhost:8083/api",
//     timeout: 6000,
//     headers:{}
// })

const request = axios.create({
    baseURL: "",
    timeout: 6000,
    headers:{}
})

request.interceptors.request.use(function (config) {
    console.log("请求拦截器已经执行");
    return config;
}, function (error) {
    return Promise.reject(error);
});

export default request
