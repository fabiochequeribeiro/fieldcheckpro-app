import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resposta(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = req.headers.get('Authorization');
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
      return resposta({ error: 'Acesso não autorizado.' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    const currentUser = authData?.user;
    if (authError || !currentUser?.email) return resposta({ error: 'Sessão inválida ou expirada.' }, 401);

    const { data: manager, error: managerError } = await adminClient
      .from('tecnicos')
      .select('id,nome,email,empresa,papel,ativo')
      .eq('email', currentUser.email.trim().toLowerCase())
      .eq('ativo', true)
      .maybeSingle();
    if (managerError || !manager || !['administrador', 'supervisor'].includes(manager.papel)) {
      return resposta({ error: 'Seu perfil não possui permissão para criar usuários.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const senha = String(body.senha || '');
    const papel = String(body.papel || 'tecnico').trim().toLowerCase();

    if (nome.length < 2) return resposta({ error: 'Informe o nome completo.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta({ error: 'Informe um e-mail válido.' }, 400);
    if (senha.length < 8) return resposta({ error: 'A senha provisória deve ter pelo menos 8 caracteres.' }, 400);
    if (!['tecnico', 'supervisor', 'administrador'].includes(papel)) return resposta({ error: 'Perfil inválido.' }, 400);
    if (manager.papel !== 'administrador' && papel !== 'tecnico') {
      return resposta({ error: 'Somente administradores podem criar gestores.' }, 403);
    }

    const { data: existingProfile } = await adminClient
      .from('tecnicos')
      .select('id,user_id,empresa')
      .eq('email', email)
      .maybeSingle();
    if (existingProfile?.user_id) return resposta({ error: 'Já existe um login vinculado a este e-mail.' }, 409);
    if (existingProfile?.empresa && existingProfile.empresa.toLowerCase() !== manager.empresa.toLowerCase()) {
      return resposta({ error: 'Este e-mail já pertence a outra empresa.' }, 409);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, empresa: manager.empresa, papel },
    });
    if (createError || !created.user) {
      const mensagem = createError?.message?.toLowerCase().includes('already')
        ? 'Este e-mail já está cadastrado no sistema de login.'
        : createError?.message || 'Não foi possível criar o login.';
      return resposta({ error: mensagem }, 400);
    }

    let profileError;
    if (existingProfile?.id) {
      ({ error: profileError } = await adminClient.from('tecnicos').update({
        user_id: created.user.id,
        nome,
        email,
        empresa: manager.empresa,
        papel,
        ativo: true,
        updated_at: new Date().toISOString(),
      }).eq('id', existingProfile.id));
    } else {
      ({ error: profileError } = await adminClient.from('tecnicos').insert({
        user_id: created.user.id,
        nome,
        email,
        empresa: manager.empresa,
        papel,
        ativo: true,
      }));
    }

    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return resposta({ error: `O perfil não pôde ser criado: ${profileError.message}` }, 400);
    }

    return resposta({
      success: true,
      user: { id: created.user.id, nome, email, empresa: manager.empresa, papel, ativo: true },
    }, 201);
  } catch (error) {
    return resposta({ error: error instanceof Error ? error.message : 'Erro interno ao criar usuário.' }, 500);
  }
});
