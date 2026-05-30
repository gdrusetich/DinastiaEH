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
                            onclick="event.stopPropagation(); alternarDestacado(event, ${id})"
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

function irADetalle(id) {
    window.location.href = `/detalle?id=${id}`;
}

async function editarFila(id) {
    const idLimpio = parseInt(id);
    const urlBusqueda = `${API_PRODUCTS}/find-id/${idLimpio}`;    
    console.log("🚀 Iniciando edición del producto:", idLimpio);
    try {
        const resp = await fetch(urlBusqueda);
        if (!resp.ok) throw new Error(`Error al buscar producto: ${resp.status}`);
        
        const p = await resp.json();
        productoEnEdicion = p;
        document.getElementById('edit-prod-id').innerText = `#${idLimpio}`;
        document.getElementById('edit-prod-title').value = p.title || "";
        document.getElementById('edit-prod-price').value = p.price || 0;
        document.getElementById('edit-prod-stock').value = p.stock || 0;
        
        const imgElement = document.getElementById('edit-prod-img');
        if (imgElement) {
            let urlImg = (p.mainImage?.url) ? p.mainImage.url : (p.images?.[0]?.url || "");
            imgElement.src = urlImg ? obtenerUrlFinal(urlImg) : '';
        }

        const secCat = document.getElementById('seccion-edit-categorias');
        const secSpec = document.getElementById('seccion-edit-especificaciones');
        if (secCat) secCat.classList.add('d-none');
        if (secSpec) secSpec.classList.add('d-none');

        llenarChecksCategoriasModal(); 
        const categoriasIds = p.categories ? p.categories.map(cat => cat.id || cat.idCategory) : [];
        
        await renderizarEspecificacionesEnModal(categoriasIds);

        if (secCat) secCat.classList.remove('d-none');
        if (secSpec) secSpec.classList.remove('d-none');

        const modalElement = document.getElementById('modalEditarProducto');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstance.show();
        }

    } catch (err) {
        console.error("❌ Error en flujo de edición:", err);
        alert("No se pudo cargar el editor. Por favor, intenta de nuevo.");
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

async function alternarDestacado(event, id) {
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

function abrirModalDesc(btn) {
    const panel = btn.parentElement.querySelector('.panel-desc');
    panel.style.display = 'block';
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

function toggleSeccionEdicion(tipo) {
    const divCat = document.getElementById('seccion-edit-categorias');
    const divSpec = document.getElementById('seccion-edit-especificaciones');

    if (tipo === 'categorias') {
        divCat.classList.toggle('d-none');
        divSpec.classList.add('d-none');
        if (!divCat.classList.contains('d-none')) llenarChecksCategoriasModal(); 
    } else {
        divSpec.classList.toggle('d-none');
        divCat.classList.add('d-none');
        if (!divSpec.classList.contains('d-none')) cargarChecksEspecificaciones();
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

function eliminarProducto(id) {
    if(confirm("¿Seguro que desea borrar este producto?")) {
        fetch(`${API_PRODUCTS}/delete/${id}`, { method: 'DELETE' }).then(() => cargarProductos());
    }
}

function toggleModalProdCat() {
    const overlay = document.getElementById('modal-prod-cat-overlay');
    overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if(overlay.style.display === 'flex') cargarCategoriasEnProducto();
}

function toggleModalProdSpecs() {
    const overlay = document.getElementById('modal-prod-specs-overlay');
    overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if(overlay.style.display === 'flex') cargarSpecsEnProducto();
}

function cerrarModalProdCat() {
    toggleModalProdCat();
}

function cerrarModalProdSpecs() {
    toggleModalProdSpecs();
}

function togglePanel(idPanel) {
    const panel = document.getElementById(idPanel);
    if (!panel) {
        console.error(`Panel ${idPanel} no encontrado`);
        return;
    }
    
    // Cambiamos el display directamente
    const esVisible = panel.style.display === 'block';
    panel.style.display = esVisible ? 'none' : 'block';
    
    // Si lo estamos abriendo, podemos disparar la carga de datos
    if (!esVisible) {
        if (idPanel === 'seccion-edit-categorias') {
            llenarChecksCategoriasModal();
        } else if (idPanel === 'panel-especificaciones-flotante') {
            // Asumiendo que esta es tu función de carga de specs
            const catIds = productoEnEdicion.categories.map(c => c.id || c.idCategory);
            renderizarEspecificacionesEnModal(catIds);
        }
    }
}