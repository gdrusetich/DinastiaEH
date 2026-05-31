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
window.appState = {
    categoriasSeleccionadasParaGrupo: []
};

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

function mostrarTab(tabId, event) { 
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const tabTarget = document.getElementById(tabId);
    if (tabTarget) tabTarget.style.display = 'block';
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabId === 'tab-cocategoria') { 
        if (document.getElementById('formulario-propiedad-dinamico'))
            resetFormCoCatGroup();
        if (typeof cargarCheckboxesCategorias === 'function')
            cargarCheckboxesCategorias(); 
    } else {
        if (typeof cargarCheckboxesCoCategoryGroup === 'function')
            cargarCheckboxesCoCategoryGroup();
    }
}

function configurarFormulario(modo) {
    // 1. Elementos principales
    const formDinamico = document.getElementById('formulario-propiedad-dinamico');
    const selectArea = document.getElementById('cocat-view-select');
    const seccionPasos = document.getElementById('seccion-pasos-secundarios');
    const btnEliminar = document.getElementById('btn-eliminar-cocat');
    const btnCancelar = document.getElementById('btn-cancelar-cocat');
    const titulo = document.getElementById('cocat-group-form-title');

    // SIEMPRE mostramos el formulario principal al hacer clic en cualquiera de los dos botones
    formDinamico.style.display = 'block';

    if (modo === 'crear') {
        titulo.innerText = "Nueva Propiedad";
        selectArea.style.display = 'none';      // Ocultamos el selector de edición
        seccionPasos.style.display = 'block';   // Mostramos botones de edición
        btnEliminar.style.display = 'none';    // Ocultamos borrar
        btnCancelar.style.display = 'inline-block';
        
        // Limpiamos
        document.getElementById('new-cocat-group-name').value = "";
    } 
    else if (modo === 'editar') {
        titulo.innerText = "✏️ Editando Propiedad";
        selectArea.style.display = 'block';     // Mostramos el selector para elegir cuál editar
        seccionPasos.style.display = 'block';   // Mostramos botones
        btnEliminar.style.display = 'inline-block'; // Mostramos borrar
        btnCancelar.style.display = 'inline-block';
        cargarSelectorEdicion(); 
    }
}

function resetFormCoCatGroup() {
    document.getElementById('formulario-propiedad-dinamico').style.display = 'none';
    document.getElementById('cocat-group-form-title').innerText = "Gestión de Propiedades";
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
    const panel = document.getElementById('modal-property-category');
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

async function cargarSelectorEdicion() {
    console.log("Sincronizando selector...");
    await cargarCoCategoryGroup(); 
    activarModoEdicionCoCatGroup();
}


function togglePanelCategorias() {
    const panel = document.getElementById('seccion-edit-categorias');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function togglePanelEspecificaciones() {
    const panel = document.getElementById('panel-especificaciones-flotante');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function abrirPanelEspecificaciones() { togglePanelEspecificaciones(); }
function cerrarPanelEspecificaciones() { togglePanelEspecificaciones(); }

async function procesarGuardadoPropiedad() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombre = inputNombre ? inputNombre.value.trim() : "";
    const btnGuardar = document.getElementById('btn-guardar-cocat');

    if (nombre === "") {
        alert("Por favor, ingrese un nombre para la propiedad.");
        return;
    }

    const payload = {
        name: nombre,
        categoryIds: window.appState.categoriasSeleccionadasParaGrupo || []
    };

    const esModoEdicion = (typeof editingCoCatGroupId !== 'undefined' && editingCoCatGroupId !== null && editingCoCatGroupId !== "");

    if (!esModoEdicion) {
        const listaGrupos = coCategoryGroupsData || [];
        const existeYa = listaGrupos.some(g => g.name.toLowerCase() === nombre.toLowerCase());
        
        if (existeYa) {
            alert("¡Error! La propiedad '" + nombre + "' ya existe en el sistema. Elegí otro nombre o editá la existente.");
            if (inputNombre) inputNombre.focus();
            return;
        }

        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.innerText = "Guardando...";
        }

        try {
            const response = await fetch('/api/co-category-group/add', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const propiedadCreada = await response.json();
                alert("¡Propiedad '" + nombre + "' creada con éxito! Ahora podés añadir sus valores y categorías.");
                
                await cargarListaCoCategoryGroups(); 
                editingCoCatGroupId = propiedadCreada.id;
                cambiarModoPropiedad('editar');
                const selector = document.getElementById('cocat-selector');
                if (selector) {
                    selector.value = propiedadCreada.id;
                }
            } else {
                alert("Hubo un problema al intentar guardar la propiedad en el servidor.");
            }
        } catch (error) {
            console.error("Error al crear propiedad:", error);
        } finally {
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerText = "Guardar";
            }
        }
    } else {
        alert("Cambios de la propiedad guardados.");
    }
}

function confirmarSeleccionCategorias() {
    const checkboxes = document.querySelectorAll('.cat-check:checked');
    window.appState.categoriasSeleccionadasParaGrupo = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const botonTrigger = document.getElementById('btn-modal-cat-trigger');
    if (botonTrigger) {
        if (checkboxes.length > 0) {
            botonTrigger.innerText = `Categorías asociadas (${checkboxes.length}) ▾`;
            botonTrigger.style.borderColor = "#28a745";
        } else {
            botonTrigger.innerText = "Asociar a Categorías";
            botonTrigger.style.borderColor = "#444";
        }
    }

    if (typeof toggleModalCategorias === 'function') {
        toggleModalCategorias();
    }
}