package com.ProjectoJava.objetos.controller;

import com.ProjectoJava.objetos.DTO.response.CategoryResponseDTO;
import com.ProjectoJava.objetos.DTO.response.ProductResponseDTO;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.entity.Product;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Comparator;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*") // Para que el frontend pueda entrar
public class CategoryController {

    @Autowired
    private CategoryRepository repository;

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryService service;

    @GetMapping("/list")
    public List<Category> listar() {
        List<Category> categorias = repository.findAll();
        categorias.sort(Comparator.comparing(Category::getName)); // Ordenamos por nombre
        return categorias;
    }

    @GetMapping("/all")
    public List<CategoryResponseDTO> getAllCategories() {
        return repository.findAll()
                .stream()
                .sorted(Comparator.comparing(Category::getName))
                .map(cat -> new CategoryResponseDTO(cat))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long id) {
        CategoryResponseDTO dto = service.obtenerCategoriaConGrupos(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/ancestros")
    public List<CategoryResponseDTO> getAncestros(@PathVariable Long id) {
        return service.obtenerAncestrosDTO(id);
    }

    @GetMapping("/{id}/hijos")
    public List<CategoryResponseDTO> getHijos(@PathVariable Long id) {
        List<Category> hijas = service.obtenerSubcategorias(id);
        return hijas.stream()
                    .sorted(Comparator.comparing(Category::getName)) // <--- AGREGAR ESTO
                    .map(CategoryResponseDTO::new)
                    .collect(Collectors.toList());
    }

    @PostMapping("/add")
    public ResponseEntity<?> agregar(@RequestBody Category nueva) {
        try {
            if (nueva.getParent() != null && nueva.getParent().getId() != null) {
                Category padre = repository.findById(nueva.getParent().getId())
                    .orElseThrow(() -> new RuntimeException("Padre no encontrado"));
                nueva.setParent(padre);
            } else {
                nueva.setParent(null);
            }

            repository.save(nueva);
            return ResponseEntity.ok().body("{\"status\": \"success\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/update/{id}")
    public Category update(@PathVariable Long id, @RequestBody Category category) {
        category.setId(id);
        return repository.save(category);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            service.borrarCategoria(id);
            return ResponseEntity.ok().body("{\"status\": \"success\", \"message\": \"Categoría eliminada y jerarquía reestructurada\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/contador/visibles")
    public Map<Long, Integer> verContadoresVisibles(@RequestParam(defaultValue = "true") boolean soloVisibles) {
        return service.cantidadProductosPorCategoria(soloVisibles);
    }

    @GetMapping("/contador/totales")
    public Map<Long, Integer> verContadoresTotales(@RequestParam(defaultValue = "false") boolean soloVisibles) {
        return service.cantidadProductosPorCategoria(soloVisibles);
    }

}