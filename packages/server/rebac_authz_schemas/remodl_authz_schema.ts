const schema = {
    dsl: `
    model AuthZ 1.0

    type user
        relation platform_admin: platform
        
        permission is_platform_admin: platform_admin
        permission is_app_admin: app_admin
        permission is_org_admin: org_admin
        permission is_workspace_admin: workspace_admin
        permission is_project_admin: project_admin
        permission is_conversation_admin: conversation_admin
        permission is_session_admin: session_admin
        permission is_chatflow_admin: chatflow_admin

        permission can_create_user: platform_admin | app_admin | org_admin
        permission can_edit_user: platform_admin | app_admin | org_admin
        permission can_delete_user: platform_admin | app_admin | org_admin
        permission can_view_user: platform_admin | app_admin | org_admin | workspace_admin | project_admin

        permission can_create_app: platform_admin
        permission can_edit_app: platform_admin
        permission can_delete_app: platform_admin
        permission can_view_app: platform_admin

        permission can_create_org: platform_admin | app_admin
        permission can_edit_org: platform_admin | app_admin | org_admin
        permission can_delete_org: platform_admin | app_admin
        permission can_view_org: platform_admin | app_admin | org_admin

        permission can_create_workspace: platform_admin | app_admin | org_admin | workspace_admin
        permission can_edit_workspace: platform_admin | app_admin | org_admin | workspace_admin
        permission can_delete_workspace: platform_admin | app_admin | org_admin | workspace_admin
        permission can_view_workspace: platform_admin | app_admin | org_admin | workspace_admin
        
        permission can_create_project: platform_admin | app_admin | org_admin | workspace_admin | project_admin
        permission can_edit_project: platform_admin | app_admin | org_admin | workspace_admin | project_admin
        permission can_delete_project: platform_admin | app_admin | org_admin | workspace_admin
        permission can_view_project: platform_admin | app_admin | org_admin | workspace_admin | project_admin
        
        permission can_create_credential: platform_admin | app_admin | credential_admin
        

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
        relation parent: organization
        relation group_owner: user | parent.org_owner | parent.org_admin
        relation super_admin: user | group_owner
        relation member: user | super_admin
        
        permission can_edit: group_owner | super_admin | parent.org_owner | parent.org_admin
        permission can_add_member: group_owner | super_admin | parent.org_owner | parent.org_admin
        permission can_view: group_owner | super_admin | member | parent.org_owner | parent.org_admin | parent.finance | parent.can_view

    type project
        relation parent: organization
        relation project_owner: user | parent.org_owner | parent.org_admin
        relation admin: user | project_owner
        relation member: user | admin | parent.member | group#member
        
        permission can_create: project_owner | admin | parent.org_owner | parent.org_admin
        permission can_edit: project_owner | admin | parent.org_owner | parent.org_admin
        permission can_delete: project_owner | parent.org_owner | parent.org_admin
        permission can_view: project_owner | admin | member | parent.org_owner | parent.org_admin | parent.finance | parent.can_view

    type workspace
        relation parent: project
        relation workspace_owner: user | parent.project_owner | parent.admin
        relation editor: user | workspace_owner
        relation viewer: user | editor | parent.member
        
        permission can_create: workspace_owner | editor | parent.can_create
        permission can_edit: workspace_owner | editor | parent.can_edit
        permission can_delete: workspace_owner | parent.project_owner | parent.admin | parent.can_delete
        permission can_view: workspace_owner | editor | viewer | parent.can_view

    type conversation
        relation parent: organization | workspace
        relation conversation_owner: user
        relation participant: user | parent.member
        
        permission can_view: conversation_owner | participant | parent.org_owner | parent.org_admin | parent.workspace_owner
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
        

    type credential_admin
        relation parent: organization | app | platform
        relation admin_user: user
        
        permission can_manage_all_credentials: admin_user | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin

    type credential
        relation parent: organization | app | platform
        relation credential_owner: user | parent.org_owner | parent.app_owner | parent.platform_owner
        relation shared_with_user: user
        relation shared_with_workspace: workspace
        relation shared_with_project: project
        relation shared_with_organization: organization
        relation administered_by: credential_admin
        
        permission can_create: parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin | credential_admin#can_manage_all_credentials
        permission can_view: credential_owner | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.app_owner | parent.platform_owner | credential_admin#can_manage_all_credentials
        permission can_edit: credential_owner | parent.org_owner | parent.app_owner | parent.platform_owner | credential_admin#can_manage_all_credentials
        permission can_delete: credential_owner | parent.org_owner | parent.app_owner | parent.platform_owner | credential_admin#can_manage_all_credentials
        permission can_use: credential_owner | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin
        permission can_share: credential_owner | parent.org_owner | parent.app_owner | parent.platform_owner | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_project.project_owner | shared_with_workspace.workspace_owner

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
        
        permission can_manage: storage_owner | manager | parent.app_owner | parent.org_owner
        permission can_view: storage_owner | manager | parent.app_admin | parent.org_admin | parent.app_owner | parent.org_owner

    type document_store_admin
        relation parent: organization | app | platform
        relation admin_user: user
        
        permission can_manage_all_stores: admin_user | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin

    type document_store
        relation parent: organization | app | platform
        relation store_owner: user | parent.org_owner | parent.app_owner | parent.platform_owner
        relation shared_with_user: user
        relation shared_with_workspace: workspace
        relation shared_with_project: project
        relation shared_with_organization: organization
        relation administered_by: document_store_admin
        
        permission can_create: parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin | document_store_admin#can_manage_all_stores
        permission can_view: store_owner | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.app_owner | parent.platform_owner | document_store_admin#can_manage_all_stores
        permission can_edit: store_owner | parent.org_owner | parent.app_owner | parent.platform_owner | document_store_admin#can_manage_all_stores
        permission can_delete: store_owner | parent.org_owner | parent.app_owner | parent.platform_owner | document_store_admin#can_manage_all_stores
        permission can_use: store_owner | shared_with_user | shared_with_workspace.editor | shared_with_workspace.viewer | shared_with_project.admin | shared_with_project.member | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_organization.member | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin
        permission can_share: store_owner | parent.org_owner | parent.app_owner | parent.platform_owner | shared_with_organization.org_owner | shared_with_organization.org_admin | shared_with_project.project_owner | shared_with_workspace.workspace_owner
        permission can_add_documents: store_owner | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin | document_store_admin#can_manage_all_stores
        permission can_edit_chunks: store_owner | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin | document_store_admin#can_manage_all_stores
        permission can_manage_vectorstore: store_owner | parent.org_owner | parent.org_admin | parent.app_owner | parent.app_admin | parent.platform_owner | parent.platform_admin | document_store_admin#can_manage_all_stores

    type document_loader
        relation parent: document_store
        relation loader_owner: user | parent.store_owner
        
        permission can_create: loader_owner | parent.store_owner | parent.can_edit | document_store_admin#can_manage_all_stores
        permission can_view: loader_owner | parent.can_view
        permission can_edit: loader_owner | parent.store_owner | parent.can_edit
        permission can_delete: loader_owner | parent.store_owner | parent.can_edit
        permission can_process: loader_owner | parent.store_owner | parent.can_edit
        permission can_refresh: loader_owner | parent.store_owner | parent.can_edit

    type document_chunk
        relation parent: document_loader
        relation chunk_owner: user | parent.loader_owner
        
        permission can_view: chunk_owner | parent.can_view
        permission can_edit: chunk_owner | parent.loader_owner | parent.can_edit
        permission can_delete: chunk_owner | parent.loader_owner | parent.can_edit

    type vector_store
        relation parent: document_store
        relation vectorstore_owner: user | parent.store_owner
        
        permission can_create: vectorstore_owner | parent.store_owner | parent.can_edit | document_store_admin#can_manage_all_stores
        permission can_view: vectorstore_owner | parent.can_view
        permission can_edit: vectorstore_owner | parent.store_owner | parent.can_edit
        permission can_delete: vectorstore_owner | parent.store_owner | parent.can_edit
        permission can_query: vectorstore_owner | parent.can_view | parent.can_use
        permission can_insert: vectorstore_owner | parent.store_owner | parent.can_edit
        permission can_update_config: vectorstore_owner | parent.store_owner | parent.can_edit
    `
};

export default schema;