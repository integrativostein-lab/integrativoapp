const express = require("express");
const router = express.Router();

// Placeholder para rotas de entidades. Será implementado na fase de FHIR.
router.get("/", (req, res) => {
  res.json({ mensagem: "Rota de entidades (placeholder) - a ser implementada com FHIR." });
});

module.exports = router;
