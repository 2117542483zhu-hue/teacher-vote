<template>
  <div class="admin-page">
    <header class="app-header">
      <div class="app-header__title">⚙ 管理后台</div>
      <div class="app-header__right">
        <span>{{ adminInfo.username }}</span>
        <el-button size="small" round type="danger" @click="handleResetSystem">重置系统</el-button>
        <el-button size="small" round @click="handleLogout">退出</el-button>
      </div>
    </header>

    <div class="app-main">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">

        <!-- ===== 教师管理 ===== -->
        <el-tab-pane label="教师管理" name="teachers">
          <div class="toolbar">
            <el-input v-model="teacherSearch" placeholder="搜索教师姓名…" clearable style="width: 260px;"
              @clear="loadTeachers" @keyup.enter="loadTeachers" />
            <el-button type="primary" round @click="loadTeachers">搜索</el-button>
            <el-button round @click="openTeacherDialog(null)">+ 添加教师</el-button>
          </div>

          <el-table :data="teachers" stripe v-loading="teacherLoading">
            <el-table-column prop="id" label="#" width="52" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="college" label="学院" min-width="140" />
            <el-table-column prop="title" label="职称" width="100" />
            <el-table-column prop="age" label="年龄" width="64" />
            <el-table-column prop="vote_count" label="票数" width="64" />
            <el-table-column label="照片" width="72">
              <template #default="s">
                <el-avatar :src="s.row.photo_url" :size="36" v-if="s.row.photo_url" />
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="候选" width="72">
              <template #default="s">
                <el-tag :type="s.row.is_candidate ? 'success' : 'info'" size="small" round>
                  {{ s.row.is_candidate ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="s">
                <el-button type="primary" size="small" round plain @click="openTeacherDialog(s.row)">编辑</el-button>
                <el-button type="danger" size="small" round plain @click="deleteTeacher(s.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ===== 学生管理 ===== -->
        <el-tab-pane label="学生管理" name="students">
          <div class="toolbar">
            <el-input v-model="studentSearch" placeholder="搜索用户名…" clearable style="width: 260px;"
              @clear="loadStudents" @keyup.enter="loadStudents" />
            <el-button type="primary" round @click="loadStudents">搜索</el-button>
            <el-button round @click="openStudentDialog(null)">+ 添加学生</el-button>
          </div>

          <el-table :data="students" stripe v-loading="studentLoading">
            <el-table-column prop="id" label="#" width="52" />
            <el-table-column prop="username" label="用户名" width="140" />
            <el-table-column label="角色" width="90">
              <template #default="s">
                <el-tag :type="s.row.role === 'admin' ? 'danger' : ''" size="small" round>
                  {{ s.row.role === 'admin' ? '管理员' : '学生' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="投票状态" width="110">
              <template #default="s">
                <template v-if="s.row.role === 'student'">
                  <el-tag v-if="s.row.vote_status === 0" type="info" size="small" round>未投票</el-tag>
                  <el-tag v-else-if="s.row.vote_status === 1" type="success" size="small" round>已投票</el-tag>
                  <el-tag v-else type="danger" size="small" round>已作废</el-tag>
                </template>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="s">
                <el-button type="primary" size="small" round plain @click="openStudentDialog(s.row)">编辑</el-button>
                <el-button type="danger" size="small" round plain @click="deleteStudent(s.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ===== 推荐候选人 ===== -->
        <el-tab-pane label="推荐候选人" name="recommend">
          <div class="vote-banner fade-in">
            <div class="vote-banner__icon">📋</div>
            <div>
              <strong>第一阶段：推荐候选人</strong>
              <p>从下方教师列表中勾选（最多 10 名），确认后生成初选名单供学生投票</p>
            </div>
            <div class="vote-count-badge">
              {{ selectedCandidateIds.length }} <small>/ 10</small>
            </div>
          </div>

          <div class="toolbar">
            <el-button type="primary" round :disabled="selectedCandidateIds.length === 0" @click="confirmRecommend">
              确认生成初选名单
            </el-button>
            <el-button round @click="loadCandidateTeachers">刷新列表</el-button>
          </div>

          <div class="candidate-showcase" v-if="currentCandidates.length > 0">
            <el-card v-for="t in currentCandidates" :key="t.id" class="candidate-showcase-card" shadow="never">
              <el-avatar :src="t.photo_url" :size="44" style="margin-bottom: 8px;" />
              <h4 style="margin: 0 0 4px; font-size: 14px;">{{ t.name }}</h4>
              <p style="margin: 0; font-size: 12px; color: var(--c-text-secondary);">{{ t.college }}</p>
              <el-tag type="success" size="small" round style="margin-top: 8px;">候选人</el-tag>
            </el-card>
          </div>

          <el-divider />

          <el-table :data="candidateTeacherList" stripe @selection-change="handleCandidateSelectionChange"
            ref="candidateTableRef" v-loading="candidateLoading">
            <el-table-column type="selection" width="44" />
            <el-table-column prop="id" label="#" width="52" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="college" label="学院" min-width="140" />
            <el-table-column prop="title" label="职称" width="100" />
            <el-table-column label="状态" width="110">
              <template #default="s">
                <el-tag :type="s.row.is_candidate ? 'success' : 'info'" size="small" round>
                  {{ s.row.is_candidate ? '已是候选人' : '未推荐' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ===== 投票统计 ===== -->
        <el-tab-pane label="投票统计" name="results">
          <div class="toolbar">
            <el-button :type="adminSortMode === false ? 'primary' : 'default'" round @click="loadAdminResults(false)">默认排序</el-button>
            <el-button :type="adminSortMode === true ? 'primary' : 'default'" round @click="loadAdminResults(true)">按票数排序</el-button>
          </div>

          <div class="podium-stage fade-in" v-if="adminTop3.length > 0">
            <div class="podium-block podium-silver" v-if="adminTop3[1]">
              <div class="podium-rank">🥈</div>
              <div class="podium-name">{{ adminTop3[1].name }}</div>
              <div class="podium-votes">{{ adminTop3[1].vote_count }} 票</div>
            </div>
            <div class="podium-block podium-gold" v-if="adminTop3[0]">
              <div class="podium-rank">🥇</div>
              <div class="podium-name">{{ adminTop3[0].name }}</div>
              <div class="podium-votes">{{ adminTop3[0].vote_count }} 票</div>
            </div>
            <div class="podium-block podium-bronze" v-if="adminTop3[2]">
              <div class="podium-rank">🥉</div>
              <div class="podium-name">{{ adminTop3[2].name }}</div>
              <div class="podium-votes">{{ adminTop3[2].vote_count }} 票</div>
            </div>
          </div>
          <el-empty v-else description="暂无投票数据" />

          <el-table :data="adminResults" stripe v-loading="resultLoading">
            <el-table-column type="index" label="#" width="52" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="college" label="学院" min-width="140" />
            <el-table-column prop="title" label="职称" width="100" />
            <el-table-column prop="age" label="年龄" width="64" />
            <el-table-column prop="vote_count" label="得票数" width="120" align="center">
              <template #default="s">
                <span class="table-votes">{{ s.row.vote_count }} <small>票</small></span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ===== 教师编辑弹窗 ===== -->
    <el-dialog v-model="teacherDialogVisible" :title="isEditTeacher ? '编辑教师' : '添加教师'" width="500px">
      <el-form :model="teacherForm" label-width="64px">
        <el-form-item label="姓名" required>
          <el-input v-model="teacherForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="teacherForm.college" placeholder="请输入所属学院" />
        </el-form-item>
        <el-form-item label="职称">
          <el-input v-model="teacherForm.title" placeholder="请输入职称" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="teacherForm.age" :min="20" :max="100" />
        </el-form-item>
        <el-form-item label="照片">
          <div style="display: flex; align-items: center; gap: 14px;">
            <el-upload :show-file-list="false" :http-request="handlePhotoUpload" accept="image/*">
              <el-button round size="small">选择本地照片</el-button>
            </el-upload>
            <el-avatar :src="teacherForm.photo_url || '/uploads/default.jpg'" :size="48" shape="square" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="teacherDialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="teacherSubmitting" @click="submitTeacherForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- ===== 学生编辑弹窗 ===== -->
    <el-dialog v-model="studentDialogVisible" :title="isEditStudent ? '编辑学生' : '添加学生'" width="480px">
      <el-form :model="studentForm" label-width="72px">
        <el-form-item label="用户名" required>
          <el-input v-model="studentForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :required="!isEditStudent">
          <el-input v-model="studentForm.password" placeholder="请输入密码" show-password />
          <span v-if="isEditStudent" class="text-muted" style="font-size: 12px;">留空则不修改密码</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="studentForm.role">
            <el-radio label="student" size="large">学生</el-radio>
            <el-radio label="admin" size="large">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="studentDialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="studentSubmitting" @click="submitStudentForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const activeTab = ref('teachers')
const adminInfo = ref({})
const adminSortMode = ref(false)

// 教师管理状态
const teachers = ref([])
const teacherSearch = ref('')
const teacherLoading = ref(false)

// 学生管理状态
const students = ref([])
const studentSearch = ref('')
const studentLoading = ref(false)

// 候选人推荐状态
const candidateTeacherList = ref([])
const selectedCandidateIds = ref([])
const currentCandidates = ref([])
const candidateLoading = ref(false)
const candidateTableRef = ref(null)

// 投票统计状态
const adminResults = ref([])
const adminTop3 = ref([])
const resultLoading = ref(false)

// 教师弹窗状态
const teacherDialogVisible = ref(false)
const isEditTeacher = ref(false)
const editingTeacherId = ref(null)
const teacherSubmitting = ref(false)
const teacherFormDefault = { name: '', college: '', title: '', age: 30, photo_url: '' }
const teacherForm = reactive({ ...teacherFormDefault })

const handlePhotoUpload = async ({ file }) => {
  try {
    const res = await api.uploadPhoto(file)
    teacherForm.photo_url = res.data
    ElMessage.success('照片上传成功')
  } catch { /* 拦截器已处理 */ }
}

// 学生弹窗状态
const studentDialogVisible = ref(false)
const isEditStudent = ref(false)
const editingStudentId = ref(null)
const studentSubmitting = ref(false)
const studentFormDefault = { username: '', password: '', role: 'student' }
const studentForm = reactive({ ...studentFormDefault })

// ===== 教师 CRUD =====
const loadTeachers = async () => {
  teacherLoading.value = true
  try { const res = await api.getTeachers(teacherSearch.value || undefined); teachers.value = res.data }
  catch { /* 拦截器已处理 */ }
  finally { teacherLoading.value = false }
}

const openTeacherDialog = (row) => {
  if (row) {
    isEditTeacher.value = true; editingTeacherId.value = row.id
    Object.assign(teacherForm, { name: row.name, college: row.college || '', title: row.title || '', age: row.age || 30, photo_url: row.photo_url || '' })
  } else {
    isEditTeacher.value = false; editingTeacherId.value = null
    Object.assign(teacherForm, teacherFormDefault)
  }
  teacherDialogVisible.value = true
}

const submitTeacherForm = async () => {
  if (!teacherForm.name.trim()) { ElMessage.warning('请输入教师姓名'); return }
  teacherSubmitting.value = true
  try {
    const payload = { name: teacherForm.name.trim(), college: teacherForm.college.trim(), title: teacherForm.title.trim(), age: teacherForm.age, photo_url: teacherForm.photo_url.trim() || '/uploads/default.jpg' }
    isEditTeacher.value ? await api.updateTeacher(editingTeacherId.value, payload) : await api.addTeacher(payload)
    ElMessage.success(isEditTeacher.value ? '修改成功' : '添加成功')
    teacherDialogVisible.value = false; loadTeachers()
  } catch { /* 拦截器已处理 */ }
  finally { teacherSubmitting.value = false }
}

const deleteTeacher = (id) => {
  ElMessageBox.confirm('确定删除该教师吗？此操作不可恢复。', '警告', { type: 'warning' }).then(async () => {
    try { await api.deleteTeacher(id); ElMessage.success('删除成功'); loadTeachers() }
    catch { /* 拦截器已处理 */ }
  }).catch(() => {})
}

// ===== 学生 CRUD =====
const loadStudents = async () => {
  studentLoading.value = true
  try { const res = await api.getStudents(studentSearch.value || undefined); students.value = res.data }
  catch { /* 拦截器已处理 */ }
  finally { studentLoading.value = false }
}

const openStudentDialog = (row) => {
  if (row) {
    isEditStudent.value = true; editingStudentId.value = row.id
    Object.assign(studentForm, { username: row.username, password: '', role: row.role })
  } else {
    isEditStudent.value = false; editingStudentId.value = null
    Object.assign(studentForm, studentFormDefault)
  }
  studentDialogVisible.value = true
}

const submitStudentForm = async () => {
  if (!studentForm.username.trim()) { ElMessage.warning('请输入用户名'); return }
  if (!isEditStudent.value && !studentForm.password) { ElMessage.warning('请输入密码'); return }
  studentSubmitting.value = true
  try {
    const payload = { username: studentForm.username.trim(), password: studentForm.password || '__KEEP_OLD__', role: studentForm.role }
    isEditStudent.value ? await api.updateStudent(editingStudentId.value, payload) : await api.addStudent(payload)
    ElMessage.success(isEditStudent.value ? '修改成功' : '添加成功')
    studentDialogVisible.value = false; loadStudents()
  } catch { /* 拦截器已处理 */ }
  finally { studentSubmitting.value = false }
}

const deleteStudent = (id) => {
  ElMessageBox.confirm('确定删除该学生吗？其投票记录也将一并删除。', '警告', { type: 'warning' }).then(async () => {
    try { await api.deleteStudent(id); ElMessage.success('删除成功'); loadStudents() }
    catch { /* 拦截器已处理 */ }
  }).catch(() => {})
}

// ===== 候选人推荐 =====
const loadCandidateTeachers = async () => {
  candidateLoading.value = true
  try {
    const res = await api.getTeachers()
    candidateTeacherList.value = res.data
    selectedCandidateIds.value = res.data.filter(t => t.is_candidate === 1).map(t => t.id)
    loadCurrentCandidates()
    await nextTick()
    if (candidateTableRef.value) {
      candidateTeacherList.value.forEach(row => {
        if (row.is_candidate === 1) candidateTableRef.value.toggleRowSelection(row, true)
      })
    }
  } catch { /* 拦截器已处理 */ }
  finally { candidateLoading.value = false }
}

const loadCurrentCandidates = async () => {
  try { const res = await api.getResults(false); currentCandidates.value = res.data }
  catch { /* ignore */ }
}

const handleCandidateSelectionChange = (rows) => {
  if (rows.length > 10) { ElMessage.error('最多只能推荐 10 名候选人'); return }
  selectedCandidateIds.value = rows.map(r => r.id)
}

const confirmRecommend = () => {
  if (selectedCandidateIds.value.length === 0) { ElMessage.warning('请至少选择 1 名候选人'); return }
  ElMessageBox.confirm(
    `确定将当前勾选的 ${selectedCandidateIds.value.length} 名教师设为初选候选人吗？\n\n此操作将覆盖之前的初选名单。`,
    '确认推荐', { type: 'info' }
  ).then(async () => {
    try { await api.recommend(selectedCandidateIds.value); ElMessage.success('初选名单生成成功'); loadCandidateTeachers() }
    catch { /* 拦截器已处理 */ }
  }).catch(() => {})
}

// ===== 投票统计 =====
const loadAdminResults = async (sortByVote = false) => {
  adminSortMode.value = sortByVote
  resultLoading.value = true
  try {
    const res = await api.getResults(sortByVote)
    adminResults.value = res.data
    const sorted = [...res.data].sort((a, b) => b.vote_count - a.vote_count)
    adminTop3.value = sorted.slice(0, 3)
  } catch { /* 拦截器已处理 */ }
  finally { resultLoading.value = false }
}

// ===== 公共方法 =====
const handleTabChange = (tabName) => {
  const loaders = { teachers: loadTeachers, students: loadStudents, recommend: loadCandidateTeachers, results: () => loadAdminResults(false) }
  loaders[tabName]?.()
}

const handleLogout = () => { localStorage.clear(); router.push('/') }

// 系统重置：清空投票数据和学生，保留教师库和管理员（用于新一轮投票）
const handleResetSystem = () => {
  ElMessageBox.confirm(
    '⚠ 确定要重置整个系统吗？\n\n此操作将：\n• 清空所有投票记录\n• 将所有教师票数归零\n• 清除候选人名单\n• 删除所有学生账号\n\n管理员账号不受影响。此操作不可恢复！',
    '重置系统',
    { type: 'error', confirmButtonText: '确认重置', cancelButtonText: '取消' }
  ).then(async () => {
    try {
      await api.resetSystem()
      ElMessage.success('系统已重置')
      const loaders = { teachers: loadTeachers, students: loadStudents, recommend: loadCandidateTeachers, results: () => loadAdminResults(false) }
      loaders[activeTab.value]?.()
    } catch { /* 拦截器已处理 */ }
  }).catch(() => {})
}

onMounted(() => {
  adminInfo.value = JSON.parse(localStorage.getItem('user'))
  loadTeachers()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 60% 40% at 60% 10%, rgba(99,102,241,.03) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 30% 90%, rgba(139,92,246,.02) 0%, transparent 60%),
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
</style>
