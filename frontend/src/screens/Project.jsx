/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer.js'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const navigate = useNavigate()

    // Panel visibility states
    const [ isFileExplorerOpen, setIsFileExplorerOpen ] = useState(true)
    const [ isChatOpen, setIsChatOpen ] = useState(true)
    const [ isTerminalOpen, setIsTerminalOpen ] = useState(false)
    const [ isCollaboratorsOpen, setIsCollaboratorsOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    
    const [ selectedUserId, setSelectedUserId ] = useState(new Set())
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([])
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)
    const [ terminalLogs, setTerminalLogs ] = useState([])

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
            // Refresh project data
            axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
                setProject(res.data.project)
            })
        }).catch(err => {
            console.log(err)
        })
    }

    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message)
        return (
            <div className='overflow-auto bg-slate-900 text-white rounded-lg p-3 text-sm'>
                <Markdown
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                >
                    {messageObject.text}
                </Markdown>
            </div>
        )
    }

    const send = () => {
        if (!message.trim()) return
        
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ])
        setMessage("")
        setTimeout(scrollToBottom, 100)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    // This useEffect is used to initialize the socket and the web container
    useEffect(() => {

        // Initialize the socket : 1st function of config/socket.js
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("WebContainer started")
            }).catch(err => {
                console.error("WebContainer error:", err)
            })
        }

        receiveMessage('project-message', data => {
            console.log(data)
            
            if (data.sender._id === 'ai') {
                const message = JSON.parse(data.message)
                console.log(message)
                
                if (message.fileTree) {
                    webContainer?.mount(message.fileTree)
                    setFileTree(message.fileTree)
                }
                setMessages(prevMessages => [ ...prevMessages, data ])
            } else {
                setMessages(prevMessages => [ ...prevMessages, data ])
            }
            setTimeout(scrollToBottom, 100)
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            const ft = res.data.project.fileTree || {}
            setFileTree(ft)
            
            // Auto-open first file if available
            const files = Object.keys(ft)
            if (files.length > 0 && !currentFile) {
                setCurrentFile(files[0])
                setOpenFiles([files[0]])
            }
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }

    const runProject = async () => {
        try {
            setTerminalLogs([])
            setIsTerminalOpen(true)
            
            await webContainer.mount(fileTree)
            
            setTerminalLogs(prev => [...prev, '📦 Installing dependencies...'])
            const installProcess = await webContainer.spawn("npm", [ "install" ])

            installProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk)
                    setTerminalLogs(prev => [...prev, chunk])
                }
            }))

            await installProcess.exit

            if (runProcess) {
                runProcess.kill()
            }

            setTerminalLogs(prev => [...prev, '🚀 Starting server...'])
            let tempRunProcess = await webContainer.spawn("npm", [ "start" ])

            tempRunProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk)
                    setTerminalLogs(prev => [...prev, chunk])
                }
            }))

            setRunProcess(tempRunProcess)

            webContainer.on('server-ready', (port, url) => {
                console.log(port, url)
                setIframeUrl(url)
                setTerminalLogs(prev => [...prev, `✅ Server ready at ${url}`])
            })
        } catch (error) {
            console.error(error)
            setTerminalLogs(prev => [...prev, `❌ Error: ${error.message}`])
        }
    }

    const closeFile = (file, e) => {
        e.stopPropagation()
        const newOpenFiles = openFiles.filter(f => f !== file)
        setOpenFiles(newOpenFiles)
        if (currentFile === file && newOpenFiles.length > 0) {
            setCurrentFile(newOpenFiles[newOpenFiles.length - 1])
        } else if (newOpenFiles.length === 0) {
            setCurrentFile(null)
        }
    }

    return (
        <main className='h-screen w-screen flex flex-col bg-gray-50 overflow-hidden'>
            {/* Header */}
            <header className='bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0'>
                <div className='flex items-center gap-4'>
                    <button 
                        onClick={() => navigate('/')}
                        className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    >
                        <i className="ri-arrow-left-line text-xl"></i>
                    </button>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                            <i className="ri-folder-line text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 className='text-lg font-bold text-gray-800'>{project.name}</h1>
                            <p className='text-xs text-gray-500'>{project.users?.length} collaborators</p>
                        </div>
                    </div>
                </div>
                
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setIsCollaboratorsOpen(!isCollaboratorsOpen)}
                        className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors flex items-center gap-2'
                    >
                        <i className="ri-team-line"></i>
                        <span>Team</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md'
                    >
                        <i className="ri-user-add-line"></i>
                        <span>Add Collaborator</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area - No Scrolling */}
            <div className='flex flex-1 overflow-hidden min-h-0'>
                {/* File Explorer - Left Panel */}
                <div className={`${isFileExplorerOpen ? 'w-64' : 'w-12'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0`}>
                    <div className='flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0'>
                        {isFileExplorerOpen && <h2 className='font-semibold text-gray-700 text-sm'>FILES</h2>}
                        <button
                            onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
                            className='p-1.5 hover:bg-gray-200 rounded transition-colors ml-auto'
                        >
                            <i className={`ri-${isFileExplorerOpen ? 'sidebar-fold' : 'sidebar-unfold'}-line text-gray-600`}></i>
                        </button>
                    </div>
                    
                    {isFileExplorerOpen && (
                        <div className="file-tree flex-1 overflow-y-auto overflow-x-hidden">
                            {Object.keys(fileTree).length === 0 ? (
                                <div className='p-4 text-center text-gray-500 text-sm'>
                                    <i className="ri-folder-open-line text-3xl mb-2 block"></i>
                                    <p>No files yet</p>
                                </div>
                            ) : (
                                Object.keys(fileTree).map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                        }}
                                        className={`w-full text-left p-3 px-4 flex items-center gap-2 hover:bg-blue-50 transition-colors border-l-2 ${
                                            currentFile === file ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-gray-700'
                                        }`}
                                    >
                                        <i className={`ri-file-${file.endsWith('.js') ? 'code' : file.endsWith('.json') ? 'settings' : file.endsWith('.html') ? 'code' : file.endsWith('.css') ? 'css' : 'text'}-line`}></i>
                                        <span className='text-sm font-medium truncate'>{file}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Code Editor - Center Panel with Terminal */}
                <div className='flex-1 flex flex-col bg-white min-w-0 overflow-hidden'>
                    {/* Open Files Tabs */}
                    <div className="tabs flex items-center gap-1 bg-gray-50 border-b border-gray-200 px-2 py-1 flex-shrink-0 overflow-x-hidden">
                        {openFiles.length === 0 ? (
                            <div className='p-2 text-gray-400 text-sm'>No files open</div>
                        ) : (
                            openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors group flex-shrink-0 ${
                                        currentFile === file 
                                            ? 'bg-white text-blue-600 font-medium shadow-sm' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <i className={`ri-file-${file.endsWith('.js') ? 'code' : file.endsWith('.json') ? 'settings' : 'text'}-line text-sm`}></i>
                                    <span className='text-sm'>{file}</span>
                                    <i 
                                        className="ri-close-line text-sm opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                        onClick={(e) => closeFile(file, e)}
                                    ></i>
                                </button>
                            ))
                        )}
                        <button
                            onClick={runProject}
                            className='ml-auto px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md text-sm flex-shrink-0'
                        >
                            <i className="ri-play-fill"></i>
                            <span>Run</span>
                        </button>
                        {isTerminalOpen && (
                            <button
                                onClick={() => setIsTerminalOpen(false)}
                                className='px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2 text-sm flex-shrink-0'
                            >
                                <i className="ri-terminal-line"></i>
                            </button>
                        )}
                    </div>

                    {/* Code and Terminal Split View */}
                    <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
                        {/* Code Editor Area */}
                        <div className={`${isTerminalOpen ? 'h-1/2' : 'flex-1'} bg-gray-900 overflow-hidden flex flex-col border-b border-gray-700`}>
                            {currentFile && fileTree[currentFile] ? (
                                <div className="h-full overflow-y-auto overflow-x-hidden">
                                    <pre className="hljs m-0 min-h-full">
                                        <code
                                            className="hljs outline-none block p-4 font-mono text-sm"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ 
                                                __html: hljs.highlight(
                                                    'javascript', 
                                                    fileTree[currentFile].file?.contents || ''
                                                ).value 
                                            }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                            }}
                                        />
                                    </pre>
                                </div>
                            ) : (
                                <div className='flex items-center justify-center h-full text-gray-400'>
                                    <div className='text-center'>
                                        <i className="ri-code-box-line text-6xl mb-4 block"></i>
                                        <p className='text-lg'>Select a file to edit</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Terminal/Server Panel - Integrated */}
                        {isTerminalOpen && (
                            <div className='h-1/2 bg-gray-900 text-gray-100 flex flex-col min-h-0'>
                                <div className='flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0'>
                                    <div className='flex items-center gap-4'>
                                        <h3 className='font-semibold text-sm flex items-center gap-2'>
                                            <i className="ri-terminal-line"></i>
                                            TERMINAL & PREVIEW
                                        </h3>
                                        {iframeUrl && (
                                            <input
                                                type="text"
                                                value={iframeUrl}
                                                onChange={(e) => setIframeUrl(e.target.value)}
                                                className="bg-gray-700 text-gray-200 px-3 py-1 rounded text-xs w-64 border border-gray-600 focus:border-blue-500 focus:outline-none"
                                                placeholder="Server URL"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsTerminalOpen(false)}
                                        className='p-1 hover:bg-gray-700 rounded transition-colors'
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>
                                <div className='flex-1 flex overflow-hidden min-h-0'>
                                    <div className={`${iframeUrl ? 'w-1/2' : 'flex-1'} overflow-y-auto overflow-x-hidden p-4 font-mono text-xs`}>
                                        {terminalLogs.length === 0 ? (
                                            <div className='text-gray-500 text-center mt-4'>Terminal logs will appear here...</div>
                                        ) : (
                                            terminalLogs.map((log, index) => (
                                                <div key={index} className='text-gray-300 mb-1'>{log}</div>
                                            ))
                                        )}
                                    </div>
                                    {iframeUrl && webContainer && (
                                        <div className='w-1/2 border-l border-gray-700 overflow-hidden'>
                                            <iframe src={iframeUrl} className="w-full h-full bg-white"></iframe>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel - Right */}
                <div className={`${isChatOpen ? 'w-96' : 'w-12'} transition-all duration-300 bg-white border-l border-gray-200 flex flex-col shadow-sm flex-shrink-0 overflow-hidden`}>
                    <div className='flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0'>
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className='p-1.5 hover:bg-gray-200 rounded transition-colors'
                        >
                            <i className={`ri-${isChatOpen ? 'sidebar-unfold' : 'sidebar-fold'}-line text-gray-600`}></i>
                        </button>
                        {isChatOpen && <h2 className='font-semibold text-gray-700 text-sm'>CHAT & AI</h2>}
                    </div>
                    
                    {isChatOpen && (
                        <>
                            <div
                                ref={messageBox}
                                className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-gray-50"
                            >
                                {messages.length === 0 ? (
                                    <div className='text-center text-gray-400 mt-8'>
                                        <i className="ri-chat-3-line text-5xl mb-3 block"></i>
                                        <p className='text-sm'>Start a conversation</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${msg.sender._id === user._id.toString() ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`${
                                                msg.sender._id === 'ai' 
                                                    ? 'max-w-full bg-gradient-to-br from-purple-500 to-blue-500 text-white' 
                                                    : msg.sender._id === user._id.toString()
                                                        ? 'max-w-xs bg-blue-600 text-white'
                                                        : 'max-w-xs bg-white border border-gray-200'
                                            } rounded-lg p-3 shadow-sm break-words`}>
                                                <div className='flex items-center gap-2 mb-1'>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                                        msg.sender._id === 'ai' ? 'bg-white/20' : 'bg-black/20'
                                                    }`}>
                                                        {msg.sender._id === 'ai' ? '🤖' : msg.sender.email?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className='text-xs opacity-75 truncate'>{msg.sender.email || 'AI Assistant'}</span>
                                                </div>
                                                <div className='text-sm'>
                                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : <p className='break-words'>{msg.message}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                                <div className='flex gap-2'>
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className='flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm min-w-0'
                                        type="text"
                                        placeholder='Type a message or ask AI...'
                                    />
                                    <button
                                        onClick={send}
                                        className='px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md flex-shrink-0'
                                    >
                                        <i className="ri-send-plane-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Collaborators Side Panel */}
            {isCollaboratorsOpen && (
                <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col'>
                        <header className='flex justify-between items-center p-4 border-b border-gray-200'>
                            <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                                <i className="ri-team-line text-blue-600"></i>
                                Collaborators
                            </h2>
                            <button
                                onClick={() => setIsCollaboratorsOpen(false)}
                                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </header>
                        <div className="flex-1 overflow-auto p-4 space-y-2">
                            {project.users && project.users.length > 0 ? (
                                project.users.map(user => (
                                    <div
                                        key={user._id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold'>
                                            {user.email?.[0]?.toUpperCase()}
                                        </div>
                                        <div className='flex-1'>
                                            <h3 className='font-semibold text-gray-800'>{user.email}</h3>
                                            <p className='text-xs text-gray-500'>Collaborator</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className='text-center text-gray-400 py-8'>
                                    <i className="ri-user-line text-5xl mb-2 block"></i>
                                    <p>No collaborators yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Collaborator Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <header className='flex justify-between items-center p-4 border-b border-gray-200'>
                            <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                                <i className="ri-user-add-line text-blue-600"></i>
                                Add Collaborator
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </header>
                        <div className="flex-1 overflow-auto p-4 space-y-2">
                            {users.length > 0 ? (
                                users.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => handleUserClick(user._id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                            Array.from(selectedUserId).includes(user._id)
                                                ? 'bg-blue-50 border-2 border-blue-500'
                                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold relative'>
                                            {user.email?.[0]?.toUpperCase()}
                                            {Array.from(selectedUserId).includes(user._id) && (
                                                <div className='absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
                                                    <i className="ri-check-line text-white text-xs"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex-1'>
                                            <h3 className='font-semibold text-gray-800'>{user.email}</h3>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className='text-center text-gray-400 py-8'>
                                    <i className="ri-user-line text-5xl mb-2 block"></i>
                                    <p>No users available</p>
                                </div>
                            )}
                        </div>
                        <div className='p-4 border-t border-gray-200'>
                            <button
                                onClick={addCollaborators}
                                disabled={selectedUserId.size === 0}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                    selectedUserId.size > 0
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Add {selectedUserId.size > 0 ? `${selectedUserId.size} ` : ''}Collaborator{selectedUserId.size !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project