package com.example.tcc.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class RotasController {

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping({ "/", "/home" })
    public String index() {
        return "home";
    }

    // Rota Genérica para os Módulos Cadastrados Dinamicamente
    @GetMapping("/m/{slug}")
    public String moduloGenerico(@PathVariable String slug, Model model) {
        model.addAttribute("moduloSlug", slug);
        return "modulo-template";
    }

    // Mantido por retrocompatibilidade se existirem links salvos
    @GetMapping("/razao")
    public String razao(Model model) {
        model.addAttribute("moduloSlug", "razao");
        return "modulo-template";
    }

    @GetMapping("/estatistica")
    public String estatistica(Model model) {
        model.addAttribute("moduloSlug", "estatistica");
        return "modulo-template";
    }

    @GetMapping("/admin")
    public String admin() {
        return "admin";
    }

    @PostMapping("/admin")
    public String salvarDesafio() {
        return "redirect:/admin";
    }

    @GetMapping("/aula")
    public String aula() {
        return "aula";
    }

    @GetMapping("/admin-editar")
    public String adminEditar() {
        return "admin-editar";
    }

    @GetMapping("/admin-simulados")
    public String adminSimulados() {
        return "admin-simulados";
    }

    @GetMapping("/admin-editar-simulados")
    public String adminEditarSimulados() {
        return "admin-editar-simulados";
    }

    @GetMapping("/painel-geral")
    public String painelGeral() {
        return "painel-geral";
    }

    @GetMapping("/ranking")
    public String ranking() {
        return "ranking";
    }

    @GetMapping("/simulados")
    public String simulados() {
        return "simulados";
    }

    @GetMapping("/galeria")
    public String galeria() {
        return "galeria";
    }

    @GetMapping("/admin-video")
    public String adminVideo() {
        return "admin-video";
    }

    @GetMapping("/desempenho")
    public String desempenho() {
        return "desempenho";
    }

    @GetMapping("/admin-conquistas")
    public String adminConquistas() {
        return "admin-conquistas";
    }

    // Nova Rota do Formulário de Criação de Módulo
    @GetMapping("/admin-modulos")
    public String adminModulos() {
        return "admin-modulos";
    }

    @GetMapping("/loja")
    public String loja() {
        return "loja";
    }

    @GetMapping("/admin-editar-conquistas")
    public String adminEditarConquistas() {
        return "admin-editar-conquistas";
    }

    @GetMapping("/admin-editar-video")
    public String adminEditarVideo() {
        return "admin-editar-video";
    }
}