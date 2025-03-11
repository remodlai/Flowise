/**
 * Supabase-specific interfaces for the Flowise application
 * These types represent the data structures used in Supabase tables
 */
export interface ISupabaseUser {
    id: string;
    email: string;
    app_metadata?: {
        is_platform_admin?: boolean;
        roles?: any[];
        [key: string]: any;
    };
    user_metadata?: {
        first_name?: string;
        last_name?: string;
        [key: string]: any;
    };
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseOrganization {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseOrganizationUser {
    id: string;
    organization_id: string;
    user_id: string;
    role: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseApplication {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseRole {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabasePermission {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseUserRole {
    id: string;
    user_id: string;
    role_id: string;
    resource_type?: string;
    resource_id?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseRolePermission {
    id: string;
    role_id: string;
    permission_id: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseSecret {
    id: string;
    name: string;
    type: string;
    value: string;
    metadata?: any;
    key_id?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}
export interface ISupabaseBucket {
    id: string;
    name: string;
    owner: string;
    created_at: string;
    updated_at: string;
    public: boolean;
    [key: string]: any;
}
export interface ISupabaseResponse<T> {
    data: T | null;
    error: {
        message: string;
        details: string;
        hint: string;
        code: string;
    } | null;
}
