import React from 'react'
import { Link } from 'react-router-dom'
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import AppsIcon from '@mui/icons-material/Apps'
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'

interface NavigationItem {
  name: string
  path: string
  icon: React.ReactNode
  divider?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon />
  },
  {
    name: 'Applications',
    path: '/admin/applications',
    icon: <AppsIcon />
  },
  {
    name: 'Organizations',
    path: '/admin/organizations',
    icon: <BusinessIcon />
  },
  {
    name: 'Users',
    path: '/admin/users',
    icon: <PeopleIcon />
  },
  {
    name: 'Role Builder',
    path: '/admin/roles',
    icon: <SecurityIcon />
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: <SettingsIcon />,
    divider: true
  }
]

const AdminNavigation: React.FC = () => {
  return (
    <Box sx={{ width: '100%', maxWidth: 360 }}>
      <List component="nav">
        {navigationItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <ListItem button component={Link} to={item.path}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
            {item.divider && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  )
}

export default AdminNavigation 