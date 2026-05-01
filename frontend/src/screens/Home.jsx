import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    // Give time for UserContext to restore user data
    setTimeout(() => {
      if (!token) {
        navigate('/login');
      }
      setIsLoading(false);
    }, 100);
  }, [navigate]);

  // Fetch all projects
  useEffect(() => {
    axios
      .get('/project/all')
      .then((res) => {
        console.log('Projects response:', res.data);
        setProjects(res.data.Project || []);
      })
      .catch((error) => {
        console.log('Error fetching projects:', error);
      });
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  function createProject(e) {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    axios
      .post('/project/create', {
        name: projectName,
      })
      .then((res) => {
        console.log(res);
        setIsModalOpen(false);
        setProjectName('');
        toast.success('Project created successfully!');
      })
      .catch((error) => {
        console.log(error);
        if (error.response?.status === 401) {
          toast.error('Please login to create a project');
          navigate('/login');
        } else {
          toast.error('Failed to create project. try different name.');
        }
      });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-[#e5e1e4]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#353437] border-t-violet-400"></div>
          <p className="mt-4 text-sm text-[#ccc3d8]">Loading workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-[#e5e1e4]">
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-zinc-800 bg-[#09090b]/95 px-4 backdrop-blur">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-left">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 text-white">
              <i className="ri-terminal-box-fill"></i>
            </span>
            <span className="text-xl font-black tracking-tight text-white">ZENTRIX</span>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <span className="border-b-2 border-violet-500 pb-3 pt-3 text-white">Projects</span>
            <span className="text-zinc-500">Models</span>
            <span className="text-zinc-500">Team</span>
            <span className="text-zinc-500">Docs</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-bold leading-none text-zinc-100">{user?.email || user?.name || 'Developer'}</p>
            <p className="mt-1 text-[10px] text-zinc-500">Workspace owner</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-xs font-bold text-violet-200">
            {(user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-red-300"
            title="Logout"
          >
            <i className="ri-logout-box-r-line text-lg"></i>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-5 py-10 md:px-6 md:py-12">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-violet-300/80">Project control plane</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#ccc3d8]">
              You have <span className="font-semibold text-violet-300">{projects.length} active project{projects.length === 1 ? '' : 's'}</span> ready for AI-assisted development and live execution.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e5e1e4] px-6 font-bold text-[#0e0e10] transition hover:bg-white active:scale-[0.98]"
          >
            <i className="ri-add-line text-xl"></i>
            Create Project
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group min-h-52 rounded-xl border border-dashed border-[#4a4455] bg-[#131315] p-6 text-left transition hover:border-violet-400/70 hover:bg-[#1c1b1d]"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300 transition group-hover:bg-violet-600 group-hover:text-white">
              <i className="ri-add-line text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white">Create New Project</h3>
            <p className="mt-2 text-sm leading-6 text-[#ccc3d8]">
              Start a collaborative AI workspace with chat, files, terminal output, and live preview.
            </p>
          </button>

          {projects.map((project, index) => (
            <button
              key={project._id}
              onClick={() => navigate(`/project/${project._id}`)}
              className="group min-h-52 rounded-xl border border-[#4a4455] bg-gradient-to-br from-[#201f22] to-[#131315] p-6 text-left transition duration-300 hover:border-violet-400/70 hover:-translate-y-0.5"
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <i className={index % 2 === 0 ? 'ri-cloud-line text-xl' : 'ri-database-2-line text-xl'}></i>
                </div>
                <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Active
                </span>
              </div>
              <h3 className="line-clamp-1 text-xl font-bold text-white transition group-hover:text-violet-300">{project.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#ccc3d8]">
                AI coding workspace with synchronized collaboration and generated project files.
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#09090b] bg-violet-600 text-[10px] font-bold text-white">AI</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#09090b] bg-zinc-800 text-[10px] font-bold text-zinc-300">
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-violet-300">
                  Open
                  <i className="ri-arrow-right-line"></i>
                </span>
              </div>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-8 rounded-xl border border-[#4a4455] bg-[#131315] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#4a4455] bg-[#1c1b1d] text-[#958da1]">
              <i className="ri-folder-unknow-line text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#ccc3d8]">
              Create your first project to begin collaborating with Zentrix AI.
            </p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#4a4455] bg-[#2a2a2c] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-[#4a4455] bg-[#353437] p-6">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-violet-200/70">New environment</p>
                <h2 className="mt-2 text-xl font-bold text-white">Create Project</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md p-2 text-[#ccc3d8] hover:bg-white/10 hover:text-white">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={createProject} className="space-y-6 p-6">
              <div>
                <label className="mb-2 block font-display text-[10px] uppercase tracking-[0.16em] text-[#ccc3d8]">
                  Project name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Skyline Dashboard"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-12 w-full rounded-lg border border-[#4a4455] bg-[#0e0e10] px-4 text-sm text-white outline-none transition placeholder:text-[#958da1] focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#ccc3d8] transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 active:scale-[0.98]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
