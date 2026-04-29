package com.example.tcc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    // Vai buscar o seu e-mail configurado no application.properties
    @Value("${spring.mail.username}")
    private String remetente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailVerificacao(String para, String codigoOtp) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        
        // CONFIGURAÇÃO OBRIGATÓRIA QUE FALTAVA
        mensagem.setFrom(remetente); 
        
        mensagem.setTo(para);
        mensagem.setSubject("Código de Verificação - Evolução Educacional");
        mensagem.setText("Olá!\n\n"
                + "Bem-vindo(a) à Evolução Educacional! \n"
                + "O teu código de verificação é: " + codigoOtp + "\n\n"
                + "Por favor, insere este código no site para concluir a criação da sua conta.\n\n"
                + "Se não solicitou este o codigo, pode ignorar este e-mail.");
        
        mailSender.send(mensagem);
    }
}