package com.ProjectoJava.objetos.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "property_values")
public class PropertyValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    
    private String value;

    @ManyToOne
    @JoinColumn(name = "group_id") // Asegurate que en tu DB la columna se llame así
    private CoCategoryGroup coCategoryGroup;

    public PropertyValue() {}

    public Long getId() { return id; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public CoCategoryGroup getCoCategoryGroup() { return coCategoryGroup; }
    public void setCoCategoryGroup(CoCategoryGroup property) { this.coCategoryGroup = property; }
}