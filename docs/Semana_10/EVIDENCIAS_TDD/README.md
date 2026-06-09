# Evidencias TDD (Red - Green - Refactor)

Esta carpeta debe contener las **capturas de pantalla** que evidencian el ciclo TDD.
Las imagenes deben tomarlas ustedes ejecutando las pruebas en su maquina. Nombren los
archivos exactamente asi:

| Archivo                          | Que debe mostrar |
|----------------------------------|------------------|
| `01_red_test_fallando.png`       | Un test recien escrito que **falla** (en rojo) antes de implementar la funcionalidad. Ej: `npm test` mostrando un test en rojo. |
| `02_green_test_pasando.png`      | El mismo test **pasando** (en verde) tras escribir el codigo minimo. |
| `03_refactor_codigo_limpio.png`  | El codigo refactorizado con los tests **aun en verde**. |

## Como generar la evidencia

```bash
npm install
npm test
```

Tomen la captura de la terminal en cada fase del ciclo y guardenla aqui con el nombre
indicado. Recomendacion: incluir en la captura el codigo del test y el resultado.
