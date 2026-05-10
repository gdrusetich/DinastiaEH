package com.ProjectoJava.objetos.service;

import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.repository.CoCategoryGroupRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.DTO.response.CategoryResponseDTO;
import com.ProjectoJava.objetos.DTO.response.CoCategoryGroupResponseDTO;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Product;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;


@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CoCategoryGroupRepository coCategoryGroupRepository;
    @Autowired
    private ProductRepository productRepository;

    public Category buscarPorId(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("La categoría con ID " + id + " no existe."));
    }

    public List<Category> obtenerCategoriasPadre() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> obtenerSubcategorias(Long padreId) {
        return categoryRepository.findByParent_Id(padreId);
    }

    public List<Category> obtenerAncestros(Long categoryId) {
        List<Category> ancestros = new ArrayList<>();
        
        Category actual = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        
        ancestros.add(actual);
        
        while (actual.getParent() != null) {
            actual = actual.getParent();
            ancestros.add(actual);
        }
        return ancestros;
    }
    
    @GetMapping("/all")
    public List<Category> listarTodas() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    public List<CategoryResponseDTO> obtenerAncestrosDTO(Long categoryId) {
        List<Category> entidades = obtenerAncestros(categoryId); // Usás la lógica que ya tenías
        return entidades.stream()
                        .map(CategoryResponseDTO::new)
                        .collect(Collectors.toList());
    }

    @Transactional
    public void borrarCategoria(Long id) {
        Category categoriaABorrar = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        List<CoCategoryGroup> grupos = coCategoryGroupRepository.findByCategoriesContaining(categoriaABorrar);
        for (CoCategoryGroup grupo : grupos) {
            grupo.getCategories().remove(categoriaABorrar);
            coCategoryGroupRepository.save(grupo); 
        }

        Category abuelo = categoriaABorrar.getParent();
        List<Category> hijas = categoryRepository.findByParent_Id(id);
        for (Category hija : hijas) {
            hija.setParent(abuelo);
        }
        categoryRepository.saveAll(hijas);

        List<Product> productosAsociados = productRepository.findByCategoriesContaining(categoriaABorrar);
        for (Product producto : productosAsociados) {
            producto.getCategories().remove(categoriaABorrar);
            if (abuelo != null) {
                producto.getCategories().add(abuelo);
            }
        }
        productRepository.saveAll(productosAsociados);
        categoryRepository.delete(categoriaABorrar);
    }

    public Map<Long, Integer> cantidadProductosPorCategoria(boolean soloVisibles) {
        List<Category> categorias = categoryRepository.findAll();
        List<Product> productos = productRepository.findAll();
        Map<Long, Integer> contadores = new HashMap<>();
        for (Category cat : categorias) {
            contadores.put(cat.getId(), 0);
        }

        for (Product prod : productos) {
            if (soloVisibles && prod.isOculto()) {
                continue; 
            }

            for (Category catDirecta : prod.getCategories()) {
                Category actual = catDirecta;
                while (actual != null) {
                    Long id = actual.getId();
                    if (contadores.containsKey(id)) {
                        contadores.put(id, contadores.get(id) + 1);
                    }
                    actual = actual.getParent();
                }
            }
        }
        return contadores;
    }


    public CategoryResponseDTO obtenerCategoriaConGrupos(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        CategoryResponseDTO dto = new CategoryResponseDTO(cat);
        List<CoCategoryGroup> grupos = coCategoryGroupRepository.findByCategoriesContaining(cat);
        dto.setCoCategoriesGroup(grupos.stream()
                .map(CoCategoryGroupResponseDTO::new)
                .collect(Collectors.toList()));

        return dto;
    }

}