import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050/api',
});

export const fetchDataSources = () => api.get('/data-sources');
export const savePattern = (patternData) => api.post('/patterns', patternData);
export default api;
