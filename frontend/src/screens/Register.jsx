import React, { useState , useContext} from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {setUser} = useContext(UserContext)

  function submitHandler(e) {
    e.preventDefault();

    if (password.length < 3) {
      toast.error("Password must be at least 3 characters");
      return;
    }

    axios.post("/users/register", {
      email,
      password
    }).then((res) => {
      console.log(res.data);
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user)
      toast.success('Registration successful!')
      navigate('/home');
    }).catch((err) => {
      console.log(err.response?.data || err.message);
      toast.error(err.response?.data?.errors?.[0]?.msg || "Registration failed");
    });
  }

  return (
    <main className="zentrix-grid relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 text-[#e5e1e4]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_18%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(255,183,132,0.11),transparent_28%),linear-gradient(to_bottom,rgba(14,14,16,0.2),#09090b)]" />
      <div className="relative z-10 w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-600 text-violet-50 shadow-2xl shadow-violet-600/25">
            <i className="ri-code-box-fill text-2xl"></i>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">ZENTRIX</h1>
          <p className="mt-2 text-sm text-[#ccc3d8]">Provision your AI coding workspace</p>
        </div>

        <form onSubmit={submitHandler} className="zentrix-glass rounded-xl p-6 shadow-2xl shadow-black/40">
          <div className="mb-5">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-violet-200/70">Create account</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Start building</h2>
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
            <i className="ri-lock-password-line absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#958da1] transition-colors group-focus-within:text-violet-300"></i>
            <input
              type="password"
              name="password"
              placeholder="Minimum 3 characters"
              className="font-code h-12 w-full rounded-lg border border-[#4a4455] bg-[#1c1b1d] pl-10 pr-4 text-sm text-white outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            Create Workspace
            <i className="ri-arrow-right-line text-lg"></i>
          </button>

          <p className="mt-5 text-center text-sm text-[#ccc3d8]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white transition hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};

export default Register;
