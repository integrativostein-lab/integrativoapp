module.exports = {
  // Configurações para a CPU dedicada que você contratará
  CPU_EXTERNA: {
    IP: process.env.CPU_IP || '0.0.0.0',
    DOMINIO: process.env.CPU_DOMINIO || 'sua-cpu.integrativo.app'
  },
  
  // Integração Plug-n-Meet (Vídeo)
  PLUGNMEET: {
    URL: process.env.PLUGNMEET_URL || 'https://video.integrativo.app',
    API_KEY: process.env.PLUGNMEET_API_KEY || 'sua_api_key',
    API_SECRET: process.env.PLUGNMEET_API_SECRET || 'seu_api_secret'
  },

  // Processamento de Voz (STT) - Caso use servidor próprio
  VOZ_IA_URL: process.env.VOZ_IA_URL || 'https://stt.integrativo.app/process'
};
