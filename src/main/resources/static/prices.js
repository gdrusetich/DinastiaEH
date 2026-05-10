const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8081" 
    : "https://dinastiaeh-production.up.railway.app";

let cambiosPendientes = {};
let productosCargados = [];
let todasLasCategorias = []; // Usamos este nombre consistentemente

document.addEventListener("DOMContentLoaded", () => {
    console.log("Iniciando Gestión de Precios...");
    cargarTabla();
    llenarSelectorCategorias();
});

function cargarTabla() {
    fetch(`${API_BASE}/products/list`)
    .then(res => res.json())
    .then(productos => {
        productosCargados = productos;
        renderizarTabla(productos);
    });
}

function renderizarTabla(lista) {
    const tbody = document.getElementById('cuerpo-tabla');
    let html = "";
    lista.forEach(p => {
        html += `
            <tr id="fila-${p.id}" class="fila-producto">
                <td>${p.id}</td>
                <td class="nombre-tabla">
                    <input type="text" value="${p.title || ''}" onchange="registrarCambio(${p.id}, 'title', this)">
                </td>
                <td>
                    <input type="number" value="${p.price || 0}" onchange="registrarCambio(${p.id}, 'price', this, ${p.price})">
                    <span id="anterior-${p.id}" class="precio-anterior"></span>
                </td>
                <td><input type="number" value="${p.stock || 0}" onchange="registrarCambio(${p.id}, 'stock', this)"></td>
            </tr>`;
    });
    tbody.innerHTML = html;
}

function llenarSelectorCategorias() {
    fetch(`${API_BASE}/categories/list`)
        .then(res => res.json())
        .then(data => {
            todasLasCategorias = data; // Guardamos todo el árbol
            const selectMadres = document.getElementById('filtro-categoria');
            
            // Filtramos solo las que no tienen padre
            const madres = data.filter(c => c.parent === null);
            
            madres.forEach(cat => {
                const opt = new Option(cat.name, cat.id);
                selectMadres.appendChild(opt);
            });
        });
}

function manejarCambioCategoria() {
    const idPadre = document.getElementById('filtro-categoria').value;
    const selectHijas = document.getElementById('filtro-subcategoria');

    selectHijas.innerHTML = '<option value="todas">Todas las subcategorías</option>';    
    const hijas = todasLasCategorias.filter(c => c.parent && c.parent.id == idPadre);

    if (hijas.length > 0 && idPadre !== 'todas') {
        hijas.forEach(h => {
            selectHijas.add(new Option(h.name, h.id));
        });
        selectHijas.classList.remove('hidden');
        selectHijas.style.display = ''; // Por si tenía el inline style de antes
    } else {
        selectHijas.classList.add('hidden');
        selectHijas.value = 'todas'; 
    }

    filtrarTodo();
}

function filtrarTodo() {
    const texto = document.getElementById('busqueda-precios').value.toLowerCase();
    const catMadre = document.getElementById('filtro-categoria').value;
    const catHija = document.getElementById('filtro-subcategoria').value;

    // El ID que manda es la hija si existe, sino la madre
    let idObjetivo = (catHija !== 'todas' && catHija !== "") ? catHija : catMadre;

    productosCargados.forEach(p => {
        // 1. Filtro de texto
        const coincideTexto = p.title.toLowerCase().includes(texto) || p.id.toString() === texto;

        // 2. Filtro de categoría con "Trabajito de Ancestros"
        let coincideCategoria = false;

        if (idObjetivo === 'todas' || idObjetivo === "") {
            coincideCategoria = true;
        } else {
            coincideCategoria = p.categories && p.categories.some(catProd => {
                // ¿Es la categoría exacta?
                if (catProd.id == idObjetivo) return true;

                // Si no es la exacta, buscamos hacia arriba (Ancestros)
                let actualId = catProd.id;
                let maximaSeguridad = 0; // Para evitar bucles infinitos por las dudas

                while (actualId && maximaSeguridad < 10) {
                    // Buscamos la info de esta categoría en nuestra lista global
                    const infoCat = todasLasCategorias.find(c => c.id == actualId);
                    
                    if (!infoCat || !infoCat.parent) break;

                    // ¿El padre de esta categoría es la que buscamos?
                    if (infoCat.parent.id == idObjetivo) return true;

                    // Seguimos subiendo al siguiente nivel
                    actualId = infoCat.parent.id;
                    maximaSeguridad++;
                }
                return false;
            });
        }

        // 3. Mostrar/Ocultar fila
        const fila = document.getElementById(`fila-${p.id}`);
        if (fila) {
            if (coincideTexto && coincideCategoria) {
                fila.classList.remove('hidden');
            } else {
                fila.classList.add('hidden');
            }
        }
    });
}

function registrarCambio(id, campo, input, valorOriginal = null) {
    const fila = document.getElementById(`fila-${id}`);
    if (fila) fila.classList.add('fila-modificada');

    if (campo === 'price' && valorOriginal !== null) {
        document.getElementById(`anterior-${id}`).innerText = ` (Antes: $${valorOriginal})`;
    }

    if (!cambiosPendientes[id]) cambiosPendientes[id] = { id: id };
    cambiosPendientes[id][campo] = input.value;
}

async function guardarCambios() {
    const lista = Object.values(cambiosPendientes);
    if (lista.length === 0) return alert("No hay cambios pendientes.");

    try {
        for (let p of lista) {
            // Creamos un objeto vacío y solo le agregamos lo que el usuario MODIFICÓ
            const bodyEnviar = {};
            
            if (p.title !== undefined) bodyEnviar.title = p.title;
            if (p.price !== undefined) bodyEnviar.price = parseFloat(p.price);
            if (p.stock !== undefined) bodyEnviar.stock = parseInt(p.stock);

            console.log(`Enviando actualización para ID ${p.id}:`, bodyEnviar);

            const res = await fetch(`${API_BASE}/products/actualizar-rapido/${p.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyEnviar)
            });

            if (!res.ok) {
                const errorTexto = await res.text();
                throw new Error(`Error en ID ${p.id} (Status ${res.status}): ${errorTexto}`);
            }
        }
        
        alert("¡Cambios guardados con éxito!");
        cambiosPendientes = {}; // Limpiamos los cambios
        location.reload();
    } catch (error) {
        console.error("Error detallado:", error);
        alert("Hubo un error al guardar. Mirá la consola de IntelliJ para el error real.");
    }
}