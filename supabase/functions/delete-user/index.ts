import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is a professor
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is a professor
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'professor')
      .single()

    if (roleError || !roleData) {
      throw new Error('Only professors can delete users')
    }

    // Delete related records first to avoid foreign key constraint violations
    
    // 1. Delete attendance records
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance_records')
      .delete()
      .eq('user_id', userId)
    
    if (attendanceError) {
      console.error('Error deleting attendance records:', attendanceError)
      throw new Error('Failed to delete attendance records')
    }

    // 2. Delete device fingerprints
    const { error: fingerprintError } = await supabaseAdmin
      .from('device_fingerprints')
      .delete()
      .eq('user_id', userId)
    
    if (fingerprintError) {
      console.error('Error deleting fingerprints:', fingerprintError)
      throw new Error('Failed to delete device fingerprints')
    }

    // 3. Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError)
      throw new Error('Failed to delete user roles')
    }

    // 4. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Failed to delete profile')
    }

    // 5. Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
