<template>
  <div class="student-page">
    <header class="app-header">
      <div class="app-header__title">🎓 我最喜爱的教师评选</div>
      <div class="app-header__right">
        <span>{{ userInfo.username }}</span>
        <el-button size="small" round @click="handleLogout">退出</el-button>
      </div>
    </header>

    <div class="app-main">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">

        <!-- ===== 参与投票 ===== -->
        <el-tab-pane label="参与投票" name="vote">

          <div v-if="userInfo.vote_status === 1" class="state-card fade-in">
            <div class="state-icon state-icon--done">✓</div>
            <h3>你已完成投票</h3>
            <p>投票结果将在公示阶段揭晓</p>
          </div>

          <div v-else-if="userInfo.vote_status === 2" class="state-card fade-in">
            <div class="state-icon state-icon--void">!</div>
            <h3>选票已作废</h3>
            <p>因勾选超过 3 项，你的选票被系统作废</p>
          </div>

          <template v-else>
            <div class="vote-banner fade-in">
              <div class="vote-banner__icon">⚡</div>
              <div>
                <strong>投票规则</strong>
                <p>每人最多投 3 票，超过 3 票整张选票将直接作废，请谨慎勾选</p>
              </div>
              <div class="vote-count-badge">
                {{ selectedTeacherIds.length }} <small>/ 3</small>
              </div>
            </div>

            <div class="teacher-card-grid">
              <el-card
                v-for="(t, i) in candidateTeachers" :key="t.id"
                class="vote-teacher-card fade-in"
                :class="'fade-in-' + (i % 3 + 1)"
                shadow="never"
              >
                <div class="vote-card-body">
                  <el-avatar :src="t.photo_url" :size="48" style="margin-bottom: 12px;" />
                  <h3 class="vote-card-name">{{ t.name }}</h3>
                  <p class="vote-card-info">{{ t.college }}</p>
                  <p class="vote-card-info">{{ t.title }}</p>
                  <div class="vote-card-ft">
                    <el-checkbox
                      :label="t.id"
                      v-model="selectedTeacherIds"
                      @change="handleCheckboxChange"
                      size="large"
                    >
                      <span style="font-weight: 600;">投他一票</span>
                    </el-checkbox>
                  </div>
                </div>
              </el-card>
            </div>

            <div class="submit-area fade-in">
              <el-button
                type="primary" size="large" round
                :loading="submitting"
                :disabled="selectedTeacherIds.length === 0"
                @click="submitVote"
              >
                确认提交选票
              </el-button>
            </div>
          </template>
        </el-tab-pane>

        <!-- ===== 公示与统计 ===== -->
        <el-tab-pane label="公示与统计" name="result">
          <div class="toolbar">
            <el-button :type="sortMode === false ? 'primary' : 'default'" round @click="loadResults(false)">默认排序</el-button>
            <el-button :type="sortMode === true ? 'primary' : 'default'" round @click="loadResults(true)">按票数排序</el-button>
          </div>

          <div class="podium-stage fade-in" v-if="top3.length > 0">
            <div class="podium-block podium-silver" v-if="top3[1]">
              <div class="podium-rank">🥈</div>
              <div class="podium-name">{{ top3[1].name }}</div>
              <div class="podium-votes">{{ top3[1].vote_count }} 票</div>
            </div>
            <div class="podium-block podium-gold" v-if="top3[0]">
              <div class="podium-rank">🥇</div>
              <div class="podium-name">{{ top3[0].name }}</div>
              <div class="podium-votes">{{ top3[0].vote_count }} 票</div>
            </div>
            <div class="podium-block podium-bronze" v-if="top3[2]">
              <div class="podium-rank">🥉</div>
              <div class="podium-name">{{ top3[2].name }}</div>
              <div class="podium-votes">{{ top3[2].vote_count }} 票</div>
            </div>
          </div>
          <el-empty v-else description="暂无投票数据" />

          <el-table :data="resultTeachers" v-loading="resultLoading" stripe>
            <el-table-column type="index" label="#" width="56" />
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="college" label="学院" min-width="160" />
            <el-table-column prop="vote_count" label="得票数" width="120" align="center">
              <template #default="s">
                <span class="table-votes">{{ s.row.vote_count }} <small>票</small></span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const activeTab = ref('vote')
const sortMode = ref(false)

// 投票相关状态
const userInfo = ref({})
const candidateTeachers = ref([])
const selectedTeacherIds = ref([])
const submitting = ref(false)

// 结果相关状态
const resultTeachers = ref([])
const top3 = ref([])
const resultLoading = ref(false)

const loadCandidates = async () => {
  try {
    const res = await api.getResults(false)
    candidateTeachers.value = res.data
  } catch { /* 拦截器已处理 */ }
}

const handleCheckboxChange = () => {
  if (selectedTeacherIds.value.length > 3) {
    ElMessage.error('已超过 3 项！提交后选票将作废！')
  }
}

const submitVote = () => {
  ElMessageBox.confirm('投票提交后不可更改，确定提交吗？', '提示', { type: 'info' }).then(async () => {
    submitting.value = true
    try {
      const res = await api.submitVote(userInfo.value.id, selectedTeacherIds.value)
      ElMessage.success(res.message)
      // 前端同步更新投票状态：超过3票标记为作废(vote_status=2)，否则正常完成(vote_status=1)
      userInfo.value.vote_status = selectedTeacherIds.value.length > 3 ? 2 : 1
      localStorage.setItem('user', JSON.stringify(userInfo.value))
    } catch { /* 拦截器已处理 */ }
    finally { submitting.value = false }
  }).catch(() => {})
}

const loadResults = async (isSort = false) => {
  sortMode.value = isSort
  resultLoading.value = true
  try {
    const res = await api.getResults(isSort)
    resultTeachers.value = res.data
    const sorted = [...res.data].sort((a, b) => b.vote_count - a.vote_count)
    top3.value = sorted.slice(0, 3)
  } catch { /* 拦截器已处理 */ }
  finally { resultLoading.value = false }
}

const handleTabChange = (tabName) => {
  if (tabName === 'result') loadResults(false)
}

const handleLogout = () => {
  localStorage.clear()
  router.push('/')
}

onMounted(() => {
  userInfo.value = JSON.parse(localStorage.getItem('user'))
  loadCandidates()
})
</script>

<style scoped>
.student-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 40% at 30% 20%, rgba(99,102,241,.04) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 80%, rgba(139,92,246,.03) 0%, transparent 60%),
    var(--c-bg);
}

.vote-banner {
  position: relative;
  overflow: hidden;
}
.vote-banner::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 120px;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
  transform: rotate(15deg);
  animation: shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.vote-teacher-card {
  position: relative;
  overflow: hidden;
}
.vote-teacher-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(99,102,241,.03) 0%, transparent 50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity .4s var(--ease-out-expo);
}
.vote-teacher-card:hover::before {
  opacity: 1;
}
.vote-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
}

.submit-area {
  position: relative;
}
.submit-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-primary-glow), transparent);
}

.state-card {
  position: relative;
  overflow: hidden;
}
.state-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(99,102,241,.02) 0%, transparent 70%);
  pointer-events: none;
}
</style>
