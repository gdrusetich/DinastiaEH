package com.ProjectoJava.objetos.repository;

import com.ProjectoJava.objetos.entity.PropertyValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyValueRepository extends JpaRepository<PropertyValue, Long> {
    boolean existsByValueIgnoreCaseAndCoCategoryGroupId(String value, Long coCategoryGroupId);
    List<PropertyValue> findByCoCategoryGroupId(Long coCategoryGroupId);

}