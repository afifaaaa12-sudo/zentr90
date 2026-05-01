import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { setUser } = useContext(UserContext);

  function submitHandler(e) {
    e.preventDefault();
    axios
      .post('/users/login', {
        email,
        password,
      })
      .then((res) => {
        console.log(res.data);
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));

        // Simple: Only set user in this specific tab's memory
        setUser(res.data.user);
        console.log('🔐 Login - User:', res.data.user.email);
        toast.success('Login successful!');
        navigate('/home');
      })
      .catch((err) => {
        console.log(err.response?.data || err.message);
        toast.error(err.response?.data?.error || 'Login failed. Please try again.');
      });
  }

  return (
    <main className="zentrix-grid relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 text-[#e5e1e4]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_85%_5%,rgba(0,162,230,0.14),transparent_28%),linear-gradient(to_bottom,rgba(14,14,16,0.2),#09090b)]" />
      <div className="absolute left-1/2 top-1/2 h-[540px] w-[460px] -translate-x-1/2 -translate-y-1/2 rotate-3 rounded-2xl border border-violet-300/10 bg-white/[0.03] blur-[1px]" />
      <div className="relative z-10 w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-600 text-violet-50 shadow-2xl shadow-violet-600/25">
            <i className="ri-terminal-box-fill text-2xl"></i>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">ZENTRIX</h1>
          <p className="mt-2 text-sm text-[#ccc3d8]">Access your high-performance workspace</p>
        </div>

        <form onSubmit={submitHandler} className="zentrix-glass rounded-xl p-6 shadow-2xl shadow-black/40">
          <div className="mb-5">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-violet-200/70">Secure login</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Welcome back</h2>
          </div>

          <label className="mb-2 block font-display text-[10px] uppercase tracking-[0.16em] text-[#ccc3d8]">
            Developer identity
          </label>
          <div className="group relative mb-4">
            <i className="ri-at-line absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#958da1] transition-colors group-focus-within:text-violet-300"></i>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              className="h-12 w-full rounded-lg border border-[#4a4455] bg-[#1c1b1d] pl-10 pr-4 text-sm text-white outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="mb-2 block font-display text-[10px] uppercase tracking-[0.16em] text-[#ccc3d8]">
            Access key
          </label>
          <div className="group relative">
            <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#958da1] transition-colors group-focus-within:text-violet-300"></i>
            <input
              type="password"
              name="password"
              placeholder="********"
              className="font-code h-12 w-full rounded-lg border border-[#4a4455] bg-[#1c1b1d] pl-10 pr-4 text-sm text-white outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#e5e1e4] font-bold text-[#0e0e10] transition hover:bg-white active:scale-[0.98]"
          >
            Sign In
            <i className="ri-arrow-right-line text-lg"></i>
          </button>

          <p className="mt-5 text-center text-sm text-[#ccc3d8]">
            New to Zentrix?{' '}
            <Link to="/register" className="font-semibold text-white transition hover:text-violet-300">
              Create an account
            </Link>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#958da1]">
          <span>Privacy</span>
          <span className="h-1 w-1 rounded-full bg-[#4a4455]" />
          <span>Terms</span>
          <span className="h-1 w-1 rounded-full bg-[#4a4455]" />
          <span>v1.0.4</span>
        </div>
      </div>
    </main>
  );
};

export default Login;
