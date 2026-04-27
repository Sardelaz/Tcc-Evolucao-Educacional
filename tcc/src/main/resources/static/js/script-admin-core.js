// Funções compartilhadas entre todos os painéis de Admin

function toggleAlternativas() {
    const tipo = document.getElementById('tipo_pergunta').value;
    const boxAlt = document.getElementById('box-alternativas');
    const selMultipla = document.getElementById('resposta_correta_multipla');
    const inputDissertativa = document.getElementById('resposta_correta_dissertativa');

    if (tipo === 'multipla') {
        boxAlt.classList.remove('hidden');
        selMultipla.classList.remove('hidden');
        inputDissertativa.classList.add('hidden');
        selMultipla.required = true;
        inputDissertativa.required = false;
    } else {
        boxAlt.classList.add('hidden');
        selMultipla.classList.add('hidden');
        inputDissertativa.classList.remove('hidden');
        selMultipla.required = false;
        inputDissertativa.required = true;
    }
}

async function fazerUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    const statusSpan = document.getElementById('upload_status');
    statusSpan.style.display = 'block';
    statusSpan.style.color = '#fff';
    statusSpan.textContent = 'A enviar...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // CORREÇÃO: Ler como JSON em vez de Text, porque o UploadService devolve um Map (JSON)
            const jsonResponse = await response.json();
            
            if (jsonResponse.erro) {
                throw new Error(jsonResponse.erro);
            }

            // Atribui apenas o valor da URL limpa ao input escondido
            document.getElementById('imagem_url').value = jsonResponse.url;
            statusSpan.style.color = '#4CAF50';
            statusSpan.textContent = 'Upload concluído com sucesso!';
        } else {
            throw new Error('Falha no upload');
        }
    } catch (error) {
        statusSpan.style.color = '#F44336';
        statusSpan.textContent = 'Erro ao enviar imagem.';
        console.error(error);
    }
}