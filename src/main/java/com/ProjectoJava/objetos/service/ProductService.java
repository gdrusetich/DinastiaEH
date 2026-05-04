package com.ProjectoJava.objetos.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ProjectoJava.objetos.DTO.request.ProductRequestDTO;
import com.ProjectoJava.objetos.DTO.response.ProductResponseDTO;
import com.ProjectoJava.objetos.entity.Product;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.entity.Image;
import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.repository.ImageRepository;
import exceptions.NoStockException;
import exceptions.ProductExistsException;
import exceptions.ProductNotExistsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepositoryJPA;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ImageService imageService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    public ProductService(ProductRepository repositorio) {
        this.productRepositoryJPA = repositorio;
    }

    public ProductResponseDTO agregarProducto(ProductRequestDTO nuevoDTO) throws ProductExistsException {
        if (productRepositoryJPA.existsByTitleIgnoreCase(nuevoDTO.getTitle())){
            throw new ProductExistsException("Ya existe un producto con ese titulo");
        }

        Product productoNuevo = new Product();
        productoNuevo.setTitle(nuevoDTO.getTitle());
        productoNuevo.setPrice(nuevoDTO.getPrice());
        productoNuevo.setFechaUltimoPrecio(nuevoDTO.getFechaUltimoPrecio());
        productoNuevo.setOculto(nuevoDTO.isOculto());
        productoNuevo.setFeatured(nuevoDTO.isFeatured());
        productoNuevo.setStock(nuevoDTO.getStock());
        productoNuevo.setDescription(nuevoDTO.getDescription()); // ¡No te olvides de la descripción!
        
        List<Category> categoriasEncontradas = categoryRepository.findAllById(nuevoDTO.getCategories());
        productoNuevo.setCategories(new HashSet<>(categoriasEncontradas));

        Product productoGuardado = productRepositoryJPA.save(productoNuevo);
        if (nuevoDTO.getImageURL() != null && !nuevoDTO.getImageURL().isEmpty()) {
            for (String nombre : nuevoDTO.getImageURL()) {
                Image img = new Image();
                String nombreLimpio = nombre;
                if (nombre.contains("/")) {
                    nombreLimpio = nombre.substring(nombre.lastIndexOf("/") + 1);
                    if (nombreLimpio.contains(".")) {
                        nombreLimpio = nombreLimpio.substring(0, nombreLimpio.lastIndexOf("."));
                    }
                }
                img.setUrl(nombreLimpio); 
                img.setProduct(productoGuardado);
                imageRepository.save(img); 
            }
        }
        return new ProductResponseDTO(productoGuardado);
    }

    public List<ProductResponseDTO> listarProductosVisibles() {
        return productRepositoryJPA.findByOcultoFalse().stream()
                .map(ProductResponseDTO::new)
                .collect(Collectors.toList());
    }

    public List<ProductResponseDTO> listarTodoCompleto() {
        try {
            List<Product> productos = productRepositoryJPA.findAll();
            return productos.stream()
                    .map(p -> new ProductResponseDTO(p)) // Transformación manual a DTO
                    .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace(); // Esto te va a mostrar el error REAL en la consola de Java
            throw e;
        }
    }

    public List<ProductResponseDTO> filtrarPorPrecio(double precioMaximo){
        List<Product> listaDeProductos = productRepositoryJPA.findAll();
        List<ProductResponseDTO> productosFiltrados = new ArrayList<>();
        for(Product p: listaDeProductos){
            if(p.getPrice()<=precioMaximo) {
                ProductResponseDTO nuevoDTO = new ProductResponseDTO(p);
                productosFiltrados.add(nuevoDTO);
            }
        }
        return productosFiltrados;
    }

    public List<Category> obtenerCategoriasDeProducto(Long productId) {
        Product producto = productRepositoryJPA.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return new ArrayList<>(producto.getCategories());
    }

    public List<ProductResponseDTO> filtrarPorCategoria(Long categoryId) {
        List<Long> idsFiltrar = new ArrayList<>();
        idsFiltrar.add(categoryId);
        
        categoryRepository.findByParent_Id(categoryId)
                        .forEach(hija -> idsFiltrar.add(hija.getId()));

        List<Product> productos = productRepositoryJPA.findByCategories_IdIn(idsFiltrar);
        
        return productos.stream()
                .map(ProductResponseDTO::new)
                .collect(Collectors.toList());
    }
 

    public Map<String, List<Category>> obtenerMapaCategoriasPorProducto(Long productId) {
        Product producto = productRepositoryJPA.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Map<String, List<Category>> mapaResultados = new HashMap<>();

        for (Category cat : producto.getCategories()) {
            mapaResultados.put(cat.getName(), categoryService.obtenerAncestros(cat.getId()));
        }

        return mapaResultados;
    }


    public ProductResponseDTO buscarProductoPorId(Long id) throws ProductNotExistsException {
        Product productoBuscado = productRepositoryJPA.findById(id)
                .orElseThrow(() -> new ProductNotExistsException("Producto no encontrado con ID: " + id));
        return new ProductResponseDTO(productoBuscado);
    }

    public ProductResponseDTO actualizarProducto(long id, ProductRequestDTO PRDTO) throws ProductNotExistsException{
        Product productoExistente = productRepositoryJPA.findById(id)
            .orElseThrow(() -> new ProductNotExistsException("Producto no encontrado con ID: " + id));

        if (PRDTO.getTitle() != null && !PRDTO.getTitle().isEmpty()) productoExistente.setTitle(PRDTO.getTitle());
        if (PRDTO.getPrice() > 0) productoExistente.setPrice(PRDTO.getPrice());
        productoExistente.setOculto(PRDTO.isOculto());
        if (PRDTO.getStock() >= 0) productoExistente.setStock(PRDTO.getStock());
        if (PRDTO.getDescription() != null && !PRDTO.getDescription().isEmpty()) productoExistente.setDescription(PRDTO.getDescription());
        
        List<Category> categoriasEncontradas = categoryRepository.findAllById(PRDTO.getCategories());
        productoExistente.setCategories(new HashSet<>(categoriasEncontradas));

        if (PRDTO.getImageURL() != null && !PRDTO.getImageURL().isEmpty()) {
            // En lugar de clear(), borramos cada una correctamente en DB y Nube
            List<Long> idsABorrar = productoExistente.getImages().stream()
                                        .map(Image::getId)
                                        .collect(Collectors.toList());
            
            for (Long idImg : idsABorrar) {
                imageService.deleteImage(idImg);
            }

            // Ahora agregamos las nuevas URLs de Cloudinary
            for(String urlCloudinary : PRDTO.getImageURL()){
                Image nuevaImagen = new Image();
                nuevaImagen.setUrl(urlCloudinary);
                nuevaImagen.setProduct(productoExistente);
                imageRepository.save(nuevaImagen); 
            }
        }
            Product productoActualizado = productRepositoryJPA.save(productoExistente);
            return new ProductResponseDTO(productoActualizado);
    }

    public void eliminarProductoPorId(long id) throws ProductNotExistsException{
        if(!productRepositoryJPA.existsById(id)){
            throw new ProductNotExistsException("Producto no encontrado con ID: "+ id);
        }
        this.productRepositoryJPA.deleteById(id);
    }

    public Boolean hayStock(Long idProducto, int cantidad) throws ProductNotExistsException {
        Product productoBuscado = productRepositoryJPA.findById(idProducto)
                .orElseThrow(() -> new ProductNotExistsException("Producto no encontrado con ID: " + idProducto));
        return productoBuscado.getStock() >= cantidad;
    }

    public void descontarStock(long idProducto, int cantidad) throws ProductNotExistsException, NoStockException {
        Product productoADescontar = productRepositoryJPA.findById(idProducto)
                .orElseThrow(() -> new ProductNotExistsException("Producto no encontrado con ID: " + idProducto));
        if (productoADescontar.getStock() < cantidad) {
            throw new NoStockException("No hay suficiente stock para: " + productoADescontar.getTitle());
        }
        productoADescontar.setStock(productoADescontar.getStock() - cantidad);
        productRepositoryJPA.save(productoADescontar); // actualiza en la DB
    }

    public Product editarPrecio(Long id, Double nuevoPrecio) throws ProductNotExistsException {
        Product productoAACtualizar = productRepositoryJPA.findById(id)
                .orElseThrow(() -> new ProductNotExistsException("Producto no encontrado con ID: " + id));
        productoAACtualizar.setPrice(nuevoPrecio);

        this.productRepositoryJPA.save(productoAACtualizar);
        return productoAACtualizar;
    }

    @Transactional
    public void establecerImagenPrincipal(Long productoId, Long imagenId) {
        Product producto = productRepositoryJPA.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Image imagen = imageRepository.findById(imagenId)
            .orElseThrow(() -> new RuntimeException("Imagen no encontrada"));

        producto.setMainImage(imagen);
        productRepositoryJPA.save(producto);
    }

}



