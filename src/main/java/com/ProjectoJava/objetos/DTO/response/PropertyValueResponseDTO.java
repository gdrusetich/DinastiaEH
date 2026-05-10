package com.ProjectoJava.objetos.DTO.response;

import com.ProjectoJava.objetos.entity.PropertyValue;;

public class PropertyValueResponseDTO {
    private Long id;
    private String value;
    private String coCategoryName; // Opcional, útil para mostrar en tablas
    private Long coCategoryGroupId;

    public PropertyValueResponseDTO() {}

    public PropertyValueResponseDTO(Long id, String value, String groupName) {
        this.id = id;
        this.value = value;
        this.coCategoryName = groupName;
    }

    public PropertyValueResponseDTO(PropertyValue entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.value = entity.getValue();
                if (entity.getCoCategoryGroup() != null) {
                this.coCategoryGroupId = entity.getCoCategoryGroup().getId();
                this.coCategoryName = entity.getCoCategoryGroup().getName();
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getCoCategoryName() { return coCategoryName; }
    public void setCoCategoryName(String groupName) { this.coCategoryName = groupName; }
    public Long getCoCategoryGroupId() { return coCategoryGroupId; }
    public void setCoCategoryGroupId(Long id) { this.coCategoryGroupId = id; }
}