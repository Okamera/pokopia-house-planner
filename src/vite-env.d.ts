/// <reference types="vite/client" />

declare module '*/images.json' {
  const images: Record<string, string>
  export default images
}