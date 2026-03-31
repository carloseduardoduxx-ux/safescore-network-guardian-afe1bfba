

## Plano: GitHub Actions para gerar o .exe automaticamente

### Pré-requisito
O projeto precisa estar conectado ao GitHub. Se ainda não estiver, será necessário conectar via **Project Settings → GitHub**.

### O que será criado

**1. Workflow GitHub Actions** (`.github/workflows/build-agent.yml`)
- Roda em runner **Windows** (`windows-latest`)
- Instala Python 3.11 + dependências (`requests`, `nuitka`, `ordered-set`, `zstandard`)
- Compila `public/safescore-agent.py` com Nuitka em modo `--onefile`
- Publica o `SafeScoreAgent.exe` como **Release artifact** para download direto
- Trigger: manual (`workflow_dispatch`) + push quando `public/safescore-agent.py` for alterado

**2. Atualização da página de download no app**
- Adicionar link direto para a página de Releases do GitHub onde o `.exe` ficará disponível
- Instruções simplificadas: "Baixe o .exe pronto, sem precisar instalar nada"

### Fluxo para o usuário final
1. Você edita o `safescore-agent.py` no Lovable
2. O código sincroniza automaticamente com o GitHub
3. O GitHub Actions compila o `.exe` em ~3-5 minutos
4. O `.exe` fica disponível na aba **Releases** do repositório
5. Clientes baixam direto de lá

### Arquivos alterados
| Arquivo | Ação |
|---|---|
| `.github/workflows/build-agent.yml` | Criar |
| `src/pages/NetworkInventory.tsx` | Atualizar link de download |

