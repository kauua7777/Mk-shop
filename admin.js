// MK SHOP - Administração

const config = window.MK_CONFIG;

const adminClient = config?.SUPABASE_URL &&
  config?.SUPABASE_KEY &&
  !config.SUPABASE_URL.includes("COLE_") &&
  !config.SUPABASE_KEY.includes("COLE_")
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY)
    : null;

const loginArea = document.getElementById("login-area");
const painel = document.getElementById("painel-admin");
const mensagem = document.getElementById("mensagem-admin");

function avisar(texto, erro = false) {
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.style.color = erro ? "#c62828" : "#087b42";
}

async function verificarAdmin() {
  if (!adminClient) {
    avisar("Configure o Supabase no config.js.", true);
    return;
  }

  const { data: { user } } = await adminClient.auth.getUser();

  if (!user) {
    loginArea.hidden = false;
    painel.hidden = true;
    return;
  }

  const { data: perfil, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || perfil?.role !== "admin") {
    avisar("Acesso não autorizado.", true);
    await adminClient.auth.signOut();
    return;
  }

  loginArea.hidden = true;
  painel.hidden = false;
  carregarProdutos();
  carregarPedidos();
}

document.getElementById("form-login")?.addEventListener("submit", async e => {
  e.preventDefault();

  const email = document.getElementById("email-admin").value;
  const senha = document.getElementById("senha-admin").value;

  const { error } = await adminClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    avisar("E-mail ou senha incorretos.", true);
    return;
  }

  avisar("Login realizado!");
  verificarAdmin();
});

document.getElementById("sair-admin")?.addEventListener("click", async () => {
  await adminClient.auth.signOut();
  location.reload();
});

async function carregarProdutos() {
  const lista = document.getElementById("lista-produtos");
  if (!lista) return;

  const { data, error } = await adminClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    avisar("Erro ao carregar produtos: " + error.message, true);
    return;
  }

  lista.innerHTML = "";

  (data || []).forEach(produto => {
    const item = document.createElement("article");
    item.style.cssText = "background:white;padding:15px;border-radius:10px;margin:10px 0;border:1px solid #ddd";

    const nome = document.createElement("strong");
    nome.textContent = produto.name;

    const preco = document.createElement("p");
    preco.textContent = Number(produto.price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const estado = document.createElement("p");
    estado.textContent = produto.is_active ? "Ativo" : "Oculto";

    const editar = document.createElement("button");
    editar.textContent = "Editar";
    editar.onclick = () => editarProduto(produto);

    const excluir = document.createElement("button");
    excluir.textContent = "Excluir";
    excluir.style.marginLeft = "8px";
    excluir.onclick = () => excluirProduto(produto.id);

    item.append(nome, preco, estado, editar, excluir);
    lista.appendChild(item);
  });
}

document.getElementById("form-produto")?.addEventListener("submit", async e => {
  e.preventDefault();

  const id = document.getElementById("produto-id").value;

  const produto = {
    name: document.getElementById("produto-nome").value.trim(),
    description: document.getElementById("produto-descricao").value.trim(),
    price: Number(document.getElementById("produto-preco").value),
    category: document.getElementById("produto-categoria").value,
    image_url: document.getElementById("produto-imagem").value.trim() || null,
    stock: Number(document.getElementById("produto-estoque").value),
    is_active: document.getElementById("produto-ativo").checked
  };

  if (!produto.name || !Number.isFinite(produto.price) || produto.price < 0) {
    avisar("Confira o nome e o preço do produto.", true);
    return;
  }

  const resultado = id
    ? await adminClient.from("products").update(produto).eq("id", id)
    : await adminClient.from("products").insert(produto);

  if (resultado.error) {
    avisar("Não foi possível salvar: " + resultado.error.message, true);
    return;
  }

  avisar("Produto salvo com sucesso!");
  e.target.reset();
  document.getElementById("produto-id").value = "";
  carregarProdutos();
});

function editarProduto(p) {
  document.getElementById("produto-id").value = p.id;
  document.getElementById("produto-nome").value = p.name || "";
  document.getElementById("produto-descricao").value = p.description || "";
  document.getElementById("produto-preco").value = p.price || 0;
  document.getElementById("produto-categoria").value = p.category || "";
  document.getElementById("produto-imagem").value = p.image_url || "";
  document.getElementById("produto-estoque").value = p.stock || 0;
  document.getElementById("produto-ativo").checked = !!p.is_active;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  const { error } = await adminClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    avisar("Erro ao excluir: " + error.message, true);
    return;
  }

  avisar("Produto excluído.");
  carregarProdutos();
}

async function carregarPedidos() {
  const lista = document.getElementById("lista-pedidos");
  if (!lista) return;

  const { data, error } = await adminClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    avisar("Erro ao carregar pedidos: " + error.message, true);
    return;
  }

  lista.innerHTML = "";

  (data || []).forEach(pedido => {
    const item = document.createElement("article");
    item.style.cssText = "background:white;padding:15px;border-radius:10px;margin:10px 0;border:1px solid #ddd";

    const titulo = document.createElement("strong");
    titulo.textContent = "Pedido de " + pedido.customer_name;

    const total = document.createElement("p");
    total.textContent = "Total: " + Number(pedido.total).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const status = document.createElement("p");
    status.textContent = "Status: " + pedido.status;

    item.append(titulo, total, status);
    lista.appendChild(item);
  });
}

verificarAdmin();
