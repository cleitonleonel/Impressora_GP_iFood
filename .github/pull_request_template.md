# Resumo

Este PR melhora a experiência no Linux ao reduzir configuração manual de impressora.

# O que foi alterado

- Seleção automática da impressora no backend com fallback.
- Suporte à impressora padrão do CUPS (Ubuntu/Linux).
- Retorno de `defaultPrinter` no endpoint `GET /printers`.
- Tratamento de payload sem `printerConfig` completo.
- Documentação atualizada no `README`.

# Ordem de resolução da impressora

1. Impressora enviada no payload (se existir no sistema).
2. `PRINTER_NAME` (variável de ambiente, opcional).
3. Impressora padrão via `node-printer`.
4. Impressora padrão via CUPS (`lpstat -d` / `lpoptions -d`).
5. Primeira impressora disponível.

# Motivação

No Linux, muitos usuários já têm impressora térmica configurada no CUPS, mas não sabem coletar manualmente nome/caminho/fabricante para o payload. Este PR simplifica a instalação e reduz erros de configuração.

# Como validar

1. Configurar impressora padrão no sistema:
   - `lpstat -p -d`
   - `lpoptions -d NOME_DA_IMPRESSORA`
2. Subir o servidor: `node server.js`
3. Consultar `GET /printers` e conferir `defaultPrinter`.
4. Enviar `POST /print` sem `printerConfig` completo e validar impressão.

# Compatibilidade

- Mantém compatibilidade com payload antigo (quando `printerConfig` é enviado).
- Adiciona comportamento automático para cenários incompletos.

# Checklist

- [ ] Código testado localmente no Linux/CUPS
- [ ] Fluxo com payload completo continua funcionando
- [ ] Fluxo com payload incompleto funciona com impressora padrão
- [ ] README atualizado