import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // VERY IMPORTANT: sends session cookie
});

export default axiosClient;
