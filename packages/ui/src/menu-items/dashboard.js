// assets
import {
    IconUsersGroup,
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconFiles,
    IconSettings,
    IconUser,
    IconUsers,
    IconBuildingSkyscraper,
    IconApps,
    IconCreditCard,
    IconServer,
    IconShieldLock
} from '@tabler/icons-react'

// constant
const icons = { 
    IconUsersGroup, 
    IconHierarchy, 
    IconBuildingStore, 
    IconKey, 
    IconTool, 
    IconLock, 
    IconRobot, 
    IconVariable, 
    IconFiles,
    IconSettings,
    IconUser,
    IconUsers,
    IconBuildingSkyscraper,
    IconApps,
    IconCreditCard,
    IconServer,
    IconShieldLock
}

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
    id: 'dashboard',
    title: '',
    type: 'group',
    children: [
        {
            id: 'agents',
            title: 'Agents',
            type: 'collapse',
            icon: icons.IconGear,
            children: [
                {
                    id: 'chatflows',
                    title: 'Agent Chains',
                    type: 'item',
                    url: '/chatflows',
                    icon: icons.IconHierarchy,
                    breadcrumbs: true,
                },
                {
                    id: 'agentflows',
                    title: 'Agent Teams',
                    type: 'item',
                    url: '/agentflows',
                    icon: icons.IconUsersGroup,
                    breadcrumbs: true,
                    isBeta: false
                },
                {
                    id: 'assistants',
                    title: 'Assistants',
                    type: 'item',
                    url: '/assistants',
                    icon: icons.IconRobot,
                    breadcrumbs: true
                }
            ]
        },
        {
            id: 'marketplaces',
            title: 'Vault',
            type: 'item',
            url: '/marketplaces',
            icon: icons.IconBuildingStore,
            breadcrumbs: true
        },
        {
            id: 'tools',
            title: 'Tools',
            type: 'item',
            url: '/tools',
            icon: icons.IconTool,
            breadcrumbs: true
        },
        {
            id: 'credentials',
            title: 'Credentials',
            type: 'item',
            url: '/credentials',
            icon: icons.IconLock,
            breadcrumbs: true
        },
        {
            id: 'variables',
            title: 'Variables',
            type: 'item',
            url: '/variables',
            icon: icons.IconVariable,
            breadcrumbs: true
        },
        {
            id: 'apikey',
            title: 'API Keys',
            type: 'item',
            url: '/apikey',
            icon: icons.IconKey,
            breadcrumbs: true
        },
        {
            id: 'document-stores',
            title: 'Document Stores',
            type: 'item',
            url: '/document-stores',
            icon: icons.IconFiles,
            breadcrumbs: true
        },
        {
            id: 'settings',
            title: 'Settings',
            type: 'collapse',
            icon: icons.IconGear,
            children: [
                {
                    id: 'child1',
                    title: 'Child Item 1',
                    type: 'item',
                    url: '/some-url',
                    icon: icons.SomeIcon,
                    breadcrumbs: true
                },
                {
                    id: 'child2',
                    title: 'Child Item 2',
                    type: 'item',
                    url: '/another-url',
                    icon: icons.AnotherIcon,
                    breadcrumbs: true
                }
            ]
        },
        {
            id: 'admin',
            title: 'Admin',
            type: 'collapse',
            icon: icons.IconSettings,
            children: [
                {
                    id: 'users',
                    title: 'Users & Access',
                    type: 'item',
                    url: '/admin/users',
                    icon: icons.IconUsers,
                    breadcrumbs: true
                },
                {
                    id: 'organizations',
                    title: 'Organizations',
                    type: 'item',
                    url: '/admin/organizations',
                    icon: icons.IconBuildingSkyscraper,
                    breadcrumbs: true
                },
                {
                    id: 'applications',
                    title: 'Applications',
                    type: 'item',
                    url: '/admin/applications',
                    icon: icons.IconApps,
                    breadcrumbs: true
                },
                {
                    id: 'roles',
                    title: 'Role Builder',
                    type: 'item',
                    url: '/admin/roles',
                    icon: icons.IconShieldLock,
                    breadcrumbs: true
                },
                {
                    id: 'platform',
                    title: 'Platform',
                    type: 'item',
                    url: '/admin/platform',
                    icon: icons.IconServer,
                    breadcrumbs: true
                },
                {
                    id: 'billing',
                    title: 'Billing',
                    type: 'item',
                    url: '/admin/billing',
                    icon: icons.IconCreditCard,
                    breadcrumbs: true
                }
            ]
        }
    ]
}

export default dashboard
