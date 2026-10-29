<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Supabase PAT & MCP Integration
- **Token Expiration**: The Supabase Personal Access Token (PAT) for the Samppel project expires on **04 Jan 2027**. Remind the user when approaching this date.

# Sistema de Checkup e Protocolo de Integridade
- **Cadastro Obrigatório de Novas Funcionalidades:** Toda nova funcionalidade ou módulo implementado DEVE ser imediatamente adicionado à matriz em [docs/CHECKUP_MATRIX.md](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/docs/CHECKUP_MATRIX.md).
- **Validação Cruzada de Não-Regressão:** Toda modificação deve verificar os módulos dependentes mapeados na matriz para evitar efeitos colaterais.
- **Alerta Prévio Obrigatório com Opções:** Se qualquer quebra ou inconsistência entre funcionalidades for identificada, o assistente **DEVE SEMPRE AVISAR O USUÁRIO ANTES DE TOMAR QUALQUER DECISÃO**, apresentando no mínimo duas opções de solução para escolha do usuário.
- **Carimbo de Data:** Atualizar o campo `Última Alteração` do módulo correspondente em `docs/CHECKUP_MATRIX.md` sempre que alterar arquivos relacionados.
- **Execução do Checkup:** Ao comando de "checkup", "check" ou "varredura", seguir a skill `.agents/skills/system-checkup/SKILL.md` e rodar `npm run checkup`.


