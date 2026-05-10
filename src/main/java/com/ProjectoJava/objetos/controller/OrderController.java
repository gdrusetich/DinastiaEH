package com.ProjectoJava.objetos.controller;
import com.ProjectoJava.objetos.DTO.request.OrderLineRequestDTO;
import exceptions.NoStockException;
import exceptions.OrderNotExistsException;
import exceptions.ProductNotExistsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ProjectoJava.objetos.service.OrderService;
import com.ProjectoJava.objetos.entity.Order;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    @Autowired
    public OrderController(OrderService orderService) {
        this.service = orderService;
    }

    @PostMapping("/")
    public ResponseEntity<?> crear(@RequestBody List<OrderLineRequestDTO> items) throws ProductNotExistsException, NoStockException {

        try {

            Order nueva = service.crearPedido(items);
            return ResponseEntity.ok(nueva);
        } catch (ProductNotExistsException | NoStockException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listar() throws OrderNotExistsException, ProductNotExistsException {
        try {return ResponseEntity.ok(service.listarPedidos());}
        catch (OrderNotExistsException | ProductNotExistsException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno");
        }
    }

    @GetMapping("/filter-cheaper/{precioMaximo}")
    public ResponseEntity<?> ordenesBaratas(@PathVariable double precioMaximo) throws ProductNotExistsException {
        try {return ResponseEntity.ok(service.ordenesMasBaratasQue(precioMaximo));}
        catch (OrderNotExistsException | ProductNotExistsException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno");
        }
    }

    @GetMapping("/filter-expensive/{precioMinimo}")
    public ResponseEntity<?> ordenesCaras(@PathVariable double precioMinimo) throws ProductNotExistsException {
        try {return ResponseEntity.ok(service.ordenesMasCarasQue(precioMinimo));}
        catch (OrderNotExistsException | ProductNotExistsException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno");
        }
    }



    @GetMapping("/{id}")
    public ResponseEntity<?> buscar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.buscarOrderReturnDTO(id));
        } catch (OrderNotExistsException | ProductNotExistsException e) {
            return ResponseEntity.notFound().build();
        }
    }

}

