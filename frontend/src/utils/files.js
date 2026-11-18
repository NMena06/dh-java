export const MAX_IMAGE_SIZE_MB = 2;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`No se pudo leer la imagen ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Devuelve el primer archivo que supera el limite, o undefined. */
export const findTooBig = (files) => files.find((f) => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
