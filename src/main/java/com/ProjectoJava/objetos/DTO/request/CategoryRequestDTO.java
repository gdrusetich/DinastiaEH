package com.ProjectoJava.objetos.DTO.request;

import java.util.HashSet;
import java.util.Set;

public class CategoryRequestDTO {
    private String name;
    private Long parentId; 
    private Set<Long> coCategoryGroupIds = new HashSet<>();
}