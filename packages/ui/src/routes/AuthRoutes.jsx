import { lazy } from 'react'

// project imports
import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'

// login routing
const Login = Loadable(lazy(() => import('@/views/auth/Login')))

// ==============================|| AUTH ROUTING ||============================== //

const AuthRoutes = {
    path: '/',
    element: <MinimalLayout />,
    children: [
        {
            path: '/login',
            element: <Login />
        }
    ]
}

export default AuthRoutes 