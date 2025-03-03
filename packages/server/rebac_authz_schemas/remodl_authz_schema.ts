const schema = {
    dsl: `
    model AuthZ 1.0

    type user
        relation super_admin: platform
        
        permission platform_admin: super_admin

    type platform
        relation owner: user
        relation admin: user | owner
        
        permission manage_apps: owner | admin
        permission view_all: owner | admin

    type app
        relation parent: platform
        relation owner: user | parent.owner
        relation admin: user | owner | parent.admin
        
        permission manage_orgs: owner | admin | parent.manage_apps
        permission view_all: owner | admin | parent.view_all
        permission create_org: owner | admin | parent.manage_apps

    type organization
        relation parent: app
        relation owner: user | group#member| group#super_admin
        relation super_admin: user | group#super_admin | owner
        relation finance: user | group#super_admin | owner
        relation member: user | group#member
        
        permission can_create: owner | super_admin | parent.owner | parent.admin | parent.create_org
        permission can_edit: owner | super_admin | parent.owner | parent.admin
        permission can_delete: owner | super_admin | parent.owner | parent.admin
        permission can_view: owner | super_admin | finance | member | parent.owner | parent.admin | parent.view_all

    type group
        relation parent: organization | group | project
        relation member: user
        relation owner: user | parent.owner | parent.super_admin
        
        permission can_add_member: owner | parent.owner | parent.super_admin
        permission can_remove_member: owner | parent.owner | parent.super_admin
        permission can_view: member | owner | parent.owner | parent.super_admin | parent.can_view
        
    type project
        relation parent: organization
        relation owner: user | parent.owner | parent.super_admin
        relation editor: user | owner | group#member
        relation viewer: user | editor
        
        permission can_edit: owner | editor | parent.owner | parent.super_admin
        permission can_view: owner | editor | viewer | parent.owner | parent.super_admin | parent.member | parent.can_view
        
    type workspace
        relation parent: project
        relation owner: user | parent.owner 
        relation editor: user | owner | group#member | parent.editor
        relation viewer: user | editor | parent.viewer
        
        permission can_edit: owner | editor | parent.owner | parent.can_edit
        permission can_view: owner | editor | viewer | parent.owner | parent.can_view
        
    type conversation
        relation parent: organization
        relation owner: user | parent.owner | parent.super_admin
        relation participant: user | parent.member
        
        permission can_view: owner | participant | parent.owner | parent.super_admin
        permission can_edit: owner | parent.owner | parent.super_admin
        permission can_delete: owner | parent.owner | parent.super_admin
        
    type session
        relation parent: conversation
        relation owner: user
        
        permission can_view: owner | parent.participant | parent.owner
        permission can_edit: owner | parent.owner
        permission can_delete: owner | parent.owner
        
    type chatflow
        relation parent: organization | workspace | project
        relation owner: user | parent.owner 
        relation editor: user | owner | parent.editor
        relation viewer: user | editor | parent.viewer
        
        permission can_edit: owner | editor | parent.can_edit
        permission can_view: owner | editor | viewer | parent.can_view
        permission can_deploy: owner | parent.owner | parent.super_admin
        
    type file_asset
        relation parent: organization | conversation | session
        relation owner: user
        relation uploader: user | owner
        relation editor: user | owner | uploader | parent.owner
        relation viewer: user | editor | parent.participant | parent.member | parent.viewer
        
        permission can_view: owner | uploader | viewer | parent.can_view
        permission can_edit: owner | editor | parent.owner | parent.super_admin
        permission can_delete: owner | parent.owner | parent.super_admin
        
    type storage_location
        relation parent: app | organization
        relation owner: user | parent.owner | parent.super_admin
        relation manager: user | owner
        
        permission can_manage: owner | manager | parent.owner | parent.super_admin
        permission can_view: owner | manager | parent.owner | parent.super_admin | parent.can_view
    `
};

export default schema;