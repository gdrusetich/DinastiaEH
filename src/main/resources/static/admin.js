let editandoId = null;
let productosCargados = [];
let productoEnEdicion = null;
let editandoCatId = null;
let categoriasData = [];
let categoriaActualId = null;
let idsHijasActuales = [];
const API_CO_CAT_GROUP = "/api/co-category-group"; 
let editingCoCatGroupId = null; 
let coCategoryGroupsData = [];
let modalValoresBootstrap;
let filaActualId = null; 
let valoresSeleccionadosPorFila = {}; // Estructura: { idFila: Set([idValor1, idValor2]) }
let categoriaSeleccionadaEnModalId = null; 
let mapaAsociacionesTemporales = {};

// Nota: Asegurate de definir 'todasLasCategorias' en el HTML si esto es un JS externo.
let todasLasCategorias = window.todasLasCategorias || [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando Dashboard...");
    inicializarApp();
});

async function inicializarApp() {
     await Promise.all([
        cargarProductos(),
        cargarCategoriasSelector(),  // Crea los botones de niveles (Nivel 0)
        cargarSelectCategorias(),
        cargarCoCategoryGroup()
    ]);
    await cargarCheckboxesCategorias();
    await cargarCheckboxesCoCategoryGroup();
}

let resizeTimer;
window.onresize = () => {       // Renderiza el nivel de categorias al mover la pantalla.
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (categoriasData && categoriasData.length > 0) {
            const principales = categoriasData.filter(c => !c.parent);
            renderizarNivel(0, principales);
        }
    }, 250); 
};

function mostrarSeccion(seccion) {
    const seccionUsuarios = document.getElementById('seccion-usuarios');
    const seccionProductos = document.getElementById('seccion-productos');
    
    if (seccion === 'usuarios') {
        if (seccionUsuarios) seccionUsuarios.style.display = 'block';
        if (seccionProductos) seccionProductos.style.display = 'none';
        cargarUsuarios();
    } else {
        if (seccionUsuarios) seccionUsuarios.style.display = 'none';
        if (seccionProductos) seccionProductos.style.display = 'block';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('oculto');
    
    const btn = document.querySelector('.btn-colapsar');
    if (btn) {
        btn.innerHTML = sidebar.classList.contains('oculto') ? "☰" : "✕";
    }
}

// CORRECCIÓN: Se recibe 'event' de forma explícita
function mostrarTab(tabId, event) { 
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const tabTarget = document.getElementById(tabId);
    if (tabTarget) tabTarget.style.display = 'block';
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    if (tabId === 'tab-cocategoria') { 
        resetFormCoCatGroup();
        if (typeof cargarCheckboxesCategorias === 'function') {
            cargarCheckboxesCategorias(); 
        }
    } else {
        if (typeof cargarCheckboxesCoCategoryGroup === 'function') {
            cargarCheckboxesCoCategoryGroup();
        }
    }
}

document.addEventListener('click', () => {
    const menu = document.querySelector('.menu-categorias-extra');
    if (menu) menu.remove();
});

function toggleAsociadorCategorias() {
    const box = document.getElementById('contenedor-asociar-cat');
    if (box) box.style.display = (box.style.display === 'none') ? 'block' : 'none';
}

function toggleDropdownPropiedades() {
    const panel = document.getElementById('dropdown-panel-prop');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
}

function confirmarSeleccionPropiedades() {
    const checkboxes = document.querySelectorAll('.co-cat-check:checked');
    const botonTrigger = document.getElementById('btn-dropdown-prop');
    if (!botonTrigger) return;

    if (checkboxes.length > 0) {
        botonTrigger.innerText = `Propiedades seleccionadas (${checkboxes.length}) ▾`;
        botonTrigger.style.borderColor = "#28a745";
    } else {
        botonTrigger.innerText = "Seleccionar Propiedades ▾";
        botonTrigger.style.borderColor = "#444";
    }
    toggleDropdownPropiedades();
}

function abrirModalValores() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombreGrupo = inputNombre ? inputNombre.value.trim() : "";
    const esModoEdicion = (typeof editingCoCatGroupId !== 'undefined' && editingCoCatGroupId !== null);

    if (!esModoEdicion) {
        if (nombreGrupo === "") {
            alert("Debe ingresar un nombre para la nueva propiedad antes de gestionar sus valores.");
            if (inputNombre) inputNombre.focus();
            return;
        }

        const listaGrupos = coCategoryGroupsData || [];
        const existeNombre = listaGrupos.some(g => g.name.toLowerCase() === nombreGrupo.toLowerCase());
        
        if (existeNombre) {
            alert("Ese nombre de propiedad ya existe en el sistema. Elija otro o use el modo 'Editar Existente'.");
            if (inputNombre) inputNombre.focus();
            return;
        }

        const tituloModal = document.getElementById('nombre-grupo-titulo');
        if (tituloModal) {
            tituloModal.innerText = nombreGrupo + " (Nueva)";
        }
    } else {
        const selector = document.getElementById('cocat-selector');
        if (!selector || selector.value === "") {
            alert("Por favor, selecciona una propiedad de la lista para editar.");
            return;
        }

        const tituloModal = document.getElementById('nombre-grupo-titulo');
        if (tituloModal) {
            tituloModal.innerText = nombreGrupo;
        }
    }

    if (esModoEdicion) {
        refrescarListaValoresModal();
    } else {
        const contenedor = document.getElementById('contenedor-checks-valores');
        if (contenedor) {
            contenedor.innerHTML = '<p style="color: #888; font-size: 0.85rem; text-align: center; padding: 10px;">No hay valores cargados aún. ¡Agregá el primero abajo!</p>';
        }
    }

    const modalElement = document.getElementById('modalValores');
    if (modalElement) {
        const myModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        myModal.show();
    }
}

async function refrescarListaValoresModal() {
    const contenedor = document.getElementById('contenedor-checks-valores');
    if (!contenedor) return;
    contenedor.innerHTML = "Cargando...";

    try {
        const res = await fetch(`/api/property-values/group/${editingCoCatGroupId}`);
        let valores = await res.json();

        valores.sort((a, b) => a.value.localeCompare(b.value));

        contenedor.innerHTML = "";
        if (valores.length === 0) {
            contenedor.innerHTML = "<p class='text-muted small'>No hay valores aún.</p>";
        }

        valores.forEach(v => {
            contenedor.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input check-valor" type="checkbox" value="${v.id}" id="val-${v.id}" checked disabled>
                    <label class="form-check-label" for="val-${v.id}">${v.value}</label>
                    <span class="text-danger ms-2" style="cursor:pointer" onclick="eliminarValor(${v.id})">
                        <i class="fas fa-times-circle"></i>
                    </span>
                </div>`;
        });
    } catch (e) {
        console.error("Error al refrescar valores:", e);
        contenedor.innerHTML = "<p class='text-danger small'>Error al cargar valores.</p>";
    }
}

async function crearValorDesdeModal() {
    const input = document.getElementById('input-nuevo-valor');
    if (!input) return;
    const texto = input.value.trim();
    if (!texto) return;
    
    const payload = {
        value: texto,
        coCategoryGroupId: editingCoCatGroupId
    };

    try {
        const res = await fetch('/api/property-values/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            input.value = "";
            await refrescarListaValoresModal();
        } else {
            const mensajeError = await res.text();
            alert(mensajeError || "Ese valor ya existe o no se pudo guardar.");
        }
    } catch (e) {
        console.error("Error en la red:", e);
        alert("Error de conexión al intentar agregar el valor.");
    }
}

async function eliminarValor(id) {
    if (!confirm("¿Seguro que querés borrar este valor?")) return;

    try {
        const res = await fetch(`/api/property-values/delete/${id}`, { 
            method: 'DELETE' 
        });

        if (res.ok) {
            console.log("Valor eliminado con éxito, refrescando lista...");
            await refrescarListaValoresModal();
        } else {
            const errorText = await res.text();
            console.error("Error al eliminar el valor:", errorText);
            alert("No se pudo eliminar el valor: " + errorText);
        }
    } catch (e) {
        console.error("Error en la conexión al eliminar valor:", e);
    }
}