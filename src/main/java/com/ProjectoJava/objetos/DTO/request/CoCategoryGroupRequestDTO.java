package com.ProjectoJava.objetos.DTO.request;
import java.util.List;

public class CoCategoryGroupRequestDTO {
    private String name;
    private String type;
    private List<Long> categoryIds; // Agregamos esto para recibir los IDs de los checkboxes

    public CoCategoryGroupRequestDTO() {}

    public List<Long> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<Long> categoryIds) { this.categoryIds = categoryIds; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}