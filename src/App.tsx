import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Home } from '@/pages/Home'
import { CourseUpload } from '@/pages/CourseUpload'
import { InstructorOnboarding } from '@/pages/InstructorOnboarding'
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
          <Route path="upload" element={<CourseUpload />} />
          <Route path="onboarding" element={<InstructorOnboarding />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
