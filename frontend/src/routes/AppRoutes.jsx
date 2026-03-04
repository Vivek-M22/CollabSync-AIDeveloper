import { Route, BrowserRouter, Routes, useLocation } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'
import Navbar from '../components/Navbar'

const AppContent = () => {
    const location = useLocation()
    const isProjectPage = location.pathname === '/project'

    return (
        <>
            {!isProjectPage && <Navbar />}
            <div className={isProjectPage ? '' : 'pt-16'}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                </Routes>
            </div>
        </>
    )
}

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    )
}

export default AppRoutes