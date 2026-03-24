import axios from 'axios';

const instance = axios.create({
  baseURL: '/wp-json/api',
});

export default instance;
