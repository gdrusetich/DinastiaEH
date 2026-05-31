package com.ProjectoJava.objetos.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Table(name = "co_categories_group")
public class CoCategoryGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String type;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "category_cocategory_relation",
        joinColumns = @JoinColumn(name = "cocategory_group_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @JsonIgnore
    private Set<Category> categories = new HashSet<>();

    @OneToMany(mappedBy = "coCategoryGroup", fetch = FetchType.EAGER)
    @OrderBy("value ASC")
    private List<PropertyValue> propertyValues = new ArrayList<>();

    public CoCategoryGroup() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; } // Agregalo si no estaba
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Set<Category> getCategories() { return categories; }
    public void setCategories(Set<Category> categories) { this.categories = categories; }

    public List<PropertyValue> getPropertyValues() { 
        return propertyValues; 
    }
    public void setPropertyValues(List<PropertyValue> propertyValues) { 
        this.propertyValues = propertyValues; 
    }
}