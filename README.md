# 我最喜爱的教师投票系统

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Axios + Vue Router |
| 后端 | Python 3 + FastAPI + PyMySQL |
| 数据库 | MySQL |

## 项目结构

```
├── teacher_vote_frontend/   # Vue 前端
│   └── src/
│       ├── views/           # 页面组件
│       ├── router/          # 路由配置
│       └── api/             # API 请求封装
└── teacher_vote_backend/    # Python 后端
    └── pythonProject/
        └── app/
            └── routers/     # API 路由模块
```

## 快速启动

### 1. 数据库

创建 MySQL 数据库 `teacher_vote`，执行 `schema.sql` 建表。

### 2. 后端

```bash
cd teacher_vote_backend/pythonProject

# 首次运行需安装依赖
pip install fastapi uvicorn pymysql python-dotenv

# 复制环境变量文件，修改密码
cp .env.example .env

# 启动后端 (端口 8000)
python main.py
```

### 3. 前端

```bash
cd teacher_vote_frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

### 4. 访问

浏览器打开 `http://localhost:5173`
