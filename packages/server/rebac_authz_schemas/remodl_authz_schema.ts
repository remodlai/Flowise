const schema = {
    dsl: `
    model AuthZ 1.0

    type user
        relation platform_admin: platform
        
        permission is_platform_admin: platform_admin

    type platform
        relation platform_owner: user
        relation platform_admin: user | platform_owner
        
        permission manage_apps: platform_owner | platform_admin
        permission view_all: platform_owner | platform_admin

    type app
        relation parent: platform
        relation app_owner: user | parent.platform_owner
        relation app_admin: user | app_owner | parent.platform_admin
        
        permission manage_orgs: app_owner | app_admin | parent.manage_apps
        permission view_all: app_owner | app_admin | parent.view_all
        permission create_org: app_owner | app_admin | parent.manage_apps

    type organization
        relation parent: app
        relation org_owner: user | group#member| group#super_admin
        relation org_admin: user | group#super_admin | org_owner
        relation finance: user | group#super_admin | org_owner
        relation member: user | group#member
        
        permission can_create: org_owner | org_admin | parent.app_owner | parent.app_admin | parent.create_org
        permission can_edit: org_owner | org_admin | parent.app_owner | parent.app_admin
        permission can_delete: org_owner | org_admin | parent.app_owner | parent.app_admin
        permission can_view: org_owner | org_admin | finance | member | parent.app_owner | parent.app_admin | parent.view_all

    type group
        relation parent: organization | group | project
        relation member: user
        relation group_owner: user | parent.org_owner | parent.org_admin
        
        permission can_add_member: group_owner | parent.org_owner | parent.org_admin
        permission can_remove_member: group_owner | parent.org_owner | parent.org_admin
        permission can_view: member | group_owner | parent.org_owner | parent.org_admin | parent.can_view
        
    type project
        relation parent: organization
        relation project_owner: user | parent.org_owner | parent.org_admin
        relation editor: user | project_owner | group#member
        relation viewer: user | editor
        
        permission can_edit: project_owner | editor | parent.org_owner | parent.org_admin
        permission can_view: project_owner | editor | viewer | parent.org_owner | parent.org_admin | parent.member | parent.can_view
        
    type workspace
        relation parent: project
        relation workspace_owner: user | parent.project_owner 
        relation editor: user | workspace_owner | group#member | parent.editor
        relation viewer: user | editor | parent.viewer
        
        permission can_edit: workspace_owner | editor | parent.project_owner | parent.can_edit
        permission can_view: workspace_owner | editor | viewer | parent.project_owner | parent.can_view
        
    type conversation
        relation parent: organization
        relation conversation_owner: user | parent.org_owner | parent.org_admin
        relation participant: user | parent.member
        
        permission can_view: conversation_owner | participant | parent.org_owner | parent.org_admin
        permission can_edit: conversation_owner | parent.org_owner | parent.org_admin
        permission can_delete: conversation_owner | parent.org_owner | parent.org_admin
        
    type session
        relation parent: conversation
        relation session_owner: user
        
        permission can_view: session_owner | parent.participant | parent.conversation_owner
        permission can_edit: session_owner | parent.conversation_owner
        permission can_delete: session_owner | parent.conversation_owner
        
    type chatflow
        relation parent: organization | workspace | project
        relation chatflow_owner: user | parent.org_owner | parent.workspace_owner | parent.project_owner
        relation editor: user | chatflow_owner | parent.editor
        relation viewer: user | editor | parent.viewer
        
        permission can_edit: chatflow_owner | editor | parent.can_edit
        permission can_view: chatflow_owner | editor | viewer | parent.can_view
        permission can_deploy: chatflow_owner | parent.org_owner | parent.org_admin
        
    type file_asset
        relation parent: organization | conversation | session
        relation file_owner: user
        relation uploader: user | file_owner
        relation editor: user | file_owner | uploader | parent.org_owner | parent.conversation_owner | parent.session_owner
        relation viewer: user | editor | parent.participant | parent.member | parent.viewer
        
        permission can_view: file_owner | uploader | viewer | parent.can_view
        permission can_edit: file_owner | editor | parent.org_owner | parent.org_admin
        permission can_delete: file_owner | parent.org_owner | parent.org_admin
        
    type storage_location
        relation parent: app | organization
        relation storage_owner: user | parent.app_owner | parent.org_owner
        relation manager: user | storage_owner
        
        permission can_manage: storage_owner | manager | parent.app_owner | parent.org_admin
        permission can_view: storage_owner | manager | parent.app_owner | parent.org_admin | parent.can_view
    `
};

export default schema;