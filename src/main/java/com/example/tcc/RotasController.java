package com.example.tcc;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class RotasController {

    // Rota Principal (Dashboard)
    @GetMapping({"/", "/home"})
    public String index() {
        return "home"; 
    }

    // Módulo de Matemática (Razão e Proporção)
    @GetMapping("/razao")
    public String razao() {
        return "razao"; 
    }

    // Módulo de Matemática (Estatistica)
    @GetMapping("/estatistica")
    public String estatistica() {
        return "estatistica"; 
    }

    // Painel para você cadastrar as questões/aulas (Exibe a tela)
    @GetMapping("/admin")
    public String admin() {
        return "admin"; 
    }

    // Recebe o envio do formulário (POST) e recarrega a tela
    @PostMapping("/admin")
    public String salvarDesafio() {
        // Futuramente, é aqui que o Java vai pegar as informações e salvar no Banco de Dados.
        // O "redirect" faz a página recarregar limpa depois de salvar.
        return "redirect:/admin"; 
    }

    // Rota que exibe o desafio estilo Duolingo
    @GetMapping("/aula")
    public String aulaInterativa() {
        return "aula"; 
    }
}