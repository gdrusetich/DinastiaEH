package com.ProjectoJava.objetos.entity;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;
import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProducto;
    @Column(nullable = false, unique = true)
    private String title;
    private double price;
    @Column(name = "fecha_ultimo_precio")
    private LocalDate fechaUltimoPrecio;
    @Column(name = "oculto")
    private Boolean oculto = false;
    private Boolean featured = false;
    private int stock;
    @Column(columnDefinition = "TEXT")
    private String description;
    @ManyToMany
    @JoinTable( name = "product_categories",
                joinColumns = @JoinColumn(name = "product_id"),
                inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @ManyToMany
    @JoinTable( name = "product_property_values",
                joinColumns = @JoinColumn(name = "product_id"),
                inverseJoinColumns = @JoinColumn(name = "property_value_id"))
    private Set<PropertyValue> propertyValues = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "main_image_id")
    private Image mainImage;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Image> images = new LinkedHashSet<>();
    
    public Product(){
        this.fechaUltimoPrecio=java.time.LocalDate.now();
    }

    public Long getId(){return this.idProducto;}
    public String getTitle(){return this.title;}
    public double getPrice( ){return this.price;}
    public LocalDate getFechaUltimoPrecio(){return this.fechaUltimoPrecio;}
    public Boolean isOculto() {if (oculto == null) return false; return oculto;}
    public Boolean isFeatured() {return this.featured;}
    public int getStock( ){return this.stock;}
    public String getDescription(){return this.description;}
    public Image getMainImage(){return this.mainImage;}
    public Set<Category> getCategories(){return this.categories;}
    public Set<PropertyValue> getPropertyValues(){return this.propertyValues;}
    public Set<Image> getImages(){return this.images;}
    public void setTitle(String newTitle){this.title = newTitle;}
    public void setPrice(double newPrice){
        this.price = newPrice;
        this.fechaUltimoPrecio = LocalDate.now();
    }
    public void setFechaUltimoPrecio(LocalDate unaFecha){this.fechaUltimoPrecio = unaFecha;}
    public void setOculto(Boolean oculto){this.oculto = oculto;}
    public void setFeatured(Boolean featured){this.featured = featured;}
    public void setStock(int nuevoStock){this.stock = nuevoStock;}
    public void setDescription(String nuevaDescripcion){this.description = nuevaDescripcion;}
    public void setCategories(Set<Category> nuevaCategoria){this.categories = nuevaCategoria;}
    public void setPropertyValues(Set<PropertyValue> nuevaPropertyValue){this.propertyValues = nuevaPropertyValue;}
    public void setMainImage(Image nuevaMainImage){this.mainImage = nuevaMainImage;}
    public void setImageURL(Set<Image> nuevaImagen){this.images  = nuevaImagen;}
    public void addCategory(Category unCategory){this.categories.add(unCategory);}
    public void addPropertyValue(PropertyValue unPropertyValue){
        this.propertyValues.add(unPropertyValue);
    }
    public void addImage(Image image) {
        this.images.add(image);
        image.setProduct(this);
        if (this.mainImage == null) {
            this.mainImage = image;
        }
    }
    double precioConDescuento(double descuento){
        return price - price * descuento;
    }

}