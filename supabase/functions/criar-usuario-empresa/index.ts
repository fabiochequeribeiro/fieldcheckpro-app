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

function papelLegado(perfil: string) {
  return perfil === 'admin_empresa' ? 'administrador' : perfil;
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
      .select('id,nome,email,empresa,empresa_id,papel,perfil,ativo')
      .eq('email', currentUser.email.trim().toLowerCase())
      .eq('ativo', true)
      .maybeSingle();

    const managerRole = manager?.perfil || (manager?.papel === 'administrador' ? 'admin_empresa' : manager?.papel);
    if (managerError || !manager || !['super_admin', 'admin_empresa'].includes(managerRole)) {
      return resposta({ error: 'Seu perfil não possui permissão para criar usuários.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const senha = String(body.senha || '');
    const perfil = String(body.perfil || body.papel || 'tecnico').trim().toLowerCase();
    const empresaIdSolicitada = String(body.empresa_id || '').trim() || null;

    if (nome.length < 2) return resposta({ error: 'Informe o nome completo.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta({ error: 'Informe um e-mail válido.' }, 400);
    if (senha.length < 8) return resposta({ error: 'A senha provisória deve ter pelo menos 8 caracteres.' }, 400);
    if (!['tecnico', 'supervisor', 'admin_empresa'].includes(perfil)) return resposta({ error: 'Perfil inválido.' }, 400);
    const empresaIdFinal = managerRole === 'super_admin' ? empresaIdSolicitada : manager.empresa_id;
    if (!empresaIdFinal) return resposta({ error: 'Selecione uma empresa antes de criar o usuário.' }, 400);

    const { data: empresaDestino, error: empresaError } = await adminClient
      .from('empresas')
      .select('id,nome,status')
      .eq('id', empresaIdFinal)
      .maybeSingle();
    if (empresaError || !empresaDestino) return resposta({ error: 'Empresa não encontrada.' }, 404);
    if (['bloqueada', 'cancelada'].includes(empresaDestino.status)) {
      return resposta({ error: 'Esta empresa está bloqueada para novos usuários.' }, 403);
    }

    const { data: existingProfile } = await adminClient
      .from('tecnicos')
      .select('id,user_id,empresa,empresa_id')
      .eq('email', email)
      .maybeSingle();
    if (existingProfile?.user_id) return resposta({ error: 'Já existe um login vinculado a este e-mail.' }, 409);
    if (existingProfile?.empresa_id && existingProfile.empresa_id !== empresaIdFinal) {
      return resposta({ error: 'Este e-mail já pertence a outra empresa.' }, 409);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, empresa: empresaDestino.nome, empresa_id: empresaIdFinal, perfil },
    });
    if (createError || !created.user) {
      const mensagem = createError?.message?.toLowerCase().includes('already')
        ? 'Este e-mail já está cadastrado no sistema de login.'
        : createError?.message || 'Não foi possível criar o login.';
      return resposta({ error: mensagem }, 400);
    }

    let profileError;
    const profilePayload = {
      user_id: created.user.id,
      nome,
      email,
      empresa: empresaDestino.nome,
      empresa_id: empresaIdFinal,
      perfil,
      papel: papelLegado(perfil),
      ativo: true,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile?.id) {
      ({ error: profileError } = await adminClient.from('tecnicos').update(profilePayload).eq('id', existingProfile.id));
    } else {
      ({ error: profileError } = await adminClient.from('tecnicos').insert(profilePayload));
    }

    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return resposta({ error: `O perfil não pôde ser criado: ${profileError.message}` }, 400);
    }

    return resposta({
      success: true,
      user: { id: created.user.id, nome, email, empresa: empresaDestino.nome, empresa_id: empresaIdFinal, perfil, ativo: true },
    }, 201);
  } catch (error) {
    return resposta({ error: error instanceof Error ? error.message : 'Erro interno ao criar usuário.' }, 500);
  }
});
