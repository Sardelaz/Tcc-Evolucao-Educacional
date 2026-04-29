package com.example.tcc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    // Recupera o email do remetente das propriedades
    @Value("${spring.mail.username}")
    private String remetente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailVerificacao(String para, String codigoOtp) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        
        mensagem.setFrom(remetente); 
        mensagem.setTo(para);
        mensagem.setSubject("Código de Verificação - Evolução Educacional");
        mensagem.setText("Olá!\n\n"
                + "Seja bem-vindo(a) à Evolução Educacional! \n"
                + "O seu código de verificação é: " + codigoOtp + "\n\n"
                + "Insira este código no site para ativar a sua conta.");
        
        try {
            mailSender.send(mensagem);
        } catch (Exception e) {
            // Lança a exceção para que o AuthController saiba que falhou
            throw new RuntimeException("Erro ao disparar e-mail: " + e.getMessage());
        }
    }
}