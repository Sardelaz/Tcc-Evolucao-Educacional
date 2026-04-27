package com.example.tcc.config;

import com.example.tcc.domain.Modulo;
import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.ModuloRepository;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class AdminSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ModuloRepository moduloRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(UsuarioRepository usuarioRepository, ModuloRepository moduloRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.moduloRepository = moduloRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@tcc.com";
        
        // Criação de Admin Base
        if (usuarioRepository.findByEmail(adminEmail).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setNome("Administrador do Sistema");
            admin.setEmail(adminEmail);
            admin.setSenha(passwordEncoder.encode("admin123")); 
            admin.setRole("ROLE_ADMIN");
            admin.setAvatar("👑");
            admin.setNivel(99);
            admin.setXp(9999);
            
            usuarioRepository.save(admin);
            System.out.println("=========================================================");
            System.out.println("✅ CONTA DE ADMINISTRADOR CRIADA COM SUCESSO (JPA)!");
            System.out.println("=========================================================");
        }

        // Semear os Módulos Padrões na Base de Dados caso esteja vazia
        if (moduloRepository.count() == 0) {
            Modulo m1 = new Modulo(); m1.setSlug("razao"); m1.setNome("Razão e Proporção"); m1.setIcone("📐"); m1.setCor("#00A8FF");
            Modulo m2 = new Modulo(); m2.setSlug("estatistica"); m2.setNome("Estatística"); m2.setIcone("📊"); m2.setCor("#9C27B0");
            Modulo m3 = new Modulo(); m3.setSlug("probabilidade"); m3.setNome("Probabilidade"); m3.setIcone("🎲"); m3.setCor("#e74c3c");
            Modulo m4 = new Modulo(); m4.setSlug("aritmetica"); m4.setNome("Aritmética Básica"); m4.setIcone("➗"); m4.setCor("#4CAF50");
            moduloRepository.saveAll(List.of(m1, m2, m3, m4));
            System.out.println("✅ MÓDULOS PADRÕES SEMEADOS NO BANCO DE DADOS!");
        }
    }
}