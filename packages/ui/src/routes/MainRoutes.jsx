import { lazy } from 'react'

// project imports
import MainLayout from '@/layout/MainLayout'
import Loadable from '@/ui-component/loading/Loadable'
import ProtectedRoute from './ProtectedRoute'

// chatflows routing
const Chatflows = Loadable(lazy(() => import('@/views/chatflows')))

// agents routing
const Agentflows = Loadable(lazy(() => import('@/views/agentflows')))

// marketplaces routing
const Marketplaces = Loadable(lazy(() => import('@/views/marketplaces')))

// apikey routing
const APIKey = Loadable(lazy(() => import('@/views/apikey')))

// tools routing
const Tools = Loadable(lazy(() => import('@/views/tools')))

// assistants routing
const Assistants = Loadable(lazy(() => import('@/views/assistants')))
const OpenAIAssistantLayout = Loadable(lazy(() => import('@/views/assistants/openai/OpenAIAssistantLayout')))
const CustomAssistantLayout = Loadable(lazy(() => import('@/views/assistants/custom/CustomAssistantLayout')))
const CustomAssistantConfigurePreview = Loadable(lazy(() => import('@/views/assistants/custom/CustomAssistantConfigurePreview')))

// credentials routing
const Credentials = Loadable(lazy(() => import('@/views/credentials')))

// variables routing
const Variables = Loadable(lazy(() => import('@/views/variables')))

// documents routing
const Documents = Loadable(lazy(() => import('@/views/docstore')))
const DocumentStoreDetail = Loadable(lazy(() => import('@/views/docstore/DocumentStoreDetail')))
const ShowStoredChunks = Loadable(lazy(() => import('@/views/docstore/ShowStoredChunks')))
const LoaderConfigPreviewChunks = Loadable(lazy(() => import('@/views/docstore/LoaderConfigPreviewChunks')))
const VectorStoreConfigure = Loadable(lazy(() => import('@/views/docstore/VectorStoreConfigure')))
const VectorStoreQuery = Loadable(lazy(() => import('@/views/docstore/VectorStoreQuery')))

// admin routing
const AdminLayout = Loadable(lazy(() => import('@/views/admin/AdminLayout')))
const UsersAdmin = Loadable(lazy(() => import('@/views/admin/users')))
const OrganizationsAdmin = Loadable(lazy(() => import('@/views/admin/organizations')))
const OrganizationDetail = Loadable(lazy(() => import('@/views/admin/organizations/detail')))
const ApplicationsAdmin = Loadable(lazy(() => import('@/views/admin/applications')))
const RoleBuilderAdmin = Loadable(lazy(() => import('@/views/admin/roles')))
const PlatformAdmin = Loadable(lazy(() => import('@/views/admin/platform')))
const PlatformFiles = Loadable(lazy(() => import('@/views/admin/platform/files')))
const PlatformNodes = Loadable(lazy(() => import('@/views/admin/platform/nodes')))
const ToolsAndNodes = Loadable(lazy(() => import('@/views/admin/platform/tools')))
const SystemSettings = Loadable(lazy(() => import('@/views/admin/platform/settings')))
const BillingAdmin = Loadable(lazy(() => import('@/views/admin/billing')))
const PlansAndPricing = Loadable(lazy(() => import('@/views/admin/billing/plans')))
const Subscriptions = Loadable(lazy(() => import('@/views/admin/billing/subscriptions')))
const Invoices = Loadable(lazy(() => import('@/views/admin/billing/invoices')))
const UsageReports = Loadable(lazy(() => import('@/views/admin/billing/usage')))

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
    path: '/',
    element: (
        <ProtectedRoute>
            <MainLayout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: '/',
            element: <Chatflows />
        },
        {
            path: '/chatflows',
            element: <Chatflows />
        },
        {
            path: '/agentflows',
            element: <Agentflows />
        },
        {
            path: '/marketplaces',
            element: <Marketplaces />
        },
        {
            path: '/apikey',
            element: <APIKey />
        },
        {
            path: '/tools',
            element: <Tools />
        },
        {
            path: '/assistants',
            element: <Assistants />
        },
        {
            path: '/assistants/custom',
            element: <CustomAssistantLayout />
        },
        {
            path: '/assistants/custom/:id',
            element: <CustomAssistantConfigurePreview />
        },
        {
            path: '/assistants/openai',
            element: <OpenAIAssistantLayout />
        },
        {
            path: '/credentials',
            element: <Credentials />
        },
        {
            path: '/variables',
            element: <Variables />
        },
        {
            path: '/document-stores',
            element: <Documents />
        },
        {
            path: '/document-stores/:storeId',
            element: <DocumentStoreDetail />
        },
        {
            path: '/document-stores/chunks/:storeId/:fileId',
            element: <ShowStoredChunks />
        },
        {
            path: '/document-stores/:storeId/:name',
            element: <LoaderConfigPreviewChunks />
        },
        {
            path: '/document-stores/vector/:storeId',
            element: <VectorStoreConfigure />
        },
        {
            path: '/document-stores/vector/:storeId/:docId',
            element: <VectorStoreConfigure />
        },
        {
            path: '/document-stores/query/:storeId',
            element: <VectorStoreQuery />
        },
        // Admin routes
        {
            path: '/admin',
            element: <AdminLayout />,
            children: [
                {
                    path: '',
                    element: <UsersAdmin />
                },
                {
                    path: 'users',
                    element: <UsersAdmin />
                },
                {
                    path: 'organizations',
                    element: <OrganizationsAdmin />
                },
                {
                    path: 'organizations/:id',
                    element: <OrganizationDetail />
                },
                {
                    path: 'applications',
                    element: <ApplicationsAdmin />
                },
                {
                    path: 'roles',
                    element: <RoleBuilderAdmin />
                },
                {
                    path: 'roles/:roleId/edit',
                    element: <RoleBuilderAdmin />
                },
                {
                    path: 'platform',
                    element: <PlatformAdmin />,
                    children: [
                        {
                            path: '',
                            element: <PlatformFiles />
                        },
                        {
                            path: 'files',
                            element: <PlatformFiles />
                        },
                        {
                            path: 'nodes',
                            element: <PlatformNodes />
                        },
                        {
                            path: 'tools',
                            element: <ToolsAndNodes />
                        },
                        {
                            path: 'settings',
                            element: <SystemSettings />
                        }
                    ]
                },
                {
                    path: 'billing',
                    element: <BillingAdmin />,
                    children: [
                        {
                            path: '',
                            element: <PlansAndPricing />
                        },
                        {
                            path: 'plans',
                            element: <PlansAndPricing />
                        },
                        {
                            path: 'subscriptions',
                            element: <Subscriptions />
                        },
                        {
                            path: 'invoices',
                            element: <Invoices />
                        },
                        {
                            path: 'usage',
                            element: <UsageReports />
                        }
                    ]
                }
            ]
        }
    ]
}

export default MainRoutes
