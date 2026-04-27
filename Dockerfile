# Estágio 1: Build (Compilação)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copia o pom.xml e a pasta tcc para dentro do container
COPY pom.xml .
COPY tcc/ ./tcc/

# Executa o Maven apontando para o arquivo de projeto dentro da subpasta
RUN mvn -f tcc/pom.xml clean package -DskipTests

# Estágio 2: Execução
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copia o JAR que o Maven gerou dentro da pasta target da subpasta tcc
COPY --from=build /app/tcc/target/*.jar app.jar

EXPOSE 8080

# Comando para rodar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]