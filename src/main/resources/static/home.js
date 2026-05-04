window.seleccionarCategoria = seleccionarCategoria;
window.enviarWhatsApp = enviarWhatsApp;
window.pedirProductos = pedirProductos;

/* ==========================================
   CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================== */
let timerInterval;
let categoriasData = [];
let productosHome = [];
if (typeof userLogger === 'undefined') var userLogger = null;
const tooltip = document.getElementById('tooltip-descripcion');

document.addEventListener("DOMContentLoaded", () => {
    localStorage.removeItem("returnUrl");

    cargarCategorias();
    pedirProductos(`${API_URL}/products/list`);
    chequearTimerActivo();
    inicializarBuscadorCategorias('cat-search', 'categorias-nav');
    inicializarAccesoRapidoBusqueda();
    aplicarConfiguracionGlobal();

    ['productos-destacados-container', 'categorias-nav', 'subcategorias-nav', 'nietos-nav'].forEach(id => {
        configurarScrollArrastrable(id);
    });

    if (window.productosDestacadosIniciales) {
        renderizarDestacados(window.productosDestacadosIniciales);
        moverCinta(); 
    }
});

/* ==========================================
   GESTIÓN DE PRODUCTOS
   ========================================== */
    function pedirProductos(url) {
        fetch(url)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                if (Array.isArray(data)) {
                    productosHome = data;
                    aplicarFiltrosYOrden();
                }
            })
            .catch(err => {
                console.error("Error al pedir productos:", err);
                const div = document.getElementById('lista-productos');
                if (div) div.innerHTML = "Error al conectar.";
            });
    }

    function renderizarCards(data) {
        const div = document.getElementById('lista-productos');
        if (!div) return;
        div.innerHTML = '';

        if (!data || data.length === 0) {
            div.innerHTML = '<p style="color:white; text-align:center; width:100%;">No hay productos en esta categoría.</p>';
            return;
        }

        div.innerHTML = data.map(p => {
            const catId = (p.categories && p.categories.length > 0) ? p.categories[0].id : '';
            const esUsuarioReal = (window.nombreUsuario && window.nombreUsuario !== 'Invitado');
            
            // Lógica de imagen mejorada
            let fotoUrl = rutaDefault;
            let nombreImagen = (p.mainImage?.url) || (p.images?.[0]?.url) || p.images?.[0];

            if (nombreImagen) {
                if (nombreImagen.startsWith('http')) fotoUrl = nombreImagen;
                else {
                    let cleanUrl = nombreImagen.startsWith('/') ? nombreImagen.substring(1) : nombreImagen;
                    fotoUrl = (cleanUrl.startsWith('images/') || cleanUrl.startsWith('uploads/')) 
                            ? `/${cleanUrl}` 
                            : `${FOLDER_SYSTEM}/${cleanUrl}`;
                }
            }
            return `
                <div class="card" data-category-id="${catId}">
                    <div class="img-container" onclick="window.location.href='/detalle?id=${p.id}'">
                        <img src="${fotoUrl}" alt="${p.title}" class="card-img" 
                            onerror="this.src='${rutaDefault}'">
                    </div>
                    <div class="info">
                        <h3>${p.title}</h3>
                        
                        <div class="card-footer-actions">
                            <div class="price-and-link">
                                ${esUsuarioReal 
                                    ? `<span class="price">$ ${p.price.toLocaleString('es-AR')}</span>` 
                                    : `<button class="btn-ingresar-link" onclick="window.location.href='/login'">Ingresar</button>`
                                }
                            </div>

                            <img src="${rutaWA}" alt="WhatsApp" class="btn-wa-card" onclick="enviarWhatsApp('${p.title}')"> 
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function renderizarCards(data) {
        const div = document.getElementById('lista-productos');
        if (!div) return;
        div.innerHTML = '';

        if (!data || data.length === 0) {
            div.innerHTML = '<p style="color:white; text-align:center; width:100%;">No hay productos en esta categoría.</p>';
            return;
        }

        div.innerHTML = data.map(p => {
            const catId = (p.categories && p.categories.length > 0) ? p.categories[0].id : '';
            const esUsuarioReal = (window.nombreUsuario && window.nombreUsuario !== 'Invitado');
            
            // --- CAMBIO AQUÍ: Obtenemos el nombre y usamos la utilidad ---
            let nombreImagen = (p.mainImage?.url) || (p.images?.[0]?.url) || p.images?.[0];
            let fotoUrl = obtenerUrlFinal(nombreImagen);

            return `
                <div class="card" data-category-id="${catId}">
                    <div class="img-container" onclick="window.location.href='/detalle?id=${p.id}'">
                        <img src="${fotoUrl}" alt="${p.title}" class="card-img" 
                            onerror="this.src='${rutaDefault}'">
                    </div>
                    <div class="info">
                        <h3>${p.title}</h3>
                        <div class="card-footer-actions">
                            <div class="price-and-link">
                                ${esUsuarioReal 
                                    ? `<span class="price">$ ${p.price.toLocaleString('es-AR')}</span>` 
                                    : `<button class="btn-ingresar-link" onclick="window.location.href='/login'">Ingresar</button>`
                                }
                            </div>
                            <img src="${rutaWA}" alt="WhatsApp" class="btn-wa-card" onclick="enviarWhatsApp('${p.title}')"> 
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
   function cargarProductos() {
    fetch(`${API_URL}/products/list`)
        .then(response => response.json())
        .then(data => {
            productosHome = data; // Guardamos la copia
            aplicarFiltrosYOrden(); // Llamamos a la nueva función
        })
        .catch(err => {
            console.error("Error:", err);
            document.getElementById('lista-productos').innerHTML = "Error al conectar.";
        });
}

function obtenerURLImagenPrincipal(producto) {
    let nombreArchivo = "default.jpg";
    if (producto.mainImage && producto.mainImage.url) {
        nombreArchivo = producto.mainImage.url;
    } else if (producto.images && producto.images.length > 0) {
        nombreArchivo = producto.images[0].url ? producto.images[0].url : producto.images[0];
    }
    return `${FOLDER_SYSTEM}/${nombreArchivo}`;
}

function mostrarDescripcion(event, texto) {
    tooltip.innerText = texto;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
}

function ocultarDescripcion() {
    tooltip.style.display = 'none';
}

function enviarWhatsApp(producto) {
    const numero = window.whatsappNegocio; 
    const mensaje = encodeURIComponent(`Hola! Quisiera pedir el producto: ${producto}`);
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');
}

function abrirModalLogin() {
    window.location.href = "/login";
}

function abrirModalPerfil() {
    window.location.href = "/perfil";
}

/* ==========================================
   SISTEMA DE CATEGORÍAS
   ========================================== */
function cargarCategorias() {
    fetch(`${API_URL}/categories/list`)
        .then(res => res.json())
        .then(data => {
            window.categoriasData = data.sort((a, b) => a.name.localeCompare(b.name));
            const principales = data.filter(c => !c.parentId && !c.parent);
            renderizarNivel('categorias-nav', principales, null);
        }).catch(err => console.error("Error al cargar categorías:", err));
}

/* ==========================================
   SISTEMA DE CATEGORÍAS (INFINITO Y CENTRADO)
   ========================================== */

function renderizarBarraNavegacion(containerId, listaCompleta, idPadreActual) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Limpiamos y preparamos el panel
    container.innerHTML = '';
    container.className = 'panel-movil-container';

    // Ordenar alfabéticamente
    listaCompleta.sort((a, b) => a.name.localeCompare(b.name));

    // Crear el botón "Todas"
    const btnTodo = document.createElement('div');
    btnTodo.className = "panel-item active";
    btnTodo.innerText = (containerId === 'categorias-nav') ? 'Todas' : 'Ver Todo';
    btnTodo.onclick = () => {
        const url = (containerId === 'categorias-nav') ? `${API_URL}/products/list` : `${API_URL}/products/categoria/${idPadreActual}`;
        if (containerId === 'categorias-nav') limpiarNivelesInferiores(true);
        pedirProductos(url);
        marcarActivoPanel(btnTodo);
    };
    container.appendChild(btnTodo);

    // Crear las categorías
    listaCompleta.forEach(cat => {
        const item = document.createElement('div');
        item.className = "panel-item";
        item.innerText = cat.name;
        item.onclick = () => seleccionarCategoria(cat.id, item);
        container.appendChild(item);
    });

    configurarMovimientoPanel(containerId);
}

function marcarActivoPanel(elementoRelativo) {
    if (!elementoRelativo) return;

    const padre = elementoRelativo.parentElement;
    if (!padre) return;
    const items = padre.querySelectorAll('.panel-item');
    items.forEach(item => {
        item.classList.remove('active');
    });
    elementoRelativo.classList.add('active');
}

function configurarMovimientoPanel(id) {
    const panel = document.getElementById(id);
    const wrapper = panel.parentElement;
    const arrowLeft = wrapper.querySelector('.arrow-left');
    const arrowRight = wrapper.querySelector('.arrow-right');
    let intervaloScroll = null;
    let clickBloqueo = false;

    if (!panel) return;
    const mover = (pixeles) => {
        panel.scrollLeft += pixeles;
    };

    const iniciarHover = (velocidad) => {
        if (clickBloqueo) return; // Si acabamos de clickear, no hacemos nada
        clearInterval(intervaloScroll);
        intervaloScroll = setInterval(() => mover(velocidad), 10);
    };

    const detenerHover = () => {
        clearInterval(intervaloScroll);
    };

    const ejecutarSalto = (distancia, velocidadHover, direccion) => {
            detenerHover();
            clickBloqueo = true; 
            
            panel.scrollBy({ left: distancia, behavior: 'smooth' });
            setTimeout(() => {
                clickBloqueo = false;
                const flechaActual = (direccion === 'derecha') ? arrowRight : arrowLeft;
                if (flechaActual && flechaActual.matches(':hover')) {
                    iniciarHover(velocidadHover);
                }
            }, 400); 
        };

        if (arrowRight) {
            arrowRight.onmouseenter = () => iniciarHover(6);
            arrowRight.onmouseleave = detenerHover;
            arrowRight.onclick = (e) => {
                e.stopPropagation();
                ejecutarSalto(400, 6, 'derecha');
            };
        }

        if (arrowLeft) {
            arrowLeft.onmouseenter = () => iniciarHover(-6);
            arrowLeft.onmouseleave = detenerHover;
            arrowLeft.onclick = (e) => {
                e.stopPropagation();
                ejecutarSalto(-400, -6, 'izquierda');
            };
        }
    const actualizarFlechas = () => {
        const scrollLeft = panel.scrollLeft;
        const maxScroll = panel.scrollWidth - panel.clientWidth;
        if (arrowLeft) arrowLeft.style.opacity = scrollLeft > 10 ? "1" : "0";
        if (arrowRight) arrowRight.style.opacity = scrollLeft < maxScroll - 10 ? "1" : "0";
    };

    panel.addEventListener('scroll', actualizarFlechas);
    setTimeout(actualizarFlechas, 500);
}

function seleccionarCategoria(id, btn) {
    if (!btn) return;
    marcarActivoPanel(btn);
    pedirProductos(`${API_URL}/products/categoria/${id}`);

    const contenedor = btn.parentElement;
    const idContenedor = contenedor ? contenedor.id : '';
    let siguienteNivel = null;
    
    if (idContenedor === 'categorias-nav') {
        siguienteNivel = 'subcategorias-nav';
        limpiarNivelesInferiores(true); 
    } else if (idContenedor === 'subcategorias-nav') {
        siguienteNivel = 'nietos-nav';
        const nietos = document.getElementById('nietos-nav');
        if (nietos) {
            nietos.innerHTML = '';
            nietos.parentElement.style.display = 'none';
        }
    }

    const hijos = window.categoriasData.filter(c => {
        const pId = c.parentId || (c.parent ? c.parent.id : null);
        return pId === id;
    });
    if (siguienteNivel && hijos.length > 0) {
        renderizarNivel(siguienteNivel, hijos, id);
    }
}

function filtrarPorTexto() {
    aplicarFiltrosYOrden();
}

function actualizarInterfazFiltros() {
    const tipo = document.getElementById('tipoFiltroPrecio').value;
    const container = document.getElementById('inputs-precio');
    container.innerHTML = '';

    if (tipo === 'menor' || tipo === 'mayor') {
        container.innerHTML = `<input type="number" id="precioUno" placeholder="Precio" class="price-input">`;
    } else if (tipo === 'entre') {
        container.innerHTML = `
            <input type="number" id="precioUno" placeholder="Min" class="price-input">
            <span style="color:#888">-</span>
            <input type="number" id="precioDos" placeholder="Max" class="price-input">
        `;
    }
}

/* ==========================================
   PRODUCTOS DESTACADOS (CINTA ANIMADA)
   ========================================== */

// --- LÓGICA DE PRODUCTOS DESTACADOS (COMO ANTES) ---
let posicionActual = 0;
let startX = 0;
let scrollLeftAlTocar = 0;
let isPaused = false;
let velocidad = 0;
let ultimaPosicionX = 0;
let friccion = 0.95;
let seguidorInercia;

function renderizarDestacados(data) {
    const track = document.getElementById('lista-destacados');
    if (!track || !data || data.length === 0) return;
    const listaParaSlider = [...data, ...data];

    track.innerHTML = listaParaSlider.map((p) => {
        // --- CAMBIO AQUÍ: Usamos la utilidad centralizada ---
        let fotoUrl = obtenerUrlFinal(p.imageUrl || p.url);

        const idFinal = p.productId || p.id;
        return `
            <div class="card-destacado" data-id="${idFinal}">
                <div class="featured-img-container">
                    <img src="${fotoUrl}" alt="${p.title}" onerror="this.src='${rutaDefault}';">
                </div>
                <h3 class="featured-title-top">${p.title}</h3>
                <div class="featured-actions-container">
                    <p class="product-price">$ ${p.price ? p.price.toLocaleString('es-AR') : 'Consultar'}</p>
                    <button class="btn-wa-featured" onclick="event.stopPropagation(); enviarWhatsApp('${p.title}')">
                        <img src="/images/WhatsApp.png" alt="WhatsApp" class="wa-icon-featured">
                    </button>
                </div>
            </div>
        `;
    }).join('');

    setTimeout(() => {
        const contenedores = track.querySelectorAll('.featured-img-container');
        let alturaMaxima = 0;
        contenedores.forEach(cont => {
            const h = cont.offsetHeight;
            if (h > alturaMaxima) alturaMaxima = h;
        });

        if (alturaMaxima > 0) {
            contenedores.forEach(cont => {
                cont.style.height = `${alturaMaxima}px`;
            });
        }
    }, 100);

    track.querySelectorAll('.card-destacado').forEach(card => {
        card.onclick = function(e) {
            if (e.target.closest('.btn-wa-featured')) return;
            const id = this.getAttribute('data-id');
            if (id) window.location.href = `/detalle?id=${id}`;
        };
    });

    configurarTouchDestacados(track);
}

function moverCinta() {
    const track = document.getElementById('lista-destacados');
    if (!track || isPaused) {
        requestAnimationFrame(moverCinta);
        return;
    }

    posicionActual -= 0.8; 
    if (Math.abs(posicionActual) >= track.scrollWidth / 2) {
        posicionActual = 0;
    }
    track.style.transform = `translateX(${posicionActual}px)`;
    requestAnimationFrame(moverCinta);
}

function configurarTouchDestacados(track) {
    track.addEventListener('touchstart', (e) => {
        isPaused = true;
        startX = e.touches[0].pageX;
        scrollLeftAlTocar = posicionActual;
        track.style.transition = 'none';
    }, {passive: true});

    track.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX;
        const walk = x - startX;
        let xActual = e.touches[0].clientX;
        velocidad = xActual - ultimaPosicionX;
        ultimaPosicionX = xActual;

        posicionActual = scrollLeftAlTocar + walk;
        track.style.transform = `translateX(${posicionActual}px)`;
    }, {passive: true});

    track.addEventListener('touchend', () => {
        aplicarInercia(track);
    });
}

function aplicarInercia(track) {
    if (Math.abs(velocidad) > 0.1) {
        posicionActual += velocidad;
        velocidad *= friccion;
        if (Math.abs(posicionActual) >= track.scrollWidth / 2) posicionActual = 0;
        track.style.transform = `translateX(${posicionActual}px)`;
        seguidorInercia = requestAnimationFrame(() => aplicarInercia(track));
    } else {
        setTimeout(() => { isPaused = false; }, 1000);
    }
}

// utils.js

function aplicarFiltrosYOrden() {
    const texto = document.getElementById('busqueda')?.value.toLowerCase() || "";
    const orden = document.getElementById('ordenPrecioHome')?.value || 'default';
    const tipoFiltro = document.getElementById('tipoFiltroPrecio')?.value || 'todos';
    const p1 = parseFloat(document.getElementById('precioUno')?.value);
    const p2 = parseFloat(document.getElementById('precioDos')?.value);

    let resultado = productosHome.filter(p => {
        const coincideTexto = p.title.toLowerCase().includes(texto);
        let coincidePrecio = true;
        if (tipoFiltro === 'menor' && !isNaN(p1)) coincidePrecio = (p.price <= p1);
        else if (tipoFiltro === 'mayor' && !isNaN(p1)) coincidePrecio = (p.price >= p1);
        else if (tipoFiltro === 'entre' && !isNaN(p1) && !isNaN(p2)) coincidePrecio = (p.price >= p1 && p.price <= p2);
        return coincideTexto && coincidePrecio;
    });

    if (orden === "min") resultado.sort((a, b) => a.price - b.price);
    else if (orden === "max") resultado.sort((a, b) => b.price - a.price);

    renderizarCards(resultado);
}

function inicializarBuscadorCategorias(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.oninput = () => {
        const busqueda = input.value.toLowerCase().trim();
        if (busqueda.length < 3) return;
        const catEncontrada = window.categoriasData.find(c => 
            c.name.toLowerCase().includes(busqueda)
        );

        if (catEncontrada) {
            desplegarArbolHasta(catEncontrada);
        }
    };
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    };
}

async function desplegarArbolHasta(categoria) {
    const camino = [];
    let actual = categoria;

    while (actual) {
        camino.unshift(actual);
        const padreId = actual.parentId || (actual.parent ? actual.parent.id : null);
        actual = window.categoriasData.find(c => c.id === padreId);
    }

    for (let i = 0; i < camino.length; i++) {
        const nodo = camino[i];
        const selector = `.panel-item`;
        const elementos = document.querySelectorAll(selector);
        const divVisual = Array.from(elementos).find(el => el.innerText === nodo.name);

        if (divVisual) {
            divVisual.click();
            divVisual.scrollIntoView({ behavior: 'smooth', inline: 'center' });            
            await new Promise(resolve => setTimeout(resolve, 250)); 
        }
    }
}

/*UTILS*/
function configurarScrollArrastrable(id) {
    const slider = document.getElementById(id);
    if (!slider) return;
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
    });
    slider.addEventListener('mouseleave', () => isDown = false);
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        slider.scrollLeft = scrollLeft - (x - startX) * 2;
    });
}

function marcarActivo(btn) {
    btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function obtenerHijos(idPadre) {
    return categoriasData.filter(c => (c.parentId || (c.parent && c.parent.id)) === idPadre);
}

function renderizarNivel(containerId, listaHijos, idPadreActual) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const wrapper = container.parentElement; // Este suele ser el que tiene el fondo negro

    if (!listaHijos || listaHijos.length === 0) {
        container.innerHTML = '';
        if (wrapper) {
            wrapper.style.display = 'none'; // ESTO quita el renglón negro
            wrapper.style.height = '0';     // Aseguramos por CSS
            wrapper.style.padding = '0';    // Evitamos espacios residuales
        }
        return;
    }

    // Si hay hijos, restauramos el estilo
    if (wrapper) {
        wrapper.style.display = 'flex';
        wrapper.style.height = 'auto'; // O el alto que tengas por defecto (ej: 45px)
        wrapper.style.padding = '';    // Restauramos el padding del CSS
    }
    
    container.innerHTML = '';
    const btnTodo = document.createElement('div');
    btnTodo.className = "panel-item active";
    btnTodo.innerText = (containerId === 'categorias-nav') ? 'Todas' : 'Ver Todo';
    btnTodo.onclick = () => {
        const url = (containerId === 'categorias-nav') 
            ? `${API_URL}/products/list` 
            : `${API_URL}/products/categoria/${idPadreActual}`;
        
        if (containerId === 'categorias-nav') limpiarNivelesInferiores(true);
        pedirProductos(url);
        marcarActivoPanel(btnTodo);
    };
    container.appendChild(btnTodo);

    listaHijos.forEach(h => {
        const item = document.createElement('div');
        item.className = "panel-item";
        item.innerText = h.name;
        item.onclick = () => {
            seleccionarCategoria(h.id, item);
            marcarActivoPanel(item);
        };
        container.appendChild(item);
    });

    configurarMovimientoPanel(containerId);
}

function limpiarNivelesInferiores(esPrincipal) {
    if (esPrincipal) document.getElementById('subcategorias-nav').innerHTML = '';
    const nieto = document.getElementById('nietos-nav');
    if (nieto) nieto.innerHTML = '';
}

function perteneceAFamilia(categoriaProducto, idBuscado) {
    if (!categoriaProducto) return false;
    if (Number(categoriaProducto.id) === Number(idBuscado)) return true;
    if (categoriaProducto.parent) {
        return perteneceAFamilia(categoriaProducto.parent, idBuscado);
    }
    return false;
}

function cumpleFiltros(producto, textoBusqueda, categoriaId = 'todas') {
    const coincideTexto = producto.title.toLowerCase().includes(textoBusqueda.toLowerCase());
    let coincideCategoria = true;
    if (categoriaId !== 'todas') {
        coincideCategoria = producto.categories?.some(cat => 
            perteneceAFamilia(cat, categoriaId)
        );
    }
    return coincideTexto && coincideCategoria;
}


function ejecutarFiltradoDinamico(selectorItems, inputId, selectCatId = null) {
    const textoInput = document.getElementById(inputId).value.toLowerCase();
    const elementos = document.querySelectorAll(selectorItems);

    elementos.forEach(el => {
        const contenedorNombre = el.querySelector('h3') || el.querySelector('.nombre-tabla');
        let nombre = "";

        if (contenedorNombre) {
            const inputInterno = contenedorNombre.querySelector('input');
            nombre = inputInterno ? inputInterno.value : contenedorNombre.innerText;
        }

        const coincide = nombre.toLowerCase().includes(textoInput);
        el.style.display = coincide ? "" : "none";
    });
}

/* ==========================================
   CUENTA REGRESIVA DE OFERTAS
   ========================================== */

async function chequearTimerActivo() {
    const response = await fetch('/api/featured/timer');
    const fechaFin = await response.text(); // El LocalDateTime del servidor

    if (fechaFin && fechaFin !== "") {
        iniciarCuentaRegresivaVisual(fechaFin);
        actualizarBotonAdmin(true);
    }
}

function manejarTimer() {
    const btn = document.getElementById('btn-timer-toggle');
    const input = document.getElementById('input-fecha-limite');

    if (btn.innerText === "Hora Límite") {              // Primera fase: Mostrar el selector de fecha

        input.classList.remove('d-none');
        btn.innerText = "Confirmar Límite";
    } 
    else if (btn.innerText === "Confirmar Límite") {    // Segunda fase: Mandar al servidor

        establecerLimite(input.value);
    } 
    else {                                              // Tercera fase: Cancelar (Si decía "Cancelar Límite")

        cancelarLimite();
    }
}

async function establecerLimite(fecha) {
    if (!fecha) return alert("Por favor, seleccioná una fecha y hora.");

    const response = await fetch('/api/featured/set-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fecha })
    });

    if (response.ok) {
        location.reload();
    }
}

async function cancelarLimite() {
    const response = await fetch('/api/featured/clear-timer', { method: 'DELETE' });
    if (response.ok) {
        location.reload();
    }
}

function actualizarBotonAdmin(estaActivo) {
    const btn = document.getElementById('btn-timer-toggle');
    if (btn && estaActivo) {
        btn.innerText = "Cancelar Límite";
        btn.classList.add('btn-danger-custom');
    }
}

function iniciarCuentaRegresivaVisual(fechaFin) {
    const display = document.getElementById('countdown-display');
    const span = document.getElementById('timer-numbers');
    
    if (!fechaFin || fechaFin === "null") return;

    let fechaLimpia = fechaFin.replace(/["']/g, "").trim(); 
    fechaLimpia = fechaLimpia.replace(' ', 'T'); 
    const target = new Date(fechaLimpia).getTime();
    const ahora = new Date().getTime();
    if (target < ahora) {
        display.style.display = 'none';
        return;
    }
    if (isNaN(target)) return; 
    display.style.display = 'block';
    if (window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(() => {
        const ahora = new Date().getTime();
        const diff = target - ahora;
        if (diff <= 0) {
            clearInterval(window.timerInterval);
            span.innerText = "¡OFERTA FINALIZADA!";
            setTimeout(() => location.reload(), 1500); 
            return;
        }

        // 1. Calculamos las unidades base
        const diasRestantes = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horasRestantes = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutosRestantes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundosRestantes = Math.floor((diff % (1000 * 60)) / 1000);

        // 2. Formateamos a 2 dígitos para que no "salte" el texto
        const hh = horasRestantes.toString().padStart(2, '0');
        const mm = minutosRestantes.toString().padStart(2, '0');
        const ss = segundosRestantes.toString().padStart(2, '0');

        // 3. Armamos el texto final según si hay días o no
        if (diasRestantes > 0) {
            span.innerText = `⏳${diasRestantes}d ${hh}:${mm}:${ss}`;
        } else {
            span.innerText = `⏳${hh}:${mm}:${ss}`;
        }
    }, 1000);
}

function inicializarAccesoRapidoBusqueda() {
    const trigger = document.getElementById('nav-search-trigger');
    const inputReal = document.getElementById('busqueda'); // <--- CAMBIADO A PRODUCTOS

    if (trigger && inputReal) {
        trigger.addEventListener('click', () => {
            inputReal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                inputReal.focus();
                inputReal.select();
                inputReal.style.boxShadow = "0 0 10px #ff9800";
                setTimeout(() => { inputReal.style.boxShadow = "none"; }, 1500);
            }, 600);
        });
    }
}

async function aplicarConfiguracionGlobal() {
    try {
        const response = await fetch('/api/configuraciones');
        if (!response.ok) throw new Error("Error en la red");
        const config = await response.json();
        window.globalConfig = config;
        window.whatsappNegocio = config.WHATSAPP_NUMBER || "5491159737028";        
        if (config.NOMBRE_LUGAR) {
            document.title = config.NOMBRE_LUGAR;
            const brand = document.getElementById('footer-brand-name');
            if (brand) brand.innerText = config.NOMBRE_LUGAR;
        }
        const bannerElement = document.getElementById('home-main-banner');
        if (bannerElement) {
            const urlBanner = config.BANNER_URL || '/images/banner.webp'; 
            bannerElement.style.setProperty('background-image', `url('${urlBanner}')`, 'important');
        }

        const address = document.getElementById('footer-address');
        if (address && config.DIRECCION) {
            address.innerText = `${config.DIRECCION}${config.BARRIO ? ', ' + config.BARRIO : ''}`;
        }

    } catch (error) {
        console.error("Error al sincronizar:", error);
    }
}