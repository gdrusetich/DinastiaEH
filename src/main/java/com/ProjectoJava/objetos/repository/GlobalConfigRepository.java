package com.ProjectoJava.objetos.repository;
import com.ProjectoJava.objetos.entity.GlobalConfig;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GlobalConfigRepository extends JpaRepository<GlobalConfig, String> {
}