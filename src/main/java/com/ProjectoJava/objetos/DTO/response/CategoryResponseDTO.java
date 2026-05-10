package com.ProjectoJava.objetos.DTO.response;
import com.ProjectoJava.objetos.entity.Category;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CategoryResponseDTO {
    private Long id;
    private String name;
    private Long parentId;
    private String parentName;
    private List<CoCategoryGroupResponseDTO> coCategoriesGroup; // Cambié el nombre para que el JS lo encuentre

    public CategoryResponseDTO(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        if (category.getParent() != null) {
            this.parentId = category.getParent().getId();
            this.parentName = category.getParent().getName();
        }

        this.coCategoriesGroup = (category.getCoCategoriesGroup() != null) 
            ? category.getCoCategoriesGroup().stream()
                .map(CoCategoryGroupResponseDTO::new)
                .collect(Collectors.toList())
            : new ArrayList<>();
    }

    // Constructor vacío (VITAL para que no te tire error de "undefined")
    public CategoryResponseDTO() {}

    public CategoryResponseDTO(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    // --- GETTERS ---
    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getParentId() { return parentId; }
    public String getParentName() { return parentName; }
    public List<CoCategoryGroupResponseDTO> getCoCategoriesGroup() { return coCategoriesGroup; }

    // --- SETTERS (Agregá el de ID y el de la Lista) ---
    public void setId(Long id) { this.id = id; } // <--- Esto te lo pedía el Service
    public void setName(String name) { this.name = name; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public void setParentName(String parentName) { this.parentName = parentName; }
    public void setCoCategoriesGroup(List<CoCategoryGroupResponseDTO> coCategoriesGroup) { 
        this.coCategoriesGroup = coCategoriesGroup; 
    }
}