import axios from 'axios';

export const API_URL = 'http://localhost:9999';

// Chưa có đăng nhập: tạm dùng khách hàng mẫu trong database.json
export const CURRENT_USER_ID = '2';

const api = axios.create({ baseURL: API_URL });

export default api;
