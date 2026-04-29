package com.example.tcc.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailVerificacao(String para, String codigoOtp) {
        log.info("Iniciando envio de e-mail via Mailjet para: {}", para);

        SimpleMailMessage mensagem = new SimpleMailMessage();
        
        // IMPORTANTE: Este tem de ser exatamente o e-mail validado no Mailjet
        mensagem.setFrom("joaoaugustosardelasardela@gmail.com"); 
        
        mensagem.setTo(para);
        mensagem.setSubject("Código de Verificação - Evolução Educacional");
        mensagem.setText("Olá!\n\n"
                + "Seja bem-vindo(a) à Evolução Educacional! \n"
                + "O seu código de verificação é: " + codigoOtp + "\n\n"
                + "Insira este código no site para ativar a sua conta.");
        
        try {
            mailSender.send(mensagem);
            log.info("✅ E-MAIL ENVIADO COM SUCESSO!");
        } catch (Exception e) {
            log.error("❌ Falha na autenticação SMTP: {}", e.getMessage());
            throw new RuntimeException("Erro ao disparar e-mail: Authentication failed");
        }
    }
}