import { useState, useEffect, useContext } from 'react'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        if (user) {
            axios.get('/projects/all').then((res) => {
                setProject(res.data.projects)
            }).catch(err => {
                console.log(err)
            })
        }
    }, [user])

    return (
        <main>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fade-in">
                        Collaborate. Create. Innovate.
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Experience seamless real-time collaboration powered by AI. Build projects together, anywhere, anytime.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => user ? setIsModalOpen(true) : navigate('/register')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            {user ? 'Start New Project' : 'Get Started Free'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Projects Section - Only show if logged in */}
            {user ? (
                <section className="py-12 px-4 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Projects</h2>
                    <div className="projects grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center min-h-[180px]">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <i className="ri-add-line text-white text-3xl"></i>
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-blue-600">New Project</span>
                        </button>

                    {
                        project.map((project) => (
                            <div key={project._id}
                                onClick={() => {
                                    navigate(`/project`, {
                                        state: { project }
                                    })
                                }}
                                className="group cursor-pointer p-6 bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-blue-400 transition-all duration-300 min-h-[180px] flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <i className="ri-folder-line text-white text-xl"></i>
                                        </div>
                                        <i className="ri-arrow-right-line text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
                                    </div>
                                    <h2 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors'>
                                        {project.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <i className="ri-team-line"></i>
                                    <span className="text-sm">{project.users.length} Collaborators</span>
                                </div>
                            </div>
                        ))
                    }
                    </div>
                </section>
            ) : (
                /* Call to Action Section for non-logged in users */
                <section className="py-20 px-4 max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 text-center">
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                                    <i className="ri-rocket-line text-white text-4xl"></i>
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                Ready to Start Creating?
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Join thousands of developers building amazing projects together. Sign up now and start your first project in minutes!
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    Get Started Free
                                </button>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-300"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* How it Works Section */}
            <section id="how-it-works" className="py-20 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">How It Works</h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Get started in three simple steps and experience the future of collaborative development
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <i className="ri-user-add-line text-white text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Create Account</h3>
                            <p className="text-gray-600">
                                Sign up in seconds and join a community of innovative developers building the future together.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <i className="ri-folder-add-line text-white text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Start Project</h3>
                            <p className="text-gray-600">
                                Create or join projects instantly. Invite collaborators and set up your workspace in minutes.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                                <i className="ri-code-s-slash-line text-white text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Collaborate & Build</h3>
                            <p className="text-gray-600">
                                Code together in real-time with AI assistance. See changes instantly and ship faster.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                <div className="max-w-7xl mx-auto text-white">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">About CollabSync AI</h2>
                            <p className="text-xl mb-6 text-white/90">
                                We&apos;re revolutionizing the way teams collaborate on code. Our AI-powered platform combines real-time collaboration with intelligent assistance to make development faster, smarter, and more enjoyable.
                            </p>
                            <p className="text-lg text-white/80 mb-8">
                                Whether you&apos;re a solo developer or part of a large team, CollabSync AI provides the tools you need to build amazing projects together. Experience the future of collaborative development today.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                                    <h4 className="text-3xl font-bold mb-2">10+</h4>
                                    <p className="text-white/80">Active Users</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                                    <h4 className="text-3xl font-bold mb-2">15+</h4>
                                    <p className="text-white/80">Projects Created</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                                    <h4 className="text-3xl font-bold mb-2">99.9%</h4>
                                    <p className="text-white/80">Uptime</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                                    <h4 className="text-3xl font-bold mb-2">12/7*</h4>
                                    <p className="text-white/80">Support</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="w-80 h-80 bg-white/10 backdrop-blur-md rounded-3xl p-8 flex items-center justify-center">
                                    <i className="ri-team-line text-white text-9xl"></i>
                                </div>
                                <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                    <i className="ri-sparkling-line text-white text-5xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Create Project Modal - Only show if logged in */}
            {isModalOpen && user && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <i className="ri-close-line text-2xl text-gray-600"></i>
                            </button>
                        </div>
                        <form onSubmit={createProject}>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" 
                                    placeholder="Enter your project name..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                                    required 
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors" 
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Home