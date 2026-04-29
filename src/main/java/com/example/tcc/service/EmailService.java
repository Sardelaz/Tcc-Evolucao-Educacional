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
        
        // Remetente fixado. DEVE ser o seu e-mail do Gmail validado no Brevo
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
            throw new RuntimeException("Erro ao disparar e-mail: " + e.getMessage());
        }
    }
}