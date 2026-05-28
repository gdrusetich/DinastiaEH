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

function ejecutarFiltroFinal() {
    const texto = document.getElementById('busquedaAdmin').value.toLowerCase();
    const idFiltro = document.getElementById('categoriaIdInput').value;    
    const inputFecha = document.getElementById('filtroFecha'); 
    const fechaCorte = inputFecha ? inputFecha.value : "";
    const checksSpecsActivos = document.querySelectorAll('.co-cat-filter-check:checked, .edit-spec-check:checked');
    const specsIdsActivos = Array.from(checksSpecsActivos).map(cb => parseInt(cb.value));

    let idsPermitidos = [];
    if (idFiltro && idFiltro !== "") {
        idsPermitidos = obtenerIdsDescendientes(idFiltro);
    }

    const filtrados = productosCargados.filter(p => {
        const nombreProducto = (p.title || p.name || "").toLowerCase();
        const coincideTexto = nombreProducto.includes(texto) || p.id.toString().includes(texto);
        if (!coincideTexto) return false;

        if (fechaCorte !== "") {
            if (!p.fechaUltimoPrecio) return true; 
            if (p.fechaUltimoPrecio > fechaCorte) return false;
        }

        if (idsPermitidos.length > 0) {
            let tieneCategoriaValida = false;
            
            if (Array.isArray(p.categories)) {
                tieneCategoriaValida = p.categories.some(cat => idsPermitidos.includes(Number(cat.id)));
            } else if (p.category) {
                const idCatProducto = p.category.id || p.category;
                tieneCategoriaValida = idsPermitidos.includes(Number(idCatProducto));
            }
            
            if (!tieneCategoriaValida) return false;
        }

        if (specsIdsActivos.length > 0) {
            if (!p.propertyValues || p.propertyValues.length === 0) {
                return false;
            }
            
            const cumpleEspecificacion = p.propertyValues.some(pv => {
                const pvId = pv.id || pv.idPropertyValues;
                return specsIdsActivos.includes(Number(pvId));
            });
            
            if (!cumpleEspecificacion) return false;
        }
        
        return true;
    });
    renderizarTabla(filtrados);
}

function cargarProductos() {
    fetch(`${API_PRODUCTS}/all`)
        .then(res => {
            if (!res.ok) throw new Error("Error en el servidor");
            return res.json();
        })
        .then(productos => {
            console.log("Productos para Admin cargados:", productos);
            productosCargados = Array.isArray(productos) ? productos : []; 
            ejecutarFiltroFinal();
        })
        .catch(err => {
            console.error("Error al cargar productos:", err);
            productosCargados = []; 
            renderizarTabla([]);
        });
}

function renderizarTabla(lista) {
    const tabla = document.getElementById('tabla-productos');
    let htmlFinal = "";
    if (!lista || lista.length === 0) {
        tabla.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px;'>No hay productos en esta categoría</td></tr>";
        return;
    }
    
    lista.sort((a, b) => (a.id || a.id_producto) - (b.id || b.id_producto));

    lista.forEach(p => {
        const id = p.id || p.id_producto;
        const btnVisibilidadColor = p.oculto ? 'rgba(27, 67, 50, 0.5)' : '#1b4332'; 
        const btnVisibilidadTexto = p.oculto ? 'Mostrar' : 'Ocultar';
        
        const esDestacado = (p.featured === true || p.isFeatured === true);
        const estrellaIcono = esDestacado ? "⭐" : "☆";

        let nombreImagenBase = (p.mainImage && p.mainImage.url) 
            ? p.mainImage.url 
            : (p.images && p.images.length > 0 ? (p.images[0].url || p.images[0]) : null);
        let rtaImagen = obtenerUrlFinal(nombreImagenBase);

        htmlFinal += `
        <tr id="fila-${id}" onclick="manejadorClickFila(event, ${id})" style="cursor: pointer;" class="fila-producto">
            <td>${id}</td>
            <td>
                <img src="${rtaImagen}" alt="${p.title}" 
                     style="width: 100px; height: 60px; object-fit: contain;"
                     onerror="this.src='${rutaDefault}';">
            </td>
            <td><strong>${p.title}</strong></td>
            <td>$${p.price ? p.price.toLocaleString('es-AR') : '0'}</td>
            <td>${p.stock}</td>

            <td style="min-width: 200px;">
                <div class="d-flex gap-1">
                    <div class="d-flex flex-column gap-1" style="flex: 1;">
                        <button class="btn-admin-panel" style="background-color: ${btnVisibilidadColor} !important; padding: 5px;" 
                                onclick="event.stopPropagation(); toggleVisibilidad(${id})">
                            ${btnVisibilidadTexto}
                        </button>
                        <button class="btn-admin-panel" style="padding: 5px;" 
                                onclick="event.stopPropagation(); alternarDestacado(${id})">
                            ${estrellaIcono}
                        </button>
                    </div>

                    <div class="d-flex flex-column gap-1" style="flex: 1;">
                        <button class="btn-admin-edit" 
                                onclick="event.stopPropagation(); editarFila(${id})">
                            Editar
                        </button>
                        <button class="btn-admin-danger" style="padding: 5px;" 
                                onclick="event.stopPropagation(); eliminarProducto(${id})">
                            Borrar
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
    });

    tabla.innerHTML = htmlFinal;
}

function irADetalle(id) {
    window.location.href = `/detalle?id=${id}`;
}

async function editarFila(id) {
    const idLimpio = parseInt(id);
    const urlBusqueda = `${API_PRODUCTS}/find-id/${idLimpio}`;
    
    console.log("🚀 Iniciando edición del producto:", idLimpio);

    try {
        const resp = await fetch(urlBusqueda);
        
        if (!resp.ok) {
            throw new Error(`No se encontró el producto (Status: ${resp.status})`);
        }
        
        const p = await resp.json();
        
        productoEnEdicion = p;

        document.getElementById('edit-prod-id').innerText = `#${idLimpio}`;
        document.getElementById('edit-prod-title').value = p.title || "";
        document.getElementById('edit-prod-price').value = p.price || 0;
        document.getElementById('edit-prod-stock').value = p.stock || 0;
        const imgElement = document.getElementById('edit-prod-img');
        let urlImg = (p.mainImage && p.mainImage.url) ? p.mainImage.url : (p.images?.[0]?.url || "");
        imgElement.src = obtenerUrlFinal(urlImg);

        document.getElementById('seccion-edit-categorias').classList.add('d-none');
        document.getElementById('seccion-edit-especificaciones').classList.add('d-none');

        llenarChecksCategoriasModal(); 
        const categoriasInicialesIds = p.categories ? p.categories.map(cat => cat.id || cat.idCategory) : [];
        await actualizarEspecificacionesPorCategorias(categoriasInicialesIds);
        document.getElementById('seccion-edit-categorias').classList.remove('d-none');
        document.getElementById('seccion-edit-especificaciones').classList.remove('d-none');

        const modalElement = document.getElementById('modalEditarProducto');
        const miModal = new bootstrap.Modal(modalElement);
        miModal.show();

    } catch (err) {
        console.error("❌ Error al cargar datos para edición:", err);
        alert("Atención: " + err.message);
    }
}

async function confirmarGuardadoEdicion() {
    if (!productoEnEdicion) return;

    const id = productoEnEdicion.id || productoEnEdicion.id_producto;
    const btnGuardar = document.querySelector("#modalEditarProducto .btn-success");
    
    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";
    const title = document.getElementById('edit-prod-title').value;
    const price = document.getElementById('edit-prod-price').value;
    const stock = document.getElementById('edit-prod-stock').value;
    const selectedCats = Array.from(document.querySelectorAll('.edit-cat-check:checked'))
                              .map(cb => parseInt(cb.value));

    const selectedSpecs = Array.from(document.querySelectorAll('.edit-spec-check:checked'))
                               .map(cb => parseInt(cb.value));

    const payload = {
        title: title,
        price: parseFloat(price),
        stock: parseInt(stock),
        idCategories: selectedCats, 
        idPropertyValues: selectedSpecs
    };

    try {
        console.log("JSON que sale para Java:", JSON.stringify(payload));
        const resp = await fetch(`${API_BASE}/products/actualizar-rapido/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            alert("Producto actualizado correctamente");
            const modalEl = document.getElementById('modalEditarProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            
            cargarProductos(); 
        } else {
            const errText = await resp.text();
            throw new Error(errText);
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("No se pudo guardar: " + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = "Guardar Cambios";
    }
}

function toggleSeccionEdicion(tipo) {
    const divCat = document.getElementById('seccion-edit-categorias');
    const divSpec = document.getElementById('seccion-edit-especificaciones');

    if (tipo === 'categorias') {
        divCat.classList.toggle('d-none');
        divSpec.classList.add('d-none');
        if (!divCat.classList.contains('d-none')) {
            llenarChecksCategoriasModal(); 
        }
    } else {
        divSpec.classList.toggle('d-none');
        divCat.classList.add('d-none');
        if (!divSpec.classList.contains('d-none')) {
            cargarChecksEspecificaciones();
        }
    }
}

async function llenarChecksCategoriasModal() {
    const contenedor = document.getElementById('lista-checks-categorias');
    const catsActualesIds = productoEnEdicion.categories.map(c => c.id);
    
    contenedor.innerHTML = categoriasData.map(cat => `
        <label class="checkbox-item">
            <input type="checkbox" value="${cat.id}" class="edit-cat-check" 
                   ${catsActualesIds.includes(cat.id) ? 'checked' : ''}
                   onchange="escucharCambioCategoriaModal()"> ${cat.name}
        </label>
    `).join('');
}

async function cargarCheckboxesCategorias() {
    const container = document.getElementById('cat-checkboxes');
    if (!container) return;
    const lista = categoriasData || [];
    const dataOrdenada = [...lista].sort((a, b) => a.name.localeCompare(b.name));
    
    container.innerHTML = dataOrdenada.map(cat => `
        <label class="checkbox-item">
            <input type="checkbox" value="${cat.id}" class="cat-check">
            <span>${cat.name}</span>
        </label>
    `).join('');
}

function toggleModalCategorias() {
    const modal = document.getElementById('modal-cat-overlay');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
}

function confirmarSeleccionCategorias() {
    const checkboxes = document.querySelectorAll('.cat-check:checked');
    const botonTrigger = document.getElementById('btn-modal-cat-trigger');
    
    if (checkboxes.length > 0) {
        botonTrigger.innerText = `Categorías asociadas (${checkboxes.length}) ▾`;
        botonTrigger.style.borderColor = "#28a745";
    } else {
        botonTrigger.innerText = "Asociar a Categorías";
        botonTrigger.style.borderColor = "#444";
    }
    toggleModalCategorias();
}

async function cargarChecksEspecificaciones() {
    const contenedor = document.getElementById('lista-checks-specs');
    if (!contenedor) return;

    contenedor.innerHTML = "<p class='text-info'>Cargando especificaciones...</p>";
    
    try {
        let grupos = coCategoryGroupsData;
        
        if (!grupos || grupos.length === 0) {
            const res = await fetch(`${API_COCAT_GROUPS}/all`); // AGREGAMOS EL /all
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
        console.error("Error al armar el modal de specs:", error);
        contenedor.innerHTML = "<p class='text-danger'>Error: " + error.message + "</p>";
    }
}


function eliminarProducto(id) {
    if(confirm("¿Borrar?")) fetch(`${API_PRODUCTS}/delete/${id}`, { method: 'DELETE' }).then(() => cargarProductos());
}

function crearUsuarioDesdeAdmin() {
    const user = document.getElementById('new-username').value;
    const pass = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (!user || !pass) {
        alert("Por favor, completa usuario y contraseña.");
        return;
    }

    const params = new URLSearchParams();
    params.append('username', user);
    params.append('password', pass);
    params.append('role', role);

    fetch('/api/usuarios/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(res => {
        if (res.ok) {
            alert("Usuario creado con éxito");
            document.getElementById('new-username').value = "";
            document.getElementById('new-password').value = "";
        } else {
            alert("Error al crear el usuario. Quizás ya existe.");
        }
    });
}

function cargarUsuarios() {
    fetch('/api/usuarios/listar') 
        .then(res => {
            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            return res.text();
        })
        .then(texto => {
            return texto ? JSON.parse(texto) : [];
        })
        .then(usuarios => {
            const tabla = document.getElementById('tabla-usuarios-body');
            if (!tabla) return;
            
            tabla.innerHTML = ""; 
            if (usuarios.length === 0) {
                tabla.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No tienes permisos o no hay usuarios.</td></tr>";
                return;
            }

            usuarios.forEach(u => {
                tabla.innerHTML += `
                    <tr style="border-bottom: 1px solid #444;">
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td>${u.password}</td> 
                        <td><span class="badge">${u.role}</span></td>
                        <td>
                            <button onclick="prepararEdicionUsuario(${u.id}, '${u.username}')" style="color:#ff9800; cursor:pointer; background:none; border:1px solid #ff9800; border-radius:4px; padding:2px 5px; margin-right:5px;">✏️ Editar</button>
                            <button onclick="eliminarUsuario(${u.id})" style="color:#ff5252; cursor:pointer; background:none; border:none;">🗑️ Borrar</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(err => console.error("Error cargando usuarios:", err));
}

function prepararEdicionUsuario(id, nombreActual) {
    const nuevoNombre = prompt("Nuevo nombre de usuario:", nombreActual);
    const nuevaClave = prompt("Nueva contraseña:");

    if (nuevoNombre && nuevaClave) {
        const params = new URLSearchParams();
        params.append('id', id);
        params.append('username', nuevoNombre);
        params.append('password', nuevaClave);

        fetch('/api/usuarios/editar-desde-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        }).then(res => {
            if (res.ok) {
                alert("Usuario actualizado");
                cargarUsuarios();
            }
        });
    }
}

function eliminarUsuario(id) {
    if (confirm("¿Estás seguro de que querés eliminar a este usuario?")) {
        fetch(`/api/usuarios/eliminar/${id}`, {
            method: 'POST'
        })
        .then(res => {
            if (res.ok) {
                alert("Usuario eliminado con éxito");
                cargarUsuarios();
            } else {
                alert("No tenés permisos para hacer esto");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("No se pudo eliminar el usuario");
        });
    }
}

function mostrarSeccion(seccion) {
    if (seccion === 'usuarios') {
        document.getElementById('seccion-usuarios').style.display = 'block';
        document.getElementById('seccion-productos').style.display = 'none';
        cargarUsuarios();
    } else {
        document.getElementById('seccion-usuarios').style.display = 'none';
        document.getElementById('seccion-productos').style.display = 'block';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('oculto');
    
    const btn = document.querySelector('.btn-colapsar');
    if(sidebar.classList.contains('oculto')) {
        btn.innerHTML = "☰";
    } else {
        btn.innerHTML = "✕";
    }
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

document.addEventListener('click', () => {
    const menu = document.querySelector('.menu-categorias-extra');
    if (menu) menu.remove();
});

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
    if (!selectPadre) {
        console.error("No se encontró el elemento cat-parent en el HTML");
        return;
    }

    try {
        console.log("Intentando cargar categorías desde el servidor...");
        const res = await fetch(`${API_CATEGORIES}/list`);
        const data = await res.json();
        
        categoriasData = data; 
        console.log("Categorías recibidas:", data);

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
        console.log("Buscando datos completos para la categoría ID:", idSeleccionado);
        const res = await fetch(`${API_CATEGORIES}/${idSeleccionado}`);
        if (!res.ok) throw new Error("No se pudo obtener el detalle de la categoría");
        
        const catCompleta = await res.json();
        console.log("Datos recibidos del DTO:", catCompleta);        
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
        console.log("Grupos de co-categorías a tildar:", gruposAsociados);
        
        if (gruposAsociados.length > 0) {
            gruposAsociados.forEach(grupo => {
                const cb = document.querySelector(`.co-cat-check[value="${grupo.id}"]`);
                if (cb) {
                    cb.checked = true;
                    console.log(`¡Check tildado con éxito para!: ${grupo.name}`);
                } else {
                    console.warn(`No se encontró el checkbox físico para el grupo ID: ${grupo.id}`);
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar co-categorías para editar:", error);
    }
}

function cancelarEdicionCat() {
    editandoCatId = null;
    document.getElementById('new-category-name').value = "";
    document.getElementById('cat-parent').value = "";
    document.getElementById('titulo-form-cat').innerText = "Crear Nueva Categoría";
    document.getElementById('titulo-form-cat').style.color = "#aaa";
    document.getElementById('btn-cancelar-cat').style.display = "none";
    actualizarBotones();
    document.querySelectorAll('.co-cat-check').forEach(cb => cb.checked = false);
}

async function guardarCategoria() {
    const nombre = document.getElementById('new-category-name').value.trim();
    const padreId = document.getElementById('cat-parent').value;

    if (!nombre) { alert("Poné un nombre"); return; }

    const payload = {
        name: nombre,
        parent: (padreId && padreId !== "") ? { id: parseInt(padreId) } : null
    };

    try {
        const url = editandoCatId ? `${API_CATEGORIES}/update/${editandoCatId}` : `${API_CATEGORIES}/add`;
        const metodo = editandoCatId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

    if (res.ok) {
        alert("¡Categoría guardada!"); // Ya no intentamos procesar la respuesta como objeto
        cancelarEdicionCat();
        await cargarSelectCategorias(); 
    } else {
        const errorText = await res.text();
        console.error("Error detallado:", errorText);
        alert("Error 500: Revisa la consola del servidor (IntelliJ)");
    }
    } catch (e) {
        console.error("Error de conexión:", e);
    }
}

function eliminarCategoriaSeleccionada() {
    const select = document.getElementById('cat-parent');
    const id = select.value;
    const nombre = select.options[select.selectedIndex].text;

    if (!id) {
        alert("Por favor, selecciona una categoría para eliminar.");
        return;
    }

    if (confirm(`¿Estás seguro de eliminar "${nombre}"?\n\n- Las subcategorías subirán de nivel.\n- Los productos se reasignarán al padre.`)) {
        
        fetch(`${API_BASE}/categories/delete/${id}`, {
            method: 'DELETE'
        })
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
            console.error('Error:', error);
            alert("No se pudo eliminar la categoría. Revisa la consola.");
        });
    }
}

function mostrarTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    if(tabId === 'tab-cocategoria') { 
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

function activarModoEdicionCoCatGroup() {
    const titulo = document.getElementById('cocat-group-form-title');
    if (titulo) {
        titulo.innerText = "✏️ Editando Grupo de Co-Categoría";
        titulo.style.color = "#ff9800";
    }

    const selectorArea = document.getElementById('cocat-view-select');
    const selector = document.getElementById('cocat-selector');

    if (selectorArea && selector) {
        selectorArea.style.display = 'block';
        selector.innerHTML = '<option value="">-- Seleccionar para editar --</option>';
        
        coCategoryGroupsData.forEach(group => {
            const opt = document.createElement('option');
            opt.value = group.id;
            opt.textContent = group.name;
            selector.appendChild(opt);
        });
    }

    const btnModoEditar = document.getElementById('btn-modo-editar-cocat');
    const btnCancelar = document.getElementById('btn-cancelar-cocat');
    const btnEliminar = document.getElementById('btn-eliminar-cocat');

    if (btnModoEditar) btnModoEditar.style.display = 'none';
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
    if (btnEliminar) btnEliminar.style.display = 'inline-block';
    const inputNombre = document.getElementById('new-cocat-group-name');
    if (inputNombre) inputNombre.value = "";

    console.log("Modo edición de Grupos activado y selector cargado.");
}

function toggleAsociadorCategorias() {
    const box = document.getElementById('contenedor-asociar-cat');
    box.style.display = (box.style.display === 'none') ? 'block' : 'none';
}

function resetFormCoCatGroup() {
    editingCoCatGroupId = null;
    
    const inputNombre = document.getElementById('new-cocat-group-name');
    if (inputNombre) inputNombre.value = ""; 
    
    document.querySelectorAll('.cat-check').forEach(cb => cb.checked = false);
    
    const selectorArea = document.getElementById('cocat-view-select');
    if (selectorArea) selectorArea.style.display = 'none';
    
    document.getElementById('btn-modo-editar-cocat').style.display = 'inline-block';
    document.getElementById('btn-eliminar-cocat').style.display = 'none';
    document.getElementById('btn-cancelar-cocat').style.display = 'none';
    
    const titulo = document.getElementById('cocat-group-form-title');
    if (titulo) {
        titulo.innerText = "Nueva Propiedad";
        titulo.style.color = "#aaa";
    }
}

async function cargarCoCategoryGroup() {
    try {
        const res = await fetch(`${API_CO_CAT_GROUP}/all`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        
        const data = await res.json();
        coCategoryGroupsData = data;
        console.log("Co-Category Groups cargados:", coCategoryGroupsData);
    } catch (e) {
        console.error("Falla en la carga de Grupos:", e.message);
        coCategoryGroupsData = [];
    }
}

async function cargarCheckboxesCoCategoryGroup() {
    const container = document.getElementById('co-cat-checkboxes');
    if (!container) return;
    const lista = coCategoryGroupsData || [];
    const dataOrdenada = [...lista].sort((a, b) => a.name.localeCompare(b.name));
    container.innerHTML = dataOrdenada.map(cocat => `
        <label class="checkbox-item" style="display: flex; align-items: center; gap: 8px; color: #ccc; cursor: pointer;">
            <input type="checkbox" value="${cocat.id}" class="co-cat-check"> ${cocat.name}
        </label>
    `).join('');
}

function toggleDropdownPropiedades() {
    const panel = document.getElementById('dropdown-panel-prop');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
}

function confirmarSeleccionPropiedades() {
    const checkboxes = document.querySelectorAll('.co-cat-check:checked');
    const botonTrigger = document.getElementById('btn-dropdown-prop');
    if (checkboxes.length > 0) {
        botonTrigger.innerText = `Propiedades seleccionadas (${checkboxes.length}) ▾`;
        botonTrigger.style.borderColor = "#28a745";
    } else {
        botonTrigger.innerText = "Seleccionar Propiedades ▾";
        botonTrigger.style.borderColor = "#444";
    }
    toggleDropdownPropiedades();
}

async function guardarCoCategoryGroup() {
    const inputNombre = document.getElementById('new-cocat-group-name');
    const nombre = inputNombre ? inputNombre.value.trim() : "";
    const checksMarcados = document.querySelectorAll('.cat-check:checked');
    const categoriasIds = Array.from(checksMarcados).map(cb => parseInt(cb.value));

    if (!nombre) {
        alert("El nombre es obligatorio");
        return;
    }

    const payload = {
        name: nombre,
        type: "TEXT", 
        categoryIds: categoriasIds
    };

    const url = editingCoCatGroupId 
        ? `/api/co-category-group/update/${editingCoCatGroupId}` 
        : `/api/co-category-group/add`;
    
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
                console.log("Forzando IDs en la variable local para no perder los tildes...");
                grupoServidor.categoryIds = categoriasIds;
            }

            alert(editingCoCatGroupId ? "Actualizado con éxito" : "Creado con éxito");            
            await cargarCoCategoryGroup(); 
            
            const index = coCategoryGroupsData.findIndex(g => g.id === grupoServidor.id);
            if (index !== -1) {
                coCategoryGroupsData[index] = grupoServidor;
            }
            editingCoCatGroupId = null; 
            document.getElementById('new-cocat-group-name').value = "";
            document.querySelectorAll('.cat-check').forEach(cb => cb.checked = false);
            const selector = document.getElementById('cocat-selector');
            if (selector) selector.value = "";

        } else {
            const errorText = await res.text();
            console.error("Error del servidor:", errorText);
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
    
    const contenedorAsociacion = document.getElementById('contenedor-asociar-cat');
    if (contenedorAsociacion) {
        contenedorAsociacion.style.display = 'block';
    }

    const todosLosChecks = document.querySelectorAll('.cat-check');
    todosLosChecks.forEach(cb => cb.checked = false);
    console.log("IDs que vienen del DTO para tildar:", group.categoryIds);

    if (group.categoryIds && group.categoryIds.length > 0) {
        group.categoryIds.forEach(idAsociado => {
            const cb = document.querySelector(`.cat-check[value="${idAsociado}"]`);
            if (cb) {
                cb.checked = true;
                console.log(`Check tildado para ID: ${idAsociado}`);
            } else {
                console.warn(`No se encontró el checkbox para el ID: ${idAsociado}`);
            }
        });
    }
}

async function eliminarCoCategoryGroup() {
    const id = document.getElementById('cocat-selector').value;
    if (!id) {
        alert("Seleccioná un grupo para borrar.");
        return;
    }

    if (confirm(`¿Estás seguro de que querés eliminar este grupo?`)) {
        try {
            const res = await fetch(`${API_CO_CAT_GROUP}/delete/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("Eliminado correctamente.");
                resetFormCoCatGroup();
                await cargarCoCategoryGroup();
            } else {
                alert("No se pudo eliminar.");
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }
}


const todasLasCategorias = /*[[${categoriasPadre}]]*/ [];

async function guardarTodo() {
    const filas = document.querySelectorAll("#cuerpo-carga tr");
    
    if (filas.length === 0) {
        alert("No hay filas para guardar.");
        return;
    }

    for (let [index, fila] of filas.entries()) {
        const formData = new FormData();
        const nombre = fila.querySelector(".in-nombre")?.value || "";
        const precio = fila.querySelector(".in-precio")?.value || "0";
        const stock = fila.querySelector(".in-stock")?.value || "0";
        const desc = fila.querySelector(".in-descripcion")?.value || ""; 
        
        formData.append("title", nombre);
        formData.append("price", precio);
        formData.append("stock", stock);
        formData.append("description", desc);
        
        const checks = fila.querySelectorAll(".cat-check:checked");
        if (checks.length === 0) {
            console.error(`Fila ${index + 1}: No tiene categorías seleccionadas.`);
            alert(`Error en fila ${index + 1}: Seleccioná al menos una categoría.`);
            continue;
        }        
        checks.forEach(cb => {
            formData.append("category", cb.value);
        });

        const filaId = fila.getAttribute("data-id") || index; 
        if (valoresSeleccionadosPorFila[filaId]) {
            valoresSeleccionadosPorFila[filaId].forEach(valId => {
                formData.append("propertyValues", valId); 
            });
        }

        const inputFotos = fila.querySelector(".in-fotos");
        if (inputFotos && inputFotos.files.length > 0) {
            for (let i = 0; i < inputFotos.files.length; i++) {
                formData.append("images", inputFotos.files[i]);
            }
        }

        try {
            const resp = await fetch(`${API_BASE}/products/nuevo-producto`, { 
                method: "POST",
                body: formData
            });

            if (resp.ok) {
                console.log(`✅ Fila ${index + 1} guardada: ${nombre}`);
                fila.style.backgroundColor = "#1b4332"; 
                fila.querySelectorAll("input, button").forEach(el => el.disabled = true);
            } else {
                const errorData = await resp.text();
                console.error(`❌ Error en Fila ${index + 1}:`, errorData);
                alert(`Error en fila ${index + 1}: ${errorData || "Revisá los campos obligatorios."}`);
            }
        } catch (err) {
            console.error("Error de red:", err);
            alert("Error de conexión al servidor.");
        }
    }
}

function agregarFila() {
    const tbody = document.getElementById("cuerpo-carga");
    const categorias = categoriasData || []; 

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" class="in-nombre" placeholder="Título"></td>
        <td><input type="number" class="in-precio" placeholder="0.00" style="width:80px"></td>
        <td><input type="number" class="in-stock" placeholder="10" style="width:60px"></td>        
        <td>
            <button type="button" onclick="toggleCats(this)" style="padding: 5px 10px; cursor:pointer;">Editar Desc. 📝</button>
            <div class="panel-desc" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background: white; border: 3px solid #444; z-index: 10001; padding: 25px; width: 90%; max-width: 600px; box-shadow: 0px 0px 50px rgba(0,0,0,0.8); border-radius: 12px;">
                <h4 style="color: black; margin-top: 0;">Descripción del Producto</h4>
                <textarea class="in-descripcion" style="width: 100%; height: 300px; padding: 10px; font-family: sans-serif; font-size: 14px; border: 1px solid #ccc; border-radius: 5px; resize: none;" placeholder="Escribí aquí la descripción..."></textarea>
                <button type="button" onclick="this.parentElement.style.display='none'" style="width: 100%; background: #007bff; color: white; border: none; padding: 12px; margin-top: 15px; cursor: pointer; border-radius: 6px; font-weight: bold;">ACEPTAR</button>
            </div>
        </td>

        <td>
            <button type="button" onclick="toggleCats(this)" style="padding: 5px 10px; cursor:pointer;">Categorías ▼</button>
            <div class="lista-desplegable" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background: white; border: 3px solid #444; z-index: 10000; padding: 25px; width: 80%; max-width: 500px; box-shadow: 0px 0px 50px rgba(0,0,0,0.8); border-radius: 12px;">
                <h4 style="color: black; margin-top: 0;">Seleccionar Categorías</h4>
                <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${categorias.map(cat => `
                        <label style="display:flex; align-items:center; color: #000; font-size: 14px; cursor: pointer; background: #f9f9f9; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="checkbox" value="${cat.id}" class="cat-check" style="margin-right: 10px; width: 18px; height: 18px;"> 
                            ${cat.name} 
                        </label>
                    `).join('')}
                </div>
                <button type="button" onclick="this.parentElement.style.display='none'" style="width: 100%; background: #28a745; color: white; border: none; padding: 12px; cursor: pointer; border-radius: 6px; font-weight: bold;">ACEPTAR</button>
            </div>
        </td>

        <td><input type="file" class="in-fotos" multiple></td>
        <td><button type="button" onclick="this.closest('tr').remove()" style="background:none; border:none; cursor:pointer; font-size:20px;">❌</button></td>
    `;
    tbody.appendChild(tr);
}

function toggleCats(btn) {
    const lista = btn.nextElementSibling;
    if (lista) {
        if (lista.style.display === "none" || lista.style.display === "") {
            lista.style.display = "block";
        } else {
            lista.style.display = "none";
        }
    }
}

function cancelarEdicion(id) {
    const fila = document.getElementById(`fila-${id}`);
    fila.querySelectorAll('.view-mode').forEach(el => el.classList.remove('d-none'));
    fila.querySelectorAll('.edit-mode').forEach(el => el.classList.add('d-none'));
}

function abrirModalDesc(btn) {
    const panel = btn.parentElement.querySelector('.panel-desc');
    panel.style.display = 'block';
}

function toggleVisibilidad(id) {
    fetch(`api/products/${id}/toggle-visible`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (res.ok) {
            console.log(`Estado del producto ${id} cambiado.`);
            cargarProductos();
        } else {
            alert("Error al cambiar la visibilidad");
        }
    })
    .catch(err => console.error("Error:", err));
}

function manejadorClickFila(event, id) {
    const fila = document.getElementById(`fila-${id}`);
    if (!fila) return; // Seguridad: si no hay fila, no hacemos nada

    const editMode = fila.querySelector('.edit-mode');
    if (editMode && editMode.classList.contains('d-none')) {
        irADetalle(id);
    }
}

let resizeTimer;
window.onresize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (categoriasData && categoriasData.length > 0) {
            // Solo redibujamos las principales
            const principales = categoriasData.filter(c => !c.parent);
            renderizarNivel(0, principales);
        }
    }, 250); // Espera un cuarto de segundo después de que dejes de mover la ventana
};

async function alternarDestacado(id) {
    const boton = event.target.closest('button');
    const yaEsDestacado = boton.classList.contains("is-featured");
    const nuevoEstado = !yaEsDestacado;

    boton.innerHTML = "⏳";

    try {
        const res = await fetch(`${API_PRODUCTS}/${id}/destacar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featured: nuevoEstado })
        });

        if (res.ok) {
            boton.innerHTML = nuevoEstado ? "⭐" : "☆";
            if (nuevoEstado) {
                boton.classList.add("is-featured");
                alert("¡El Producto es Destacado!");
            } else {
                boton.classList.remove("is-featured");
                alert("¡El Producto dejó de ser Destacado!");
            }

            const p = productosCargados.find(prod => (prod.id || prod.id_producto) === id);
            if (p) p.featured = nuevoEstado;

        } else {
            throw new Error("Error en el servidor");
        }
    } catch (err) {
        console.error("Error:", err);
        boton.innerHTML = yaEsDestacado ? "⭐" : "☆";
        alert("No se pudo actualizar el estado del producto.");
    }
}

async function guardarEdicionRapida(id) {
    const fila = document.getElementById(`fila-${id}`);
    
    const data = {
        title: fila.querySelector('.in-title').value,
        price: parseFloat(fila.querySelector('.in-price').value),
        stock: parseInt(fila.querySelector('.in-stock').value)
    };

    try {
        const res = await fetch(`${API_PRODUCTS}/actualizar-rapido/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            await cargarProductos(); 
        } else {
            alert("Error al guardar cambios de texto.");
        }
    } catch (err) {
        console.error(err);
    }
}

async function procesarCargaMasiva(input) {
    const archivo = input.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = async (e) => {
        const contenido = e.target.result;
        const filas = contenido.split(/\r?\n/); // Divide por saltos de línea (Windows/Linux)
        let exitos = 0;
        let errores = 0;

        for (let fila of filas) {
            if (fila.trim() === "") continue;

            try {
                // Formato: titulo;precio;stock;descripcion;[cat1,cat2]
                const partes = fila.split(';');
                if (partes.length < 5) continue;

                const titulo = partes[0].trim();
                const precio = parseFloat(partes[1].trim());
                const stock = parseInt(partes[2].trim());
                const descripcion = partes[3].trim();
                const catsRaw = partes[4].replace('[', '').replace(']', '').trim();
                const nombresCategorias = catsRaw.split(',').map(c => c.trim());
                const nuevoProducto = {
                    title: titulo,
                    price: precio,
                    stock: stock,
                    description: descripcion,
                    categoryNames: nombresCategorias // Tu backend debe recibir esto
                };

                const response = await fetch(`${API_BASE}/products/create-masivo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoProducto)
                });

                if (response.ok) exitos++;
                else errores++;

            } catch (err) {
                console.error("Error en fila:", fila, err);
                errores++;
            }
        }
        alert(`Carga finalizada.\nÉxitos: ${exitos}\nErrores: ${errores}`);
        location.reload();
    };
    lector.readAsText(archivo);
}

async function borrarTodasLasFotos(id) {
    if (!confirm("⚠️ ¿Estás seguro de borrar TODAS las fotos de este producto?")) return;

    try {
        const resp = await fetch(`${API_BASE}/products/${id}/images/all`, { 
            method: "DELETE" 
        });

        if (resp.ok) {
            alert("🗑️ Se han borrado todas las fotos.");
            cargarProductos();
        } else {
            alert("Hubo un drama en el servidor al intentar borrar.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

function agregarFotos(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';

    input.onchange = async () => {
        const archivos = input.files;
        if (archivos.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < archivos.length; i++) {
            formData.append("images", archivos[i]); 
        }

        try {
            const resp = await fetch(`${API_BASE}/products/${id}/add-images`, { 
                method: "POST",
                body: formData
            });

            if (resp.ok) {
                alert("✅ ¡Fotos agregadas con éxito!");
                cargarProductos();
            } else {
                alert("❌ Error al subir fotos: " + await resp.text());
            }
        } catch (err) {
            console.error("Error de red:", err);
            alert("Error de conexión al servidor.");
        }
    };
    input.click();
}

async function abrirModalValores() {
    if (!editingCoCatGroupId) {
        alert("Primero seleccioná o guardá un Grupo para asignarle valores.");
        return;
    }
    const grupo = coCategoryGroupsData.find(g => g.id == editingCoCatGroupId);
    document.getElementById('nombre-grupo-titulo').innerText = grupo.name;

    if (!modalValoresBootstrap) {
        modalValoresBootstrap = new bootstrap.Modal(document.getElementById('modalValores'));
    }

    await refrescarListaValoresModal();
    modalValoresBootstrap.show();
}

async function refrescarListaValoresModal() {
    const contenedor = document.getElementById('contenedor-checks-valores');
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
        console.error("Error:", e);
    }
}

async function crearValorDesdeModal() {
    const input = document.getElementById('input-nuevo-valor');
    const texto = input.value.trim();

    if (!texto) return;

    const payload = {
        value: texto,
        coCategoryGroupId: editingCoCatGroupId
    };

    const res = await fetch('/api/property-values/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        input.value = "";
        await refrescarListaValoresModal();
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

function guardarCambiosValores() {
    modalValoresBootstrap.hide();
    alert("Valores actualizados correctamente.");
}

async function verificarCascadaAtributos(categoriaId, filaId) {
    filaActualId = filaId;
    if (!valoresSeleccionadosPorFila[filaId]) {
        valoresSeleccionadosPorFila[filaId] = new Set();
    }

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

async function actualizarEspecificacionesPorCategorias(arrayCategoriasIds) {
    const contenedorSpecs = document.getElementById('seccion-edit-especificaciones');
    if (!arrayCategoriasIds || arrayCategoriasIds.length === 0) {
        contenedorSpecs.innerHTML = "<p class='text-muted small'>Seleccioná una categoría para ver sus especificaciones disponibles.</p>";
        return;
    }

    contenedorSpecs.innerHTML = "Actualizando especificaciones...";

    try {
        let gruposMapeados = [];
        for (let catId of arrayCategoriasIds) {
            const resp = await fetch(`${API_BASE}/categories/${catId}`);
            if (resp.ok) {
                const categoria = await resp.json();
                if (categoria.coCategoriesGroup) {
                    gruposMapeados.push(...categoria.coCategoriesGroup);
                }
            }
        }

        const gruposUnicos = Array.from(new Map(gruposMapeados.map(g => [g.id, g])).values());
        if (gruposUnicos.length === 0) {
            contenedorSpecs.innerHTML = "<p class='text-muted small'>Las categorías seleccionadas no requieren especificaciones técnicas.</p>";
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
        console.error("Error al actualizar la cascada de especificaciones:", error);
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
    actualizarEspecificacionesPorCategorias(catsActivas);
}