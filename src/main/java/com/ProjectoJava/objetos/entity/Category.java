package com.ProjectoJava.objetos.entity;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parent;

    @ManyToMany
    @JoinTable(
        name = "category_co_category_group", // Nombre de tabla intermedia estándar
        joinColumns = @JoinColumn(name = "category_id"),
        inverseJoinColumns = @JoinColumn(name = "co_category_group_id")
    )
    private Set<CoCategoryGroup> coCategoriesGroup = new HashSet<>();

    public Category() {}
    
    public Category(String name) { 
        this.name = name; 
    }

    public Category(String name, Category parent) {
        this.name = name;
        this.parent = parent;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Category getParent(){ return parent; }
    public Set<CoCategoryGroup> getCoCategoriesGroup() { return coCategoriesGroup; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setParent(Category parent){ this.parent = parent; }
    public void setCoCategoriesGroup(Set<CoCategoryGroup> coCategoriesGroup) { 
    this.coCategoriesGroup = coCategoriesGroup; 
    }
}