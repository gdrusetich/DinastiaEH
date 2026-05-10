package com.ProjectoJava.objetos.DTO.response;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.DTO.response.PropertyValueResponseDTO;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

public class CoCategoryGroupResponseDTO {
    private Long id;
    private String name;
    private String type;
    private List<Long> categoryIds;
    private List<String> categoryNames;
    private List<PropertyValueResponseDTO> propertyValues; // <--- ¡La pieza que faltaba!

    public CoCategoryGroupResponseDTO() {}

    public CoCategoryGroupResponseDTO(CoCategoryGroup entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.type = entity.getType();

        // Mapeo de Categorías (IDs y Nombres)
        if (entity.getCategories() != null) {
            this.categoryIds = entity.getCategories().stream()
                    .map(Category::getId)
                    .collect(Collectors.toList());
            this.categoryNames = entity.getCategories().stream()
                    .map(Category::getName)
                    .collect(Collectors.toList());
        }

        if (entity.getPropertyValues() != null) {
            this.propertyValues = entity.getPropertyValues().stream()
                    .map(PropertyValueResponseDTO::new) 
                    .collect(Collectors.toList());
        } else {
            this.propertyValues = new ArrayList<>();
        }
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<Long> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<Long> categoryIds) { 
        this.categoryIds = categoryIds; 
    }

    public List<String> getCategoryNames() { return categoryNames; }
    public void setCategoryNames(List<String> categoryNames) { 
        this.categoryNames = categoryNames; 
    }

    public List<PropertyValueResponseDTO> getPropertyValues() { return propertyValues; }
    public void setPropertyValues(List<PropertyValueResponseDTO> propertyValues) { 
        this.propertyValues = propertyValues; 
    }
}