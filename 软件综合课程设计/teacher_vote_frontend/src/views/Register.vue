<template>
  <div class="login-page">
    <div class="login-box fade-in">
      <div class="login-brand">
        <div class="login-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <h1 class="login-brand__title">创建账号</h1>
        <p class="login-brand__sub">注册成为学生，参与教师评选</p>
      </div>

      <el-form :model="registerForm" @submit.prevent class="login-form">
        <div class="input-group">
          <label class="input-label">用户名</label>
          <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <label class="input-label">密码</label>
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <label class="input-label">确认密码</label>
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password @keyup.enter="handleRegister" />
        </div>
        <el-button type="primary" size="large" class="login-submit" :loading="loading" @click="handleRegister" round>
          注 册
        </el-button>
      </el-form>

      <p class="login-foot">
        已有账号？<router-link to="/">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const loading = ref(false)
const registerForm = ref({ username: '', password: '', confirmPassword: '' })

const handleRegister = async () => {
  const { username, password, confirmPassword } = registerForm.value
  if (!username || !password) { ElMessage.warning('用户名和密码不能为空'); return }
  if (password !== confirmPassword) { ElMessage.warning('两次输入的密码不一致'); return }
  loading.value = true
  try {
    await api.register(username, password)
    ElMessage.success('注册成功，即将跳转登录...')
    setTimeout(() => router.push('/'), 1000)
  } catch { /* 拦截器已处理 */ }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(91,95,227,.06) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 80%, rgba(91,95,227,.04) 0%, transparent 70%),
    var(--c-bg);
  padding: 24px;
}
.login-box {
  width: 400px;
  background: var(--c-bg-card);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  padding: 48px 40px 36px;
  border: 1px solid var(--c-border-light);
}
.login-brand { text-align: center; margin-bottom: 36px; }
.login-icon {
  width: 56px; height: 56px;
  margin: 0 auto 16px;
  background: var(--c-primary-light);
  color: var(--c-primary);
  border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center;
}
.login-brand__title { font-size: 22px; font-weight: 700; color: var(--c-text); margin: 0; letter-spacing: .02em; }
.login-brand__sub { font-size: 14px; color: var(--c-text-secondary); margin: 4px 0 0; }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: 13px; font-weight: 600; color: var(--c-text); }
.login-submit { width: 100%; height: 46px; font-size: 16px; font-weight: 600; margin-top: 4px; }
.login-foot { text-align: center; margin-top: 24px; font-size: 13px; color: var(--c-text-secondary); }
.login-foot a { color: var(--c-primary); font-weight: 600; text-decoration: none; }
.login-foot a:hover { text-decoration: underline; }
</style>
