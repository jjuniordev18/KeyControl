# 🔑 KeyControl

Sistema de gestão inteligente de retirada e devolução de chaves.

## Funcionalidades

- 📱 **Mobile-first** - Interface otimizada para smartphone
- ☁️ **Sincronização Firebase** - Dados na nuvem
- 📊 **Dashboard** - Estatísticas em tempo real
- 🔍 **Filtros** - Busca por nome, código, local ou status
- 🌙 **Dark Mode** - Tema automático
- 📄 **Export** - PDF e CSV
- 🔐 **Admin** - Gerenciamento de ativos

## Tech Stack

- Vanilla JavaScript
- Vite (build)
- Firebase Firestore
- Netlify (hospedagem)

## Deploy

1. Fork este repositório
2. Configure no Netlify: `npm run build` → `dist/`
3. Configure as regras do Firebase Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /keys/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Uso

1. Abra o app
2. Clique em 🔐 para modo admin
3. Senha: ******
4. Adicione ativos e grupos
5. Retire/devolva chaves com foto

## Licença

MIT © 2026 Techart Soluções
