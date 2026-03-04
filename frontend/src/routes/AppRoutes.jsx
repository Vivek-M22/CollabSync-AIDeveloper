import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'
import Navbar from '../components/Navbar'

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <div className="pt-16">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default AppRoutes