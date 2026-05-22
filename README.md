# 📝 Sistema de Evaluaciones - Frontend

Este es el repositorio del **Frontend** para la plataforma de evaluación académica. Está construido utilizando **React** + **Vite** + **TypeScript**.

##  Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:
* [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
* Un gestor de paquetes como **npm** (viene incluido de forma automática al instalar Node.js)

##  Configuración Inicial para Trabajo Local

Sigue estos pasos detallados para clonar el proyecto y levantar el entorno de desarrollo en tu computadora:

### 1. Clonar el repositorio

Si utilizas **GitHub Desktop**, simplemente ve a la página del repositorio en GitHub, haz clic en el botón verde **"Code"** y selecciona **"Open with GitHub Desktop"**. Clona el repositorio en la ruta donde trabajaras.

### 2. Instalar dependencias

Abre la terminal dentro de la carpeta del proyecto e instala todas las librerías necesarias ejecutando:

```bash
npm install
```

Nota: Esto creará la carpeta node_modules localmente con todo lo necesario para que React funcione. **NO TE PREOCUPES AL HACER PUSH EN GITHUB, GRACIAS AL ARCHIVO .gitignore NO SE SUBIRÁ ESE ARCHIVO, ENTONCES NO CAUSARÁ CONFLICTOS CON EL RESTO DEL EQUIPO**. 

### 3. Arrancar el servidor de desarrollo
Para encender la aplicación localmente y ver los cambios en tiempo real, ejecuta:

```bash
npm run dev
```

### 4. Acceder a la aplicación
Una vez encendido el servidor, la terminal te mostrará una dirección local. Abre tu navegador web e ingresa a la ruta de localhost que te marque la terminal.

### 5. Desarrollo de la aplicación (IMPORTANTE)

Todo el desarrollo de la aplicación (Archivos, carpetas, etc) se encontrara en la carpeta src, es necesario  trabajar dentro de esta carpeta para no generar conflictos con la estructura del proyecto.

### 6. ¡IMPORTANTE! ANTES DE HACER PUSH (SUBIR TUS CAMBIOS AL PROYECTO) EN GITHUB

Recuerda que antes de subir tus cambios a GitHub debes asegurarte de que el archivo .gitignore esté actualizado para evitar conflictos con el resto del equipo. Por lo general, solo debes subir los cambios que hayas realizado en la carpeta src.

---

📦 Tecnologías Principales Utilizadas
React - Biblioteca para la construcción de interfaces de usuario.

Vite - Herramienta de construcción y empaquetado ultra rápida.

TypeScript - Tipado estático para un desarrollo más seguro y ordenado.