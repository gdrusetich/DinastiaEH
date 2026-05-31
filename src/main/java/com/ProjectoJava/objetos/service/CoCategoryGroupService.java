package com.ProjectoJava.objetos.service;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.DTO.response.CoCategoryGroupResponseDTO;
import com.ProjectoJava.objetos.DTO.request.CoCategoryGroupRequestDTO;
import com.ProjectoJava.objetos.repository.ProductRepository;

import com.ProjectoJava.objetos.repository.CoCategoryGroupRepository;
import com.ProjectoJava.objetos.repository.CategoryRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CoCategoryGroupService {

    @Autowired
    private CoCategoryGroupRepository CoCategoryGroupRepository;

    @Autowired
    private CategoryRepository categoryRepository; // <--- Faltaba esta inyección

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public CoCategoryGroupResponseDTO crear(CoCategoryGroupRequestDTO dto) {
        if (CoCategoryGroupRepository.existsByNameIgnoreCase(dto.getName().trim())) {
            throw new IllegalArgumentException("¡Error! La propiedad '" + dto.getName() + "' ya existe.");
        }

        CoCategoryGroup nueva = new CoCategoryGroup();
        nueva.setName(dto.getName().trim());
        nueva.setType(dto.getType());
        
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            Set<Category> categoriasObtenidas = dto.getCategoryIds().stream()
                .map(catId -> categoryRepository.findById(catId)
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada: " + catId)))
                .collect(Collectors.toSet());
            nueva.getCategories().clear();
            nueva.getCategories().addAll(categoriasObtenidas);
            nueva.setCategories(categoriasObtenidas);
        }
        
        CoCategoryGroup guardada = CoCategoryGroupRepository.save(nueva);
        return convertToResponseDTO(guardada);
    }

    @Transactional
    public void eliminar(Long id) {
        CoCategoryGroup coCat = CoCategoryGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("No se encontró la co-categoría"));
        CoCategoryGroupRepository.delete(coCat);
    }

    @Transactional
    public CoCategoryGroupResponseDTO actualizar(Long id, CoCategoryGroupRequestDTO dto) {
        System.out.println("DEBUG: Recibiendo actualización para grupo " + id);
        System.out.println("DEBUG: IDs de categorías recibidos: " + (dto.getCategoryIds() != null ? dto.getCategoryIds().toString() : "NULL"));
        CoCategoryGroup cocat = CoCategoryGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Co-Categoría no encontrada"));

        cocat.setName(dto.getName());
        cocat.setType(dto.getType());

        if (dto.getCategoryIds() != null) {
            Set<Category> categoriasObtenidas = dto.getCategoryIds().stream()
                    .map(catId -> categoryRepository.findById(catId)
                        .orElseThrow(() -> new RuntimeException("Categoría no encontrada: " + catId)))
                    .collect(Collectors.toSet());
            
            // Limpiamos y cargamos para que Hibernate detecte el cambio de una
            cocat.getCategories().clear();
            cocat.getCategories().addAll(categoriasObtenidas);
        } else {
            cocat.getCategories().clear();
        }

        CoCategoryGroup guardada = CoCategoryGroupRepository.saveAndFlush(cocat);
        System.out.println("Categorías en la entidad antes de devolver: " + guardada.getCategories().size());

        return convertToResponseDTO(guardada);
    }

    public List<CoCategoryGroupResponseDTO> listarTodas() {
        List<CoCategoryGroup> grupos = CoCategoryGroupRepository.findAll();   
        return grupos.stream()
                .map(grupo -> {
                    return convertToResponseDTO(grupo); 
                })
                .collect(Collectors.toList());
    }
    private CoCategoryGroupResponseDTO convertToResponseDTO(CoCategoryGroup cocat) {
        return new CoCategoryGroupResponseDTO(cocat);
    }

}