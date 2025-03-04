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
    IconFiles
} from '@tabler/icons-react'

// constant
const icons = { IconUsersGroup, IconHierarchy, IconBuildingStore, IconKey, IconTool, IconLock, IconRobot, IconVariable, IconFiles }

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
            title: 'Marketplaces',
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
            icon: icons.IconGear,
            children: [
                {
                    id: 'users',
                    title: 'Users',
                    type: 'item',
                    url: '/users',
                    icon: icons.SomeIcon,
                    breadcrumbs: true
                },
                {
                    id: 'roles',
                    title: 'Roles',
                    type: 'item',
                    url: '/roles',
                    icon: icons.AnotherIcon,
                    breadcrumbs: true
                },
                {
                    id: 'permissions',
                    title: 'Permissions',
                    type: 'item',
                    url: '/permissions',
                },
                {
                    id: 'organizations',
                    title: 'Organizations',
                    type: 'item',
                    url: '/organizations',
                },
                {
                    id: 'apps',
                    title: 'Apps',
                    type: 'item',
                    url: '/apps',
                }
            ]
        }
    ]
}

export default dashboard
