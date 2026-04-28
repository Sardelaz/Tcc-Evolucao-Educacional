# 🎓 Evolução Educacional - TCC

Uma plataforma educacional desenvolvida como Trabalho de Conclusão de Curso (TCC) para incentivar a evolução diária dos alunos. A aplicação oferece uma experiência interativa e imersiva com suporte a gamificação (música e efeitos sonoros) e configuração multilingue.

🚀 **Acesso ao projeto em produção:** [Evolução Educacional no Render](https://tcc-evolucao-educacional.onrender.com/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar Localmente](#-como-executar-localmente)
- [Licença](#-licença)

---

## 📖 Sobre o Projeto

O **Evolução Educacional** é uma aplicação web interativa concebida para auxiliar no processo de aprendizagem dos alunos. Através de um ambiente personalizável, o utilizador pode focar-se nos seus estudos com uma interface amigável, ajustes de acessibilidade e um sistema de autenticação seguro.

---

## ✨ Funcionalidades

- **Autenticação de Utilizadores:**
  - Login seguro.
  - Registo de novos utilizadores ("Comece a sua jornada").
  - Recuperação de palavra-passe.
- **Painel de Configurações (Ajustes):**
  - **Idioma:** Suporte multilingue (Português, Inglês, Espanhol).
  - **Áudio e Imersão:** Controlo de volume de música ambiente e efeitos sonoros (SFX).
- **Interface Responsiva:** Ecrãs adaptados para dispositivos móveis, tablets e desktops (HTML, CSS e JS nativos).
- **Deploy na Cloud:** Aplicação alojada e disponível online na plataforma Render.

---

## 🛠 Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando as seguintes tecnologias:

### Front-End
- **HTML5** & **CSS3** (Interface de utilizador e design responsivo)
- **JavaScript** (Lógica de interação, controle de áudio e definições do cliente)

### Back-End
- **Java** (Linguagem principal)
- **Maven** (Gestão de dependências e build do projeto - `pom.xml` / `mvnw`)

### Infraestrutura e Deploy
- **Docker** (Contentorização da aplicação via `Dockerfile`)
- **Render** (Plataforma de alojamento Cloud)

---

## 📂 Estrutura do Projeto

A organização de pastas baseia-se num padrão de projeto Java/Maven:

```bash
Tcc-Evolucao-Educacional/
├── src/                # Código-fonte Java e recursos estáticos (HTML, CSS, JS)
├── uploads/            # Diretório para o upload de ficheiros de utilizadores/sistema
├── .gitattributes      # Configurações do Git
├── .gitignore          # Ficheiros ignorados pelo Git
├── Dockerfile          # Configurações de contentorização para o Docker
├── mvnw / mvnw.cmd     # Scripts do Maven Wrapper
└── pom.xml             # Ficheiro de configuração do Maven (Dependências)
```

---

🚀 Como Executar Localmente
Pré-requisitos
Antes de começar, certifique-se de que tem as seguintes ferramentas instaladas no seu computador:

- Java JDK (Versão 11 ou superior recomendada)
- Git
- Opcional: Docker (caso prefira executar via contentores)

Passos para a execução (via Maven)
Clone o repositório:

```
Bash
git clone [https://github.com/Sardelaz/Tcc-Evolucao-Educacional.git](https://github.com/Sardelaz/Tcc-Evolucao-Educacional.git)
Navegue para a pasta do projeto:

Bash
cd Tcc-Evolucao-Educacional
Compile e execute a aplicação:
Utilizando o Maven Wrapper incluído no projeto:
````
---

No Windows:

```
DOS
mvnw.cmd spring-boot:run

````

No Linux/macOS:

```
Bash
./mvnw spring-boot:run
```

Aceda à aplicação:
Abra o seu navegador e vá até: http://localhost:8080 (A porta predefinida pode variar mediante a sua configuração).

Executar com Docker
Se pretender utilizar o Docker, pode fazer o build da imagem localmente através do ficheiro Dockerfile incluído no repositório:

```
Bash
# Construir a imagem
docker build -t evolucao-educacional .

# Executar o contentor
docker run -p 8080:8080 evolucao-educacional
```

📝 Licença
Este projeto foi desenvolvido com propósitos académicos (Trabalho de Conclusão de Curso).

Desenvolvido por Sardelaz.
