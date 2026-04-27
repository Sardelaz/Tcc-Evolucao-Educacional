package com.example.tcc.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Impede que a falta de um ícone (favicon.ico) ou imagem cause um erro 500
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Void> handleNotFound(NoResourceFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    // NOVO: Trata erros de validações automáticas (@Valid, @NotEmpty, @Min)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            erros.put("erro", error.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erros);
    }

    // Trata erros de lógica de negócio (como as alternativas iguais no FaseService)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, String> erro = new HashMap<>();
        erro.put("erro", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        Map<String, String> erro = new HashMap<>();
        erro.put("erro", "Falha na operação: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception ex) {
        Map<String, String> erro = new HashMap<>();
        erro.put("erro", "Ocorreu um erro interno no servidor.");
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
    }
}