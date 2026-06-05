const VOZ_SISTEMA = {
  iniciar: (callbackSucesso) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      callbackSucesso(texto);
    };

    recognition.onerror = (event) => {
      console.error('Erro na voz:', event.error);
    };

    recognition.start();
  }
};
