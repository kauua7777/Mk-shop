// MK SHOP - Carregamento dos produtos e pedidos

const mkClient = (() => {
  const config = window.MK_CONFIG;

  if (!config?.SUPABASE_URL || !config?.SUPABASE_KEY ||
      config.SUPABASE_URL.includes("COLE_") ||
      config.SUPABASE_KEY.includes("COLE_")) {
    console.warn("Configure o Supabase no arquivo config.js");
    return null;
  }

  return window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_KEY
  );
})();

let mkProdutos = [];
let mkCategoria = "Todos";

const mkArea = document.getElementById("produtos");
const mkBusca = document.getElementById("busca");

function mkMostrarProdutos() {
  if (!mkArea) return;

  const termo = (mkBusca?.value || "").toLowerCase();

  const filtrados = mkProdutos.filter(p =>
    (mkCategoria === "Todos" || p.category === mkCategoria) &&
    (p.name || "").toLowerCase().includes(termo)
  );

  if (!filtrados.length) {
    mkArea.innerHTML = '<p class="vazio">Nenhum produto disponível no momento.</p>';
    return;
  }

  mkArea.innerHTML = filtrados.map(p => {
    const preco = Number(p.price || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const foto = p.image_url
      ? `<img src="${mkEscapar(p.image_url)}" alt="${mkEscapar(p.name)}" style="width:100%;height:155px;object-fit:contain;border-radius:10px;margin-bottom:15px">`
      : `<div class="foto">🛍️</div>`;

    return `
      <article class="produto">
        ${foto}
        <h3>${mkEscapar(p.name)}</h3>
        <p>${mkEscapar(p.description || "Confira este produto na MK Shop.")}</p>
        <div class="preco">${preco}</div>
        <button onclick="mkPedir('${mkEscapar(p.name).replace(/'/g, "\\'")}')">
          Pedir pelo WhatsApp
        </button>
      </article>
    `;
  }).join("");
}

function mkEscapar(valor) {
  return String(valor).replace(/[&<>"']/g, letra => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[letra]);
}

async function mkCarregarProdutos() {
  if (!mkClient) {
    console.warn("Supabase ainda não configurado.");
    return;
  }

  mkArea.innerHTML = '<p class="vazio">Carregando produtos...</p>';

  const { data, error } = await mkClient
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    mkArea.innerHTML = '<p class="vazio">Não foi possível carregar os produtos.</p>';
    return;
  }

  mkProdutos = data || [];
  mkMostrarProdutos();
}

function mkPedir(nome) {
  const numero = window.MK_CONFIG.WHATSAPP;
  const mensagem = encodeURIComponent(
    "Olá! Tenho interesse no produto " + nome + ". Pode me passar mais informações?"
  );

  window.open("https://wa.me/" + numero + "?text=" + mensagem, "_blank");
}

document.querySelectorAll(".categorias button").forEach(botao => {
  botao.addEventListener("click", () => {
    document.querySelector(".categorias .ativo")?.classList.remove("ativo");
    botao.classList.add("ativo");
    mkCategoria = botao.dataset.cat;
    mkMostrarProdutos();
  });
});

mkBusca?.addEventListener("input", mkMostrarProdutos);

mkCarregarProdutos();
