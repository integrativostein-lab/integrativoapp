const axios = require('axios');
const fs = require('fs');

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_TOKEN;

async function uploadArquivo(caminhoLocal, nomeArquivoDestino) {
  try {
    const fileContent = fs.readFileSync(caminhoLocal);
    const response = await axios({
      method: 'post',
      url: 'https://content.dropboxapi.com/2/files/upload',
      headers: {
        'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: '/' + nomeArquivoDestino,
          mode: 'add',
          autorename: true,
          mute: false
        }),
        'Content-Type': 'application/octet-stream'
      },
      data: fileContent
    });
    
    // Gerar link compartilhado
    const sharedLinkResponse = await axios({
      method: 'post',
      url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
      headers: {
        'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        path: response.data.path_lower,
        settings: { requested_visibility: 'public' }
      }
    });

    return sharedLinkResponse.data.url.replace('?dl=0', '?dl=1');
  } catch (error) {
    console.error('Erro no upload para Dropbox:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { uploadArquivo };
