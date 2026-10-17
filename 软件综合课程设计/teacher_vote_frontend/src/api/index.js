import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  timeout: 10000
})

// 统一响应拦截：code=200 视为成功，其余弹出错误提示
http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code === 200) return body
    ElMessage.error(body.detail || body.message || '请求失败')
    return Promise.reject(new Error(body.detail || body.message))
  },
  (err) => {
    // 网络异常或服务端错误统一提示
    const msg = err.response?.data?.detail || '网络异常，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

const api = {
  // 登录 & 注册
  login: (username, password) => http.post('/api/login', { username, password }),
  register: (username, password) => http.post('/api/register', { username, password }),

  // 教师 CRUD
  getTeachers: (name) => http.get('/api/teachers', { params: name ? { name } : {} }),
  addTeacher: (data) => http.post('/api/teachers', data),
  updateTeacher: (id, data) => http.put(`/api/teachers/${id}`, data),
  deleteTeacher: (id) => http.delete(`/api/teachers/${id}`),

  // 学生 CRUD
  getStudents: (username) => http.get('/api/students', { params: username ? { username } : {} }),
  addStudent: (data) => http.post('/api/students', data),
  updateStudent: (id, data) => http.put(`/api/students/${id}`, data),
  deleteStudent: (id) => http.delete(`/api/students/${id}`),

  // 候选人推荐
  recommend: (teacher_ids) => http.post('/api/admin/recommend', { teacher_ids }),

  // 学生投票
  submitVote: (student_id, teacher_ids) =>
    http.post('/api/student/vote', { student_id, teacher_ids }),

  // 投票结果
  getResults: (sortByVote = false) =>
    http.get('/api/vote/result', { params: { sort_by_vote: sortByVote } }),

  // 照片上传
  uploadPhoto: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 系统重置
  resetSystem: () => http.post('/api/admin/reset'),
}

export default api
