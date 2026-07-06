import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="w-20 h-20 bg-gp-foam rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-10 h-10 text-gp-jade" />
        </div>
        <h1 className="font-display font-bold text-4xl text-gp-slate mb-2">404</h1>
        <p className="text-gp-grey mb-6">This page has been composted.</p>
        <Link to="/" className="btn-primary inline-block">Go Home</Link>
      </div>
    </div>
  )
}
