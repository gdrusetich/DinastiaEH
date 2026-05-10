package com.ProjectoJava.objetos.DTO.request;

public class PropertyValueRequestDTO {
    private String value;
    private Long coCategoryGroupId;

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Long getCoCategoryGroupId() { return coCategoryGroupId; }
    public void setCoCategoryGroupId(Long coCategoryGroupId) { this.coCategoryGroupId = coCategoryGroupId; }
}