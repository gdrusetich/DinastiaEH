function cargarCategoriasSelector() {
    fetch(API_CATEGORIES + "/list")
        .then(res => res.json())
        .then(data => {
            categoriasData = data;
            const principales = data.filter(c => !c.parent);
            const opcionTodas = { id: 'limpiar', name: 'Todas' };
            const listaConTodas = [opcionTodas, ...principales];            
            renderizarNivel(0, listaConTodas);
        });
}

function renderizarNivel(nivel, lista) {
    const contenedorPadre = document.getElementById('niveles-categorias');
    if (!contenedorPadre) return;

    const existente = document.getElementById(`nivel-${nivel}`);
    if (existente) existente.remove();

    const divNivel = document.createElement('div');
    divNivel.id = `nivel-${nivel}`;
    divNivel.className = "panel-wrapper";
    divNivel.setAttribute('data-nivel', nivel);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = "panel-movil-container";
    const dropdown = document.createElement('div');
    dropdown.className = "dropdown-categorias d-none";

    lista.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = "panel-item";
        if (cat.id == categoriaActualId) btn.classList.add('active');
        btn.innerText = cat.name;
        btn.onclick = () => manejarSeleccion(cat.id, cat.name, nivel, btn);
        itemsContainer.appendChild(btn);
    });

    divNivel.appendChild(itemsContainer);
    contenedorPadre.appendChild(divNivel);

    requestAnimationFrame(() => {
        const anchoMaximo = itemsContainer.offsetWidth - 80;
        const items = itemsContainer.querySelectorAll('.panel-item');
        let anchoAcumulado = 0;
        let extras = [];

        items.forEach(item => {
            anchoAcumulado += item.offsetWidth;
            if (anchoAcumulado > anchoMaximo) {
                extras.push(item);
            }
        });

        if (extras.length > 0) {
            const btnMas = document.createElement('div');
            btnMas.className = "panel-more-btn";
            btnMas.innerHTML = `<i class="fas fa-chevron-down"></i> <span style="margin-left:5px">${extras.length} más</span>`;
            
            extras.forEach(item => {
                const clone = item.cloneNode(true);
                clone.onclick = item.onclick;
                dropdown.appendChild(clone);
                item.style.display = 'none'; 
            });

            btnMas.onclick = (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('d-none');
            };

            divNivel.appendChild(btnMas);
            divNivel.appendChild(dropdown);
        }
    });
}

function manejarSeleccion(id, nombre, nivelActual, btn) {
    if (id === 'limpiar') {
        limpiarFiltros();
        return;
    }

    categoriaActualId = id;
    document.getElementById('categoriaIdInput').value = id;
    document.getElementById('nombre-seleccionada').innerText = nombre;

    const contenedorPadre = document.getElementById('niveles-categorias');
    Array.from(contenedorPadre.children).forEach(child => {
        const nivelDelChild = parseInt(child.id.split('-')[1]);
        if (nivelDelChild > nivelActual) child.remove();
    });
    const wrapperActual = document.getElementById(`nivel-${nivelActual}`);
    if (wrapperActual) {
        wrapperActual.querySelectorAll('.panel-item').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');

    const subcats = categoriasData.filter(c => c.parent && Number(c.parent.id) === Number(id));
    if (subcats.length > 0) {
        renderizarNivel(nivelActual + 1, subcats);
    }

    if (typeof ejecutarFiltroFinal === 'function') ejecutarFiltroFinal();
}

function limpiarFiltros() {
    document.getElementById('categoriaIdInput').value = '';
    document.getElementById('nombre-seleccionada').innerText = 'Todas';
    categoriaActualId = null;
    const contenedor = document.getElementById('niveles-categorias');
    Array.from(contenedor.children).forEach(child => {
        if (child.id !== 'nivel-0') child.remove();
    });
    const nivel0 = document.getElementById('nivel-0');
    if (nivel0) {
        nivel0.querySelectorAll('.panel-item').forEach(b => {
            b.classList.remove('active');
            if (b.innerText === 'Todas') b.classList.add('active');
        });
    }

    if (typeof ejecutarFiltroFinal === 'function') ejecutarFiltroFinal();
}

async function cargarSelectCategorias() {
    const selectPadre = document.getElementById('cat-parent');
    if (!selectPadre) return;

    try {
        const res = await fetch(`${API_CATEGORIES}/list`);
        const data = await res.json();
        categoriasData = data; 

        selectPadre.innerHTML = '<option value="">-- Ninguna (Principal) --</option>';
        data.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            selectPadre.appendChild(option);
        });
    } catch (e) {
        console.error("Error en cargarSelectCategorias:", e);
    }
}

function obtenerIdsDescendientes(idPadre) {
    let ids = [Number(idPadre)];
    const hijas = categoriasData.filter(c => c.parent && Number(c.parent.id) === Number(idPadre));
    hijas.forEach(hija => {
        ids = ids.concat(obtenerIdsDescendientes(hija.id));
    });
    return ids;
}

function actualizarBotones() {
    const select = document.getElementById('cat-parent');
    const btnEditar = document.getElementById('btn-preparar-edicion');
    const btnEliminar = document.getElementById('btn-eliminar-cat');
    const btnGuardar = document.getElementById('btn-guardar-cat');

    if (select.value !== "") {
        btnEditar.style.display = "block";
        btnEliminar.style.display = "block";
        btnGuardar.innerText = "Guardar como Subcategoría";
    } else {
        btnEditar.style.display = "none";
        btnEliminar.style.display = "none";
        btnGuardar.innerText = "Guardar como Nueva Raíz";
    }
}

async function prepararEdicionDesdeSelect() {
    const select = document.getElementById('cat-parent');
    const idSeleccionado = select.value;
    if (!idSeleccionado) return;

    try {
        const res = await fetch(`${API_CATEGORIES}/${idSeleccionado}`);
        if (!res.ok) throw new Error("No se pudo obtener el detalle de la categoría");
        
        const catCompleta = await res.json();
        editandoCatId = catCompleta.id;
        document.getElementById('new-category-name').value = catCompleta.name;

        const tituloForm = document.getElementById('titulo-form-cat');
        if (tituloForm) {
            tituloForm.innerText = "Modificando Categoría";
            tituloForm.style.color = "#ffc107"; 
        }
        
        document.getElementById('btn-cancelar-cat').style.display = "block";
        document.getElementById('btn-preparar-edicion').style.display = "none"; 
        if (catCompleta.parent && catCompleta.parent.id) {
            select.value = catCompleta.parent.id;
        } else if (catCompleta.parentId) {
            select.value = catCompleta.parentId;
        } else {
            select.value = "";
        }
        
        document.getElementById('new-category-name').focus();
        document.querySelectorAll('.co-cat-check').forEach(cb => cb.checked = false);
        const gruposAsociados = catCompleta.coCategoriesGroup || catCompleta.coCategoryGroups || [];
        
        if (gruposAsociados.length > 0) {
            gruposAsociados.forEach(grupo => {
                const cb = document.querySelector(`.co-cat-check[value="${grupo.id}"]`);
                if (cb) cb.checked = true;
            });
        }
    } catch (error) {
        console.error("Error al cargar co-categorías para editar:", error);
    }
}

function cancelarEdicionCat() {
    editandoCatId = null;
    const inputNombre = document.getElementById('new-category-name');
    if (inputNombre) inputNombre.value = "";

    const selectPadre = document.getElementById('cat-parent');
    if (selectPadre) selectPadre.value = "";

    const titulo = document.getElementById('titulo-form-cat');
    if (titulo) {
        titulo.innerText = "Crear Nueva Categoría";
        titulo.style.color = "#aaa";
    }

    const btnCancelar = document.getElementById('btn-cancelar-cat');
    if (btnCancelar) btnCancelar.style.display = "none";
    if (typeof actualizarBotones === 'function') {
        actualizarBotones();
    }
    document.querySelectorAll('.co-cat-check').forEach(cb => cb.checked = false);
}

async function guardarCategoria() {
    const nombre = document.getElementById('new-category-name').value.trim();
    const padreId = document.getElementById('cat-parent').value;
    const checks = document.querySelectorAll('.co-cat-check:checked');
    const selectedCoCats = Array.from(checks).map(cb => {
        console.log("DEBUG: ID marcado:", cb.value);
        return parseInt(cb.value);
    });
    console.log("DEBUG: Nombre:", nombre);
    console.log("DEBUG: Cantidad de grupos marcados:", checks.length);
    
    if (!nombre) { alert("Poné un nombre"); return; }

    const payload = {
        name: nombre,
        parent: (padreId && padreId !== "") ? { id: parseInt(padreId) } : null,
        coCategoryGroupIds: selectedCoCats 
    };
    console.log("DEBUG: Payload final a enviar:", JSON.stringify(payload));
    console.log("DEBUG: Antes del fetch"); // <-- Agregá esto
    try {
        const url = editandoCatId ? `${API_CATEGORIES}/update/${editandoCatId}` : `${API_CATEGORIES}/add`;
        const metodo = editandoCatId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("DEBUG: Respuesta recibida:", res.status); // <-- Agregá esto

        if (res.ok) {
            alert("¡Categoría guardada!");
            cancelarEdicionCat();
            await cargarSelectCategorias(); 
        } else {
            const errorText = await res.text();
            alert("Error: " + errorText);
        }
    } catch (e) {
        console.error("DEBUG: ERROR CRÍTICO:", e);
    }
}

function eliminarCategoriaSeleccionada() {
    const select = document.getElementById('cat-parent');
    const id = select.value;
    const nombre = select.options[select.selectedIndex].text;

    if (!id) { alert("Por favor, selecciona una categoría para eliminar."); return; }

    if (confirm(`¿Estás seguro de eliminar "${nombre}"?\n\n- Las subcategorías subirán de nivel.\n- Los productos se reasignarán al padre.`)) {
        fetch(`${API_BASE}/categories/delete/${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error("Error en la respuesta del servidor");
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                alert("Categoría eliminada con éxito.");
                location.reload(); 
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            alert("No se pudo eliminar la categoría. Revisa la consola.");
        });
    }
}

async function cargarCheckboxesCategorias() {
    const container = document.getElementById('cat-checkboxes');
    if (!container) return;
    container.className = "grid-checkboxes";
    const lista = categoriasData || [];
    container.innerHTML = lista.map(cat => `
        <label class="item-check-estilo">
            <input type="checkbox" value="${cat.id}" class="cat-check" style="margin-right: 8px;">
            ${cat.name}
        </label>
    `).join('');
}

function toggleModalCategorias() {
    const modal = document.getElementById('modal-category-property');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'flex' : 'none';
}