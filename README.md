# UNTREF — Laboratorio electrostático

Simulador frontend de distribuciones de carga concéntricas para esfera y cilindro.

La aplicación está convertida a React + Vite y no usa backend.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## GitHub Pages

El proyecto está configurado para publicarse en GitHub Pages desde GitHub Actions.

La base de Vite está configurada para:

```js
base: '/simulador-distribuciones-cargas/'
```

Cuando se haga push a `main`, el workflow `.github/workflows/deploy.yml` genera `dist/` y lo publica en Pages.

