import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Leaf, Phone, Lock, Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { motion } from 'framer-motion'

export default function CollectorLogin() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', phone: '', password: '', zone: '' })
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: () => authAPI.collectorLogin({ phone: form.phone, password: form.password }),
    onSuccess: ({ data }) => {
      localStorage.setItem('gp_token', data.token)
      localStorage.setItem('gp_collector', JSON.stringify(data.collector))
      toast.success(`Welcome back, ${data.collector.name}!`)
      navigate('/collector')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Login failed'),
  })

  const registerMutation = useMutation({
    mutationFn: () => authAPI.collectorRegister(form),
    onSuccess: ({ data }) => {
      localStorage.setItem('gp_token', data.token)
      localStorage.setItem('gp_collector', JSON.stringify(data.collector))
      toast.success('Account created!')
      navigate('/collector')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Registration failed'),
  })

  const isLoading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gp-foam rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-7 h-7 text-gp-emerald" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gp-slate">Collector Portal</h1>
          <p className="text-gp-grey text-sm mt-1">{mode === 'login' ? 'Sign in to see active jobs' : 'Create your collector account'}</p>
        </div>
        <div className="card">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white text-gp-forest shadow-sm' : 'text-gray-500'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {mode === 'register' && (
              <>
                <div><label className="text-sm font-medium text-gp-slate block mb-1">Full Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Kwame Asante" className="input-field" /></div>
                <div><label className="text-sm font-medium text-gp-slate block mb-1">Zone / Area</label>
                  <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="East Legon, Madina..." className="input-field" /></div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-gp-slate block mb-1">Phone Number</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0244000000" className="input-field pl-10" type="tel" /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gp-slate block mb-1">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" placeholder="••••••••" className="input-field pl-10" /></div>
            </div>
            <button onClick={() => mode === 'login' ? loginMutation.mutate() : registerMutation.mutate()} disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Please wait...</> : mode === 'login' ? 'Sign In' : <><UserPlus className="w-4 h-4" />Create Account</>}
            </button>
          </div>
          <p className="text-center text-xs text-gp-grey mt-4">
            Are you a recycler? <Link to="/recycler/login" className="text-blue-600 font-medium">Recycler login →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
