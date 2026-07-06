import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Recycle, Phone, Lock, Loader2, Building2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { RECYCLER_TYPES } from '../lib/constants'
import { motion } from 'framer-motion'

export default function RecyclerLogin() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ companyName: '', phone: '', password: '', recyclerType: 'PLASTIC', address: '', zone: '' })
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: () => authAPI.recyclerLogin({ phone: form.phone, password: form.password }),
    onSuccess: ({ data }) => {
      localStorage.setItem('gp_recycler_token', data.token)
      localStorage.setItem('gp_recycler', JSON.stringify(data.recycler))
      toast.success(`Welcome, ${data.recycler.companyName}!`)
      navigate('/recycler/dashboard')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Login failed'),
  })

  const registerMutation = useMutation({
    mutationFn: () => authAPI.recyclerRegister(form),
    onSuccess: ({ data }) => {
      localStorage.setItem('gp_recycler_token', data.token)
      localStorage.setItem('gp_recycler', JSON.stringify(data.recycler))
      toast.success('Recycler account created!')
      navigate('/recycler/dashboard')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Registration failed'),
  })

  const isLoading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Recycle className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gp-slate">Recycler Portal</h1>
          <p className="text-gp-grey text-sm mt-1">
            {mode === 'login' ? 'Sign in to browse available waste' : 'Register your recycling business'}
          </p>
        </div>

        <div className="card">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white text-gp-forest shadow-sm' : 'text-gray-500'}`}>
                {m === 'login' ? 'Sign In' : 'Register Business'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gp-slate block mb-1">Company / Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Accra Plastics Ltd." className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gp-slate block mb-1">Recycler Type</label>
                  <div className="relative">
                    <select value={form.recyclerType} onChange={e => setForm({ ...form, recyclerType: e.target.value })}
                      className="input-field appearance-none pr-10">
                      {Object.entries(RECYCLER_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gp-grey mt-1">
                    Accepts: {RECYCLER_TYPES[form.recyclerType]?.accepts.join(', ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gp-slate block mb-1">Business Address</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Industrial Area, Accra" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gp-slate block mb-1">Operating Zone</label>
                  <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}
                    placeholder="Greater Accra" className="input-field" />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-gp-slate block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="0244000000" className="input-field pl-10" type="tel" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gp-slate block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  type="password" placeholder="••••••••" className="input-field pl-10" />
              </div>
            </div>
            <button
              onClick={() => mode === 'login' ? loginMutation.mutate() : registerMutation.mutate()}
              disabled={isLoading}
              className="btn-recycler w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</> :
                mode === 'login' ? 'Sign In' : 'Create Recycler Account'}
            </button>
          </div>

          <p className="text-center text-xs text-gp-grey mt-4">
            Are you a collector? <Link to="/login" className="text-gp-emerald font-medium">Collector login →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
