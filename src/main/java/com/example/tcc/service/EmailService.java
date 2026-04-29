package com.example.tcc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:joaoaugustosardelasardela@gmail.com}")
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
                + "Bem-vindo(a) à Evolução Educacional! \n"
                + "O teu código de verificação é: " + codigoOtp + "\n\n"
                + "Por favor, insere este código no site para concluíres a criação da tua conta.\n\n"
                + "Se não solicitaste este registo, podes ignorar este e-mail.");
        
        mailSender.send(mensagem);
    }
}