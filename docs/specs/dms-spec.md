# Document Management System Specification

## 1. Objetivo

Entregar uma aplicação web simples que permita enviar documentos, listar seus metadados e baixar o arquivo pelo identificador, mantendo cada documento associado a um proprietário local, com persistência física exclusivamente em filesystem local.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por `multipart/form-data`.
- Registro em memória dos metadados do documento enviado.
- Gravação do conteúdo no diretório `backend/storage` via `multer.diskStorage`.
- Listagem de todos os documentos cadastrados.
- Download de um documento pelo identificador público.
- Campo `owner` para identificação simples do usuário/dono.
- Interface React mínima para envio, listagem e download.
- Testes backend focados em saúde, upload, listagem e download.

### Fora do escopo

- Armazenamento externo, em nuvem ou serviço de terceiros.
- Versionamento de documentos.
- Autenticação, autorização, ACL ou segregação de documentos por usuário.
- Banco de dados ou persistência de metadados após reinicialização do processo.
- Exclusão ou substituição de documentos.
- Pesquisa avançada, filtros, ordenação persistente ou auditoria.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo por `POST /upload`; o envio deve conter um campo multipart `file`. |
| RF-02 | Ao aceitar o upload, o sistema cria um identificador único e registra nome original, nome físico de armazenamento, tamanho, tipo MIME, data ISO 8601 e proprietário. |
| RF-03 | O sistema grava o conteúdo recebido exclusivamente em `backend/storage` usando `multer.diskStorage`. |
| RF-04 | O sistema deve aceitar um campo multipart opcional `owner`; quando ausente ou vazio, usa `anonymous`. |
| RF-05 | O usuário pode listar documentos por `GET /documents`; a resposta inclui metadados públicos e não inclui o nome físico interno. |
| RF-06 | A listagem não aplica filtros ou controle de acesso nesta fase e retorna todos os metadados disponíveis em memória. |
| RF-07 | O usuário pode baixar um documento por `GET /documents/:id/download`. |
| RF-08 | O download responde com o conteúdo binário e usa `Content-Disposition: attachment` com o nome original. |
| RF-09 | Um identificador inexistente ou sem arquivo físico correspondente retorna erro 404. |
| RF-10 | Um upload sem arquivo deve ser rejeitado com erro 400 e não deve criar metadados nem arquivo. |
| RF-11 | A interface React deve permitir escolher um arquivo, opcionalmente informar o dono, enviar, listar documentos e iniciar o download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Backend Node.js + Express 5, JavaScript CommonJS. |
| RNF-02 | Upload implementado com `multer.diskStorage`; nenhum provedor externo é permitido. |
| RNF-03 | Arquivos gravados em `backend/storage`; o diretório precisa ser criado na inicialização ou ser pré-existente. |
| RNF-04 | Metadados mantidos em memória por uma estrutura da camada repository durante o tempo de execução. |
| RNF-05 | Configuração sensível à implantação por variáveis de ambiente, incluindo `PORT` e opcionalmente `MAX_FILE_SIZE_BYTES`; valores padrão só podem ser definidos no código. |
| RNF-06 | Arquitetura backend em camadas simples: `routes -> controllers -> services -> repositories`; cada camada conhece apenas a camada seguinte. |
| RNF-07 | Erros HTTP JSON seguem um formato consistente: `{ "error": { "code": "STRING", "message": "string" } }`. |
| RNF-08 | O frontend usa React/Vite, componentes funcionais e comunicação HTTP via `fetch` pelo prefixo `/api`. |
| RNF-09 | Nome do arquivo físico nunca deve permitir sobrescrita de uploads anteriores; o repositório gera um nome único. |
| RNF-10 | Conteúdo e metadados só são considerados um upload válido após a criação do registro em memória e a gravação física terem concluído. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Origem | Descrição |
| --- | --- | --- | --- |
| `id` | string | gerado pelo sistema | Identificador público único, recomendado UUID v4. |
| `originalName` | string | `file.originalname` | Nome fornecido pelo cliente no upload. |
| `size` | number | `file.size` | Tamanho em bytes. |
| `mimeType` | string | `file.mimetype` | Tipo MIME informado pelo Multer. |
| `uploadedAt` | string | gerado no aceite | Data/hora UTC em ISO 8601, por exemplo `2026-11-23T12:00:00.000Z`. |
| `owner` | string | campo multipart `owner` | Proprietário informado; usa `anonymous` quando vazio ou ausente. |

### Campo interno

| Campo | Tipo | Uso |
| --- | --- | --- |
| `storedName` | string | Nome físico único usado pelo repositório em `backend/storage`; nunca é exposto pelas rotas públicas. |

### Invariantes

- `id`, `originalName`, `storedName`, `uploadedAt` e `owner` não podem estar vazios após normalização.
- `size` deve ser inteiro não negativo.
- `storedName` deve identificar um arquivo dentro de `backend/storage` e não pode conter caminho fornecido pelo cliente.
- Uma entrada em memória só é criada após o arquivo estar gravado.
- Reiniciar o backend limpa metadados; arquivos órfãos não podem ser registrados automaticamente nesta fase.

## 6. Contratos de API

### Convenções

- Base da API backend: `/`; o frontend faz `/api/<rota>` e o proxy Vite remove `/api`.
- Header de sucesso JSON: `Content-Type: application/json`.
- Erros JSON: `{ "error": { "code": "STRING", "message": "string" } }`.
- Datas em UTC e formato ISO 8601.
- Nomes públicos usam `camelCase`.

### POST /upload

Entrada: `multipart/form-data`

- `file`: arquivo obrigatório.
- `owner`: texto opcional.
- Limite: aplicado pelo Multer com `MAX_FILE_SIZE_BYTES`, quando definido; a implementação pode usar um valor padrão seguro definido na configuração da aplicação.

Resposta `201 Created`:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "ana"
}
```

Erros:

- `400 Bad Request`, código `FILE_REQUIRED`, quando nenhum campo `file` é enviado.
- `413 Payload Too Large`, código `FILE_TOO_LARGE`, quando o conteúdo exceder o limite configurado.
- `500 Internal Server Error`, código `UPLOAD_FAILED`, em falha de escrita ou registro.

### GET /documents

Entrada: nenhuma.

Resposta `200 OK`:

```json
[
  {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-11-23T12:00:00.000Z",
    "owner": "ana"
  }
]
```

Lista vazia: `[]` com status `200`. Não há paginação nesta fase.

Erros:

- `500 Internal Server Error`, código `LIST_FAILED`, em falha interna da leitura do repositório.

### GET /documents/:id/download

Entrada: `id` como segmento de URL.

Resposta `200 OK`:

- Corpo binário do arquivo.
- `Content-Type`: MIME registrado no metadado, com fallback seguro para `application/octet-stream`.
- `Content-Disposition`: `attachment; filename="<originalName>"`.
- `Content-Length`: tamanho registrado, quando disponível.

Erros:

- `404 Not Found`, código `DOCUMENT_NOT_FOUND`, quando o identificador não existe ou o arquivo físico não está disponível.
- `500 Internal Server Error`, código `DOWNLOAD_FAILED`, em falha interna ao abrir o arquivo.

### GET /health

Resposta `200 OK`: `{ "status": "ok" }`.

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples: rotas recebem HTTP, controllers tratam entrada/resposta, services concentram regras, repositories persistem metadados e coordenam arquivo local.
- O fluxo obrigatório é `routes -> controllers -> services -> repositories`; nenhuma camada interna importa Express ou objeto `req/res`.
- Multer deve usar `diskStorage` e escrever em `backend/storage`; upload temporário ou provedor externo não é permitido.
- O nome físico é gerado pelo servidor com UUID; o nome original nunca é usado diretamente como caminho.
- Metadados são mantidos em memória nesta fase e podem ser perdidos ao reiniciar o processo.
- Ausência de autenticação é explícita: `owner` é apenas uma etiqueta atribuída no upload e não restringe listagem ou download.
- Frontend comunica-se por `/api`; o Vite redireciona para `http://localhost:3000` removendo o prefixo.

## 8. Plano de execução

### Fase 1 - Fundação e armazenamento

1. Criar a estrutura de diretórios em `backend/src/{routes,controllers,services,repositories}` e confirmar `backend/storage`.
2. Implementar o repositório em memória para metadados e operações básicas de criar, listar e buscar por `id`.
3. Configurar `multer.diskStorage` com destino `backend/storage` e nome físico gerado por UUID.
4. Declarar configuração de porta e limite opcional por ambiente, mantendo `PORT` e `MAX_FILE_SIZE_BYTES` compatíveis com 12-Factor.

Dependência: esta fase precede os endpoints que aceitam arquivo.

### Fase 2 - Regras de upload e download

1. Implementar o service de documento para validar arquivo, normalizar `owner`, gerar metadados e chamar o repositório.
2. Implementar o controller de upload com resposta `201` e erros `400/413/500`.
3. Implementar `POST /upload` na rota Express, usando o middleware Multer.
4. Implementar os services de listagem e busca por identificador.
5. Implementar `GET /documents` e `GET /documents/:id/download`.
6. Tratar `404` e erros internos sem vazamento de caminhos físicos ou detalhes de stack.

Dependência: depende da Fase 1 e pode ser integrada em paralelo à preparação do frontend após os contratos ficarem estáveis.

### Fase 3 - Interface React

1. Criar `frontend/src/services/documentService.js` com `fetch` para upload, listagem e download via `/api`.
2. Criar `UploadComponent` com seleção de arquivo, campo opcional `owner`, estado de envio e feedback.
3. Criar `DocumentList` e `DownloadButton` usando os metadados públicos retornados pela API.
4. Integrar os componentes em `App.jsx` e cobrir estados vazio, carregando, sucesso e erro.

Dependência: depende dos contratos das rotas, mas pode começar com mocks locais antes da integração.

### Fase 4 - Testes e integração

1. Adicionar testes backend para saúde, upload válido, upload sem arquivo, listagem vazia e listagem após upload.
2. Testar download por ID válido e respostas `404` para ID inexistente.
3. Testar limpeza ou remoção do arquivo usado nos testes e evitar metadados residuais entre casos.
4. Validar o proxy Vite executando backend na porta 3000 e frontend na porta 5173.
5. Executar `npm test` no backend e `npm run build` no frontend.

## 9. Critérios de aceite

- O upload aceita `multipart/form-data`, cria metadados públicos e grava o arquivo em `backend/storage`.
- Nenhum nome físico interno é exposto pela API.
- A listagem retorna somente metadados públicos e respeita `owner` informado ou `anonymous`.
- O download resolve o arquivo pelo `id`, entrega o nome original no header e retorna `404` sem inconsistências.
- Arquivos pequenos e nomes com caracteres especiais não sobrescrevem arquivos anteriores.
- O backend pode reiniciar e voltar com metadados vazios sem alterar arquivos existentes em disco.
- O frontend é capaz de enviar, listar e iniciar download sem alterações diretas no backend.

## 10. Decisões e limites assumidos

- `owner` não é obtido por autenticação nesta versão; o frontend o envia como campo opcional.
- Ausência de `owner` gera `anonymous`; não se cria usuário ou tabela separada.
- `storedName` é interno e não faz parte do contrato público.
- Não há exclusão de documento, filtro por proprietário, limite obrigatório de quantidade ou cache externo.
- Caso o arquivo físico exista mas o metadado não exista, ele não é baixável pela API.
- O plano evita prover um limite de tamanho fixo no contrato e recomenda configurá-lo por variável de ambiente.