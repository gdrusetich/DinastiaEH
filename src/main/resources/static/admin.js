let editandoId = null;
let productosCargados = [];

let editandoCatId = null;
let categoriasData = [];
let categoriaActualId = null;
let idsHijasActuales = [];

document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando Dashboard...");
    inicializarApp();
});

async function inicializarApp() {
     await Promise.all([
        cargarProductos(),
        cargarCategoriasSelector(),  // Crea los botones de niveles (Nivel 0)
        cargarSelectCategorias()
    ]);

}

function ejecutarFiltroFinal() {
    const texto = document.getElementById('busquedaAdmin').value.toLowerCase();
    const idFiltro = document.getElementById('categoriaIdInput').value;
    
    const inputFecha = document.getElementById('filtroFecha'); 
    const fechaCorte = inputFecha ? inputFecha.value : ""; // Formato YYYY-MM-DD

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

        if (idsPermitidos.length === 0) return true;
        if (Array.isArray(p.categories)) {
            return p.categories.some(cat => idsPermitidos.includes(Number(cat.id)));
        }        
        
        if (p.category) {
            const idCatProducto = p.category.id || p.category;
            return idsPermitidos.includes(Number(idCatProducto));
        }
        
        return false;
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
        const btnColor = p.oculto ? '#e67e22' : '#6f42c1'; 
        const btnTexto = p.oculto ? '👁️ Mostrar' : '🙈 Ocultar';
        const esDestacado = (p.featured === true || p.isFeatured === true);
        const estrellaIcono = esDestacado ? "⭐" : "☆";
        const estrellaClase = esDestacado ? "is-featured" : "";

        let nombreImagenBase = (p.mainImage && p.mainImage.url) 
            ? p.mainImage.url 
            : (p.images && p.images.length > 0 ? (p.images[0].url || p.images[0]) : null);
        let rtaImagen = obtenerUrlFinal(nombreImagenBase);

        htmlFinal += `
        <tr id="fila-${id}" onclick="manejadorClickFila(event, ${id})" style="cursor: pointer;" class="fila-producto">
            <td>${id}</td>
            <td>
                <img src="${rtaImagen}" alt="${p.title}" 
                     style="width: 120px; height: 80px; object-fit: contain;"
                     onerror="this.src='${rutaDefault}';">
            </td>
            
            <td>
                <span class="view-mode"><strong>${p.title}</strong></span>
                <input type="text" class="edit-mode d-none form-control in-title" value="${p.title}" onclick="event.stopPropagation()">
            </td>
            
            <td>
                <span class="view-mode">$${p.price ? p.price.toLocaleString('es-AR') : '0'}</span>
                <span class="edit-mode d-none" onclick="event.stopPropagation()">
                    $ <input type="number" class="in-price" value="${p.price}" style="width: 80px;">
                </span>
            </td>
            
            <td>
                <span class="view-mode">${p.stock}</span>
                <input type="number" class="edit-mode d-none in-stock" value="${p.stock}" style="width: 60px;" onclick="event.stopPropagation()">
            </td>

            <td style="min-width: 230px;">
                <button class="view-mode btn-tabla" style="background:#007bff; color:white;" onclick="event.stopPropagation(); editarFila(${id})">Editar</button>
                <button class="view-mode btn-tabla" style="background: ${btnColor}; color:white;" onclick="event.stopPropagation(); toggleVisibilidad(${id})"> ${btnTexto} </button>
                
                <button class="view-mode btn-destacado ${estrellaClase}" 
                        onclick="event.stopPropagation(); alternarDestacado(${id})" 
                        title="Destacar en Home"> ${estrellaIcono} </button>
                
                <button class="view-mode btn-tabla" style="background:#dc3545; color:white;" onclick="event.stopPropagation(); eliminarProducto(${id})">Borrar</button>

                <button class="edit-mode d-none btn-tabla" style="background:#28a745; color:white;" onclick="event.stopPropagation(); guardarEdicionRapida(${id})">
                    💾 Guardar
                </button>
                <button class="edit-mode d-none btn-tabla" style="background:#6c757d; color:white;" onclick="event.stopPropagation(); cancelarEdicion(${id})">
                    ✖️
                </button>
            </td>
        </tr>`;
    });

    tabla.innerHTML = htmlFinal;
}

function irADetalle(id) {
    window.location.href = `/detalle?id=${id}`;
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

    fetch('/usuarios/guardar', {
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
    fetch('/usuarios/listar') 
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

        fetch('/usuarios/editar-desde-admin', {
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
        fetch(`/usuarios/eliminar/${id}`, {
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

function manejarSeleccion(id, nombre, nivelActual, btn) {
    categoriaActualId = id;

    document.getElementById('categoriaIdInput').value = id;
    document.getElementById('nombre-seleccionada').innerText = nombre;

    const catSeleccionada = categoriasData.find(c => c.id == id);
    const padreId = (catSeleccionada && catSeleccionada.parent) ? catSeleccionada.parent.id : null;

    const hermanos = categoriasData.filter(c => {
        if (!padreId) return !c.parent; 
        return c.parent && c.parent.id == padreId;
    });

    renderizarNivel(nivelActual, hermanos);

    const subcats = categoriasData.filter(c => c.parent && Number(c.parent.id) === Number(id));
    if (subcats.length > 0) {
        renderizarNivel(nivelActual + 1, subcats);
    } else {
        const contenedorPadre = document.getElementById('niveles-categorias');
        Array.from(contenedorPadre.children).forEach(child => {
            const nivelDelChild = parseInt(child.id.split('-')[1]);
            if (nivelDelChild > nivelActual) child.remove();
        });
    }

    if (typeof ejecutarFiltroFinal === 'function') ejecutarFiltroFinal();
}

function renderizarNivel(nivel, lista) {
    const contenedorPadre = document.getElementById('niveles-categorias');
    if (!contenedorPadre) return;

    const existente = document.getElementById(`nivel-${nivel}`);
    if (existente) existente.remove();

    const divNivel = document.createElement('div');
    divNivel.id = `nivel-${nivel}`;
    divNivel.className = "nav-nivel";

    const LIMITE = window.innerWidth < 768 ? 4 : 7;

    let listaAMostrar = [...lista];
    if (categoriaActualId) {
        const index = listaAMostrar.findIndex(c => c.id == categoriaActualId);
        if (index > -1) {
            const [seleccionada] = listaAMostrar.splice(index, 1);
            listaAMostrar.unshift(seleccionada);
        }
    }

    const tieneMas = listaAMostrar.length > LIMITE;
    const principales = tieneMas ? listaAMostrar.slice(0, LIMITE) : listaAMostrar;
    const restantes = tieneMas ? listaAMostrar.slice(LIMITE) : [];

    principales.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "filter-btn";
        if (cat.id == categoriaActualId) btn.classList.add('active');
        btn.innerText = cat.name;
        btn.onclick = () => manejarSeleccion(cat.id, cat.name, nivel, btn);
        divNivel.appendChild(btn);
    });

    if (tieneMas) {
        const btnMas = document.createElement('button');
        btnMas.type = "button";
        btnMas.className = "filter-btn btn-mas";
        btnMas.innerText = `Más + (${restantes.length})`;
        
        btnMas.onclick = (e) => {
            e.stopPropagation();
            const existenteMenu = divNivel.querySelector('.menu-categorias-extra');
            if (existenteMenu) { existenteMenu.remove(); return; }

            const menuExtra = document.createElement('div');
            menuExtra.className = "menu-categorias-extra";

            restantes.forEach(cat => {
                const btnSub = document.createElement('button');
                btnSub.className = "filter-btn";
                btnSub.innerText = cat.name;
                btnSub.onclick = (ev) => {
                    ev.stopPropagation();
                    manejarSeleccion(cat.id, cat.name, nivel, btnSub);
                };
                menuExtra.appendChild(btnSub);
            });
            divNivel.appendChild(menuExtra);
        };
        divNivel.appendChild(btnMas);
    }

    contenedorPadre.appendChild(divNivel);
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
            renderizarNivel(0, principales);
        });
}

function manejarSeleccion(id, nombre, nivelActual, btn) {
    categoriaActualId = id;

    const filaActual = btn.parentElement;
    filaActual.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('categoriaIdInput').value = id;
    document.getElementById('nombre-seleccionada').innerText = nombre;

    const contenedorPadre = document.getElementById('niveles-categorias');
    Array.from(contenedorPadre.children).forEach(child => {
        const nivelDelChild = parseInt(child.id.split('-')[1]);
        if (nivelDelChild > nivelActual) child.remove();
    });

    const catSeleccionada = categoriasData.find(c => c.id == id);
    const padreId = (catSeleccionada && catSeleccionada.parent) ? catSeleccionada.parent.id : null;

    const hermanos = categoriasData.filter(c => {
        if (!padreId) return !c.parent; // Si es nivel 0 (sin padre)
        return c.parent && c.parent.id == padreId; // Si tienen el mismo padre
    });
    renderizarNivel(nivelActual, hermanos);
    const subcats = categoriasData.filter(c => c.parent && Number(c.parent.id) === Number(id));
    if (subcats.length > 0) {
        renderizarNivel(nivelActual + 1, subcats);
    }

    if (typeof ejecutarFiltroFinal === 'function') ejecutarFiltroFinal();
}

function limpiarFiltros() {
    document.getElementById('categoriaIdInput').value = '';
    document.getElementById('nombre-seleccionada').innerText = 'Ninguna';
    const contenedor = document.getElementById('niveles-categorias');
    contenedor.innerHTML = '';
    
    const principales = categoriasData.filter(c => !c.parent);
    renderizarNivel(0, principales);
    
    if (typeof ejecutarFiltroFinal === 'function') {
        ejecutarFiltroFinal();
    }
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

function prepararEdicionDesdeSelect() {
    const select = document.getElementById('cat-parent');
    const idSeleccionado = select.value;

    const cat = categoriasData.find(c => c.id == idSeleccionado);
    
    if (cat) {
        editandoCatId = cat.id;
        document.getElementById('new-category-name').value = cat.name;
        document.getElementById('titulo-form-cat').innerText = "Modificando Categoría";
        document.getElementById('titulo-form-cat').style.color = "#ffc107"; // Amarillo para avisar
        
        document.getElementById('btn-cancelar-cat').style.display = "block";
        document.getElementById('btn-preparar-edicion').style.display = "none"; // Ya estamos editando
        
        // El select ahora muestra el padre de la categoría que estamos editando
        select.value = cat.parent ? cat.parent.id : "";
        document.getElementById('new-category-name').focus();
    }
}

function cancelarEdicionCat() {
    editandoCatId = null;
    document.getElementById('new-category-name').value = "";
    document.getElementById('cat-parent').value = "";
    document.getElementById('titulo-form-cat').innerText = "Crear Nueva Categoría";
    document.getElementById('titulo-form-cat').style.color = "#aaa";
    document.getElementById('btn-cancelar-cat').style.display = "none";
    actualizarBotones(); // Resetea la visual de los botones
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
        
        fetch(`${API_URL}/categories/delete/${id}`, {
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

const todasLasCategorias = /*[[${categoriasPadre}]]*/ [];


async function guardarTodo() {
    const filas = document.querySelectorAll("#cuerpo-carga tr");
    
    if (filas.length === 0) {
        alert("No hay filas para guardar.");
        return;
    }

    for (let [index, fila] of filas.entries()) {
        const formData = new FormData();

        // Extraemos los datos buscando dentro de la fila actual
        const nombre = fila.querySelector(".in-nombre")?.value || "";
        const precio = fila.querySelector(".in-precio")?.value || "0";
        const stock = fila.querySelector(".in-stock")?.value || "0";
        // Buscamos el textarea del modal de esta fila
        const desc = fila.querySelector(".in-descripcion")?.value || ""; 
        
        formData.append("title", nombre);
        formData.append("price", precio);
        formData.append("stock", stock);
        formData.append("description", desc);

        // Categorías
        const checks = fila.querySelectorAll(".cat-check:checked");
        if (checks.length === 0) {
            console.error(`Fila ${index + 1}: No tiene categorías seleccionadas.`);
            alert(`Error en fila ${index + 1}: Seleccioná al menos una categoría.`);
            continue;
        }
        
        checks.forEach(cb => {
            // Asegurate que en Java recibas "category" (o "categories" si lo cambiaste)
            formData.append("category", cb.value);
        });

        const inputFotos = fila.querySelector(".in-fotos");
        if (inputFotos && inputFotos.files.length > 0) {
            for (let i = 0; i < inputFotos.files.length; i++) {
                formData.append("images", inputFotos.files[i]);
            }
        }

        try {
        const resp = await fetch(`${API_URL}/products/nuevo-producto`, { 
            method: "POST",
            body: formData
        });

            if (resp.ok) {
                console.log(`✅ Fila ${index + 1} guardada: ${nombre}`);
                // Usamos un color verde sutil para marcar éxito
                fila.style.backgroundColor = "#1b4332"; 
                // Opcional: deshabilitar los inputs para evitar doble carga
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

function editarFila(id) {
    const fila = document.getElementById(`fila-${id}`);
    const p = productosCargados.find(prod => prod.id === id);
    if (!p) return;

    fila.innerHTML = `
        <td>${p.id}</td>
        <td style="text-align: center;">
            <div style="font-size: 20px;" title="Modo Edición">⚙️</div>
        </td>
        <td>
            <input type="text" class="in-title" value="${p.title}">
        </td>
        <td>
            <div class="precio-edit-container">
                <span>$</span>
                <input type="number" class="in-price" value="${p.price}">
            </div>
        </td>
        <td>
            <input type="number" class="in-stock" value="${p.stock}" style="width: 60px;">
        </td>
        <td class="acciones-edit">
            <div class="contenedor-grilla-botones">
                <button class="btn-grid btn-guardar-check" onclick="guardarEdicionRapida(${id})">
                    💾 Guardar
                </button>
                <button class="btn-grid btn-cancelar-x" onclick="cargarProductos()">
                    ✕ Cancelar
                </button>

                <button class="btn-grid btn-foto-add" onclick="agregarFotos(${id})">
                    📷 Agregar Fotos
                </button>
                <button class="btn-grid btn-foto-delete" onclick="borrarTodasLasFotos(${id})">
                    🗑️ Borrar Fotos
                </button>
            </div>
        </td>
    `;
}

function toggleVisibilidad(id) {
    fetch(`/products/${id}/toggle-visible`, { 
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
    
    // Solo entramos al detalle si NO estamos en modo edición
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
    
    // Solo leemos lo que realmente está en los inputs de texto/número
    const data = {
        title: fila.querySelector('.in-title').value,
        price: parseFloat(fila.querySelector('.in-price').value),
        stock: parseInt(fila.querySelector('.in-stock').value)
        // QUITAMOS la línea de 'featured' de acá
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

                const response = await fetch(`${API_URL}/products/create-masivo`, {
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
        const resp = await fetch(`${API_URL}/products/${id}/images/all`, { 
            method: "DELETE" 
        });

        if (resp.ok) {
            alert("🗑️ Se han borrado todas las fotos.");
            cargarProductos(); // Refresca la tabla
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
        // IMPORTANTE: Chequeá si en Java el parámetro se llama "images" o "files"
        for (let i = 0; i < archivos.length; i++) {
            formData.append("images", archivos[i]); 
        }

        try {
            const resp = await fetch(`${API_URL}/products/${id}/add-images`, { 
                method: "POST",
                body: formData
            });

            if (resp.ok) {
                alert("✅ ¡Fotos agregadas con éxito!");
                cargarProductos(); // Recarga la tabla para ver los cambios
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