package com.ProjectoJava.objetos.repository;

import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Category;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoCategoryGroupRepository extends JpaRepository<CoCategoryGroup, Long> {
    List<CoCategoryGroup> findByCategoriesContaining(Category category);
    boolean existsByNameIgnoreCase(String name);
}