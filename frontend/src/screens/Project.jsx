import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { UserContext } from "../context/user.context";
import { getWebContainer } from "../config/webContainer";

function parseAiResponse(text) {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return JSON.parse(text.substring(startIndex, endIndex + 1));
    }

    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [socket, setSocket] = useState(null);

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { user } = useContext(UserContext);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor', 'chat', 'output'
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [webContainerLogs, setWebContainerLogs] = useState([]);

  useEffect(() => {
    getWebContainer().then((container) => {
      setWebContainer(container);
      console.log("WebContainer initialized");
    });
  }, []);

  console.log('Current user in Project:', user?.email || 'No user');

  useEffect(() => {
    if (id) {
      const savedMessages = sessionStorage.getItem(`messages_${id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
        console.log('Loaded messages from storage:', JSON.parse(savedMessages).length);
      }
    }
  }, [id]);

  useEffect(() => {
    if (id && messages.length > 0) {
      sessionStorage.setItem(`messages_${id}`, JSON.stringify(messages));
      console.log('Saved messages to storage:', messages.length);
    }
  }, [messages, id]);

  useEffect(() => {
    let currentTree = {};

    messages.forEach((msg) => {
      const isAi = msg.email === 'AI';
      const parsed = isAi ? parseAiResponse(msg.text) : null;

      if (parsed) {
        const tree = parsed.fileTree || parsed.filetree || parsed.tree;
        if (tree && Object.keys(tree).length > 0) {
          currentTree = { ...currentTree, ...tree };
        }

        if (parsed.files && Array.isArray(parsed.files)) {
          parsed.files.forEach((f) => {
            if (f.filename && (f.content !== undefined || f.contents !== undefined)) {
              currentTree[f.filename] = { file: { contents: f.content || f.contents } };
            }
          });
        }

        if (parsed.actions && Array.isArray(parsed.actions)) {
          parsed.actions.forEach((action) => {
            if (action.type === 'delete' && action.filename) {
              delete currentTree[action.filename];
            }
          });
        }
      }

      if (msg.action && msg.action.type === 'delete' && msg.action.filename) {
        delete currentTree[msg.action.filename];
      }
    });

    setFileTree(currentTree);
  }, [messages]);

  useEffect(() => {
    if (!id) return;

    if (socket) {
      console.log('Cleaning up existing socket...');
      socket.off('connect');
      socket.off('project-message');
      socket.off('disconnect');
      socket.disconnect();
      setSocket(null);
    }

    const token = sessionStorage.getItem('token');

    const socketInstance = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      query: { projectId: id },
      transports: ['websocket', 'polling']
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected! ID:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
    });

    socketInstance.on('project-message', (data) => {
      console.log('RECEIVED MESSAGE:', data);
      const newMessage = {
        text: data.message,
        email: data.sender?.email || 'Unknown',
        type: "incoming",
        action: data.action
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socketInstance.on('user-removed', (data) => {
      const currentUserStr = sessionStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser._id === data.userId) {
          toast.error('You have been removed from this project');
          navigate('/home');
        }
      }
    });

    return () => {
      console.log('Cleaning up socket...');
      socketInstance.off('connect');
      socketInstance.off('project-message');
      socketInstance.off('user-removed');
      socketInstance.off('disconnect');
      socketInstance.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      axios.get(`/project/get-project/${id}`)
        .then((res) => {
          if (res.data.project && res.data.project.users) {
            setCollaborators(res.data.project.users);
          }
        })
        .catch((err) => {
          console.log('Failed to fetch project details:', err);
        });
    }
  }, [id]);

  useEffect(() => {
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleAddCollaborator = (user) => {
    const exists = collaborators.find((c) => c._id === user._id);
    if (!exists) {
      axios.put('/project/add-user', {
        projectId: id,
        users: [user._id]
      }).then((res) => {
        setCollaborators((prev) => [...prev, user]);
        toast.success('User added to project!');
      }).catch((err) => {
        console.log(err);
        toast.error(err.response?.data?.error || 'Failed to add user');
      });
    }
    setIsModalOpen(false);
  };

  const handleRemoveCollaborator = (userId) => {
    axios.put('/project/remove-user', {
      projectId: id,
      userId: userId
    }).then((res) => {
      setCollaborators((prev) => prev.filter((c) => c._id !== userId));
      toast.success('User removed from project!');
      if (socket) {
        socket.emit('user-removed', { userId });
      }
    }).catch((err) => {
      console.log(err);
      toast.error(err.response?.data?.error || 'Failed to remove user');
    });
  };

  const handleLeaveProject = () => {
    if (!window.confirm('Are you sure you want to leave this project?')) return;

    axios.put('/project/remove-user', {
      projectId: id,
      userId: user._id || user.id
    }).then((res) => {
      toast.success('You have left the project');
      if (socket) {
        socket.emit('user-removed', { userId: user._id || user.id });
      }
      navigate('/home');
    }).catch((err) => {
      console.log(err);
      toast.error(err.response?.data?.error || 'Failed to leave project');
    });
  };

  function isCreateRequest(msg) {
    const lowercaseMsg = msg.toLowerCase();
    const hasCreateWord = lowercaseMsg.includes('create') || lowercaseMsg.includes('generate') || lowercaseMsg.includes('new') || lowercaseMsg.includes('make');
    const hasProjectWord = lowercaseMsg.includes('project') || lowercaseMsg.includes('app') || lowercaseMsg.includes('website') || lowercaseMsg.includes('page') || lowercaseMsg.includes('server');
    return hasCreateWord && hasProjectWord;
  }

  function handleSendMessage(overrideMessage = null) {
    const msgToSend = overrideMessage || message;
    if (!msgToSend.trim()) return;

    const hasAiMessages = messages.some(m => m.email === 'AI');
    if (!overrideMessage && msgToSend.includes('@ai') && isCreateRequest(msgToSend) && hasAiMessages) {
      setPendingMessage(msgToSend);
      setIsConfirmModalOpen(true);
      return;
    }

    const newMessage = {
      text: msgToSend,
      email: user.email,
      type: "outgoing"
    };
    setMessages(prev => [...prev, newMessage]);

    if (socket && socket.connected) {
      socket.emit('project-message', {
        message: msgToSend,
        sender: user || { email: 'Anonymous' }
      }, (ack) => {
        console.log('Server received message:', ack);
      });
    } else {
      console.log('Socket not connected, cannot send message');
    }

    setMessage('');
    setPendingMessage('');
  }

  function handleConfirmDelete() {
    setMessages([]);
    sessionStorage.removeItem(`messages_${id}`);

    handleSendMessage(pendingMessage);
    setIsConfirmModalOpen(false);
  }

  function handleCancelDelete() {
    handleSendMessage(pendingMessage);
    setIsConfirmModalOpen(false);
  }

  function handleDeleteFile(filename) {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    const deleteMessage = {
      text: `Deleted file: ${filename}`,
      email: user.email,
      type: "outgoing",
      action: { type: 'delete', filename }
    };

    setMessages(prev => [...prev, deleteMessage]);

    if (socket && socket.connected) {
      socket.emit('project-message', {
        message: deleteMessage.text,
        sender: user,
        action: deleteMessage.action
      });
    }

    if (currentFile === filename) {
      setCurrentFile(null);
    }
    setOpenFiles(prev => prev.filter(f => f !== filename));
  }

  async function runProject() {
    if (!webContainer) {
      toast.error("WebContainer is not initialized yet");
      return;
    }

    setWebContainerLogs([]);

    try {
      await webContainer.mount(fileTree);
      setWebContainerLogs(prev => [...prev, "Files mounted successfully.\n"]);
    } catch (err) {
      console.error("Mount error:", err);
      setWebContainerLogs(prev => [...prev, `Mount Error: ${err.message}\n`]);
      toast.error("Failed to mount files");
      return;
    }

    const aiMessages = messages.filter(m => m.email === 'AI');
    let buildCommands = [];
    let startCmd = null;
    if (aiMessages.length > 0) {
      const parsed = parseAiResponse(aiMessages[aiMessages.length - 1].text);
      if (parsed) {
        if (parsed.buildCommand) {
          buildCommands.push(parsed.buildCommand);
        } else if (parsed.setup_commands) {
          const commands = Object.values(parsed.setup_commands);
          commands.forEach(cmd => {
            const parts = cmd.split(" ");
            buildCommands.push({ mainItem: parts[0], commands: parts.slice(1) });
          });
        } else if (fileTree["package.json"]) {
          buildCommands.push({ mainItem: "npm", commands: ["install"] });
        }

        startCmd = parsed.startCommand;
        if (!startCmd && parsed.execution && parsed.execution.start_command) {
          const parts = parsed.execution.start_command.split(" ");
          startCmd = {
            mainItem: parts[0],
            commands: parts.slice(1)
          };
        }

        if (!startCmd) {
          if (fileTree["package.json"]) {
            startCmd = { mainItem: "npm", commands: ["start"] };
          } else if (fileTree["index.js"]) {
            startCmd = { mainItem: "node", commands: ["index.js"] };
          } else if (fileTree["server.js"]) {
            startCmd = { mainItem: "node", commands: ["server.js"] };
          }
        }
      }
    }

    try {
      for (const cmd of buildCommands) {
        setWebContainerLogs(prev => [...prev, `> ${cmd.mainItem} ${cmd.commands.join(' ')}\n`]);

        const finalCommands = [...cmd.commands];
        if (cmd.mainItem === 'npx' && !finalCommands.includes('-y')) {
          finalCommands.unshift('-y');
        }

        const installProcess = await webContainer.spawn(cmd.mainItem, finalCommands);
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            const cleanData = data.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
            console.log(cleanData);
            setWebContainerLogs(prev => [...prev, cleanData]);
          }
        }));
        await installProcess.exit;
      }

      if (startCmd) {
        setWebContainerLogs(prev => [...prev, `> ${startCmd.mainItem} ${startCmd.commands.join(' ')}\n`]);

        const finalCommands = [...startCmd.commands];
        if (startCmd.mainItem === 'npx' && !finalCommands.includes('-y')) {
          finalCommands.unshift('-y');
        }

        const process = await webContainer.spawn(startCmd.mainItem, finalCommands);
        process.output.pipeTo(new WritableStream({
          write(data) {
            const cleanData = data.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
            console.log(cleanData);
            setWebContainerLogs(prev => [...prev, cleanData]);
          }
        }));
        setRunProcess(process);
      }
    } catch (err) {
      console.error("Execution error:", err);
      setWebContainerLogs(prev => [...prev, `Execution Error: ${err.message}\n`]);
    }
  }

  useEffect(() => {
    if (webContainer) {
      webContainer.on('server-ready', (port, url) => {
        console.log("Server ready at", url);
        setIframeUrl(url);
      });
    }
  }, [webContainer]);

  const fileNames = Object.keys(fileTree);
  const availableUsers = users.filter(u => !collaborators.some(c => c._id === u._id));
  const currentFileContents = currentFile && fileTree[currentFile]
    ? fileTree[currentFile].file?.contents || fileTree[currentFile].contents || ""
    : "";

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#09090b] text-[#e5e1e4]">
      <header className="flex h-12 items-center justify-between border-b border-zinc-800 bg-[#09090b] px-4">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsExplorerOpen(!isExplorerOpen)} className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 md:hidden">
            <i className={isExplorerOpen ? "ri-close-line" : "ri-menu-line"}></i>
          </button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 text-white">
              <i className="ri-terminal-box-fill"></i>
            </span>
            <span className="text-xl font-black tracking-tight text-white">ZENTRIX</span>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <span className="border-b-2 border-violet-500 py-3 text-white">Workspace</span>
            <span className="text-zinc-500">Models</span>
            <span className="text-zinc-500">Team</span>
            <span className="text-zinc-500">Docs</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden -space-x-2 sm:flex">
            {collaborators.slice(0, 3).map((collab) => (
              <span
                key={collab._id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#09090b] bg-zinc-800 text-[10px] font-bold text-violet-200"
                title={collab.email}
              >
                {collab.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            ))}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              title="Add collaborator"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
          </div>
          <button
            onClick={() => setShowSidebar(true)}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            <i className="ri-group-line mr-2"></i>
            Collaborators
          </button>
          <button
            onClick={runProject}
            className="rounded-md bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98]"
          >
            <i className="ri-play-fill mr-2"></i>
            Run
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        <aside className={`${isExplorerOpen ? 'fixed inset-0 z-[60] flex' : 'hidden'} md:relative md:z-0 md:flex w-16 flex-col border-r border-zinc-800 bg-[#09090b] lg:w-56`}>
          <div className="flex-1 py-4">
            <div className="flex items-center justify-between px-4 md:hidden">
              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500">Workspace</span>
              <button onClick={() => setIsExplorerOpen(false)} className="text-zinc-500 hover:text-white">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="mb-4 hidden px-4 lg:block">
              <h3 className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500">Workspace</h3>
            </div>
            <nav className="space-y-1">
              {[
                ['ri-folder-3-fill', 'Explorer', true],
                ['ri-search-line', 'Search'],
                ['ri-git-branch-line', 'Source Control'],
                ['ri-sparkling-2-line', 'AI Chat'],
                ['ri-puzzle-line', 'Extensions'],
              ].map(([icon, label, active]) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 border-l-2 px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-transparent text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
                  }`}
                >
                  <i className={`${icon} text-lg`}></i>
                  <span className="hidden lg:block">{label}</span>
                </div>
              ))}
            </nav>
          </div>
          <div className="border-t border-zinc-800 p-4">
            <div className="hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 lg:block">
              <p className="mb-2 text-[10px] text-zinc-500">SESSION FILES</p>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-violet-500" style={{ width: `${Math.min(fileNames.length * 12, 100)}%` }}></div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-400">{fileNames.length} generated files</p>
            </div>
          </div>
        </aside>

        {isExplorerOpen && <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsExplorerOpen(false)} />}

        <section className="flex min-w-0 flex-1 flex-col bg-[#131315]">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className={`${isExplorerOpen ? 'fixed inset-y-0 left-16 z-[60] flex animate-in slide-in-from-left duration-300' : 'hidden'} md:relative md:left-0 md:z-0 md:flex w-64 flex-col border-r border-zinc-800 bg-[#0e0e10]`}>
              <div className="flex h-9 items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-4">
                <span className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500">Project Files</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{fileNames.length}</span>
              </div>
              <div className="scrollbar-hide flex-1 overflow-y-auto py-2 text-sm">
                {fileNames.length > 0 ? (
                  fileNames.map((filename) => (
                    <div key={filename} className="group flex items-center pr-2">
                      <button
                        onClick={() => {
                          setCurrentFile(filename);
                          if (!openFiles.includes(filename)) setOpenFiles([...openFiles, filename]);
                          setIsExplorerOpen(false);
                        }}
                        className={`min-w-0 flex-1 border-l-2 px-4 py-1.5 text-left transition ${
                          currentFile === filename
                            ? 'border-violet-500 bg-violet-500/10 text-white'
                            : 'border-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <i className="ri-file-code-line flex-shrink-0 text-blue-400"></i>
                          <span className="truncate">{filename}</span>
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(filename);
                        }}
                        className="rounded p-1 text-zinc-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                        title="Delete file"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-sm text-zinc-500">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                      <i className="ri-folder-code-line text-xl"></i>
                    </div>
                    <p>No files generated yet.</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">Ask AI to create an app or website.</p>
                  </div>
                )}
              </div>
            </aside>

            <div className={`${activeMobileTab === 'editor' ? 'flex' : 'hidden'} md:flex min-w-0 flex-1 flex-col border-r border-zinc-800`}>
              <div className="scrollbar-hide flex h-9 items-center overflow-x-auto border-b border-zinc-800 bg-zinc-900/30">
                {currentFile ? (
                  <div className="flex h-full items-center gap-2 border-r border-zinc-800 border-t-2 border-t-violet-500 bg-[#1c1b1d] px-4 text-xs text-zinc-100">
                    <i className="ri-file-code-line text-blue-400"></i>
                    <span>{currentFile}</span>
                  </div>
                ) : (
                  <div className="px-4 text-xs text-zinc-500">No file selected</div>
                )}
              </div>
              <div className="scrollbar-hide flex-1 overflow-auto bg-[#0e0e10] p-4 md:p-6">
                {currentFile && fileTree[currentFile] ? (
                  <pre className="font-code min-h-full whitespace-pre-wrap break-words text-[13px] leading-7 text-zinc-300">
                    <code>{currentFileContents}</code>
                  </pre>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                    <i className="ri-code-box-line mb-3 text-5xl text-zinc-700"></i>
                    <p className="text-sm font-semibold text-zinc-400">Select a file to view code</p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-600">Generated project files will appear in the explorer when AI returns a file tree.</p>
                  </div>
                )}
              </div>
            </div>

            <aside className={`${activeMobileTab === 'chat' ? 'flex' : 'hidden'} xl:flex w-full xl:w-80 flex-col bg-[#0e0e10]`}>
              <div className="flex h-9 items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-4">
                <div className="flex items-center gap-2">
                  <i className="ri-sparkling-2-line text-violet-300"></i>
                  <span className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-500">AI Assistant</span>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="text-zinc-500 hover:text-zinc-300">
                  <i className="ri-user-add-line"></i>
                </button>
              </div>
              <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm leading-6 text-zinc-500">
                    Mention <span className="font-code text-violet-300">@ai</span> to generate files, review code, or create a new project.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isAi = msg.email === 'AI';
                    const parsed = isAi ? parseAiResponse(msg.text) : null;
                    const displayText = parsed
                      ? parsed.text || "I have generated the requested files for you. Click 'Run' to execute the project."
                      : msg.text;

                    return (
                      <div key={index} className={`flex flex-col gap-2 ${msg.type === "incoming" ? "" : "items-end"}`}>
                        <div className="flex items-center gap-2">
                          {msg.type === "incoming" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] text-white">
                              <i className={isAi ? 'ri-flashlight-fill' : 'ri-user-line'}></i>
                            </span>
                          )}
                          <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                            {isAi ? 'ZENTRIX AI' : msg.email}
                          </span>
                        </div>
                        <div
                          className={`max-w-[92%] whitespace-pre-wrap break-words rounded-lg border p-3 text-sm leading-6 ${
                            msg.type === "incoming"
                              ? 'border-zinc-800 bg-zinc-800/40 text-zinc-300'
                              : 'border-violet-500/30 bg-violet-500/10 text-zinc-100'
                          }`}
                        >
                          {displayText}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-zinc-800 bg-zinc-900/20 p-4">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 pr-11 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Ask AI to help with code..."
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="absolute bottom-2 right-2 rounded-md bg-violet-600 p-2 text-white transition hover:bg-violet-500"
                  >
                    <i className="ri-send-plane-fill"></i>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div className={`${activeMobileTab === 'output' ? 'flex' : 'hidden'} md:flex h-full md:h-64 flex-col md:flex-row border-t border-zinc-800 bg-zinc-900/50`}>
            <div className="flex min-w-0 flex-1 flex-col border-b md:border-b-0 md:border-r border-zinc-800">
              <div className="flex h-8 items-center gap-4 border-b border-zinc-800 bg-zinc-900/80 px-4">
                <span className="font-display flex h-full items-center border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-100">Terminal</span>
                <span className="font-display text-[10px] uppercase tracking-[0.16em] text-zinc-500">Output</span>
              </div>
              <div className="scrollbar-hide font-code flex-1 overflow-auto p-4 text-[12px] leading-6 text-zinc-300">
                {webContainerLogs.length > 0 ? (
                  <pre className="whitespace-pre-wrap break-words">{webContainerLogs.join('')}</pre>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400">$</span>
                      <span className="text-blue-400">zentrix-workspace</span>
                      <span className="text-violet-400">ready</span>
                    </div>
                    <p className="mt-2 text-zinc-500">Terminal output will appear here after running generated files.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col bg-zinc-950 md:w-[420px] md:flex-none">
              <div className="flex h-8 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4">
                <div className="flex items-center gap-2">
                  <i className="ri-global-line text-zinc-500"></i>
                  <span className="font-display text-[10px] uppercase tracking-[0.16em] text-zinc-100">Live Preview</span>
                </div>
                {iframeUrl && (
                  <button onClick={() => setIframeUrl(null)} className="text-zinc-500 hover:text-white">
                    <i className="ri-close-line"></i>
                  </button>
                )}
              </div>
              <div className="m-2 flex flex-1 overflow-hidden rounded bg-white min-h-[300px] md:min-h-0">
                {iframeUrl ? (
                  <iframe src={iframeUrl} className="h-full w-full" title="Web Container Preview" />
                ) : (
                  <div className="flex flex-1 items-center justify-center bg-white text-center text-zinc-800">
                    <div>
                      <i className="ri-window-line text-4xl text-zinc-300"></i>
                      <p className="mt-3 text-sm font-bold">Preview waiting</p>
                      <p className="mt-1 text-xs text-zinc-500">Run a generated app to open it here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="flex h-6 items-center justify-between bg-violet-600 px-3 text-[10px] font-medium text-white">
            <div className="flex items-center gap-4">
              <span><i className="ri-git-branch-line mr-1"></i>main*</span>
              <span><i className="ri-refresh-line mr-1"></i>Synchronized</span>
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <span>{currentFile || 'No file'}</span>
              <span>UTF-8</span>
              <span className="rounded-sm bg-white/20 px-2">ZENTRIX</span>
            </div>
          </footer>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-zinc-800 bg-black/80 backdrop-blur-md md:hidden">
        {[
          { id: 'editor', icon: 'ri-code-s-slash-line', label: 'Code' },
          { id: 'chat', icon: 'ri-sparkling-2-line', label: 'AI Chat' },
          { id: 'output', icon: 'ri-terminal-window-line', label: 'Output' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition ${
              activeMobileTab === tab.id ? 'text-violet-400' : 'text-zinc-500'
            }`}
          >
            <i className={`${tab.icon} text-lg`}></i>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="fixed bottom-20 right-4 z-40 hidden md:block xl:hidden">
        <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-800 bg-[#0e0e10] shadow-2xl shadow-black/50">
          <div className="flex h-9 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4">
            <span className="font-display text-[10px] uppercase tracking-[0.18em] text-zinc-400">AI Assistant</span>
          </div>
          <div className="scrollbar-hide max-h-52 overflow-y-auto p-3 text-sm text-zinc-400">
            {messages.slice(-3).map((msg, index) => (
              <div key={index} className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
                <p className="mb-1 text-[10px] font-bold uppercase text-zinc-600">{msg.email}</p>
                <p className="line-clamp-3 whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="flex border-t border-zinc-800">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="min-w-0 flex-1 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
              type="text"
              placeholder="Ask AI..."
            />
            <button onClick={() => handleSendMessage()} className="bg-violet-600 px-3 text-white">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed right-4 top-16 z-50 w-80 rounded-xl border border-[#4a4455] bg-[#201f22] p-4 shadow-2xl shadow-black/50">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.18em] text-violet-200/70">Invite teammate</p>
              <h2 className="mt-1 font-semibold text-white">Select User</h2>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-white">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div className="scrollbar-hide flex max-h-72 flex-col gap-2 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-500">No users available to add.</p>
            ) : (
              availableUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleAddCollaborator(user)}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left text-sm text-zinc-300 transition hover:border-violet-500/60 hover:bg-violet-500/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                    {user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="truncate">{user.email}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex h-full w-80 flex-col border-r border-[#4a4455] bg-[#201f22] p-4 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-violet-200/70">Project access</p>
                <h2 className="mt-1 text-lg font-bold text-white">Collaborators</h2>
              </div>
              <button onClick={() => setShowSidebar(false)} className="rounded p-2 text-zinc-500 hover:bg-white/10 hover:text-white">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto">
              {collaborators.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-500">No collaborators yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {collaborators.map((collab) => (
                    <div key={collab._id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                          {collab.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <span className="truncate text-sm text-zinc-300">{collab.email}</span>
                      </div>
                      {collab._id !== (user._id || user.id) && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab._id)}
                          className="rounded p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300"
                          title="Remove collaborator"
                        >
                          <i className="ri-user-unfollow-line"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <button
                onClick={handleLeaveProject}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
              >
                <i className="ri-logout-box-line"></i>
                Leave Project
              </button>
            </div>
          </div>
          <button className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4a4455] bg-[#201f22] shadow-2xl shadow-black/60">
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-300">
                <i className="ri-delete-bin-6-line text-2xl"></i>
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">Create New Project?</h2>
              <p className="text-sm leading-6 text-[#ccc3d8]">
                You are about to create a new project. Do you want to delete the previous project history and start fresh, or keep the existing files?
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-800 bg-[#131315] p-4 sm:flex-row">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500"
              >
                Delete & Create
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700"
              >
                Keep & Create
              </button>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
