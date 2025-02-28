const schema = {
    dsl: `
    model AuthZ 1.0

    type user



    type group
        relation parent: organization | group | project
        relation member: user
        relation owner: user
        relation super_admin: user
        relation viewer: user
        relation editor: user

        permission can_create: owner| super_admin | parent.owner | parent.super_admin | parent.can_create
        permission can_edit: editor | owner | super_admin | parent.editor | parent.owner | parent.super_admin | parent.can_edit
        permission can_delete: owner | editor | super_admin | parent.owner | parent.editor | parent.super_admin | parent.can_delete
        permission can_view: viewer | member | editor | owner | super_admin | parent.viewer | parent.member | parent.editor | parent.owner | parent.super_admin


    type organization
        relation parent: platform
        relation owner: user | group#member| group#super_admin
        relation super_admin: user | group#super_admin | owner
        relation finance: user | group#super_admin | owner
        relation member: user | group#member

        permission can_create: owner | super_admin | parent.owner | parent.super_admin | parent.can_create | can_create
        permission can_edit: owner | super_admin | parent.owner | parent.super_admin | parent.can_edit | can_edit
        permission can_delete: owner | super_admin | parent.owner | parent.super_admin | parent.can_delete | can_delete
        permission can_view: owner | super_admin | parent.owner | parent.super_admin | parent.can_view | can_view   



    type workspace
        relation parent: organization
        relation owner: user | organization#owner | organization#super_admin 
        relation super_admin: user | group#super_admin
        relation member: user | group#member
        relation viewer: user | group#member



    type project
        relation parent: workspace
        relation owner: user | group#member
        relation super_admin: user | group#super_admin
        relation member: user | group#member
        relation viewer: user | group#member


    type folder
        relation parent: project
        relation owner: user | group#member
        relation super_admin: user | group#super_admin
        relation member: user | group#member
        relation viewer: user | group#member

    type flow
        relation parent: folder | project
        relation owner: user | group#member
        relation super_admin: user | group#super_admin
        relation member: user | group#member
        relation viewer: user | group#member


    type node


    type api_key
    `
}