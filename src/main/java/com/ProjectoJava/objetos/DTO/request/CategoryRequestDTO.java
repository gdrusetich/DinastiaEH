package com.ProjectoJava.objetos.DTO.request;
import java.util.HashSet;
import java.util.Set;

public class CategoryRequestDTO {
    private String name;
    private Long parentId;
    private Set<Long> coCategoryGroupIds = new HashSet<>();
    public CategoryRequestDTO() {
    }
    public CategoryRequestDTO(String name, Long parentId, Set<Long> coCategoryGroupIds) {
        this.name = name;
        this.parentId = parentId;
        this.coCategoryGroupIds = coCategoryGroupIds;
    }

    public String getName() {return name;}
    public void setName(String name) {this.name = name;}
    public Long getParentId() {return parentId;}
    public void setParentId(Long parentId) {this.parentId = parentId;}
    public Set<Long> getCoCategoryGroupIds() {return coCategoryGroupIds;}
    public void setCoCategoryGroupIds(Set<Long> coCategoryGroupIds) {this.coCategoryGroupIds = coCategoryGroupIds;}
}