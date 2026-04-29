package com.example.tcc.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailVerificacao(String para, String codigoOtp) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        
        // CORREÇÃO CRÍTICA: Removido o @Value("${spring.mail.username}")
        // O e-mail de envio DEVE ser o seu e-mail real e validado no Brevo.
        mensagem.setFrom("joaoaugustosardelasardela@gmail.com"); 
        
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