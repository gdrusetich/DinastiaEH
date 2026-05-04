package com.ProjectoJava.objetos.entity;
import jakarta.persistence.*;
import java.time.LocalTime;
@Entity

public class HorarioAtencion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String diaSemana; // "Lunes", "Martes", etc.
    private LocalTime horaApertura;
    private LocalTime horaCierre;
    private boolean cerrado; // Por si querés marcar un día como "Cerrado" sin borrar el horario

}