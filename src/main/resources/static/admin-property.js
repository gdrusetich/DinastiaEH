async function cargarCoCategoryGroup() {
    try {
        const res = await fetch(`${API_CO_CAT_GROUP}/all`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        coCategoryGroupsData = data;
    } catch (e) {
        console.error("Falla en la carga de Grupos:", e.message);
        coCategoryGroupsData = [];
    }
}

async function cargarCheckboxesCoCategoryGroup() {
    const container = document.getElementById('co-cat-checkboxes');
    if (!container) return;
    
    container.className = "checkbox-grid-container";
    
    const lista = coCategoryGroupsData || [];
    const dataOrdenada = [...lista].sort((a, b) => a.name.localeCompare(b.name));
    
    container.innerHTML = dataOrdenada.map(cocat => `
        <label class="checkbox-item">
            <input type="checkbox" value="${cocat.id}" class="co-cat-check"> 
            <span style="margin-left: 8px;">${cocat.name}</span>
        </label>
    `).join('');
}

async function cargarChecksEspecificaciones() {
    const contenedor = document.getElementById('lista-checks-specs');
    if (!contenedor) return;

    contenedor.innerHTML = "<p class='text-info'>Cargando especificaciones...</p>";
    
    try {
        let grupos = coCategoryGroupsData;
        if (!grupos || grupos.length === 0) {
            const res = await fetch(`${API_COCAT_GROUPS}/all`);
            if (!res.ok) throw new Error("No se pudieron cargar los grupos");
            grupos = await res.json();
        }

        grupos.sort((a, b) => a.name.localeCompare(b.name));
        const valoresActualesIds = (productoEnEdicion && productoEnEdicion.propertyValues) 
            ? productoEnEdicion.propertyValues.map(v => v.id) 
            : [];

        let html = "";
        
        for (const g of grupos) {
            const urlValores = `${API_PROPERTY_VALUES}/group/${g.id}`;
            const respValores = await fetch(urlValores);
            if (!respValores.ok) continue;

            const valores = await respValores.json();
            
            if (valores.length > 0) {
                html += `
                <div class="grupo-especif mb-3" style="border-left: 3px solid #ffc107; padding-left: 10px;">
                    <div style="color: #ffc107; font-weight: bold; margin-bottom: 5px; font-size: 0.85em;">
                        ${g.name.toUpperCase()}
                    </div>
                    <div class="d-flex flex-wrap gap-2">`;
                
                html += valores.map(v => `
                    <label class="checkbox-item" style="background: #222; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">
                        <input type="checkbox" value="${v.id}" class="edit-spec-check" 
                               ${valoresActualesIds.includes(v.id) ? 'checked' : ''}> 
                        <span class="ms-1">${v.value}</span>
                    </label>
                `).join('');
                
                html += `</div></div>`;
            }
        }
        contenedor.innerHTML = html || "<p class='text-muted'>No hay especificaciones disponibles.</p>";
    } catch (error) {
        contenedor.innerHTML = "<p class='text-danger'>Error: " + error.message + "</p>";
    }
}

async function activarModoEdicionCoCatGroup() {
    if (!coCategoryGroupsData || coCategoryGroupsData.length === 0) {
        console.warn("⚠️ Advertencia: coCategoryGroupsData está vacío. ¿Se cargaron los datos al iniciar?");
        await cargarCoCategoryGroup(); // Asegúrate de tener una función que traiga los grupos
    }

    const titulo = document.getElementById('cocat-group-form-title');
    if (titulo) {
        titulo.innerText = "✏️ Editando Grupo de Co-Categoría";
        titulo.style.color = "#ff9800";
    }

    const selectorCont = document.getElementById('cocat-view-select');
    if (selectorCont) {
        selectorCont.style.display = 'block'; // Forzamos visibilidad
        selectorCont.classList.remove('oculto');
    }
    const mostrar = (id) => { const el = document.getElementById(id); if (el) el.classList.remove('oculto'); };
    const ocultar = (id) => { const el = document.getElementById(id); if (el) el.classList.add('oculto'); };

    mostrar('formulario-propiedad-dinamico');
    mostrar('cocat-view-select');    
    ocultar('btn-modo-editar-cocat');
    ocultar('btn-modo-crear-cocat');
    mostrar('btn-cancelar-cocat');
    mostrar('btn-eliminar-cocat');
    const selector = document.getElementById('cocat-selector');
    if (selector) {
        selector.innerHTML = '<option value="">-- Seleccionar para editar --</option>';
        
        coCategoryGroupsData.forEach(group => {
            console.log("Agregando al selector:", group.name); // Ver en consola si llega algo
            const opt = document.createElement('option');
            opt.value = group.id;
            opt.textContent = group.name;
            selector.appendChild(opt);
        });
    }
}

function resetFormCoCatGroup() {
    editingCoCatGroupId = null;

    // Solo ejecuta si el elemento existe (evita el error 'null')
    const elementosParaOcultar = [
        'cocat-view-select', 
        'formulario-propiedad-dinamico', 
        'btn-eliminar-cocat', 
        'btn-cancelar-cocat'
    ];
    
    elementosParaOcultar.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('oculto');
    });

    const btnCrear = document.getElementById('btn-modo-crear-cocat');
    const btnEditar = document.getElementById('btn-modo-editar-cocat');
    if (btnCrear) btnCrear.classList.remove('oculto');
    if (btnEditar) btnEditar.classList.remove('oculto');

    const input = document.getElementById('new-cocat-group-name');
    if (input) input.value = "";
    
    const titulo = document.getElementById('cocat-group-form-title');
    if (titulo) {
        titulo.innerText = "Gestión de Propiedades";
        titulo.style.color = "#ccc";
    }
}

async function guardarCoCategoryGroup() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombre = inputNombre ? inputNombre.value.trim() : "";
    const checksMarcados = document.querySelectorAll('.cat-check:checked');
    const categoriasIds = Array.from(checksMarcados).map(cb => parseInt(cb.value));

    if (!nombre) { alert("El nombre es obligatorio"); return; }

    const payload = { name: nombre, type: "TEXT", categoryIds: categoriasIds };
    const url = editingCoCatGroupId ? `/api/co-category-group/update/${editingCoCatGroupId}` : `/api/co-category-group/add`;
    const method = editingCoCatGroupId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const grupoServidor = await res.json();
            if ((!grupoServidor.categoryIds || grupoServidor.categoryIds.length === 0) && categoriasIds.length > 0) {
                grupoServidor.categoryIds = [...categoriasIds];
            }
            
            alert(editingCoCatGroupId ? "Actualizado con éxito" : "Creado con éxito");            
            await cargarCoCategoryGroup(); 
            resetFormCoCatGroup();
        }
    } catch (e) {
        console.error("Error en la conexión:", e);
    }
}

async function cargarDatosCoCatGroupParaEditar() {
    const idSeleccionado = document.getElementById('cocat-selector').value;
    if (!idSeleccionado) return;

    const group = coCategoryGroupsData.find(c => c.id == idSeleccionado);
    if (!group) return;

    editingCoCatGroupId = group.id;
    document.getElementById('new-cocat-group-name').value = group.name;
    if (document.getElementById('contenedor-asociar-cat')) document.getElementById('contenedor-asociar-cat').style.display = 'block';

    document.querySelectorAll('.cat-check').forEach(cb => cb.checked = false);
    if (group.categoryIds && group.categoryIds.length > 0) {
        group.categoryIds.forEach(idAsociado => {
            const cb = document.querySelector(`.cat-check[value="${idAsociado}"]`);
            if (cb) cb.checked = true;
        });
    }
}

async function eliminarCoCategoryGroup() {
    const id = document.getElementById('cocat-selector').value;
    if (!id) { alert("Seleccioná un grupo para borrar."); return; }

    if (confirm(`¿Estás seguro de que querés eliminar este grupo?`)) {
        try {
            const res = await fetch(`${API_CO_CAT_GROUP}/delete/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Eliminado correctamente.");
                resetFormCoCatGroup();
                await cargarCoCategoryGroup();
            }
        } catch (e) { console.error(e); }
    }
}

function abrirModalValores() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombreGrupo = inputNombre ? inputNombre.value.trim() : "";
    const esModoEdicion = (editingCoCatGroupId !== undefined && editingCoCatGroupId !== null);

    if (!esModoEdicion) {
        if (nombreGrupo === "") {
            alert("Debe ingresar un nombre para la nueva propiedad antes de gestionar sus valores.");
            if (inputNombre) inputNombre.focus();
            return;
        }
        if ((coCategoryGroupsData || []).some(g => g.name.toLowerCase() === nombreGrupo.toLowerCase())) {
            alert("Ese nombre de propiedad ya existe.");
            return;
        }
        if (document.getElementById('nombre-grupo-titulo')) document.getElementById('nombre-grupo-titulo').innerText = nombreGrupo + " (Nueva)";
    } else {
        if (document.getElementById('nombre-grupo-titulo')) document.getElementById('nombre-grupo-titulo').innerText = nombreGrupo;
    }

    if (esModoEdicion) refrescarListaValoresModal();
    else if (document.getElementById('contenedor-checks-valores')) {
        document.getElementById('contenedor-checks-valores').innerHTML = '<p class="text-muted text-center small">No hay valores cargados aún.</p>';
    }

    const modalElement = document.getElementById('modalValores');
    if (modalElement) {
        const myModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        myModal.show();
    }
}

async function refrescarListaValoresModal() {
    const contenedor = document.getElementById('contenedor-checks-valores');
    if(!contenedor) return;
    contenedor.innerHTML = "Cargando...";

    try {
        const res = await fetch(`/api/property-values/group/${editingCoCatGroupId}`);
        let valores = await res.json();
        valores.sort((a, b) => a.value.localeCompare(b.value));

        if (valores.length === 0) {
            contenedor.innerHTML = "<p class='text-muted small'>No hay valores aún.</p>";
            return;
        }

        let html = '<div class="grid-checkbox-container">';
        valores.forEach(v => {
            html += `
                <div class="form-check-card">
                    <span>${v.value}</span>
                    <span class="text-danger ms-2" style="cursor:pointer" onclick="eliminarValor(${v.id})">
                        <i class="fas fa-times-circle"></i>
                    </span>
                </div>`;
        });
        html += '</div>';
        contenedor.innerHTML = html;

    } catch (e) { console.error(e); }
}

async function crearValorDesdeModal() {
    const input = document.getElementById('input-nuevo-valor');
    const texto = input ? input.value.trim() : "";
    if (!texto) return;

    try {
        const res = await fetch('/api/property-values/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: texto, coCategoryGroupId: editingCoCatGroupId })
        });
        if (res.ok) {
            input.value = "";
            await refrescarListaValoresModal();
        }
    } catch (e) { console.error(e); }
}

async function eliminarValor(id) {
    if (!confirm("¿Seguro que querés borrar este valor?")) return;
    try {
        const res = await fetch(`/api/property-values/delete/${id}`, { method: 'DELETE' });
        if (res.ok) await refrescarListaValoresModal();
    } catch (e) { console.error(e); }
}

function toggleDropdownPropiedades() {
    const panel = document.getElementById('modal-property-category');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
}

function confirmarSeleccionPropiedades() {
    const checkboxes = document.querySelectorAll('.co-cat-check:checked');
    const botonTrigger = document.getElementById('btn-dropdown-prop');
    if (botonTrigger) {
        botonTrigger.innerText = checkboxes.length > 0 ? `Propiedades seleccionadas (${checkboxes.length}) ▾` : "Seleccionar Propiedades ▾";
    }
    toggleDropdownPropiedades();
}

function toggleAsociadorCategorias() {
    const box = document.getElementById('contenedor-asociar-cat');
    if(box) box.style.display = (box.style.display === 'none') ? 'block' : 'none';
}

async function guardarCambiosValores() {
    alert("¡Gestión de valores finalizada con éxito!");

    try {
        if (typeof cargarCoCategoryGroup === 'function') {
            await cargarCoCategoryGroup();
        }
    } catch (e) {
        console.error("Error al actualizar memoria de grupos:", e);
    }

    const modalElement = document.getElementById('modalValores'); 
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        } else {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
    }
}

async function verificarCascadaAtributos(categoriaId, filaId) {
    filaActualId = filaId;
    if (!valoresSeleccionadosPorFila[filaId])
        valoresSeleccionadosPorFila[filaId] = new Set();
    try {
        const res = await fetch(`/api/categories/${categoriaId}`);
        if (!res.ok) return;
        
        const categoria = await res.json();
        const grupos = categoria.coCategoriesGroup || [];

        if (grupos.length > 0) {
            console.log(`La categoría ${categoria.name} tiene ${grupos.length} grupos. Abriendo subfiltros...`);
            editingCoCatGroupId = grupos[0].id; 
            document.getElementById('nombre-grupo-titulo').innerText = `${categoria.name} - ${grupos[0].name}`;

            if (!modalValoresBootstrap) {
                modalValoresBootstrap = new bootstrap.Modal(document.getElementById('modalValores'));
            }

            await refrescarListaValoresParaProducto();
            modalValoresBootstrap.show();
        }
    } catch (error) {
        console.error("Error en cascada de atributos:", error);
    }
}

async function refrescarListaValoresParaProducto() {
    const contenedor = document.getElementById('contenedor-checks-valores');
    contenedor.innerHTML = "Cargando especificaciones...";

    try {
        const res = await fetch(`/api/property-values/group/${editingCoCatGroupId}`);
        let valores = await res.json();

        valores.sort((a, b) => a.value.localeCompare(b.value));
        contenedor.innerHTML = "";

        if (valores.length === 0) {
            contenedor.innerHTML = "<p class='text-muted small'>No hay subfiltros configurados para esta categoría.</p>";
            return;
        }

        valores.forEach(v => {
            const yaChecked = valoresSeleccionadosPorFila[filaActualId].has(v.id) ? "checked" : "";            
            contenedor.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input check-prod-val" 
                           type="checkbox" 
                           value="${v.id}" 
                           id="prod-val-${v.id}" 
                           ${yaChecked}
                           onchange="toggleValorFilaProducto(${v.id}, this.checked)">
                    <label class="form-check-label" for="prod-val-${v.id}">${v.value}</label>
                </div>`;
        });
    } catch (e) {
        console.error("Error al refrescar valores para el producto:", e);
        contenedor.innerHTML = "<p class='text-danger small'>Error al cargar atributos.</p>";
    }
}

async function renderizarEspecificacionesEnModal(arrayCategoriasIds) {
    const contenedorSpecs = document.getElementById('lista-checks-specs');
    if (!contenedorSpecs) {
        console.error("❌ No se encontró el contenedor #lista-checks-specs");
        return;
    }

    if (!arrayCategoriasIds || arrayCategoriasIds.length === 0) {
        contenedorSpecs.innerHTML = "<p class='text-muted small'>Seleccioná una categoría para ver sus especificaciones.</p>";
        return;
    }

    contenedorSpecs.innerHTML = "Actualizando especificaciones...";

    try {
        const promesas = arrayCategoriasIds.map(catId => 
            fetch(`${API_BASE}/categories/${catId}`).then(res => res.json())
        );
        
        const categorias = await Promise.all(promesas);
        let gruposMapeados = [];
        categorias.forEach(categoria => {
            if (categoria.coCategoriesGroup) {
                gruposMapeados.push(...categoria.coCategoriesGroup);
            }
        });

        const gruposUnicos = Array.from(new Map(gruposMapeados.map(g => [g.id, g])).values());
        
        if (gruposUnicos.length === 0) {
            contenedorSpecs.innerHTML = "<p class='text-muted small'>Las categorías seleccionadas no requieren especificaciones.</p>";
            return;
        }

        let html = "";
        gruposUnicos.forEach(grupo => {
            html += `<h6 class='mt-3 text-warning'>${grupo.name}</h6>`;            
            grupo.propertyValues.forEach(valor => {
                const yaTieneValor = productoEnEdicion.propertyValues && 
                                     productoEnEdicion.propertyValues.some(pv => (pv.id === valor.id || pv.idPropertyValues === valor.id));
                const isChecked = yaTieneValor ? "checked" : "";

                html += `
                    <div class="form-check">
                        <input class="form-check-input edit-spec-check" 
                               type="checkbox" 
                               value="${valor.id}" 
                               id="edit-spec-${valor.id}" 
                               ${isChecked}>
                        <label class="form-check-label" for="edit-spec-${valor.id}">
                            ${valor.value}
                        </label>
                    </div>`;
            });
        });

        contenedorSpecs.innerHTML = html;

    } catch (error) {
        console.error("Error al renderizar especificaciones:", error);
        contenedorSpecs.innerHTML = "<p class='text-danger small'>Error al cargar las especificaciones.</p>";
    }
}

function toggleValorFilaProducto(valorId, esChecked) {
    if (esChecked) {
        valoresSeleccionadosPorFila[filaActualId].add(valorId);
    } else {
        valoresSeleccionadosPorFila[filaActualId].delete(valorId);
    }
    console.log(`Fila ${filaActualId} - Atributos guardados en memoria:`, Array.from(valoresSeleccionadosPorFila[filaActualId]));
}

function escucharCambioCategoriaModal() {
    const catsActivas = Array.from(document.querySelectorAll('.edit-cat-check:checked'))
                             .map(cb => parseInt(cb.value));    
    renderizarEspecificacionesEnModal(catsActivas);
}

function abrirModalAsociacionAvanzada() {
    const modal = document.getElementById('modal-asociacion-avanzada');
    if (!modal) return;
    categoriaSeleccionadaEnModalId = null;
    document.getElementById('contenedor-valores-especificos-avanzado').innerHTML = '';
    modal.style.display = 'flex';
    document.getElementById('ayuda-valores-avanzado').style.display = 'block';
    
    renderizarCategoriasEnModalAvanzado();
}

function cerrarModalAsociacionAvanzada() {
    const modal = document.getElementById('modal-asociacion-avanzada');
    if (modal) modal.style.display = 'none';
}

function renderizarCategoriasEnModalAvanzado() {
    const container = document.getElementById('lista-categorias-modal-avanzado');
    if (!container) return;
    
    const lista = categoriasData || [];
    if (lista.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 0.9rem; padding: 10px;">No hay categorías cargadas.</p>';
        return;
    }
    
    const ordenadas = [...lista].sort((a, b) => a.name.localeCompare(b.name));
    
    container.innerHTML = ordenadas.map(cat => {
        const sufijoPadre = cat.parent ? ` <small style="color: #666; font-size: 0.75rem;">(${cat.parent.name})</small>` : '';
        
        return `
            <div class="item-categoria-modal" 
                 id="item-cat-modal-${cat.id}"
                 onclick="seleccionarCategoriaEnModal(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')"
                 style="padding: 10px; background: #2a2a2a; border-radius: 4px; border-left: 4px solid #444; cursor: pointer; transition: all 0.2s; color: #eee;">
                <i class="fas fa-folder" style="color: #4CAF50; margin-right: 8px; font-size: 0.85rem;"></i>
                <span>${cat.name}</span>${sufijoPadre}
            </div>
        `;
    }).join('');
}

function seleccionarCategoriaEnModal(catId, catNombre) {
    categoriaSeleccionadaEnModalId = catId;
    document.querySelectorAll('.item-categoria-modal').forEach(el => {
        el.style.borderLeftColor = '#444';
        el.style.background = '#2a2a2a';
    });
    const elementoActivo = document.getElementById(`item-cat-modal-${catId}`);
    if (elementoActivo) {
        elementoActivo.style.borderLeftColor = '#4CAF50';
        elementoActivo.style.background = '#333';
    }
    
    document.getElementById('titulo-valores-categoria-avanzado').innerHTML = `2. Valores para <span style="color: #4CAF50;">${catNombre}</span>`;
    document.getElementById('ayuda-valores-avanzado').style.display = 'none';
    renderizarValoresParaCategoria();
}

function renderizarValoresParaCategoria() {
    const container = document.getElementById('contenedor-valores-especificos-avanzado');
    if (!container) return;
    
    const valoresDisponibles = obtenerValoresDelGrupoActual(); 
    
    if (valoresDisponibles.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 0.85rem; grid-column: span 2; text-align: center; padding: 20px;">Primero agregá valores en el paso 1.</p>';
        return;
    }

    const tildadosPrevios = mapaAsociacionesTemporales[categoriaSeleccionadaEnModalId] || [];
    
    container.innerHTML = valoresDisponibles.map(v => {
        const isChecked = tildadosPrevios.includes(v.id) ? 'checked' : '';
        return `
            <label style="display: flex; align-items: center; gap: 8px; background: #262626; padding: 8px 12px; border-radius: 4px; border: 1px solid #3a3a3a; cursor: pointer; color: #ddd; font-size: 0.85rem;">
                <input type="checkbox" value="${v.id}" ${isChecked} 
                       onchange="actualizarMapaAsociacionTemporal(${v.id}, this.checked)" 
                       style="cursor: pointer; accent-color: #ffc107;">
                <span>${v.nombre}</span>
            </label>
        `;
    }).join('');
}

function obtenerValoresDelGrupoActual() {
    if (editingCoCatGroupId) {
        const grupo = coCategoryGroupsData.find(g => g.id == editingCoCatGroupId);
        return grupo && grupo.propertyValues ? grupo.propertyValues.map(v => ({id: v.id, nombre: v.value})) : [];
    }
    return [];
}

function actualizarMapaAsociacionTemporal(valorId, isChecked) {
    if (!categoriaSeleccionadaEnModalId) return;
    
    if (!mapaAsociacionesTemporales[categoriaSeleccionadaEnModalId]) {
        mapaAsociacionesTemporales[categoriaSeleccionadaEnModalId] = [];
    }
    
    let listaIds = mapaAsociacionesTemporales[categoriaSeleccionadaEnModalId];
    
    if (isChecked) {
        if (!listaIds.includes(valorId)) listaIds.push(valorId);
    } else {
        mapaAsociacionesTemporales[categoriaSeleccionadaEnModalId] = listaIds.filter(id => id !== valorId);
    }
    
    console.log("Estado de asociaciones temporales en vivo:", mapaAsociacionesTemporales);
}

function cambiarModoPropiedad(modo, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log("Procesando modo:", modo);
    const formDinamico = document.getElementById('formulario-propiedad-dinamico');
    const btnCrear = document.getElementById('btn-modo-crear-cocat');
    const btnEditar = document.getElementById('btn-modo-editar-cocat');
    
    if (formDinamico) formDinamico.classList.remove('oculto');

    if (modo === 'crear') {
        resetFormCoCatGroup(); // Resetear todo primero
        if (formDinamico) formDinamico.classList.remove('oculto');
        if (btnCrear) btnCrear.classList.add('oculto');
        if (btnEditar) btnEditar.classList.add('oculto');
        
    } else if (modo === 'editar') {
        activarModoEdicionCoCatGroup();
        if (btnCrear) btnCrear.classList.add('oculto');
        if (btnEditar) btnEditar.classList.add('oculto');
    }
}

async function procesarGuardadoPropiedad() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombre = inputNombre ? inputNombre.value.trim() : "";
    const btnGuardar = document.getElementById('btn-guardar-cocat');

    if (nombre === "") {
        alert("Por favor, ingrese un nombre para la propiedad.");
        return;
    }

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
                body: JSON.stringify({ name: nombre })
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

async function eliminarPropiedadSeleccionada() {
    if (!editingCoCatGroupId) {
        alert("Por favor, seleccioná una propiedad de la lista para poder eliminarla.");
        return;
    }

    const selector = document.getElementById('cocat-selector');
    const nombrePropiedad = selector ? selector.options[selector.selectedIndex].text : "esta propiedad";
    if (!confirm(`¿Estás seguro de que querés eliminar la propiedad "${nombrePropiedad}"?`)) {
        return;
    }
    try {
        const response = await fetch(`/api/co-category-group/delete/${editingCoCatGroupId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert(`La propiedad "${nombrePropiedad}" fue eliminada correctamente.`);
            await cargarCoCategoryGroup();             
            resetFormCoCatGroup(); 
        } else {
            const errorText = await response.text();
            alert("No se pudo eliminar: " + errorText);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de red al conectar con el servidor.");
    }
}