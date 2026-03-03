import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Home } from '@/pages/Home'
import { CreateCourse } from '@/pages/CreateCourse'
import { CreateWithAI } from '@/pages/CreateWithAI'
import { UploadCourse } from '@/pages/UploadCourse'
import { CourseShare } from '@/pages/CourseShare'
import { CoursePlayer } from '@/pages/CoursePlayer'
import { Library } from '@/pages/Library'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="courses/:id" element={<CourseShare />} />
        <Route path="course/:id" element={<CoursePlayer />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Home />} />
          <Route path="library" element={<Library />} />
          <Route path="create" element={<CreateCourse />} />
          <Route path="create/ai" element={<CreateWithAI />} />
          <Route path="create/upload" element={<UploadCourse />} />
          <Route path="upload" element={<Navigate to="/create/upload" replace />} />
          <Route path="onboarding" element={<Navigate to="/create" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
