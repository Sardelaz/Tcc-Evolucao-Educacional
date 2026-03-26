package com.example.tcc;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class RotasController {

    // Rota de Login / Cadastro / Esqueci a Senha
    @GetMapping("/login")
    public String login() {
        return "login";
    }

    // Rota Principal (Dashboard)
    @GetMapping({ "/", "/home" })
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
        // Futuramente, é aqui que o Java vai pegar as informações e salvar no Banco de
        // Dados.
        // O "redirect" faz a página recarregar limpa depois de salvar.
        return "redirect:/admin";
    }

    // Rota que exibe o desafio estilo Duolingo
    @GetMapping("/aula")
    public String aula() {
        return "aula";
    }

    // Painel para EDITAR as questões/aulas existentes
    @GetMapping("/admin-editar")
    public String adminEditar() {
        return "admin-editar";
    }

    // Painel para CADASTRAR Simulados específicos
    @GetMapping("/admin-simulados")
    public String adminSimulados() {
        return "admin-simulados";
    }

    // NOVO: Painel para EDITAR Simulados específicos
    @GetMapping("/admin-editar-simulados")
    public String adminEditarSimulados() {
        return "admin-editar-simulados";
    }

    // Painel Geral de Análise
    @GetMapping("/painel-geral")
    public String painelGeral() {
        return "painel-geral";
    }

    // Ranking de Jogadores
    @GetMapping("/ranking")
    public String ranking() {
        return "ranking";
    }

    // Página de Simulados
    @GetMapping("/simulados")
    public String simulados() {
        return "simulados";
    }

}