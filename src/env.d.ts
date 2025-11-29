/// <reference types="astro/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare namespace App {
  interface Locals {
    isAdmin: boolean;
  }
}

