import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LoginForm from '@/components/auth/login-form'

interface LoginPageProps {
  searchParams: { message?: string }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Habit Monitor</h1>
            <p className="text-gray-600 dark:text-gray-300">Sign in to track your habits</p>
          </div>
          <LoginForm message={searchParams.message} />
        </div>
      </div>
    </div>
  )
} 